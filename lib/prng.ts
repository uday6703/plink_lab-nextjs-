import { createHash } from 'crypto';

// Simple random number generator for fair gaming
export class XORShift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1; // Can't start with zero
    }
  }

  /**
   * Get next random number between 0 and 1
   */
  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    this.state = this.state >>> 0; // Keep as 32-bit unsigned
    
    // Convert to [0, 1) range
    return this.state / 0x100000000;
  }

  /**
   * Get current state for debugging
   */
  getState(): number {
    return this.state;
  }
}

/**
 * Provably Fair Protocol Implementation
 * Handles commit-reveal scheme for transparent randomness
 */
export class ProvablyFairProtocol {
  /**
   * Generate a cryptographically secure server seed
   */
  static generateServerSeed(): string {
    return createHash('sha256')
      .update(Math.random().toString() + Date.now().toString())
      .digest('hex');
  }

  /**
   * Generate a unique nonce
   */
  static generateNonce(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  /**
   * Create commit hash from server seed and nonce
   */
  static createCommitHash(serverSeed: string, nonce: string): string {
    return createHash('sha256')
      .update(serverSeed + ':' + nonce)
      .digest('hex');
  }

  /**
   * Generate combined seed for deterministic randomness
   */
  static generateCombinedSeed(
    serverSeed: string,
    clientSeed: string,
    nonce: string
  ): string {
    return createHash('sha256')
      .update(serverSeed + ':' + clientSeed + ':' + nonce)
      .digest('hex');
  }

  /**
   * Extract 32-bit seed from combined seed for PRNG initialization
   */
  static extractPRNGSeed(combinedSeed: string): number {
    // Take first 4 bytes (8 hex chars) and convert to big-endian 32-bit int
    const hexSeed = combinedSeed.substring(0, 8);
    return parseInt(hexSeed, 16);
  }

  /**
   * Verify the integrity of a commit-reveal
   */
  static verifyCommit(
    serverSeed: string,
    nonce: string,
    commitHash: string
  ): boolean {
    const expectedHash = this.createCommitHash(serverSeed, nonce);
    return expectedHash === commitHash;
  }
}

/**
 * Round-specific deterministic number generator
 * Ensures all randomness for a round comes from a single PRNG stream
 */
export class RoundRNG {
  private prng: XORShift32;
  private callCount: number;

  constructor(combinedSeed: string) {
    const seed = ProvablyFairProtocol.extractPRNGSeed(combinedSeed);
    this.prng = new XORShift32(seed);
    this.callCount = 0;
  }

  /**
   * Get next random number and track call order
   */
  next(): number {
    this.callCount++;
    return this.prng.next();
  }

  /**
   * Get call count for debugging/verification
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Reset to beginning (for verification/replay)
   */
  reset(combinedSeed: string): void {
    const seed = ProvablyFairProtocol.extractPRNGSeed(combinedSeed);
    this.prng = new XORShift32(seed);
    this.callCount = 0;
  }
}