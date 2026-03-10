import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function formatNumber(n: number): string {
    return new Intl.NumberFormat().format(n);
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'online': return 'text-green-500';
        case 'offline': return 'text-zinc-500';
        case 'starting': case 'restarting': return 'text-yellow-500';
        case 'crashed': return 'text-red-500';
        case 'stopping': return 'text-orange-500';
        default: return 'text-zinc-500';
    }
}

export function getStatusDotClass(status: string): string {
    switch (status) {
        case 'online': case 'ONLINE': return 'status-dot-online';
        case 'offline': case 'OFFLINE': return 'status-dot-offline';
        case 'starting': case 'STARTING': case 'restarting': case 'RESTARTING': return 'status-dot-warning';
        case 'crashed': case 'CRASHED': return 'status-dot-error';
        default: return 'status-dot-offline';
    }
}
