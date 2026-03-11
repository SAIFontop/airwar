import { motion } from 'framer-motion';
import { useStore } from '../store';
import { IconClock, IconServer, IconSignal, IconUsers } from './Icons';

export function ServerInfo() {
    const { serverStatus } = useStore()

    return (
        <motion.div
            className="glass rounded-lg p-4 w-full max-w-xs"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
        >
            <h3 className="font-display text-xs font-bold text-aw-accent tracking-wider mb-3">
                SERVER STATUS
            </h3>

            <div className="space-y-3">
                <StatusRow
                    icon={<IconUsers size={16} />}
                    label="Players Online"
                    value={`${serverStatus.players} / ${serverStatus.maxPlayers}`}
                />
                <StatusRow
                    icon={<IconServer size={16} />}
                    label="Server Status"
                    value={serverStatus.status.toUpperCase()}
                    valueColor={serverStatus.status === 'online' ? '#22c55e' : '#f59e0b'}
                />
                <StatusRow
                    icon={<IconSignal size={16} />}
                    label="Ping"
                    value={`${serverStatus.ping}ms`}
                />
                <StatusRow
                    icon={<IconClock size={16} />}
                    label="Uptime"
                    value={serverStatus.uptime}
                />
            </div>

            {/* Visual indicator */}
            <div className="mt-3 pt-3 border-t border-gray-700/30 flex items-center gap-2">
                <motion.div
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="font-mono text-[10px] text-gray-400">
                    All systems operational
                </span>
            </div>
        </motion.div>
    )
}

function StatusRow({
    icon, label, value, valueColor,
}: {
    icon: React.ReactNode; label: string; value: string; valueColor?: string
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-gray-400">{icon}</span>
                <span className="font-mono text-[11px] text-gray-400">{label}</span>
            </div>
            <span className="font-mono text-[11px] font-medium" style={{ color: valueColor || '#e5e7eb' }}>
                {value}
            </span>
        </div>
    )
}
