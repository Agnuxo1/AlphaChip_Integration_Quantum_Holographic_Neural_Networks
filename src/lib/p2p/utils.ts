export function measureProcessingPower(): number {
  const iterations = 1000000;
  const start = performance.now();
  
  // Perform some CPU-intensive calculations
  for (let i = 0; i < iterations; i++) {
    Math.sqrt(Math.random() * 1000);
  }
  
  const end = performance.now();
  const timeInSeconds = (end - start) / 1000;
  const operationsPerSecond = iterations / timeInSeconds;
  
  // Convert to TFLOPS (very rough approximation)
  return operationsPerSecond / 1e12;
}

export function calculateNetworkLatency(start: number): number {
  return performance.now() - start;
}

export function generatePeerId(): string {
  return Math.random().toString(36).substring(2, 15);
}