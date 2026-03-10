import * as dotenv from 'dotenv';
dotenv.config();

import { collectFxMetrics, collectSystemMetrics } from './collectors';
import { AgentSocket } from './socket';

const API_URL = process.env.API_URL || 'ws://localhost:4000/ws';
const AGENT_TOKEN = process.env.AGENT_TOKEN || 'changeme';
const SERVER_ID = process.env.SERVER_ID || 'server-1';
const COLLECT_INTERVAL = parseInt(process.env.COLLECT_INTERVAL_MS || '5000', 10);
const FX_SERVER_PATH = process.env.FX_SERVER_PATH || '/home/saif/fivem/txData';

console.log('========================================');
console.log('  Saif Control — Server Agent');
console.log('========================================');
console.log(`  Server ID:  ${SERVER_ID}`);
console.log(`  API URL:    ${API_URL}`);
console.log(`  Interval:   ${COLLECT_INTERVAL}ms`);
console.log(`  FX Path:    ${FX_SERVER_PATH}`);
console.log('========================================');

let collectInterval: NodeJS.Timeout | null = null;

function handleMessage(msg: { type: string;[key: string]: unknown }) {
    switch (msg.type) {
        case 'command':
            console.log(`[agent] Received command: ${msg.command}`);
            break;
        case 'restart':
            console.log('[agent] Restart requested by control panel');
            break;
        default:
            console.log(`[agent] Unknown message type: ${msg.type}`);
    }
}

const socket = new AgentSocket(API_URL, AGENT_TOKEN, SERVER_ID, handleMessage);
socket.connect();

async function collect() {
    const system = collectSystemMetrics();
    const fx = await collectFxMetrics(FX_SERVER_PATH);

    const payload = {
        type: 'agent:metrics',
        serverId: SERVER_ID,
        timestamp: Date.now(),
        system,
        fxserver: fx,
    };

    socket.send(payload);
}

collectInterval = setInterval(collect, COLLECT_INTERVAL);

// Initial collection after a brief delay for CPU baseline
setTimeout(collect, 1000);

// Graceful shutdown
function shutdown() {
    console.log('\n[agent] Shutting down...');
    if (collectInterval) clearInterval(collectInterval);
    socket.disconnect();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
