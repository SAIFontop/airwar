import type { BackupEntry } from '@saifcontrol/shared';
import { BackupsSchema, STORAGE_FILES, now } from '@saifcontrol/shared';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, stat, unlink } from 'fs/promises';
import { basename, join } from 'path';
import { promisify } from 'util';
import { writeAudit } from '../../lib/audit.js';
import { getStore } from '../../lib/store.js';

const execAsync = promisify(exec);

function getBackupsDir(): string {
    return join(getStore().getDataDir(), 'backups');
}

/**
 * Create a backup of server-data directory using tar.
 */
export async function createBackup(
    profileId: string,
    serverDataPath: string,
    type: 'manual' | 'scheduled' | 'pre-update' = 'manual',
    userId?: string,
): Promise<BackupEntry> {
    const backupsDir = getBackupsDir();
    if (!existsSync(backupsDir)) {
        await mkdir(backupsDir, { recursive: true, mode: 0o700 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${profileId.slice(0, 8)}-${timestamp}.tar.gz`;
    const backupPath = join(backupsDir, filename);
    const parentDir = join(serverDataPath, '..');
    const dirName = basename(serverDataPath);

    await execAsync(
        `tar -czf "${backupPath}" -C "${parentDir}" "${dirName}" --exclude="*.log" --exclude="cache"`,
    );

    const stats = await stat(backupPath);

    const entry: BackupEntry = {
        id: randomUUID(),
        profileId,
        filename,
        size: stats.size,
        type,
        createdAt: now(),
    };

    const store = getStore();
    await store.update(STORAGE_FILES.BACKUPS, BackupsSchema, (data) => {
        data.backups.push(entry);
        data.updatedAt = now();
        return data;
    });

    writeAudit({ userId: userId || null, action: 'backup.create', details: { backupId: entry.id, type } });
    return entry;
}

/**
 * Restore a backup by extracting tar.gz.
 */
export async function restoreBackup(
    backupId: string,
    targetPath: string,
    userId?: string,
): Promise<void> {
    const store = getStore();
    const backupsData = await store.read(STORAGE_FILES.BACKUPS, BackupsSchema);
    if (!backupsData) throw new Error('بيانات النسخ الاحتياطية غير متوفرة');

    const entry = backupsData.backups.find((b) => b.id === backupId);
    if (!entry) throw new Error('النسخة الاحتياطية غير موجودة');

    const backupPath = join(getBackupsDir(), entry.filename);
    if (!existsSync(backupPath)) throw new Error('ملف النسخة الاحتياطية غير موجود على القرص');

    const parentDir = join(targetPath, '..');
    await execAsync(`tar -xzf "${backupPath}" -C "${parentDir}"`);

    writeAudit({ userId: userId || null, action: 'backup.restore', details: { backupId } });
}

/**
 * List all backups.
 */
export async function listBackups(profileId?: string): Promise<BackupEntry[]> {
    const store = getStore();
    const data = await store.read(STORAGE_FILES.BACKUPS, BackupsSchema);
    if (!data) return [];

    let backups = data.backups;
    if (profileId) {
        backups = backups.filter((b) => b.profileId === profileId);
    }
    return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Delete a backup.
 */
export async function deleteBackup(backupId: string, userId?: string): Promise<void> {
    const store = getStore();

    const data = await store.read(STORAGE_FILES.BACKUPS, BackupsSchema);
    if (!data) throw new Error('بيانات النسخ الاحتياطية غير متوفرة');

    const entry = data.backups.find((b) => b.id === backupId);
    if (!entry) throw new Error('النسخة الاحتياطية غير موجودة');

    // Remove file
    const backupPath = join(getBackupsDir(), entry.filename);
    if (existsSync(backupPath)) {
        await unlink(backupPath);
    }

    // Remove from metadata
    await store.update(STORAGE_FILES.BACKUPS, BackupsSchema, (d) => {
        d.backups = d.backups.filter((b) => b.id !== backupId);
        d.updatedAt = now();
        return d;
    });

    writeAudit({ userId: userId || null, action: 'backup.delete', details: { backupId } });
}
