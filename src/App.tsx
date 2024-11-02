import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ChatInterface } from './components/ChatInterface';
import { EmergentOpticalScene } from './components/EmergentOpticalScene';
import { DocumentProcessor } from './components/DocumentProcessor';
import { AlphaChipVisualizer } from './components/AlphaChipVisualizer';
import { Moon, Sun } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Progress } from './components/ui/progress';
import { ChipState, ChipAction } from './lib/chip/types';
import * as THREE from 'three';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [processingPower, setProcessingPower] = useState(0);
  const [networkEfficiency, setNetworkEfficiency] = useState(0);
  const [quantumCoherence, setQuantumCoherence] = useState(0);
  const [chipState, setChipState] = useState<ChipState>({
    components: [],
    connections: [],
    performance: {
      powerEfficiency: 75,
      areaUtilization: 80,
      thermalDissipation: 20,
      signalIntegrity: 90
    },
    quantumCoherence: 0.8,
    processingPower: 1.0,
    networkEfficiency: 0.85,
    entanglementDegree: 0.75,
    holographicFidelity: 0.9
  });

  const handleDocumentProcessed = useCallback(({ tokens, coherence }: { tokens: number; coherence: number }) => {
    setProcessingPower(prev => Math.min(10, prev + tokens / 1000));
    setQuantumCoherence(coherence);
    setNetworkEfficiency(prev => Math.min(1, prev + 0.1));
  }, []);

  const handleChipOptimization = useCallback((action: ChipAction) => {
    setChipState(prevState => {
      const newState = { ...prevState };
      
      switch (action) {
        case ChipAction.AddProcessor:
          newState.components.push({
            id: `processor-${newState.components.length + 1}`,
            position: new THREE.Vector3(
              Math.random() * 10,
              Math.random() * 10,
              Math.random() * 10
            ),
            type: 'processor',
            connections: [],
            efficiency: 75 + Math.random() * 25,
            temperature: 20 + Math.random() * 30,
            load: Math.random()
          });
          break;
          
        case ChipAction.OptimizeConnections:
          newState.performance.signalIntegrity = Math.min(100, newState.performance.signalIntegrity + 5);
          newState.performance.powerEfficiency = Math.min(100, newState.performance.powerEfficiency + 3);
          break;
      }

      newState.performance = {
        ...newState.performance,
        powerEfficiency: Math.min(100, newState.performance.powerEfficiency + Math.random() * 2),
        areaUtilization: Math.min(100, newState.performance.areaUtilization + Math.random() * 2),
        thermalDissipation: Math.max(0, newState.performance.thermalDissipation - Math.random()),
        signalIntegrity: Math.min(100, newState.performance.signalIntegrity + Math.random() * 2)
      };

      return newState;
    });
  }, []);

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={() => setIsDarkMode(!isDarkMode)}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )}
      </Button>

      <div className="w-1/2 flex flex-col p-4 overflow-auto">
        <ChatInterface isDarkMode={isDarkMode} onProcessComplete={handleDocumentProcessed} />
        
        <Card className={`mt-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <CardContent className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Power</span>
                  <span>{processingPower.toFixed(1)} TFLOPS</span>
                </div>
                <Progress value={processingPower * 10} className="h-2" />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Network Efficiency</span>
                  <span>{(networkEfficiency * 100).toFixed(1)}%</span>
                </div>
                <Progress value={networkEfficiency * 100} className="h-2" />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quantum Coherence</span>
                  <span>{(quantumCoherence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={quantumCoherence * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <DocumentProcessor 
          isDarkMode={isDarkMode}
          onProcessComplete={handleDocumentProcessed}
        />
        
        <AlphaChipVisualizer
          chipState={chipState}
          onOptimize={handleChipOptimization}
        />
      </div>

      <div className="w-1/2 fixed right-0 h-screen">
        <Canvas>
          <EmergentOpticalScene />
        </Canvas>
      </div>
    </div>
  );
}

export default App;