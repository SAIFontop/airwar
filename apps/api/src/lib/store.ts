import { expandHome } from '@saifcontrol/shared';
import { appendFileSync, closeSync, existsSync, fdatasyncSync, openSync, writeFileSync } from 'fs';
import { mkdir, readFile, rename, stat } from 'fs/promises';
import { join } from 'path';
import { lock } from 'proper-lockfile';
import { z } from 'zod';

const DEFAULT_DATA_DIR = '~/.saifcontrol';

export class JsonStore {
    private dataDir: string;

    constructor(dataDir?: string) {
        this.dataDir = expandHome(dataDir || process.env.SAIFCONTROL_DATA_DIR || DEFAULT_DATA_DIR);
    }

    getDataDir(): string {
        return this.dataDir;
    }

    getFilePath(filename: string): string {
        return join(this.dataDir, filename);
    }

    /** Ensure data directory exists */
    async ensureDir(): Promise<void> {
        if (!existsSync(this.dataDir)) {
            await mkdir(this.dataDir, { recursive: true, mode: 0o700 });
        }
    }

    /**
     * Atomic write: write to temp file, fsync, then rename.
     * Prevents data corruption on crash.
     */
    async writeAtomic<T>(filename: string, data: T): Promise<void> {
        await this.ensureDir();
        const filePath = this.getFilePath(filename);
        const tempPath = filePath + '.tmp.' + Date.now();
        const content = JSON.stringify(data, null, 2);

        // Write to temp file
        const fd = openSync(tempPath, 'w', 0o600);
        try {
            writeFileSync(fd, content, 'utf-8');
            fdatasyncSync(fd);
        } finally {
            closeSync(fd);
        }

        // Atomic rename
        await rename(tempPath, filePath);
    }

    /**
     * Read and validate JSON file against a Zod schema.
     * Returns null if file doesn't exist.
     */
    async read<T>(filename: string, schema: z.ZodType<T>): Promise<T | null> {
        const filePath = this.getFilePath(filename);

        if (!existsSync(filePath)) {
            return null;
        }

        const raw = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return schema.parse(parsed);
    }

    /**
     * Read, modify, and write back with file locking.
     * Prevents concurrent modifications.
     */
    async update<T>(
        filename: string,
        schema: z.ZodType<T>,
        updater: (current: T) => T | Promise<T>,
    ): Promise<T> {
        await this.ensureDir();
        const filePath = this.getFilePath(filename);

        // Create file if it doesn't exist (needed for lock)
        if (!existsSync(filePath)) {
            await this.writeAtomic(filename, {});
        }

        let release: (() => Promise<void>) | undefined;
        try {
            release = await lock(filePath, { retries: { retries: 5, minTimeout: 100, maxTimeout: 1000 } });

            const current = await this.read(filename, schema);
            if (current === null) {
                throw new Error(`Failed to read ${filename} after lock acquired`);
            }

            const updated = await updater(current);
            const validated = schema.parse(updated);
            await this.writeAtomic(filename, validated);
            return validated;
        } finally {
            if (release) {
                await release();
            }
        }
    }

    /**
     * Append a line to JSONL file (append-only audit log).
     */
    appendJsonl(filename: string, entry: unknown): void {
        const filePath = this.getFilePath(filename);
        const line = JSON.stringify(entry) + '\n';
        appendFileSync(filePath, line, { encoding: 'utf-8', mode: 0o600 });
    }

    /**
     * Read JSONL file, returning array of parsed entries.
     */
    async readJsonl<T>(filename: string, schema: z.ZodType<T>, limit?: number): Promise<T[]> {
        const filePath = this.getFilePath(filename);
        if (!existsSync(filePath)) return [];

        const raw = await readFile(filePath, 'utf-8');
        const lines = raw.trim().split('\n').filter(Boolean);

        const entries: T[] = [];
        const start = limit ? Math.max(0, lines.length - limit) : 0;

        for (let i = start; i < lines.length; i++) {
            try {
                const parsed = schema.parse(JSON.parse(lines[i]));
                entries.push(parsed);
            } catch {
                // Skip malformed lines
            }
        }
        return entries;
    }

    /** Check if a storage file exists */
    exists(filename: string): boolean {
        return existsSync(this.getFilePath(filename));
    }

    /** Get file stats */
    async stats(filename: string) {
        const filePath = this.getFilePath(filename);
        if (!existsSync(filePath)) return null;
        return stat(filePath);
    }
}

/** Singleton store instance */
let storeInstance: JsonStore | null = null;

export function getStore(): JsonStore {
    if (!storeInstance) {
        storeInstance = new JsonStore();
    }
    return storeInstance;
}

export function initStore(dataDir?: string): JsonStore {
    storeInstance = new JsonStore(dataDir);
    return storeInstance;
}
