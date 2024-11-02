import { HfInference } from '@huggingface/inference';
import { QuantumState } from '../quantum/QuantumMath';

interface QuantumContext {
  state: QuantumState;
  coherence: number;
  entanglement: number;
  holographicMemory: string[];
}

export class HuggingFaceClient {
  private client: HfInference | null = null;
  private model: string = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
  private quantumContext: QuantumContext | null = null;
  private memoryCache: Map<string, string[]> = new Map();

  public setToken(token: string) {
    this.client = new HfInference(token);
  }

  public setModel(model: string) {
    this.model = model;
  }

  public updateQuantumContext(context: QuantumContext) {
    this.quantumContext = context;
    this.updateMemoryCache();
  }

  private updateMemoryCache() {
    if (!this.quantumContext) return;

    // Update memory cache based on quantum coherence
    const coherenceThreshold = 0.7;
    if (this.quantumContext.coherence > coherenceThreshold) {
      this.quantumContext.holographicMemory.forEach(memory => {
        const key = this.generateMemoryKey(memory);
        if (!this.memoryCache.has(key)) {
          this.memoryCache.set(key, [memory]);
        } else {
          const existing = this.memoryCache.get(key)!;
          if (existing.length > 5) existing.shift();
          existing.push(memory);
        }
      });
    }
  }

  private generateMemoryKey(memory: string): string {
    return memory.toLowerCase().split(' ').slice(0, 3).join('_');
  }

  private async getRelevantMemories(prompt: string): Promise<string[]> {
    const keywords = prompt.toLowerCase().split(' ');
    const memories = new Set<string>();

    keywords.forEach(keyword => {
      this.memoryCache.forEach((value, key) => {
        if (key.includes(keyword)) {
          value.forEach(memory => memories.add(memory));
        }
      });
    });

    return Array.from(memories);
  }

  public async generateText(prompt: string, context?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized. Please set token first.');
    }

    try {
      const relevantMemories = await this.getRelevantMemories(prompt);
      const quantumContextStr = this.quantumContext ? `
        Quantum Coherence: ${this.quantumContext.coherence}
        Entanglement Degree: ${this.quantumContext.entanglement}
        Quantum State Phase: ${this.quantumContext.state.phase}
      ` : '';

      const systemPrompt = `
        Based on the following quantum holographic context:
        ${quantumContextStr}
        
        Relevant memories:
        ${relevantMemories.join('\n')}
        
        Additional context:
        ${context || ''}
        
        Please provide a response to: ${prompt}
      `;

      const response = await this.client.textGeneration({
        model: this.model,
        inputs: `<s>[INST] ${systemPrompt} [/INST]`,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.1,
        },
      });
      
      // Store response in memory cache
      if (this.quantumContext && this.quantumContext.coherence > 0.5) {
        const key = this.generateMemoryKey(prompt);
        const memory = [prompt, response.generated_text];
        this.memoryCache.set(key, memory);
      }

      return response.generated_text;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }
}