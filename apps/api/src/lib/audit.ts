import type { AuditEntry } from '@saifcontrol/shared';
import { now, STORAGE_FILES, uuid } from '@saifcontrol/shared';
import { getStore } from './store.js';

export function writeAudit(entry: Omit<AuditEntry, 'timestamp' | 'correlationId'> & { correlationId?: string }): void {
    const store = getStore();
    const full: AuditEntry = {
        timestamp: now(),
        correlationId: entry.correlationId || uuid(),
        ...entry,
    };
    store.appendJsonl(STORAGE_FILES.AUDIT, full);
}

export async function readAuditLog(limit = 200): Promise<AuditEntry[]> {
    const { AuditEntrySchema } = await import('@saifcontrol/shared');
    const store = getStore();
    return store.readJsonl(STORAGE_FILES.AUDIT, AuditEntrySchema, limit);
}
