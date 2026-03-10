import type { LoginRequest, LoginResponse, RbacRole, Session, User } from '@saifcontrol/shared';
import { STORAGE_FILES, SessionsSchema, UsersSchema, now } from '@saifcontrol/shared';
import { hash, verify } from 'argon2';
import { randomUUID } from 'crypto';
import { authenticator } from 'otplib';
import { writeAudit } from '../../lib/audit.js';
import { decrypt, encrypt, generateToken } from '../../lib/crypto.js';
import { getStore } from '../../lib/store.js';

const MASTER_KEY = process.env.SAIFCONTROL_MASTER_KEY || '';

/**
 * Create new user with argon2id hashed password.
 */
export async function createUser(
    username: string,
    password: string,
    role: RbacRole,
): Promise<Omit<User, 'passwordHash' | 'twoFactorSecret'>> {
    const store = getStore();

    const passwordHash = await hash(password, {
        type: 2, // argon2id
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });

    const user: User = {
        id: randomUUID(),
        username,
        passwordHash,
        role,
        twoFactorEnabled: false,
        createdAt: now(),
        updatedAt: now(),
    };

    await store.update(STORAGE_FILES.USERS, UsersSchema, (data) => {
        // Check duplicate username
        if (data.users.some((u) => u.username === username)) {
            throw new Error('اسم المستخدم موجود بالفعل');
        }
        data.users.push(user);
        data.updatedAt = now();
        return data;
    });

    writeAudit({ userId: user.id, action: 'user.create', details: { username, role } });

    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
    return safeUser;
}

/**
 * Authenticate user and return JWT tokens.
 */
export async function login(
    request: LoginRequest,
    ip: string,
    userAgent: string,
    signToken: (payload: object, options?: object) => string,
): Promise<LoginResponse> {
    const store = getStore();
    const usersData = await store.read(STORAGE_FILES.USERS, UsersSchema);
    if (!usersData) throw new Error('بيانات المستخدمين غير متوفرة');

    const user = usersData.users.find((u) => u.username === request.username);
    if (!user) {
        writeAudit({ userId: null, action: 'auth.login_failed', details: { username: request.username }, ip });
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Verify password
    const valid = await verify(user.passwordHash, request.password);
    if (!valid) {
        writeAudit({ userId: user.id, action: 'auth.login_failed', ip });
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!request.totpCode) {
            throw new Error('رمز المصادقة الثنائية مطلوب');
        }
        const secret = MASTER_KEY ? decrypt(user.twoFactorSecret, MASTER_KEY) : user.twoFactorSecret;
        const isValid = authenticator.verify({ token: request.totpCode, secret });
        if (!isValid) {
            writeAudit({ userId: user.id, action: 'auth.2fa_failed', ip });
            throw new Error('رمز المصادقة الثنائية غير صحيح');
        }
    }

    // Generate tokens
    const tokenPayload = { sub: user.id, role: user.role, username: user.username };
    const accessToken = signToken(tokenPayload, { expiresIn: '15m' });
    const refreshToken = generateToken(64);

    // Store session
    const session: Session = {
        id: randomUUID(),
        userId: user.id,
        refreshToken,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now(),
    };

    await store.update(STORAGE_FILES.SESSIONS, SessionsSchema, (data) => {
        // Clean expired sessions
        const cutoff = new Date().toISOString();
        data.sessions = data.sessions.filter((s) => s.expiresAt > cutoff);
        data.sessions.push(session);
        data.updatedAt = now();
        return data;
    });

    writeAudit({ userId: user.id, action: 'auth.login', ip });

    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
}

/**
 * Setup 2FA for user - returns secret + QR code data URL.
 */
export async function setup2FA(userId: string): Promise<{ secret: string; otpauth: string }> {
    const store = getStore();
    const usersData = await store.read(STORAGE_FILES.USERS, UsersSchema);
    if (!usersData) throw new Error('بيانات المستخدمين غير متوفرة');

    const user = usersData.users.find((u) => u.id === userId);
    if (!user) throw new Error('المستخدم غير موجود');

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.username, 'SaifControl', secret);

    return { secret, otpauth };
}

/**
 * Confirm and enable 2FA.
 */
export async function confirm2FA(userId: string, secret: string, token: string): Promise<boolean> {
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) return false;

    const store = getStore();
    const encryptedSecret = MASTER_KEY ? encrypt(secret, MASTER_KEY) : secret;

    await store.update(STORAGE_FILES.USERS, UsersSchema, (data) => {
        const user = data.users.find((u) => u.id === userId);
        if (user) {
            user.twoFactorEnabled = true;
            user.twoFactorSecret = encryptedSecret;
            user.updatedAt = now();
        }
        data.updatedAt = now();
        return data;
    });

    writeAudit({ userId, action: 'user.2fa_enabled' });
    return true;
}

/**
 * Refresh access token using refresh token.
 */
export async function refreshAccessToken(
    refreshToken: string,
    signToken: (payload: object, options?: object) => string,
): Promise<{ accessToken: string } | null> {
    const store = getStore();
    const sessionsData = await store.read(STORAGE_FILES.SESSIONS, SessionsSchema);
    if (!sessionsData) return null;

    const session = sessionsData.sessions.find(
        (s) => s.refreshToken === refreshToken && s.expiresAt > new Date().toISOString(),
    );
    if (!session) return null;

    const usersData = await store.read(STORAGE_FILES.USERS, UsersSchema);
    if (!usersData) return null;

    const user = usersData.users.find((u) => u.id === session.userId);
    if (!user) return null;

    const accessToken = signToken(
        { sub: user.id, role: user.role, username: user.username },
        { expiresIn: '15m' },
    );

    return { accessToken };
}

/**
 * Logout - invalidate session.
 */
export async function logout(userId: string, refreshToken: string): Promise<void> {
    const store = getStore();
    await store.update(STORAGE_FILES.SESSIONS, SessionsSchema, (data) => {
        data.sessions = data.sessions.filter(
            (s) => !(s.userId === userId && s.refreshToken === refreshToken),
        );
        data.updatedAt = now();
        return data;
    });

    writeAudit({ userId, action: 'auth.logout' });
}

/**
 * Get all users (safe, without password hashes).
 */
export async function getUsers(): Promise<Omit<User, 'passwordHash' | 'twoFactorSecret'>[]> {
    const store = getStore();
    const usersData = await store.read(STORAGE_FILES.USERS, UsersSchema);
    if (!usersData) return [];

    return usersData.users.map(({ passwordHash, twoFactorSecret, ...rest }) => rest);
}
