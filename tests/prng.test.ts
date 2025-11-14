import { XORShift32, ProvablyFairProtocol, RoundRNG } from '../lib/prng';

describe('XORShift32 PRNG', () => {
  test('should produce deterministic sequence', () => {
    const prng = new XORShift32(123456);
    
    // Test that same seed produces same sequence
    const sequence1 = [];
    const sequence2 = [];
    
    // Generate first sequence
    for (let i = 0; i < 5; i++) {
      sequence1.push(prng.next());
    }
    
    // Reset and generate second sequence  
    const prng2 = new XORShift32(123456);
    for (let i = 0; i < 5; i++) {
      sequence2.push(prng2.next());
    }

    // Should be identical
    sequence1.forEach((val, index) => {
      expect(val).toBe(sequence2[index]);
    });
  });

  test('should not produce zero state', () => {
    const prng = new XORShift32(0);
    expect(prng.getState()).not.toBe(0);
  });

  test('should maintain state correctly', () => {
    const prng = new XORShift32(42);
    const firstValue = prng.next();
    const secondValue = prng.next();
    
    expect(firstValue).not.toBe(secondValue);
    expect(firstValue).toBeGreaterThanOrEqual(0);
    expect(firstValue).toBeLessThan(1);
  });
});

describe('ProvablyFairProtocol', () => {
  test('should generate valid server seeds', () => {
    const seed1 = ProvablyFairProtocol.generateServerSeed();
    const seed2 = ProvablyFairProtocol.generateServerSeed();
    
    expect(seed1).toHaveLength(64); // SHA256 hex length
    expect(seed2).toHaveLength(64);
    expect(seed1).not.toBe(seed2);
    expect(/^[a-f0-9]+$/i.test(seed1)).toBe(true);
  });

  test('should generate valid nonces', () => {
    const nonce1 = ProvablyFairProtocol.generateNonce();
    const nonce2 = ProvablyFairProtocol.generateNonce();
    
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBeGreaterThan(0);
  });

  test('should create consistent commit hashes', () => {
    const serverSeed = 'test_server_seed';
    const nonce = 'test_nonce';
    
    const hash1 = ProvablyFairProtocol.createCommitHash(serverSeed, nonce);
    const hash2 = ProvablyFairProtocol.createCommitHash(serverSeed, nonce);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  test('should generate consistent combined seeds', () => {
    const serverSeed = 'server123';
    const clientSeed = 'client456';
    const nonce = 'nonce789';
    
    const combined1 = ProvablyFairProtocol.generateCombinedSeed(serverSeed, clientSeed, nonce);
    const combined2 = ProvablyFairProtocol.generateCombinedSeed(serverSeed, clientSeed, nonce);
    
    expect(combined1).toBe(combined2);
    expect(combined1).toHaveLength(64);
  });

  test('should verify commits correctly', () => {
    const serverSeed = 'test_server';
    const nonce = 'test_nonce';
    const correctHash = ProvablyFairProtocol.createCommitHash(serverSeed, nonce);
    const incorrectHash = 'wrong_hash';
    
    expect(ProvablyFairProtocol.verifyCommit(serverSeed, nonce, correctHash)).toBe(true);
    expect(ProvablyFairProtocol.verifyCommit(serverSeed, nonce, incorrectHash)).toBe(false);
  });

  test('should extract PRNG seed correctly', () => {
    const combinedSeed = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const extracted = ProvablyFairProtocol.extractPRNGSeed(combinedSeed);
    
    // First 8 hex chars: 'abcdef12' = 2882400018 in decimal
    expect(extracted).toBe(2882400018);
  });
});

describe('RoundRNG', () => {
  test('should produce identical sequences for same seed', () => {
    const combinedSeed = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    const rng1 = new RoundRNG(combinedSeed);
    const rng2 = new RoundRNG(combinedSeed);
    
    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  test('should track call count correctly', () => {
    const combinedSeed = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const rng = new RoundRNG(combinedSeed);
    
    expect(rng.getCallCount()).toBe(0);
    
    rng.next();
    expect(rng.getCallCount()).toBe(1);
    
    rng.next();
    expect(rng.getCallCount()).toBe(2);
  });

  test('should reset correctly', () => {
    const combinedSeed = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const rng = new RoundRNG(combinedSeed);
    
    const firstValue = rng.next();
    expect(rng.getCallCount()).toBe(1);
    
    rng.reset(combinedSeed);
    expect(rng.getCallCount()).toBe(0);
    
    const resetValue = rng.next();
    expect(resetValue).toBe(firstValue);
  });
});