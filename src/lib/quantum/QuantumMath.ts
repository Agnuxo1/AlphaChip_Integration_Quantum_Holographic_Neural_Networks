export class Complex {
  constructor(public real: number, public imag: number) {}

  add(other: Complex): Complex {
    return new Complex(
      this.real + other.real,
      this.imag + other.imag
    );
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  scale(factor: number): Complex {
    return new Complex(this.real * factor, this.imag * factor);
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  static fromPolar(r: number, theta: number): Complex {
    return new Complex(
      r * Math.cos(theta),
      r * Math.sin(theta)
    );
  }

  static zero(): Complex {
    return new Complex(0, 0);
  }

  static one(): Complex {
    return new Complex(1, 0);
  }

  static i(): Complex {
    return new Complex(0, 1);
  }
}

export class Matrix4x4 {
  private data: number[][];

  constructor() {
    this.data = Array(4).fill(0).map(() => Array(4).fill(0));
  }

  multiply(other: Matrix4x4): Matrix4x4 {
    const result = new Matrix4x4();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  set(row: number, col: number, value: number): void {
    this.data[row][col] = value;
  }

  get(row: number, col: number): number {
    return this.data[row][col];
  }
}

export const QUANTUM_CONSTANTS = {
  PLANCK: 6.62607015e-34,
  REDUCED_PLANCK: 1.054571817e-34,
  LIGHT_SPEED: 299792458,
  BOLTZMANN: 1.380649e-23,
  FINE_STRUCTURE: 7.297352569e-3,
  COMPTON_WAVELENGTH: 2.42631023867e-12,
  RYDBERG: 10973731.568539,
  QUANTUM_CHROMODYNAMICS_SCALE: 217e-3,
  PHOTON_INTERACTION_STRENGTH: 1.0 / 137.036,
  ELECTRON_MASS: 9.1093837015e-31,
  VACUUM_PERMITTIVITY: 8.8541878128e-12,
  WEAK_MIXING_ANGLE: 0.2229,
  STRONG_COUPLING: 0.1179
};

export interface QuantumState {
  wavefunction: Complex[];
  probability: number;
  phase: number;
  spin: number;
  entanglementDegree: number;
}

export interface OpticalProperties {
  refractiveIndex: number;
  absorption: number;
  scattering: number;
  dispersion: number;
  nonlinearity: number;
}

export interface PhotonProperties {
  wavelength: number;
  momentum: number;
  polarization: Vector3;
  phase: number;
  coherenceLength: number;
}

export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}

  add(v: Vector3): Vector3 {
    return new Vector3(
      this.x + v.x,
      this.y + v.y,
      this.z + v.z
    );
  }

  subtract(v: Vector3): Vector3 {
    return new Vector3(
      this.x - v.x,
      this.y - v.y,
      this.z - v.z
    );
  }

  scale(s: number): Vector3 {
    return new Vector3(
      this.x * s,
      this.y * s,
      this.z * s
    );
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  magnitude(): number {
    return Math.sqrt(this.dot(this));
  }

  normalize(): Vector3 {
    const mag = this.magnitude();
    return mag === 0 ? new Vector3() : this.scale(1 / mag);
  }
}