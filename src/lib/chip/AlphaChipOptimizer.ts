import * as tf from '@tensorflow/tfjs';
import { ChipState, ChipAction, PerformanceMetrics } from './types';

export class AlphaChipOptimizer {
  private model: tf.LayersModel;
  private processorState: ChipState;
  private readonly stateSize = 30;
  private readonly actionSize = 8;

  constructor(initialState: ChipState) {
    this.model = this.createModel();
    this.processorState = initialState;
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
      activation: 'softmax'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  public async getNextAction(): Promise<ChipAction> {
    const stateTensor = tf.tidy(() => {
      const stateVector = this.stateToVector(this.processorState);
      // Ensure the input tensor has the correct shape [1, stateSize]
      return tf.tensor2d([this.padStateVector(stateVector)], [1, this.stateSize]);
    });

    try {
      const prediction = this.model.predict(stateTensor) as tf.Tensor;
      const actionIndex = prediction.argMax(-1).dataSync()[0];
      
      // Cleanup tensors
      stateTensor.dispose();
      prediction.dispose();
      
      return actionIndex as ChipAction;
    } catch (error) {
      console.error('Prediction error:', error);
      // Return a safe default action if prediction fails
      return ChipAction.OptimizeConnections;
    }
  }

  private stateToVector(state: ChipState): number[] {
    return [
      state.components.length,
      state.connections.length,
      state.performance.powerEfficiency,
      state.performance.areaUtilization,
      state.performance.thermalDissipation,
      state.performance.signalIntegrity,
      state.quantumCoherence,
      state.processingPower,
      state.networkEfficiency,
      state.entanglementDegree,
      state.holographicFidelity,
      ...state.components.slice(0, 5).flatMap(c => [
        c.position.x, 
        c.position.y, 
        c.position.z,
        c.efficiency,
        c.temperature
      ]),
      ...state.connections.slice(0, 5).map(c => c.weight)
    ];
  }

  private padStateVector(vector: number[]): number[] {
    // Pad the vector with zeros to match the expected input size
    const padded = [...vector];
    while (padded.length < this.stateSize) {
      padded.push(0);
    }
    return padded.slice(0, this.stateSize);
  }

  public async trainWithPPO(
    state: ChipState,
    action: ChipAction,
    reward: number,
    nextState: ChipState
  ): Promise<void> {
    const stateTensor = tf.tensor2d([this.padStateVector(this.stateToVector(state))], [1, this.stateSize]);
    const nextStateTensor = tf.tensor2d([this.padStateVector(this.stateToVector(nextState))], [1, this.stateSize]);
    const actionTensor = tf.tensor1d([action]);
    const rewardTensor = tf.scalar(reward);

    try {
      const criticValue = this.model.predict(stateTensor) as tf.Tensor;
      const nextCriticValue = this.model.predict(nextStateTensor) as tf.Tensor;
      const advantage = rewardTensor.add(nextCriticValue.mul(0.99)).sub(criticValue);

      const actorLoss = actionTensor.mul(advantage).neg().mean();
      const criticLoss = advantage.square().mean();
      const totalLoss = actorLoss.add(criticLoss);

      const grads = tf.variableGrads(() => totalLoss);
      const optimizer = tf.train.adam(0.01);
      optimizer.applyGradients(grads.grads);

      // Cleanup tensors
      stateTensor.dispose();
      nextStateTensor.dispose();
      actionTensor.dispose();
      rewardTensor.dispose();
      criticValue.dispose();
      nextCriticValue.dispose();
      advantage.dispose();
      totalLoss.dispose();
      Object.values(grads.grads).forEach(grad => grad.dispose());
    } catch (error) {
      console.error('Training error:', error);
    }
  }

  public calculateReward(state: ChipState): number {
    const powerEfficiency = state.performance.powerEfficiency / 100;
    const areaEfficiency = state.performance.areaUtilization / 100;
    const thermalEfficiency = 1 - (state.performance.thermalDissipation / 100);
    const signalQuality = state.performance.signalIntegrity / 100;
    
    const quantumBonus = (
      state.quantumCoherence +
      state.entanglementDegree +
      state.holographicFidelity
    ) / 3;

    return (
      powerEfficiency * 0.3 +
      areaEfficiency * 0.2 +
      thermalEfficiency * 0.2 +
      signalQuality * 0.2 +
      quantumBonus * 0.1
    );
  }

  public async save(): Promise<void> {
    await this.model.save('localstorage://alphachip-model');
  }

  public async load(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://alphachip-model');
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    } catch (error) {
      console.error('Failed to load AlphaChip model:', error);
    }
  }
}