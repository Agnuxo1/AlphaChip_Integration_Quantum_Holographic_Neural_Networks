import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Activity, Cpu, Settings, TrendingUp } from 'lucide-react';
import { ChipState, ChipAction } from '../lib/chip/types';
import { AlphaChipOptimizer } from '../lib/chip/AlphaChipOptimizer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AlphaChipVisualizerProps {
  chipState: ChipState;
  onOptimize: (action: ChipAction) => void;
}

export function AlphaChipVisualizer({ chipState, onOptimize }: AlphaChipVisualizerProps) {
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);
  const [metrics, setMetrics] = useState<Array<{
    timestamp: number;
    power: number;
    area: number;
    speed: number;
  }>>([]);
  
  const optimizerRef = useRef<AlphaChipOptimizer>();
  const intervalRef = useRef<number>();

  useEffect(() => {
    optimizerRef.current = new AlphaChipOptimizer(chipState);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAutoOptimizing) {
      intervalRef.current = window.setInterval(async () => {
        if (optimizerRef.current) {
          const action = await optimizerRef.current.getNextAction();
          onOptimize(action);
          
          // Update metrics
          const newMetric = {
            timestamp: Date.now(),
            power: chipState.performance.powerEfficiency,
            area: chipState.performance.areaUtilization,
            speed: chipState.performance.signalIntegrity
          };
          
          setMetrics(prev => [...prev.slice(-19), newMetric]);
        }
      }, 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isAutoOptimizing, chipState]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            AlphaChip Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Auto-Optimization</span>
            <Switch
              checked={isAutoOptimizing}
              onCheckedChange={setIsAutoOptimizing}
              className="border-2 border-blue-500 rounded-full"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Power Efficiency</span>
                <span>{chipState.performance.powerEfficiency.toFixed(1)}%</span>
              </div>
              <Progress value={chipState.performance.powerEfficiency} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Area Utilization</span>
                <span>{chipState.performance.areaUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={chipState.performance.areaUtilization} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Thermal Dissipation</span>
                <span>{chipState.performance.thermalDissipation.toFixed(1)}%</span>
              </div>
              <Progress value={chipState.performance.thermalDissipation} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Signal Integrity</span>
                <span>{chipState.performance.signalIntegrity.toFixed(1)}%</span>
              </div>
              <Progress value={chipState.performance.signalIntegrity} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              className="flex items-center gap-2"
              onClick={() => onOptimize(ChipAction.OptimizeConnections)}
              disabled={isAutoOptimizing}
            >
              <Activity className="w-4 h-4" />
              Optimize Connections
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => onOptimize(ChipAction.AddProcessor)}
              disabled={isAutoOptimizing}
            >
              <TrendingUp className="w-4 h-4" />
              Add Processor
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  formatter={(value: number) => value.toFixed(1) + '%'}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="power"
                  name="Power Efficiency"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="area"
                  name="Area Utilization"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  name="Signal Integrity"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Component Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chipState.components.map((component, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{component.id}</span>
                  <span>{component.efficiency.toFixed(1)}% Efficient</span>
                </div>
                <Progress value={component.efficiency} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}