import * as THREE from 'three';
import { QuantumState } from '../quantum/QuantumMath';

export interface Neuron {
  position: THREE.Vector3;
  color: THREE.Color | number;
  intensity: number;
  sigma: number;
  size: number;
}

export interface QuantumNeuron extends Neuron {
  quantumState: QuantumState;
  holographicPattern: Float32Array;
}