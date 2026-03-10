import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

/**
 * Derive encryption key from passphrase + salt using scrypt.
 */
export function deriveKey(passphrase: string, salt: Buffer): Buffer {
    return scryptSync(passphrase, salt, KEY_LENGTH, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
    });
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns base64 string: salt(32) + iv(16) + tag(16) + ciphertext
 */
export function encrypt(plaintext: string, masterKey: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const key = deriveKey(masterKey, salt);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
}

/**
 * Decrypt AES-256-GCM encrypted base64 string.
 */
export function decrypt(encryptedBase64: string, masterKey: string): string {
    const data = Buffer.from(encryptedBase64, 'base64');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(masterKey, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Generate a random master key salt (hex).
 */
export function generateSalt(): string {
    return randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Generate a secure random token.
 */
export function generateToken(length = 48): string {
    return randomBytes(length).toString('base64url');
}
