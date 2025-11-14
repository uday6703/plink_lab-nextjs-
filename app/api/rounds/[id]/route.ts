import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get the round with all details
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Return different levels of detail based on round status
    const response: any = {
      id: round.id,
      createdAt: round.createdAt,
      status: round.status,
      nonce: round.nonce,
      commitHex: round.commitHex,
      rows: round.rows,
    };

    // Add details if round has started
    if (round.status === 'STARTED' || round.status === 'REVEALED') {
      response.clientSeed = round.clientSeed;
      response.combinedSeed = round.combinedSeed;
      response.pegMapHash = round.pegMapHash;
      response.dropColumn = round.dropColumn;
      response.binIndex = round.binIndex;
      response.payoutMultiplier = round.payoutMultiplier;
      response.betCents = round.betCents;
      response.pathJson = round.pathJson;
      response.winAmount = Math.round(round.betCents * round.payoutMultiplier);
    }

    // Add server seed only if revealed
    if (round.status === 'REVEALED') {
      response.serverSeed = round.serverSeed;
      response.revealedAt = round.revealedAt;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}