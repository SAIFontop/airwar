'use client';

import { cn } from '@/lib/utils';
import {
    Activity,
    Cpu,
    HardDrive,
    TrendingUp,
    Users,
    Wifi
} from 'lucide-react';
import { useState } from 'react';

function MiniChart({ data, color = 'stroke-primary', height = 40 }: { data: number[]; color?: string; height?: number }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 200;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
            <polyline
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className={color}
            />
        </svg>
    );
}

// Generate mock time-series data
const genData = (base: number, variance: number, count = 60) =>
    Array.from({ length: count }, () => base + (Math.random() - 0.5) * variance);

const cpuData = genData(42, 20);
const memoryData = genData(61, 15);
const playersData = genData(85, 30);
const tickData = genData(61, 8);
const networkInData = genData(12, 8);
const networkOutData = genData(8, 5);

interface MetricCardProps {
    label: string;
    value: string;
    unit: string;
    icon: React.ElementType;
    color: string;
    chartColor: string;
    data: number[];
    peak?: string;
    avg?: string;
}

function MetricCard({ label, value, unit, icon: Icon, color, chartColor, data, peak, avg }: MetricCardProps) {
    return (
        <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', color)} />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <div className="text-right">
                    <span className="text-xl font-semibold text-foreground">{value}</span>
                    <span className="text-xs text-muted-foreground ml-1">{unit}</span>
                </div>
            </div>
            <MiniChart data={data} color={chartColor} height={50} />
            {(peak || avg) && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    {peak && <span>Peak: {peak}</span>}
                    {avg && <span>Avg: {avg}</span>}
                </div>
            )}
        </div>
    );
}

export default function MetricsPage() {
    const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Metrics</h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time server performance monitoring</p>
                </div>
                <div className="flex items-center gap-1">
                    {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                timeRange === range
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground bg-accent/30',
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <MetricCard
                    label="CPU Usage"
                    value="42"
                    unit="%"
                    icon={Cpu}
                    color="text-emerald-400"
                    chartColor="stroke-emerald-400"
                    data={cpuData}
                    peak="92%"
                    avg="41%"
                />
                <MetricCard
                    label="Memory Usage"
                    value="61"
                    unit="%"
                    icon={HardDrive}
                    color="text-blue-400"
                    chartColor="stroke-blue-400"
                    data={memoryData}
                    peak="78%"
                    avg="59%"
                />
                <MetricCard
                    label="Players Online"
                    value="87"
                    unit="/ 128"
                    icon={Users}
                    color="text-purple-400"
                    chartColor="stroke-purple-400"
                    data={playersData}
                    peak="124"
                    avg="82"
                />
                <MetricCard
                    label="Tick Rate"
                    value="61.2"
                    unit="ms"
                    icon={Activity}
                    color="text-yellow-400"
                    chartColor="stroke-yellow-400"
                    data={tickData}
                    peak="68ms"
                    avg="61ms"
                />
                <MetricCard
                    label="Network In"
                    value="12.4"
                    unit="MB/s"
                    icon={Wifi}
                    color="text-cyan-400"
                    chartColor="stroke-cyan-400"
                    data={networkInData}
                    peak="18.2 MB/s"
                    avg="11.8 MB/s"
                />
                <MetricCard
                    label="Network Out"
                    value="8.1"
                    unit="MB/s"
                    icon={TrendingUp}
                    color="text-orange-400"
                    chartColor="stroke-orange-400"
                    data={networkOutData}
                    peak="14.6 MB/s"
                    avg="7.9 MB/s"
                />
            </div>

            {/* Detailed chart area */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-foreground">Performance Overview</h2>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> CPU</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Memory</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Tick Rate</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>CPU</span><span>42%</span>
                        </div>
                        <MiniChart data={cpuData} color="stroke-emerald-400" height={30} />
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Memory</span><span>61%</span>
                        </div>
                        <MiniChart data={memoryData} color="stroke-blue-400" height={30} />
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Tick Rate</span><span>61.2ms</span>
                        </div>
                        <MiniChart data={tickData} color="stroke-yellow-400" height={30} />
                    </div>
                </div>
            </div>
        </div>
    );
}
