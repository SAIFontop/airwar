import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { join, relative, resolve } from 'path';

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    async listDirectory(basePath: string, relativePath: string) {
        const fullPath = this.resolveSafePath(basePath, relativePath);
        const entries = await readdir(fullPath, { withFileTypes: true });

        return Promise.all(
            entries.map(async (entry) => {
                const entryPath = join(fullPath, entry.name);
                const stats = await stat(entryPath);
                return {
                    name: entry.name,
                    path: join(relativePath, entry.name),
                    type: entry.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                    modified: stats.mtimeMs,
                };
            }),
        );
    }

    async readFileContent(basePath: string, relativePath: string) {
        const fullPath = this.resolveSafePath(basePath, relativePath);
        const content = await readFile(fullPath, 'utf-8');
        const stats = await stat(fullPath);
        return {
            path: relativePath,
            content,
            encoding: 'utf-8',
            size: stats.size,
            modified: stats.mtimeMs,
        };
    }

    async writeFileContent(basePath: string, relativePath: string, content: string) {
        const fullPath = this.resolveSafePath(basePath, relativePath);
        await writeFile(fullPath, content, 'utf-8');
        return true;
    }

    async createDirectory(basePath: string, relativePath: string) {
        const fullPath = this.resolveSafePath(basePath, relativePath);
        await mkdir(fullPath, { recursive: true });
        return true;
    }

    async deleteFile(basePath: string, relativePath: string) {
        const fullPath = this.resolveSafePath(basePath, relativePath);
        await unlink(fullPath);
        return true;
    }

    private resolveSafePath(basePath: string, relativePath: string): string {
        const resolved = resolve(basePath, relativePath);
        const rel = relative(basePath, resolved);
        if (rel.startsWith('..') || resolve(basePath, rel) !== resolved) {
            throw new ForbiddenException('Path traversal detected');
        }
        return resolved;
    }
}
