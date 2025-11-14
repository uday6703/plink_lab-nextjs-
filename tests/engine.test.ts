import { PlinkoEngine, PegMap, GamePath, ROWS, BINS } from '../lib/engine';
import { RoundRNG } from '../lib/prng';

describe('PlinkoEngine', () => {
  test('should match test vector for peg map generation', () => {
    // Using test vector combinedSeed
    const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const rng = new RoundRNG(combinedSeed);
    const pegMap = PlinkoEngine.generatePegMap(rng, ROWS);
    
    // Verify structure
    expect(pegMap).toHaveLength(ROWS);
    
    // Check first few rows match expected values from test vector
    expect(pegMap[0]).toHaveLength(1);
    expect(pegMap[0][0]).toBeCloseTo(0.422123, 6);
    
    expect(pegMap[1]).toHaveLength(2);
    expect(pegMap[1][0]).toBeCloseTo(0.552503, 6);
    expect(pegMap[1][1]).toBeCloseTo(0.408786, 6);
    
    expect(pegMap[2]).toHaveLength(3);
    expect(pegMap[2][0]).toBeCloseTo(0.491574, 6);
    expect(pegMap[2][1]).toBeCloseTo(0.468780, 6);
    expect(pegMap[2][2]).toBeCloseTo(0.436540, 6);
  });

  test('should simulate deterministic ball drop', () => {
    const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    
    // Generate peg map first
    const rng1 = new RoundRNG(combinedSeed);
    const pegMap = PlinkoEngine.generatePegMap(rng1, ROWS);
    
    // Simulate drop with fresh RNG
    const rng2 = new RoundRNG(combinedSeed);
    // Skip peg map generation calls
    for (let row = 0; row < ROWS; row++) {
      for (let peg = 0; peg <= row; peg++) {
        rng2.next();
      }
    }
    
    const path = PlinkoEngine.simulateDrop(rng2, pegMap, 6); // center drop
    
    expect(path).toHaveLength(ROWS);
    
    // Verify final bin matches test vector expectation (binIndex = 6)
    const finalBin = path[path.length - 1].column;
    expect(finalBin).toBe(6);
  });

  test('should handle different starting columns', () => {
    const combinedSeed = 'test_seed_columns';
    
    for (let col = 0; col <= ROWS; col++) {
      const rng1 = new RoundRNG(combinedSeed);
      const pegMap = PlinkoEngine.generatePegMap(rng1, ROWS);
      
      const rng2 = new RoundRNG(combinedSeed);
      // Skip peg map generation
      for (let row = 0; row < ROWS; row++) {
        for (let peg = 0; peg <= row; peg++) {
          rng2.next();
        }
      }
      
      const path = PlinkoEngine.simulateDrop(rng2, pegMap, col);
      expect(path).toHaveLength(ROWS);
      expect(path[0].row).toBe(0);
    }
  });

  test('should play complete round deterministically', () => {
    // Test vector inputs
    const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
    const clientSeed = 'candidate-hello';
    const nonce = '42';
    const dropColumn = 6;
    const betCents = 500;
    
    const result1 = PlinkoEngine.playRound(
      serverSeed,
      clientSeed,
      nonce,
      dropColumn,
      ROWS,
      betCents
    );
    
    const result2 = PlinkoEngine.playRound(
      serverSeed,
      clientSeed,
      nonce,
      dropColumn,
      ROWS,
      betCents
    );
    
    // Should be identical
    expect(result1).toEqual(result2);
    
    // Verify expected bin index from test vector
    expect(result1.binIndex).toBe(6);
    expect(result1.rows).toBe(ROWS);
    expect(result1.combinedSeed).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
  });

  test('should calculate correct peg map hash', () => {
    const combinedSeed = 'test_hash_seed';
    const rng = new RoundRNG(combinedSeed);
    const pegMap = PlinkoEngine.generatePegMap(rng, ROWS);
    
    const hash1 = PlinkoEngine.createPegMapHash(pegMap);
    const hash2 = PlinkoEngine.createPegMapHash(pegMap);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA256 hex
    expect(/^[a-f0-9]+$/i.test(hash1)).toBe(true);
  });

  test('should validate payout multipliers are symmetric', () => {
    const multipliers = PlinkoEngine.getPayoutMultipliers(BINS);
    
    expect(multipliers).toHaveLength(BINS);
    
    // Should be symmetric
    for (let i = 0; i < Math.floor(BINS / 2); i++) {
      expect(multipliers[i]).toBe(multipliers[BINS - 1 - i]);
    }
    
    // Edge bins should have higher multipliers than center
    const center = Math.floor(BINS / 2);
    expect(multipliers[0]).toBeGreaterThan(multipliers[center]);
    expect(multipliers[BINS - 1]).toBeGreaterThan(multipliers[center]);
  });

  test('should handle different bet amounts correctly', () => {
    const serverSeed = 'test_seed';
    const clientSeed = 'client_seed';
    const nonce = 'nonce123';
    
    const result1 = PlinkoEngine.playRound(serverSeed, clientSeed, nonce, 6, ROWS, 100);
    const result2 = PlinkoEngine.playRound(serverSeed, clientSeed, nonce, 6, ROWS, 200);
    
    // Same game outcome
    expect(result1.binIndex).toBe(result2.binIndex);
    expect(result1.payoutMultiplier).toBe(result2.payoutMultiplier);
    
    // Different payout amounts
    expect(result2.payoutCents).toBe(result1.payoutCents * 2);
  });
});