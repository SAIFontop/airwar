import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function formatTimeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function getStatusDotClass(status: string): string {
    switch (status) {
        case 'running': case 'online': case 'started': return 'status-dot-online';
        case 'stopped': case 'offline': return 'status-dot-offline';
        case 'crashed': case 'error': return 'status-dot-crashed';
        case 'starting': case 'stopping': case 'restarting': return 'status-dot-starting';
        default: return 'status-dot-offline';
    }
}

export function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        running: 'يعمل', online: 'يعمل', started: 'شغّال',
        stopped: 'متوقف', offline: 'غير متصل',
        crashed: 'تعطّل', starting: 'يبدأ', stopping: 'يتوقف',
        restarting: 'يعيد التشغيل', unknown: 'غير معروف',
    };
    return map[status] || status;
}

export function getPingColor(ping: number): string {
    if (ping < 60) return 'text-success';
    if (ping < 120) return 'text-warning';
    return 'text-danger';
}
