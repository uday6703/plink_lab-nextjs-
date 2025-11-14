import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProvablyFairProtocol } from '@/lib/prng';

export async function POST(request: NextRequest) {
  try {
    // Generate server-side randomness
    const serverSeed = ProvablyFairProtocol.generateServerSeed();
    const nonce = ProvablyFairProtocol.generateNonce();
    
    // Create commitment hash
    const commitHex = ProvablyFairProtocol.createCommitHash(serverSeed, nonce);

    // Create new round in database with CREATED status
    const round = await prisma.round.create({
      data: {
        status: 'CREATED',
        nonce,
        commitHex,
        serverSeed, // Store server seed for later reveal
        clientSeed: '', // Will be provided when starting the round
        combinedSeed: '', // Will be generated when starting
        pegMapHash: '', // Will be computed when starting
        rows: 12,
        dropColumn: 0, // Will be set when starting
        binIndex: 0, // Will be computed when starting
        payoutMultiplier: 0, // Will be computed when starting
        betCents: 0, // Will be set when starting
        pathJson: [], // Will be populated when starting
      },
    });

    // Return commitment information (do not reveal server seed yet)
    return NextResponse.json({
      roundId: round.id,
      commitHex,
      nonce,
    });

  } catch (error) {
    console.error('Error creating round commitment:', error);
    return NextResponse.json(
      { error: 'Failed to create round commitment' },
      { status: 500 }
    );
  }
}