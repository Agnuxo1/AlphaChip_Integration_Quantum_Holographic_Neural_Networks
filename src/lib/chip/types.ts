import { Vector3 } from 'three';

export interface ChipComponent {
  id: string;
  position: Vector3;
  type: 'processor' | 'memory' | 'quantum' | 'optical';
  connections: string[];
  efficiency: number;
  temperature: number;
  load: number;
}

export interface PerformanceMetrics {
  powerEfficiency: number;
  areaUtilization: number;
  thermalDissipation: number;
  signalIntegrity: number;
}

export interface ChipState {
  components: ChipComponent[];
  performance: PerformanceMetrics;
  quantumCoherence: number;
  processingPower: number;
  networkEfficiency: number;
  entanglementDegree: number;
  holographicFidelity: number;
}

export enum ChipAction {
  AddProcessor,
  AddMemory,
  OptimizeConnections,
  RemoveComponent
}

export interface ChipOptimizationResult {
  state: ChipState;
  improvement: number;
  action: ChipAction;
  metrics: PerformanceMetrics;
}