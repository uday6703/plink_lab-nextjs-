import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProvablyFairProtocol } from '@/lib/prng';
import { PlinkoEngine } from '@/lib/engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { clientSeed, betCents, dropColumn } = await request.json();

    // Validate input
    if (!clientSeed || typeof clientSeed !== 'string') {
      return NextResponse.json(
        { error: 'Client seed is required and must be a string' },
        { status: 400 }
      );
    }

    if (!betCents || betCents <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be positive' },
        { status: 400 }
      );
    }

    if (dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'Drop column must be between 0 and 12' },
        { status: 400 }
      );
    }

    // Get the round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    if (round.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Round has already been started' },
        { status: 400 }
      );
    }

    // Generate combined seed
    const combinedSeed = ProvablyFairProtocol.generateCombinedSeed(
      round.serverSeed!,
      clientSeed,
      round.nonce
    );

    // Play the round
    const gameResult = PlinkoEngine.playRound(
      round.serverSeed!,
      clientSeed,
      round.nonce,
      dropColumn,
      round.rows,
      betCents
    );

    // Update round in database
    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed,
        pegMapHash: gameResult.pegMapHash,
        dropColumn,
        binIndex: gameResult.binIndex,
        payoutMultiplier: gameResult.payoutMultiplier,
        betCents,
        pathJson: gameResult.path as any,
      },
    });

    // Return game result (still don't reveal server seed)
    return NextResponse.json({
      roundId: updatedRound.id,
      status: updatedRound.status,
      nonce: updatedRound.nonce,
      commitHex: updatedRound.commitHex,
      clientSeed: updatedRound.clientSeed,
      combinedSeed: updatedRound.combinedSeed,
      pegMapHash: updatedRound.pegMapHash,
      rows: updatedRound.rows,
      dropColumn: updatedRound.dropColumn,
      binIndex: updatedRound.binIndex,
      payoutMultiplier: updatedRound.payoutMultiplier,
      betCents: updatedRound.betCents,
      pegMap: gameResult.pegMap,
      path: gameResult.path,
      winAmount: Math.round(betCents * gameResult.payoutMultiplier),
    });

  } catch (error) {
    console.error('Error starting round:', error);
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    );
  }
}