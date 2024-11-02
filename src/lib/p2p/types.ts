export interface NetworkMetrics {
  connectedPeers: number;
  totalProcessingPower: number;
  efficiency: number;
  bandwidth: number;
  latency: number;
}

export interface PeerMessage {
  type: string;
  data: any;
  timestamp: number;
  sender: string;
}

export interface PeerMetadata {
  id: string;
  processingPower: number;
  lastSeen: number;
  version: string;
}