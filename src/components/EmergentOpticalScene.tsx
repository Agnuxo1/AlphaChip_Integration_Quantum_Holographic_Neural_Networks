import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { CoreProcessor } from './CoreProcessor';
import { NeuralLayer } from './NeuralLayer';
import { StarField } from './StarField';
import { GaussianRayTracer } from '../lib/raytracing/GaussianRayTracer';
import { QuantumNeuron } from '../lib/raytracing/types';
import * as THREE from 'three';

// Enhanced neuron configuration
const VISIBLE_NEURONS = 50000; // Increased for better visual density
const TOTAL_NEURONS = 1000000;
const NEURON_LAYERS = 5;
const NEURONS_PER_LAYER = VISIBLE_NEURONS / NEURON_LAYERS;

export function EmergentOpticalScene() {
  const timeRef = useRef(0);
  const rayTracerRef = useRef<GaussianRayTracer | null>(null);
  const { camera, gl, size } = useThree();
  
  const [processorMetrics, setProcessorMetrics] = useState({
    quantumCoherence: 0,
    processingState: 0,
    entanglementDegree: 0
  });

  // Initialize quantum neurons with enhanced distribution
  useEffect(() => {
    const neurons: QuantumNeuron[] = [];
    
    // Create layered neuron distribution
    for (let layer = 0; layer < NEURON_LAYERS; layer++) {
      const radius = 10 + layer * 5; // Increasing radius per layer
      const layerNeurons = NEURONS_PER_LAYER;
      
      for (let i = 0; i < layerNeurons; i++) {
        const phi = Math.acos(-1 + (2 * i) / layerNeurons);
        const theta = Math.sqrt(layerNeurons * Math.PI) * phi;
        
        // Fibonacci sphere distribution
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        // Quantum properties
        const quantumState = {
          wavefunction: [{ real: Math.random(), imag: Math.random() }],
          probability: Math.random(),
          phase: Math.random() * Math.PI * 2,
          spin: Math.random() * 2 - 1,
          entanglementDegree: Math.random()
        };
        
        // Enhanced color calculation based on quantum properties
        const hue = (quantumState.phase / (Math.PI * 2)) * 360;
        const saturation = 0.5 + quantumState.probability * 0.5;
        const lightness = 0.3 + quantumState.entanglementDegree * 0.4;
        const color = new THREE.Color().setHSL(hue / 360, saturation, lightness);
        
        neurons.push({
          position: new THREE.Vector3(x, y, z),
          color,
          intensity: 0.5 + Math.random() * 0.5,
          sigma: 0.1 + Math.random() * 0.2,
          size: 0.05 + Math.random() * 0.05,
          quantumState,
          holographicPattern: new Float32Array(16).map(() => Math.random())
        });
      }
    }

    rayTracerRef.current = new GaussianRayTracer(neurons);

    // Handle window resizing
    const handleResize = () => {
      rayTracerRef.current?.onWindowResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rayTracerRef.current?.dispose();
    };
  }, []);

  const handleProcessorUpdate = useCallback((metrics: any) => {
    setProcessorMetrics(metrics);
  }, []);

  useFrame((state) => {
    timeRef.current = state.clock.getElapsedTime();

    if (rayTracerRef.current) {
      rayTracerRef.current.render(camera, timeRef.current);
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#4080ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.25} color="#ff8040" />
      
      <CoreProcessor 
        position={[0, 0, 0]} 
        scale={1} 
        onProcessorUpdate={handleProcessorUpdate}
      />
      
      <group>
        {Array.from({ length: NEURON_LAYERS }).map((_, i) => (
          <NeuralLayer 
            key={i} 
            radius={4 + i * 2} 
            neuronCount={80 + i * 40} 
          />
        ))}
      </group>
      
      <StarField count={100000} radius={50} />
      
      <Stars 
        radius={100} 
        depth={50} 
        count={10000} 
        factor={4} 
        saturation={0.5} 
        fade 
        speed={0.5} 
      />
      
      <EffectComposer multisampling={4}>
        <Bloom 
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.SCREEN}
        />
        <ChromaticAberration
          offset={[0.002, 0.002]}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={true}
          modulationOffset={0.5}
        />
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.02}
          bokehScale={3}
        />
      </EffectComposer>
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        rotateSpeed={0.5} 
        minDistance={10} 
        maxDistance={100}
        maxPolarAngle={Math.PI * 0.8}
      />
    </>
  );
}