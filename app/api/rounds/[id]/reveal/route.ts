import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProvablyFairProtocol } from '@/lib/prng';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (round.status !== 'STARTED') {
      return NextResponse.json(
        { error: 'Round must be started before revealing' },
        { status: 400 }
      );
    }

    // Update round status to revealed
    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      },
    });

    // Verify the commitment for transparency
    const isValid = ProvablyFairProtocol.verifyCommit(
      updatedRound.serverSeed!,
      updatedRound.nonce,
      updatedRound.commitHex
    );

    // Return the revealed server seed and verification
    return NextResponse.json({
      roundId: updatedRound.id,
      serverSeed: updatedRound.serverSeed,
      nonce: updatedRound.nonce,
      clientSeed: updatedRound.clientSeed,
      combinedSeed: updatedRound.combinedSeed,
      commitHex: updatedRound.commitHex,
      isValid,
      revealedAt: updatedRound.revealedAt,
    });

  } catch (error) {
    console.error('Error revealing round:', error);
    return NextResponse.json(
      { error: 'Failed to reveal round' },
      { status: 500 }
    );
  }
}