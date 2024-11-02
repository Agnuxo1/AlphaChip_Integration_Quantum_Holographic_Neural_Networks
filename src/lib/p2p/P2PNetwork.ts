import { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { NetworkMetrics } from './types';
import { measureProcessingPower } from './utils';

export class P2PNetwork {
  private peer: any | null = null;
  private connections: Map<string, DataConnection>;
  private nodeId: string;
  private processingPower: number;
  private lastHeartbeat: number;
  private statusCallbacks: ((status: string) => void)[];
  private peerJoinCallbacks: ((peerId: string) => void)[];
  private peerLeaveCallbacks: ((peerId: string) => void)[];
  private isInitialized: boolean;

  constructor() {
    this.nodeId = uuidv4();
    this.connections = new Map();
    this.processingPower = measureProcessingPower();
    this.lastHeartbeat = Date.now();
    this.statusCallbacks = [];
    this.peerJoinCallbacks = [];
    this.peerLeaveCallbacks = [];
    this.isInitialized = false;
  }

  public async initializeNetwork(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      try {
        // Dynamic import of PeerJS to ensure it's only loaded when needed
        import('peerjs').then(({ default: Peer }) => {
          this.peer = new Peer(this.nodeId, {
            debug: 2
          });

          this.peer.on('open', () => {
            this.setupEventHandlers();
            this.isInitialized = true;
            this.notifyStatus('P2P network initialized');
            resolve();
          });

          this.peer.on('error', (error: Error) => {
            this.notifyStatus(`P2P error: ${error.message}`);
            reject(error);
          });
        }).catch(error => {
          reject(new Error(`Failed to load PeerJS: ${error.message}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.isInitialized = false;
    this.notifyStatus('Disconnected from P2P network');
  }

  public onNetworkStatus(callback: (status: string) => void): void {
    this.statusCallbacks.push(callback);
  }

  public onPeerJoin(callback: (peerId: string) => void): void {
    this.peerJoinCallbacks.push(callback);
  }

  public onPeerLeave(callback: (peerId: string) => void): void {
    this.peerLeaveCallbacks.push(callback);
  }

  public getNetworkMetrics(): NetworkMetrics {
    return {
      connectedPeers: this.connections.size,
      totalProcessingPower: this.calculateTotalProcessingPower(),
      efficiency: this.calculateNetworkEfficiency(),
      bandwidth: this.calculateBandwidth(),
      latency: this.calculateAverageLatency()
    };
  }

  private setupEventHandlers(): void {
    if (!this.peer) return;

    this.peer.on('connection', (conn: DataConnection) => {
      this.handleConnection(conn);
    });

    this.peer.on('disconnected', () => {
      this.notifyStatus('Disconnected from network');
      this.handleDisconnection();
    });
  }

  private handleConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.notifyPeerJoin(conn.peer);
      this.notifyStatus(`Connected to peer: ${conn.peer}`);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.notifyPeerLeave(conn.peer);
      this.notifyStatus(`Peer disconnected: ${conn.peer}`);
    });

    conn.on('error', (error: Error) => {
      this.notifyStatus(`Connection error with peer ${conn.peer}: ${error.message}`);
    });
  }

  private handleDisconnection(): void {
    this.connections.clear();
    this.isInitialized = false;
  }

  private notifyStatus(status: string): void {
    this.statusCallbacks.forEach(callback => callback(status));
  }

  private notifyPeerJoin(peerId: string): void {
    this.peerJoinCallbacks.forEach(callback => callback(peerId));
  }

  private notifyPeerLeave(peerId: string): void {
    this.peerLeaveCallbacks.forEach(callback => callback(peerId));
  }

  private calculateTotalProcessingPower(): number {
    return this.processingPower * (this.connections.size + 1);
  }

  private calculateNetworkEfficiency(): number {
    const connectedPeers = this.connections.size;
    if (connectedPeers === 0) return 1;
    return Math.min(1, connectedPeers / 10);
  }

  private calculateBandwidth(): number {
    return this.connections.size * 1000; // Simulated bandwidth in Kbps
  }

  private calculateAverageLatency(): number {
    return this.connections.size > 0 ? 50 + this.connections.size * 5 : 0; // Simulated latency in ms
  }

  public async broadcastMessage(message: any): Promise<void> {
    this.connections.forEach(connection => {
      connection.send(message);
    });
  }
}