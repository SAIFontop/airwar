import type { ResourceInfo } from '@saifcontrol/shared';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Scan resources directory and parse fxmanifest.lua / __resource.lua files.
 */
export async function scanResources(serverDataPath: string): Promise<ResourceInfo[]> {
    const resourcesDir = join(serverDataPath, 'resources');
    if (!existsSync(resourcesDir)) return [];

    const resources: ResourceInfo[] = [];

    async function scanDir(dir: string, prefix = ''): Promise<void> {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            // Skip hidden/system dirs
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

            const fullPath = join(dir, entry.name);
            const resourceName = prefix ? `${prefix}/${entry.name}` : entry.name;

            // Check for manifest
            const manifestInfo = await parseResourceManifest(fullPath);

            if (manifestInfo) {
                resources.push({
                    name: resourceName,
                    status: 'unknown', // Actual status requires server query
                    ...manifestInfo,
                });
            }

            // Check for category folders (bracket notation like [core])
            if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
                await scanDir(fullPath, resourceName);
            }
        }
    }

    await scanDir(resourcesDir);
    return resources;
}

/**
 * Parse fxmanifest.lua or __resource.lua to extract metadata.
 */
async function parseResourceManifest(
    resourcePath: string,
): Promise<{ description?: string; version?: string; author?: string } | null> {
    const manifestFiles = ['fxmanifest.lua', '__resource.lua'];

    for (const mf of manifestFiles) {
        const manifestPath = join(resourcePath, mf);
        if (!existsSync(manifestPath)) continue;

        try {
            const content = await readFile(manifestPath, 'utf-8');
            return parseLuaManifest(content);
        } catch {
            continue;
        }
    }

    return null;
}

/**
 * Basic Lua manifest parser (extract description, version, author).
 */
function parseLuaManifest(content: string): { description?: string; version?: string; author?: string } {
    const result: { description?: string; version?: string; author?: string } = {};

    // description 'My Resource'
    const descMatch = content.match(/description\s+['"]([^'"]+)['"]/);
    if (descMatch) result.description = descMatch[1];

    // version '1.0.0'
    const verMatch = content.match(/version\s+['"]([^'"]+)['"]/);
    if (verMatch) result.version = verMatch[1];

    // author 'Name'
    const authMatch = content.match(/author\s+['"]([^'"]+)['"]/);
    if (authMatch) result.author = authMatch[1];

    return result;
}

/**
 * Get list of ensured resources from server.cfg lines.
 */
export function getEnsuredResources(cfgLines: string[]): string[] {
    const resources: string[] = [];
    for (const line of cfgLines) {
        const trimmed = line.trim();
        const match = trimmed.match(/^(?:ensure|start)\s+(\S+)/);
        if (match) {
            resources.push(match[1]);
        }
    }
    return resources;
}
