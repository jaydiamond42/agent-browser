import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BrowserManager } from './browser.js';
import { parseCommand, serializeResponse, errorResponse } from './protocol.js';
import { executeCommand } from './actions.js';

const SOCKET_PATH = path.join(os.tmpdir(), 'veb.sock');
const PID_FILE = path.join(os.tmpdir(), 'veb.pid');

/**
 * Get the socket path
 */
export function getSocketPath(): string {
  return SOCKET_PATH;
}

/**
 * Get the PID file path
 */
export function getPidFile(): string {
  return PID_FILE;
}

/**
 * Check if daemon is running
 */
export function isDaemonRunning(): boolean {
  if (!fs.existsSync(PID_FILE)) return false;
  
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    // Check if process exists
    process.kill(pid, 0);
    return true;
  } catch {
    // Process doesn't exist, clean up stale files
    cleanupSocket();
    return false;
  }
}

/**
 * Clean up socket and PID file
 */
export function cleanupSocket(): void {
  try {
    if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Start the daemon server
 */
export async function startDaemon(): Promise<void> {
  // Clean up any stale socket
  cleanupSocket();
  
  const browser = new BrowserManager();
  let shuttingDown = false;
  
  const server = net.createServer((socket) => {
    let buffer = '';
    
    socket.on('data', async (data) => {
      buffer += data.toString();
      
      // Process complete lines
      while (buffer.includes('\n')) {
        const newlineIdx = buffer.indexOf('\n');
        const line = buffer.substring(0, newlineIdx);
        buffer = buffer.substring(newlineIdx + 1);
        
        if (!line.trim()) continue;
        
        try {
          const parseResult = parseCommand(line);
          
          if (!parseResult.success) {
            const resp = errorResponse(parseResult.id ?? 'unknown', parseResult.error);
            socket.write(serializeResponse(resp) + '\n');
            continue;
          }
          
          // Auto-launch browser if not already launched and this isn't a launch command
          if (!browser.isLaunched() && parseResult.command.action !== 'launch' && parseResult.command.action !== 'close') {
            await browser.launch({ id: 'auto', action: 'launch', headless: true });
          }
          
          // Handle close command specially
          if (parseResult.command.action === 'close') {
            const response = await executeCommand(parseResult.command, browser);
            socket.write(serializeResponse(response) + '\n');
            
            if (!shuttingDown) {
              shuttingDown = true;
              setTimeout(() => {
                server.close();
                cleanupSocket();
                process.exit(0);
              }, 100);
            }
            return;
          }
          
          const response = await executeCommand(parseResult.command, browser);
          socket.write(serializeResponse(response) + '\n');
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          socket.write(serializeResponse(errorResponse('error', message)) + '\n');
        }
      }
    });
    
    socket.on('error', () => {
      // Client disconnected, ignore
    });
  });
  
  // Write PID file before listening
  fs.writeFileSync(PID_FILE, process.pid.toString());
  
  server.listen(SOCKET_PATH, () => {
    // Daemon is ready
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
    cleanupSocket();
    process.exit(1);
  });
  
  // Handle shutdown signals
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await browser.close();
    server.close();
    cleanupSocket();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Keep process alive
  process.stdin.resume();
}

// Run daemon if this is the entry point
if (process.argv[1]?.endsWith('daemon.js') || process.env.VEB_DAEMON === '1') {
  startDaemon().catch((err) => {
    console.error('Daemon error:', err);
    cleanupSocket();
    process.exit(1);
  });
}
