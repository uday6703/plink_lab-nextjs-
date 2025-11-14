'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PlinkoAnimation from '@/components/PlinkoAnimation';
import { formatHash } from '@/lib/utils';
import { PegMap, GamePath } from '@/lib/engine';

interface VerificationResult {
  serverSeed: string;
  clientSeed: string;
  nonce: string;
  dropColumn: number;
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  payoutMultiplier: number;
  pegMap: PegMap;
  path: GamePath[];
  commitValid: boolean;
  rows: number;
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [dropColumn, setDropColumn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showReplay, setShowReplay] = useState(false);
  const [roundData, setRoundData] = useState<any>(null);

  // Load from URL params if provided
  useEffect(() => {
    const serverSeedParam = searchParams.get('serverSeed');
    const clientSeedParam = searchParams.get('clientSeed');
    const nonceParam = searchParams.get('nonce');
    const dropColumnParam = searchParams.get('dropColumn');
    const roundIdParam = searchParams.get('roundId');

    if (serverSeedParam) setServerSeed(serverSeedParam);
    if (clientSeedParam) setClientSeed(clientSeedParam);
    if (nonceParam) setNonce(nonceParam);
    if (dropColumnParam) setDropColumn(parseInt(dropColumnParam, 10));

    // If roundId is provided, fetch the round data
    if (roundIdParam) {
      fetchRoundData(roundIdParam);
    }
  }, [searchParams]);

  const fetchRoundData = async (roundId: string) => {
    try {
      const response = await fetch(`/api/rounds/${roundId}`);
      if (response.ok) {
        const data = await response.json();
        setRoundData(data);
        
        // Pre-fill form if round is revealed
        if (data.status === 'REVEALED') {
          setServerSeed(data.serverSeed || '');
          setClientSeed(data.clientSeed || '');
          setNonce(data.nonce || '');
          setDropColumn(data.dropColumn || 0);
        } else {
          setClientSeed(data.clientSeed || '');
          setNonce(data.nonce || '');
          setDropColumn(data.dropColumn || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch round data:', err);
    }
  };

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !nonce || dropColumn === undefined) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const params = new URLSearchParams({
        serverSeed,
        clientSeed,
        nonce,
        dropColumn: dropColumn.toString(),
      });

      const response = await fetch(`/api/verify?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const verificationResult = await response.json();
      setResult(verificationResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplayAnimation = () => {
    setShowReplay(true);
    setTimeout(() => setShowReplay(false), 5000); // Reset after 5 seconds
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Round Verification
          </h1>
          <p className="text-lg text-gray-600">
            Verify the fairness of any Plinko round
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Verification Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="server-seed">Server Seed</Label>
                  <Input
                    id="server-seed"
                    type="text"
                    value={serverSeed}
                    onChange={(e) => setServerSeed(e.target.value)}
                    placeholder="Server seed (revealed after round)"
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="client-seed">Client Seed</Label>
                  <Input
                    id="client-seed"
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    placeholder="Your client seed"
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="nonce">Nonce</Label>
                  <Input
                    id="nonce"
                    type="text"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    placeholder="Round nonce"
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="drop-column">Drop Column</Label>
                  <Input
                    id="drop-column"
                    type="number"
                    min={0}
                    max={12}
                    value={dropColumn}
                    onChange={(e) => setDropColumn(parseInt(e.target.value, 10))}
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleVerify}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Verifying...' : 'Verify Round'}
                </Button>
              </CardContent>
            </Card>

            {/* Original Round Data (if available) */}
            {roundData && (
              <Card>
                <CardHeader>
                  <CardTitle>Original Round Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Round ID:</span>
                    <span className="font-mono">{formatHash(roundData.id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      roundData.status === 'REVEALED' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {roundData.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commit Hash:</span>
                    <span className="font-mono">{formatHash(roundData.commitHex)}</span>
                  </div>
                  {roundData.binIndex !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Result Bin:</span>
                      <span className="font-semibold">{roundData.binIndex}</span>
                    </div>
                  )}
                  {roundData.payoutMultiplier && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Multiplier:</span>
                      <span className="font-semibold">{roundData.payoutMultiplier}x</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Verification Results */}
          <div className="space-y-6">
            {result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Verification Results
                      {result.commitValid ? (
                        <span className="text-green-600 text-sm">✓ VALID</span>
                      ) : (
                        <span className="text-red-600 text-sm">✗ INVALID</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commit Hash:</span>
                      <span className="font-mono">{formatHash(result.commitHex)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Combined Seed:</span>
                      <span className="font-mono">{formatHash(result.combinedSeed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Peg Map Hash:</span>
                      <span className="font-mono">{formatHash(result.pegMapHash)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Final Bin:</span>
                      <span className="font-semibold">{result.binIndex}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payout Multiplier:</span>
                      <span className="font-semibold">{result.payoutMultiplier}x</span>
                    </div>

                    {/* Comparison with original data */}
                    {roundData && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Comparison with Original:
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Bin Match:</span>
                            <span className={
                              roundData.binIndex === result.binIndex 
                                ? 'text-green-600 font-semibold' 
                                : 'text-red-600 font-semibold'
                            }>
                              {roundData.binIndex === result.binIndex ? '✓ MATCH' : '✗ MISMATCH'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Multiplier Match:</span>
                            <span className={
                              roundData.payoutMultiplier === result.payoutMultiplier
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }>
                              {roundData.payoutMultiplier === result.payoutMultiplier ? '✓ MATCH' : '✗ MISMATCH'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleReplayAnimation}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Replay Animation
                    </Button>
                  </CardContent>
                </Card>

                {/* Animation Replay */}
                <Card>
                  <CardContent className="p-6">
                    <PlinkoAnimation
                      pegMap={result.pegMap}
                      path={result.path}
                      isAnimating={showReplay}
                      onAnimationComplete={() => setShowReplay(false)}
                      dropColumn={result.dropColumn}
                      enableSound={false} // Disable sound for verification
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Instructions */}
            {!result && (
              <Card>
                <CardHeader>
                  <CardTitle>How to Verify</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>
                    1. <strong>Server Seed:</strong> Only available after the round is revealed
                  </p>
                  <p>
                    2. <strong>Client Seed:</strong> The seed you provided before playing
                  </p>
                  <p>
                    3. <strong>Nonce:</strong> The unique round identifier
                  </p>
                  <p>
                    4. <strong>Drop Column:</strong> Where you chose to drop the ball (0-12)
                  </p>
                  <p className="pt-2 border-t border-gray-200">
                    The verification recomputes the entire game using the same deterministic
                    algorithm and compares the results with the original round.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}