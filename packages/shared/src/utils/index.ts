import { randomUUID } from 'crypto';

/** Generate UUID v4 */
export function uuid(): string {
    return randomUUID();
}

/** Current ISO datetime */
export function now(): string {
    return new Date().toISOString();
}

/** Expand ~ to home directory */
export function expandHome(filepath: string): string {
    if (filepath.startsWith('~/') || filepath === '~') {
        const home = process.env.HOME || process.env.USERPROFILE || '/root';
        return filepath.replace('~', home);
    }
    return filepath;
}

/** Sanitize path - prevent traversal */
export function isPathSafe(basePath: string, targetPath: string): boolean {
    const path = require('path');
    const resolved = path.resolve(basePath, targetPath);
    return resolved.startsWith(path.resolve(basePath));
}

/** Parse port from endpoint string like "0.0.0.0:30120" */
export function parsePort(endpoint: string): number | null {
    const match = endpoint.match(/:(\d+)$/);
    if (match) {
        const port = parseInt(match[1], 10);
        if (port > 0 && port <= 65535) return port;
    }
    return null;
}

/** Simple delay */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Truncate string with ellipsis */
export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
}
