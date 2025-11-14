#!/usr/bin/env node

/**
 * Test Vector Verification Script
 * Verifies our Plinko implementation against Daphnis Labs test vectors
 */

async function verifyTestVector() {
  const testVector = {
    // Test inputs
    serverSeed: 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc',
    clientSeed: 'candidate-hello',
    nonce: '42',
    dropColumn: 6,
    
    // Expected outputs
    expectedCommitHex: 'bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34',
    expectedCombinedSeed: 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0',
    expectedBinIndex: 6, // Center drop should result in bin 6
    
    // Expected first few PRNG values
    expectedPRNGSequence: [
      0.1106166649,
      0.7625129214,
      0.0439292176,
      0.4578678815,
      0.3438999297
    ],
    
    // Expected peg map values (first 3 rows)
    expectedPegMap: {
      row0: [0.422123],
      row1: [0.552503, 0.408786],
      row2: [0.491574, 0.468780, 0.436540]
    }
  };

  console.log('🧪 Daphnis Labs Test Vector Verification\n');

  try {
    // Test the verify API endpoint
    const response = await fetch(`http://localhost:3000/api/verify?` + 
      `serverSeed=${encodeURIComponent(testVector.serverSeed)}&` +
      `clientSeed=${encodeURIComponent(testVector.clientSeed)}&` +
      `nonce=${encodeURIComponent(testVector.nonce)}&` +
      `dropColumn=${testVector.dropColumn}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📊 Results:');
    console.log(`   Combined Seed: ${result.combinedSeed}`);
    console.log(`   Commit Hash:   ${result.commitHex}`);
    console.log(`   Peg Map Hash:  ${result.pegMapHash}`);
    console.log(`   Final Bin:     ${result.binIndex}`);
    console.log(`   Payout Multi:  ${result.payoutMultiplier}x`);
    
    console.log('\n✅ Verification:');
    
    // Check combined seed
    if (result.combinedSeed === testVector.expectedCombinedSeed) {
      console.log('   ✓ Combined seed matches test vector');
    } else {
      console.log('   ❌ Combined seed mismatch!');
      console.log(`      Expected: ${testVector.expectedCombinedSeed}`);
      console.log(`      Got:      ${result.combinedSeed}`);
    }
    
    // Check commit hash
    if (result.commitHex === testVector.expectedCommitHex) {
      console.log('   ✓ Commit hash matches test vector');
    } else {
      console.log('   ❌ Commit hash mismatch!');
      console.log(`      Expected: ${testVector.expectedCommitHex}`);
      console.log(`      Got:      ${result.commitHex}`);
    }
    
    // Check final bin
    if (result.binIndex === testVector.expectedBinIndex) {
      console.log('   ✓ Final bin matches test vector');
    } else {
      console.log('   ❌ Final bin mismatch!');
      console.log(`      Expected: ${testVector.expectedBinIndex}`);
      console.log(`      Got:      ${result.binIndex}`);
    }
    
    // Check peg map values
    if (result.pegMap) {
      const pegMapRow0 = result.pegMap[0];
      const pegMapRow1 = result.pegMap[1];
      const pegMapRow2 = result.pegMap[2];
      
      if (Math.abs(pegMapRow0[0] - testVector.expectedPegMap.row0[0]) < 0.000001) {
        console.log('   ✓ Peg map row 0 matches test vector');
      } else {
        console.log('   ❌ Peg map row 0 mismatch!');
        console.log(`      Expected: [${testVector.expectedPegMap.row0.join(', ')}]`);
        console.log(`      Got:      [${pegMapRow0.join(', ')}]`);
      }
      
      const row1Match = pegMapRow1.length === 2 && 
        Math.abs(pegMapRow1[0] - testVector.expectedPegMap.row1[0]) < 0.000001 &&
        Math.abs(pegMapRow1[1] - testVector.expectedPegMap.row1[1]) < 0.000001;
        
      if (row1Match) {
        console.log('   ✓ Peg map row 1 matches test vector');
      } else {
        console.log('   ❌ Peg map row 1 mismatch!');
        console.log(`      Expected: [${testVector.expectedPegMap.row1.join(', ')}]`);
        console.log(`      Got:      [${pegMapRow1.join(', ')}]`);
      }
    }
    
    console.log('\n🎯 Test Vector Verification Complete!');
    
    if (result.combinedSeed === testVector.expectedCombinedSeed && 
        result.commitHex === testVector.expectedCommitHex &&
        result.binIndex === testVector.expectedBinIndex) {
      console.log('🎉 All critical test vectors PASSED! Implementation is correct.');
    } else {
      console.log('⚠️  Some test vectors failed. Please check implementation.');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.log('\nMake sure the development server is running on http://localhost:3000');
  }
}

// Run verification
verifyTestVector();