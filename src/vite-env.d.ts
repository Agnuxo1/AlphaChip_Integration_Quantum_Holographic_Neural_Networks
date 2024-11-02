/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'long' {
  export default class Long {
    constructor(low: number, high?: number, unsigned?: boolean);
    static fromNumber(value: number, unsigned?: boolean): Long;
    static fromString(str: string, unsigned?: boolean | number, radix?: number): Long;
    static fromBits(lowBits: number, highBits: number, unsigned?: boolean): Long;
    static fromValue(val: string | number | Long | { low: number; high: number; unsigned?: boolean }): Long;
  }
}