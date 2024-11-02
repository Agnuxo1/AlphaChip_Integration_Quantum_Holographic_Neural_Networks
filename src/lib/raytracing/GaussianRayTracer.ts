import * as THREE from 'three';
import { BVH } from './BVH';
import { Neuron, QuantumNeuron } from './types';
import { QUANTUM_CONSTANTS } from '../quantum/QuantumMath';

export class GaussianRayTracer {
  private particles: Neuron[];
  private scene: THREE.Scene;
  private bvh: BVH;
  private instancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000 / 60; // 60 FPS target

  constructor(neurons: Neuron[]) {
    this.particles = neurons;
    this.scene = new THREE.Scene();
    this.bvh = new BVH(this.particles);
    this.dummy = new THREE.Object3D();
    
    // Create instanced material with improved shaders
    this.material = this.createInstancedMaterial();
    
    // Create instanced mesh for efficient rendering
    const geometry = new THREE.SphereGeometry(1, 32, 32); // Increased geometry detail
    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      this.material,
      neurons.length
    );
    this.instancedMesh.frustumCulled = true;
    
    // Initialize render target with HDR support
    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        encoding: THREE.LinearEncoding,
        stencilBuffer: false,
        depthBuffer: true,
        samples: 4
      }
    );
    
    this.initializeInstances();
    this.scene.add(this.instancedMesh);
  }

  private createInstancedMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() },
        quantumCoherence: { value: 0.5 },
        entanglementStrength: { value: 0.8 }
      },
      vertexShader: `
        attribute vec3 neuronColor;
        attribute float neuronIntensity;
        attribute float neuronSize;
        attribute float quantumPhase;
        attribute float entanglementDegree;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vColor;
        varying float vIntensity;
        varying float vPhase;
        varying float vEntanglement;
        varying vec3 vWorldPosition;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vColor = neuronColor;
          vIntensity = neuronIntensity;
          vPhase = quantumPhase;
          vEntanglement = entanglementDegree;
          
          // Apply quantum fluctuations
          vec3 pos = position * (neuronSize + sin(quantumPhase) * 0.1);
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        uniform float quantumCoherence;
        uniform float entanglementStrength;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vColor;
        varying float vIntensity;
        varying float vPhase;
        varying float vEntanglement;
        varying vec3 vWorldPosition;
        
        // Quantum interference pattern
        float quantumInterference(vec3 pos, float phase) {
          return sin(dot(pos, vec3(1.0)) * 10.0 + phase + time * 2.0) * 0.5 + 0.5;
        }
        
        // Holographic effect
        vec3 holographicEffect(vec3 color, vec3 normal, float intensity) {
          float fresnel = pow(1.0 - max(0.0, dot(normal, normalize(vPosition))), 3.0);
          vec3 holographic = vec3(0.2, 0.5, 1.0) * fresnel * intensity;
          return mix(color, holographic, 0.5);
        }
        
        void main() {
          // Calculate base color with quantum effects
          float interference = quantumInterference(vWorldPosition, vPhase);
          vec3 quantumColor = vColor * (interference * quantumCoherence + 0.5);
          
          // Apply holographic effect
          vec3 finalColor = holographicEffect(quantumColor, vNormal, vIntensity);
          
          // Add entanglement glow
          float entanglementGlow = vEntanglement * entanglementStrength;
          finalColor += vec3(0.3, 0.7, 1.0) * entanglementGlow;
          
          // Apply energy conservation
          finalColor = pow(finalColor, vec3(1.0 / 2.2)); // Gamma correction
          
          // Calculate alpha based on intensity and distance
          float alpha = vIntensity * (1.0 - length(vPosition) * 0.5);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  private initializeInstances(): void {
    const colorArray = new Float32Array(this.particles.length * 3);
    const intensityArray = new Float32Array(this.particles.length);
    const sizeArray = new Float32Array(this.particles.length);
    const phaseArray = new Float32Array(this.particles.length);
    const entanglementArray = new Float32Array(this.particles.length);

    this.particles.forEach((neuron, i) => {
      // Set transform with quantum jitter
      const jitter = Math.sin(Date.now() * 0.001 + i) * 0.1;
      this.dummy.position.copy(neuron.position);
      this.dummy.position.add(new THREE.Vector3(jitter, jitter, jitter));
      this.dummy.scale.setScalar(neuron.size);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Set attributes with quantum properties
      const color = neuron.color instanceof THREE.Color ? neuron.color : new THREE.Color(neuron.color);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
      
      intensityArray[i] = neuron.intensity;
      sizeArray[i] = neuron.size;
      phaseArray[i] = (neuron as QuantumNeuron).quantumState?.phase || Math.random() * Math.PI * 2;
      entanglementArray[i] = (neuron as QuantumNeuron).quantumState?.entanglementDegree || Math.random();
    });

    // Add instance attributes
    this.instancedMesh.geometry.setAttribute(
      'neuronColor',
      new THREE.InstancedBufferAttribute(colorArray, 3)
    );
    this.instancedMesh.geometry.setAttribute(
      'neuronIntensity',
      new THREE.InstancedBufferAttribute(intensityArray, 1)
    );
    this.instancedMesh.geometry.setAttribute(
      'neuronSize',
      new THREE.InstancedBufferAttribute(sizeArray, 1)
    );
    this.instancedMesh.geometry.setAttribute(
      'quantumPhase',
      new THREE.InstancedBufferAttribute(phaseArray, 1)
    );
    this.instancedMesh.geometry.setAttribute(
      'entanglementDegree',
      new THREE.InstancedBufferAttribute(entanglementArray, 1)
    );
  }

  public updateParticles(neurons: Neuron[]): void {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return; // Skip update if too soon
    }
    
    this.particles = neurons;
    this.initializeInstances();
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.lastUpdateTime = currentTime;
  }

  public render(camera: THREE.Camera, time: number): void {
    // Update uniforms
    this.material.uniforms.time.value = time;
    this.material.uniforms.resolution.value.set(
      this.renderTarget.width,
      this.renderTarget.height
    );
    
    // Update quantum parameters based on time
    const coherence = 0.5 + Math.sin(time * 0.5) * 0.3;
    const entanglement = 0.8 + Math.cos(time * 0.3) * 0.2;
    this.material.uniforms.quantumCoherence.value = coherence;
    this.material.uniforms.entanglementStrength.value = entanglement;
  }

  public onWindowResize(): void {
    this.renderTarget.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    this.material.dispose();
    this.renderTarget.dispose();
    this.scene.remove(this.instancedMesh);
  }
}