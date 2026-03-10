'use client';

import { cn } from '@/lib/utils';
import {
    ArrowUpDown,
    Cpu,
    HardDrive,
    Play,
    Puzzle,
    RotateCcw,
    Search,
    Square
} from 'lucide-react';
import { useState } from 'react';

interface Resource {
    name: string;
    status: 'started' | 'stopped';
    cpu: number;
    memory: number;
    tickTime: number;
    version: string;
    author: string;
    dependencies: string[];
}

const mockResources: Resource[] = [
    { name: 'es_extended', status: 'started', cpu: 12.3, memory: 45, tickTime: 3.2, version: '1.10.4', author: 'ESX-Org', dependencies: ['mysql-async', 'skinchanger'] },
    { name: 'esx_skin', status: 'started', cpu: 2.1, memory: 12, tickTime: 0.8, version: '1.4.0', author: 'ESX-Org', dependencies: ['es_extended'] },
    { name: 'ox_inventory', status: 'started', cpu: 8.4, memory: 38, tickTime: 2.1, version: '2.20.0', author: 'Overextended', dependencies: ['ox_lib', 'es_extended'] },
    { name: 'ox_lib', status: 'started', cpu: 1.2, memory: 8, tickTime: 0.3, version: '3.8.0', author: 'Overextended', dependencies: [] },
    { name: 'garage', status: 'started', cpu: 8.7, memory: 28, tickTime: 2.8, version: '2.1.0', author: 'Custom', dependencies: ['es_extended', 'ox_lib'] },
    { name: 'phone', status: 'started', cpu: 15.2, memory: 67, tickTime: 4.5, version: '1.0.0', author: 'Custom', dependencies: ['es_extended'] },
    { name: 'mysql-async', status: 'started', cpu: 3.8, memory: 22, tickTime: 0.1, version: '3.3.2', author: 'brouznouf', dependencies: [] },
    { name: 'skinchanger', status: 'started', cpu: 0.5, memory: 6, tickTime: 0.2, version: '1.2.0', author: 'ESX-Org', dependencies: [] },
    { name: 'admin_menu', status: 'stopped', cpu: 0, memory: 0, tickTime: 0, version: '3.2.1', author: 'Custom', dependencies: ['es_extended'] },
    { name: 'voice', status: 'started', cpu: 6.3, memory: 34, tickTime: 1.9, version: '1.5.0', author: 'Custom', dependencies: [] },
];

type SortKey = 'name' | 'cpu' | 'memory' | 'tickTime';

export default function ResourcesPage() {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('cpu');
    const [sortAsc, setSortAsc] = useState(false);
    const [filter, setFilter] = useState<'all' | 'started' | 'stopped'>('all');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(false); }
    };

    const totalCpu = mockResources.reduce((sum, r) => sum + r.cpu, 0);
    const totalMemory = mockResources.reduce((sum, r) => sum + r.memory, 0);

    const filtered = mockResources
        .filter((r) => {
            if (filter === 'started') return r.status === 'started';
            if (filter === 'stopped') return r.status === 'stopped';
            return true;
        })
        .filter((r) => search === '' || r.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const mul = sortAsc ? 1 : -1;
            if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
            return mul * ((a[sortKey] as number) - (b[sortKey] as number));
        });

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Resources</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor resource performance and manage server scripts</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-panel p-4 flex items-center gap-3">
                    <Puzzle className="w-4 h-4 text-primary" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">{mockResources.length}</div>
                        <div className="text-[10px] text-muted-foreground">Total Resources</div>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">{mockResources.filter((r) => r.status === 'started').length}</div>
                        <div className="text-[10px] text-muted-foreground">Running</div>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-yellow-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">{totalCpu.toFixed(1)}ms</div>
                        <div className="text-[10px] text-muted-foreground">Total CPU</div>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">{totalMemory} MB</div>
                        <div className="text-[10px] text-muted-foreground">Total Memory</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search resources..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(['all', 'started', 'stopped'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-accent/30',
                            )}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resource table */}
            <div className="glass-panel overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px_100px_1fr_100px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-left hover:text-foreground">
                        Resource {sortKey === 'name' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                    <span>Status</span>
                    <button onClick={() => handleSort('cpu')} className="flex items-center gap-1 text-right hover:text-foreground">
                        CPU (ms) {sortKey === 'cpu' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleSort('memory')} className="flex items-center gap-1 text-right hover:text-foreground">
                        Memory {sortKey === 'memory' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleSort('tickTime')} className="flex items-center gap-1 text-right hover:text-foreground">
                        Tick {sortKey === 'tickTime' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                    <span>Version</span>
                    <span>Dependencies</span>
                    <span className="text-right">Actions</span>
                </div>
                {filtered.map((res) => (
                    <div key={res.name} className="grid grid-cols-[1fr_80px_80px_80px_80px_100px_1fr_100px] gap-4 px-5 py-2.5 hover:bg-accent/30 transition-colors items-center">
                        <div className="flex items-center gap-2">
                            <div className={cn('w-1.5 h-1.5 rounded-full', res.status === 'started' ? 'bg-emerald-500' : 'bg-zinc-500')} />
                            <span className="text-sm font-medium text-foreground">{res.name}</span>
                        </div>
                        <span className={cn('text-xs', res.status === 'started' ? 'text-emerald-400' : 'text-muted-foreground')}>
                            {res.status}
                        </span>
                        <span className={cn('text-xs text-right', res.cpu > 10 ? 'text-yellow-400' : 'text-foreground')}>
                            {res.cpu.toFixed(1)}
                        </span>
                        <span className={cn('text-xs text-right', res.memory > 50 ? 'text-yellow-400' : 'text-foreground')}>
                            {res.memory} MB
                        </span>
                        <span className="text-xs text-right text-foreground">{res.tickTime.toFixed(1)}ms</span>
                        <span className="text-xs text-muted-foreground">v{res.version}</span>
                        <div className="flex flex-wrap gap-1">
                            {res.dependencies.map((dep) => (
                                <span key={dep} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-muted-foreground">
                                    {dep}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded hover:bg-yellow-500/20 text-muted-foreground hover:text-yellow-400 transition-colors">
                                <RotateCcw className="w-3 h-3" />
                            </button>
                            {res.status === 'started' ? (
                                <button className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                                    <Square className="w-3 h-3" />
                                </button>
                            ) : (
                                <button className="p-1.5 rounded hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 transition-colors">
                                    <Play className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
