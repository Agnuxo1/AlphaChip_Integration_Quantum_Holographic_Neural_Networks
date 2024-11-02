import * as tf from '@tensorflow/tfjs';
import { ChipState, ChipAction, PerformanceMetrics } from './types';

// Initialize TensorFlow.js
tf.setBackend('cpu');

class ReplayBuffer {
  private buffer: Array<{
    state: ChipState;
    action: ChipAction;
    reward: number;
    nextState: ChipState;
  }>;
  private capacity: number;

  constructor(capacity: number) {
    this.buffer = [];
    this.capacity = capacity;
  }

  add(state: ChipState, action: ChipAction, reward: number, nextState: ChipState): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push({ state, action, reward, nextState });
  }

  sample(batchSize: number): Array<{
    state: ChipState;
    action: ChipAction;
    reward: number;
    nextState: ChipState;
  }> {
    const samples = [];
    for (let i = 0; i < batchSize; i++) {
      const index = Math.floor(Math.random() * this.buffer.length);
      samples.push(this.buffer[index]);
    }
    return samples;
  }

  size(): number {
    return this.buffer.length;
  }
}

export class ChipDesignAgent {
  private model: tf.LayersModel;
  private optimizer: tf.Optimizer;
  private memory: ReplayBuffer;
  private readonly stateSize = 10;
  private readonly actionSize = 4;
  private readonly batchSize = 32;
  private readonly gamma = 0.99; // Discount factor
  private readonly learningRate = 0.001;

  constructor() {
    this.model = this.createModel();
    this.optimizer = tf.train.adam(this.learningRate);
    this.memory = new ReplayBuffer(10000);
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [this.stateSize]
    }));

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu'
    }));

    model.add(tf.layers.dense({
      units: this.actionSize,
      activation: 'linear'
    }));

    model.compile({
      optimizer: this.optimizer,
      loss: 'meanSquaredError'
    });

    return model;
  }

  public async train(
    state: ChipState,
    action: ChipAction,
    reward: number,
    nextState: ChipState
  ): Promise<number> {
    this.memory.add(state, action, reward, nextState);

    if (this.memory.size() < this.batchSize) {
      return 0;
    }

    const batch = this.memory.sample(this.batchSize);
    
    return tf.tidy(() => {
      const states = tf.tensor2d(
        batch.map(b => this.stateToVector(b.state))
      );
      const nextStates = tf.tensor2d(
        batch.map(b => this.stateToVector(b.nextState))
      );

      const currentQs = this.model.predict(states) as tf.Tensor;
      const futureQs = this.model.predict(nextStates) as tf.Tensor;

      const updatedQValues = currentQs.arraySync().map((q: number[], i: number) => {
        const maxFutureQ = Math.max(...(futureQs.arraySync()[i] as number[]));
        q[batch[i].action] = batch[i].reward + this.gamma * maxFutureQ;
        return q;
      });

      const targetQs = tf.tensor2d(updatedQValues);
      const history = this.model.trainOnBatch(states, targetQs);

      const loss = Array.isArray(history) ? history[0] : history;
      return loss;
    });
  }

  public async getNextAction(state: ChipState): Promise<ChipAction> {
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([this.stateToVector(state)]);
      const prediction = this.model.predict(stateTensor) as tf.Tensor;
      const action = prediction.argMax(-1).dataSync()[0] as ChipAction;
      return action;
    });
  }

  private stateToVector(state: ChipState): number[] {
    const metrics = this.normalizeMetrics(state.performance);
    return [
      state.components.length / 1000, // Normalize component count
      metrics.powerEfficiency,
      metrics.areaUtilization,
      metrics.thermalDissipation,
      metrics.signalIntegrity,
      state.quantumCoherence,
      state.processingPower,
      state.networkEfficiency,
      state.entanglementDegree,
      state.holographicFidelity
    ];
  }

  private normalizeMetrics(metrics: PerformanceMetrics): PerformanceMetrics {
    return {
      powerEfficiency: metrics.powerEfficiency / 100,
      areaUtilization: metrics.areaUtilization / 100,
      thermalDissipation: metrics.thermalDissipation / 100,
      signalIntegrity: metrics.signalIntegrity / 100
    };
  }

  public async save(): Promise<void> {
    await this.model.save('localstorage://chip-design-agent');
  }

  public async load(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://chip-design-agent');
      this.model.compile({
        optimizer: this.optimizer,
        loss: 'meanSquaredError'
      });
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  }
}