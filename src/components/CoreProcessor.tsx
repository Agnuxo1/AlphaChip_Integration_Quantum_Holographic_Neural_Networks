import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { QUANTUM_CONSTANTS } from '../lib/quantum/QuantumMath';

interface CoreProcessorProps {
  position: [number, number, number];
  scale: number;
  onProcessorUpdate?: (metrics: any) => void;
}

export function CoreProcessor({ position, scale, onProcessorUpdate }: CoreProcessorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create data textures for quantum states and holographic patterns
  const { quantumTexture, holographicTexture } = useMemo(() => {
    const size = 512;
    const quantumData = new Float32Array(4 * size * size);
    const holographicData = new Float32Array(4 * size * size);
    
    for (let i = 0; i < size * size; i++) {
      const i4 = i * 4;
      // Quantum state initialization
      quantumData[i4] = Math.random();     // Amplitude
      quantumData[i4 + 1] = Math.random(); // Phase
      quantumData[i4 + 2] = Math.random(); // Entanglement
      quantumData[i4 + 3] = 1.0;          // Alpha

      // Holographic pattern initialization
      const x = (i % size) / size;
      const y = Math.floor(i / size) / size;
      const pattern = Math.sin(x * 50) * Math.cos(y * 50);
      holographicData[i4] = 0.5 + 0.5 * pattern; // R
      holographicData[i4 + 1] = 0.5 + 0.3 * pattern; // G
      holographicData[i4 + 2] = 0.8 + 0.2 * pattern; // B
      holographicData[i4 + 3] = 1.0; // A
    }

    return {
      quantumTexture: new THREE.DataTexture(
        quantumData,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType
      ),
      holographicTexture: new THREE.DataTexture(
        holographicData,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType
      )
    };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      const time = clock.getElapsedTime();
      materialRef.current.uniforms.time.value = time;
      
      // Update quantum state visualization
      const quantumState = materialRef.current.uniforms.quantumState.value;
      const data = quantumState.image.data;
      for (let i = 0; i < data.length; i += 4) {
        const phase = (time + i * 0.01) % (2 * Math.PI);
        data[i] = 0.5 + 0.5 * Math.cos(phase);     // Quantum amplitude
        data[i + 1] = 0.5 + 0.5 * Math.sin(phase); // Phase
        data[i + 2] = Math.sin(time + i * 0.005);  // Entanglement
      }
      quantumState.needsUpdate = true;

      // Update metrics
      if (onProcessorUpdate) {
        onProcessorUpdate({
          quantumCoherence: 0.5 + 0.5 * Math.sin(time * 0.5),
          processingState: (Math.sin(time) + 1) * 0.5,
          entanglementDegree: 0.5 + 0.5 * Math.cos(time * 0.3)
        });
      }
    }
  });

  const shaderUniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(512, 512) },
    quantumState: { value: quantumTexture },
    holographicPattern: { value: holographicTexture },
    processingIntensity: { value: 0.8 },
    surfaceDetail: { value: 2.0 },
    glowIntensity: { value: 0.4 },
    pulseFrequency: { value: 1.0 },
    noiseScale: { value: 5.0 }
  }), [quantumTexture, holographicTexture]);

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[2, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={shaderUniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          
          void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec2 resolution;
          uniform sampler2D quantumState;
          uniform sampler2D holographicPattern;
          uniform float processingIntensity;
          uniform float surfaceDetail;
          uniform float glowIntensity;
          uniform float pulseFrequency;
          uniform float noiseScale;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          
          // Noise functions
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          
          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            i = mod289(i);
            vec4 p = permute(permute(permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                   
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
          }
          
          void main() {
            // Sample quantum state and holographic pattern
            vec4 quantum = texture2D(quantumState, vUv);
            vec4 hologram = texture2D(holographicPattern, vUv);
            
            // Create dynamic surface pattern
            float noise = snoise(vec3(vPosition.xy * noiseScale, time * 0.5));
            float pattern = sin(vUv.x * 50.0 + time) * cos(vUv.y * 50.0 - time) * 0.5 + 0.5;
            
            // Calculate rim lighting
            vec3 viewDir = normalize(vViewPosition);
            float rim = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.0);
            
            // Quantum interference pattern
            float interference = quantum.x * hologram.x * pattern;
            
            // Pulse effect
            float pulse = sin(time * pulseFrequency) * 0.5 + 0.5;
            
            // Calculate final color
            vec3 baseColor = vec3(0.1, 0.4, 0.8); // Quantum blue
            vec3 accentColor = vec3(0.8, 0.2, 0.6); // Quantum magenta
            vec3 glowColor = vec3(0.3, 0.7, 1.0); // Holographic glow
            
            vec3 color = mix(baseColor, accentColor, interference);
            color += glowColor * (rim * glowIntensity + pulse * 0.2);
            color *= processingIntensity;
            
            // Add surface detail and noise
            color += vec3(noise * 0.1) * surfaceDetail;
            
            // Apply holographic transparency
            float alpha = 0.95 + rim * 0.05;
            
            gl_FragColor = vec4(color, alpha);
          }
        `}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}