import * as THREE from 'three';
import { Neuron } from './types';

interface BVHNode {
  bounds: THREE.Box3;
  left: BVHNode | null;
  right: BVHNode | null;
  neuron: Neuron | null;
}

export class BVH {
  private root: BVHNode;
  private maxDepth: number = 20;
  private maxNeuronsPerNode: number = 32;

  constructor(neurons: Neuron[]) {
    this.root = this.buildBVH(neurons, 0);
  }

  private buildBVH(neurons: Neuron[], depth: number): BVHNode {
    if (neurons.length === 0) {
      return {
        bounds: new THREE.Box3(),
        left: null,
        right: null,
        neuron: null
      };
    }

    if (neurons.length === 1 || depth >= this.maxDepth) {
      const bounds = new THREE.Box3();
      neurons.forEach(neuron => {
        bounds.expandByPoint(neuron.position);
      });

      return {
        bounds,
        left: null,
        right: null,
        neuron: neurons[0]
      };
    }

    const bounds = new THREE.Box3();
    neurons.forEach(neuron => {
      bounds.expandByPoint(neuron.position);
    });

    const center = new THREE.Vector3();
    bounds.getCenter(center);

    const axis = this.getLongestAxis(bounds);
    const sortedNeurons = neurons.sort((a, b) => {
      return a.position[axis] - b.position[axis];
    });

    const mid = Math.floor(sortedNeurons.length / 2);
    const leftNeurons = sortedNeurons.slice(0, mid);
    const rightNeurons = sortedNeurons.slice(mid);

    return {
      bounds,
      left: this.buildBVH(leftNeurons, depth + 1),
      right: this.buildBVH(rightNeurons, depth + 1),
      neuron: null
    };
  }

  private getLongestAxis(bounds: THREE.Box3): 'x' | 'y' | 'z' {
    const size = new THREE.Vector3();
    bounds.getSize(size);

    if (size.x > size.y && size.x > size.z) return 'x';
    if (size.y > size.z) return 'y';
    return 'z';
  }

  public intersectRay(origin: THREE.Vector3, direction: THREE.Vector3): Neuron[] {
    const intersected: Neuron[] = [];
    this.traverseBVH(this.root, origin, direction, intersected);
    return intersected;
  }

  private traverseBVH(
    node: BVHNode,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    intersected: Neuron[]
  ): void {
    if (!node) return;

    const ray = new THREE.Ray(origin, direction);
    if (!ray.intersectsBox(node.bounds)) return;

    if (node.neuron) {
      const distance = origin.distanceTo(node.neuron.position);
      if (distance <= node.neuron.size) {
        intersected.push(node.neuron);
      }
      return;
    }

    if (node.left) this.traverseBVH(node.left, origin, direction, intersected);
    if (node.right) this.traverseBVH(node.right, origin, direction, intersected);
  }
}