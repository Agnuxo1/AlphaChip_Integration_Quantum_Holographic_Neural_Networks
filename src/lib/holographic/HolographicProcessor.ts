import { QuantumProcessor } from '../quantum/QuantumProcessor';
import { QuantumEnhancer } from '../quantum/QuantumEnhancer';
import { PhotonicProcessor } from '../optical/PhotonicProcessor';
import { Complex } from '../quantum/QuantumMath';

interface ProcessingResult {
  success: boolean;
  error?: string;
  data?: {
    tokens: number;
    coherence: number;
    entanglement: number;
    efficiency: number;
  };
}

interface ProcessorState {
  quantumState: {
    wavefunction: { real: number; imag: number }[];
    coherence: number;
    entanglement: number;
  };
  photonic: {
    interference: Float32Array;
    hologram: Float32Array;
  };
  metrics: {
    efficiency: number;
    processingPower: number;
  };
}

export class HolographicProcessor {
  private quantumProcessor: QuantumProcessor;
  private quantumEnhancer: QuantumEnhancer;
  private photonicProcessor: PhotonicProcessor;
  private processingQueue: string[];
  private isProcessing: boolean;
  private lastError: Error | null;
  private responseCache: Map<string, string>;

  constructor() {
    this.quantumProcessor = new QuantumProcessor();
    this.quantumEnhancer = new QuantumEnhancer();
    this.photonicProcessor = new PhotonicProcessor();
    this.processingQueue = [];
    this.isProcessing = false;
    this.lastError = null;
    this.responseCache = new Map();
  }

  public async processText(text: string): Promise<ProcessingResult> {
    try {
      if (!text?.trim()) {
        throw new Error('Invalid input: Text is required and cannot be empty');
      }

      // Add to processing queue
      this.processingQueue.push(text);
      
      // Process if not already processing
      if (!this.isProcessing) {
        await this.processQueue();
      }

      const quantumMetrics = this.quantumProcessor.getQuantumMetrics();
      const enhancerMetrics = this.quantumEnhancer.getQuantumMetrics();
      const photonicMetrics = this.photonicProcessor.getPhotonMetrics();

      return {
        success: true,
        data: {
          tokens: text.split(/\s+/).length,
          coherence: quantumMetrics.coherenceLength || 0,
          entanglement: enhancerMetrics.entanglement || 0,
          efficiency: photonicMetrics.hologramFidelity || 0
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.lastError = new Error(errorMessage);
      console.error('Processing error:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.processingQueue.length > 0) {
        const text = this.processingQueue[0];
        
        if (!text?.trim()) {
          this.processingQueue.shift();
          continue;
        }
        
        // Convert text to quantum data with error handling
        const quantumData = new Float32Array(text.length);
        for (let i = 0; i < text.length; i++) {
          quantumData[i] = text.charCodeAt(i) / 255;
        }

        // Process through quantum pipeline with validation
        const processedData = this.quantumProcessor.processQuantumState(quantumData);
        if (!processedData) {
          throw new Error('Quantum processing failed');
        }

        const enhancedData = this.quantumEnhancer.processPhotonic(processedData);
        if (!enhancedData) {
          throw new Error('Quantum enhancement failed');
        }
        
        // Update photonic state
        if (!this.photonicProcessor.propagatePhotons(0.01)) {
          throw new Error('Photon propagation failed');
        }

        if (!this.photonicProcessor.recordHologram(enhancedData)) {
          throw new Error('Hologram recording failed');
        }

        this.processingQueue.shift();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Queue processing error';
      this.lastError = new Error(errorMessage);
      console.error('Queue processing error:', errorMessage);
    } finally {
      this.isProcessing = false;
    }
  }

  public generateResponse(input: string): string {
    try {
      if (!input?.trim()) {
        throw new Error('Invalid input: Input text is required');
      }

      // Check cache first
      const cachedResponse = this.responseCache.get(input);
      if (cachedResponse) {
        return cachedResponse;
      }

      if (this.lastError) {
        return `Error processing input: ${this.lastError.message}`;
      }

      const quantumMetrics = this.quantumProcessor.getQuantumMetrics();
      const enhancerMetrics = this.quantumEnhancer.getQuantumMetrics();
      
      // Generate coherent response
      const words = input.split(/\s+/).filter(Boolean);
      const response = words.map(word => {
        return this.processWord(word, quantumMetrics.coherenceLength);
      }).join(' ');

      if (!response) {
        throw new Error('Response generation failed');
      }

      // Cache the response
      this.responseCache.set(input, response);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Response generation error';
      this.lastError = new Error(errorMessage);
      console.error('Response generation error:', errorMessage);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  private processWord(word: string, coherence: number): string {
    try {
      if (!word?.trim()) {
        return '';
      }

      if (typeof coherence !== 'number' || coherence < 0 || coherence > 1) {
        coherence = 0.5; // Default coherence if invalid
      }

      return word.split('').map(char => {
        const quantum = Math.random() < coherence;
        return quantum ? char : char.toLowerCase();
      }).join('');
    } catch (error) {
      throw new Error(`Word processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public saveState(): ProcessorState {
    try {
      const quantumMetrics = this.quantumProcessor.getQuantumMetrics();
      const photonicMetrics = this.photonicProcessor.getPhotonMetrics();

      return {
        quantumState: {
          wavefunction: this.quantumProcessor.getCurrentWavefunction().map(complex => ({
            real: complex.real,
            imag: complex.imag
          })),
          coherence: quantumMetrics.coherenceLength,
          entanglement: quantumMetrics.entanglementDegree
        },
        photonic: {
          interference: this.photonicProcessor.getInterferencePattern(),
          hologram: this.photonicProcessor.getHologramPlate()
        },
        metrics: {
          efficiency: photonicMetrics.hologramFidelity,
          processingPower: quantumMetrics.processingSpeed
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save state';
      this.lastError = new Error(errorMessage);
      throw new Error(`State saving error: ${errorMessage}`);
    }
  }

  public async loadState(state: ProcessorState): Promise<void> {
    try {
      if (!state?.quantumState || !state?.photonic || !state?.metrics) {
        throw new Error('Invalid state object');
      }

      const wavefunction = state.quantumState.wavefunction.map(
        w => new Complex(w.real, w.imag)
      );
      await this.quantumProcessor.setWavefunction(wavefunction);

      this.photonicProcessor.setInterferencePattern(state.photonic.interference);
      this.photonicProcessor.setHologramPlate(state.photonic.hologram);
      this.updateProcessingMetrics(state.metrics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load state';
      this.lastError = new Error(errorMessage);
      throw new Error(`State loading error: ${errorMessage}`);
    }
  }

  private updateProcessingMetrics(metrics: ProcessorState['metrics']): void {
    if (!metrics?.processingPower || !metrics?.efficiency) {
      throw new Error('Invalid metrics object');
    }

    this.quantumProcessor.updateProcessingSpeed(metrics.processingPower);
    this.photonicProcessor.updateHologramFidelity(metrics.efficiency);
  }

  public getLastError(): Error | null {
    return this.lastError;
  }

  public clearError(): void {
    this.lastError = null;
  }

  public dispose(): void {
    try {
      this.processingQueue = [];
      this.isProcessing = false;
      this.lastError = null;
      this.responseCache.clear();
    } catch (error) {
      console.error('Disposal error:', error instanceof Error ? error.message : 'Unknown error during disposal');
    }
  }
}