import { NextRequest, NextResponse } from 'next/server';
import { ProvablyFairProtocol } from '@/lib/prng';
import { PlinkoEngine } from '@/lib/engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumn = searchParams.get('dropColumn');

    // Validate required parameters
    if (!serverSeed || !clientSeed || !nonce || dropColumn === null) {
      return NextResponse.json(
        { error: 'Missing required parameters: serverSeed, clientSeed, nonce, dropColumn' },
        { status: 400 }
      );
    }

    const dropCol = parseInt(dropColumn);
    if (isNaN(dropCol) || dropCol < 0 || dropCol > 12) {
      return NextResponse.json(
        { error: 'Drop column must be a number between 0 and 12' },
        { status: 400 }
      );
    }

    // Recompute all values
    const commitHex = ProvablyFairProtocol.createCommitHash(serverSeed, nonce);
    const combinedSeed = ProvablyFairProtocol.generateCombinedSeed(serverSeed, clientSeed, nonce);
    
    // Replay the game
    const gameResult = PlinkoEngine.playRound(
      serverSeed,
      clientSeed, 
      nonce,
      dropCol,
      12, // ROWS
      100 // Bet amount doesn't affect outcome
    );

    // Verify commitment
    const commitValid = ProvablyFairProtocol.verifyCommit(serverSeed, nonce, commitHex);

    return NextResponse.json({
      // Input values
      serverSeed,
      clientSeed,
      nonce,
      dropColumn: dropCol,
      
      // Computed values
      commitHex,
      combinedSeed,
      pegMapHash: gameResult.pegMapHash,
      binIndex: gameResult.binIndex,
      payoutMultiplier: gameResult.payoutMultiplier,
      
      // Game data for replay
      pegMap: gameResult.pegMap,
      path: gameResult.path,
      
      // Verification
      commitValid,
      
      // Additional info
      rows: 12,
    });

  } catch (error) {
    console.error('Error verifying round:', error);
    return NextResponse.json(
      { error: 'Failed to verify round' },
      { status: 500 }
    );
  }
}