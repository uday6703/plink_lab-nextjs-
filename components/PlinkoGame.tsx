'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import PlinkoAnimation from './PlinkoAnimation';
import { PegMap, GamePath } from '@/lib/engine';
import { formatCents, generateClientSeed } from '@/lib/utils';

interface GameResult {
  roundId: string;
  status: string;
  nonce: string;
  commitHex: string;
  clientSeed: string;
  combinedSeed: string;
  pegMapHash: string;
  dropColumn: number;
  binIndex: number;
  payoutMultiplier: number;
  betCents: number;
  pegMap: PegMap;
  path: GamePath[];
  winAmount: number;
}

export default function PlinkoGame() {
  const [dropColumn, setDropColumn] = useState(6);
  const [betAmount, setBetAmount] = useState('1.00');
  const [clientSeed, setClientSeed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [roundId, setRoundId] = useState<string>('');
  const [easterEggActive, setEasterEggActive] = useState<{
    tilt: boolean;
    darkTheme: boolean;
  }>({ tilt: false, darkTheme: false });
  const [keySequence, setKeySequence] = useState('');
  
  // Initialize client seed on component mount
  useEffect(() => {
    setClientSeed(generateClientSeed());
  }, []);

  // Easter egg detection and keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      // Tilt effect with 'T'
      if (key === 't') {
        setEasterEggActive(prev => ({ ...prev, tilt: !prev.tilt }));
        return;
      }

      // Dark theme sequence detection
      const newSequence = keySequence + key;
      if ('open sesame'.startsWith(newSequence)) {
        setKeySequence(newSequence);
        if (newSequence === 'open sesame') {
          setEasterEggActive(prev => ({ ...prev, darkTheme: !prev.darkTheme }));
          setKeySequence('');
        }
      } else {
        setKeySequence(key);
      }

      // Keyboard controls
      if (key === 'arrowleft') {
        event.preventDefault();
        setDropColumn(prev => Math.max(0, prev - 1));
      } else if (key === 'arrowright') {
        event.preventDefault();
        setDropColumn(prev => Math.min(12, prev + 1));
      } else if (key === ' ' && !isLoading && !isAnimating) {
        event.preventDefault();
        handleDropBall();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence, isLoading, isAnimating]);

  // Clear easter eggs after one round
  useEffect(() => {
    if (gameResult && easterEggActive.darkTheme) {
      const timer = setTimeout(() => {
        setEasterEggActive(prev => ({ ...prev, darkTheme: false }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [gameResult, easterEggActive.darkTheme]);

  const handleDropBall = async () => {
    if (isLoading || isAnimating) return;

    setIsLoading(true);
    setGameResult(null);
    setShowResults(false);

    try {
      // First, commit to a round
      const commitResponse = await fetch('/api/rounds/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!commitResponse.ok) {
        throw new Error('Failed to create round commitment');
      }

      const commitData = await commitResponse.json();
      setRoundId(commitData.roundId);

      // Then start the round with client parameters
      const betCents = Math.round(parseFloat(betAmount) * 100);
      const startResponse = await fetch(`/api/rounds/${commitData.roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed,
          betCents,
          dropColumn,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start round');
      }

      const result = await startResponse.json();
      setGameResult(result);
      setIsAnimating(true);

    } catch (error) {
      console.error('Error playing round:', error);
      alert('Failed to play round. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setShowResults(true);
    
    // Auto-reveal the round after animation
    if (roundId) {
      fetch(`/api/rounds/${roundId}/reveal`, { method: 'POST' })
        .catch(console.error);
    }
  }, [roundId]);

  const handleBetAmountChange = (value: string) => {
    // Allow only valid decimal numbers
    if (/^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      easterEggActive.darkTheme ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${
            easterEggActive.darkTheme ? 'text-orange-400' : 'text-gray-900'
          }`}>
            Plinko Lab
          </h1>
          <p className={`text-lg ${
            easterEggActive.darkTheme ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Provably Fair • Deterministic • Transparent
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className={easterEggActive.darkTheme ? 'bg-gray-800 border-gray-600' : undefined}>
              <CardContent className="p-6">
                <PlinkoAnimation
                  pegMap={gameResult?.pegMap}
                  path={gameResult?.path}
                  isAnimating={isAnimating}
                  onAnimationComplete={handleAnimationComplete}
                  dropColumn={dropColumn}
                  tiltAngle={easterEggActive.tilt ? (Math.random() - 0.5) * 10 : 0}
                  isDarkTheme={easterEggActive.darkTheme}
                />
              </CardContent>
            </Card>
          </div>

          {/* Game Controls */}
          <div className="space-y-6">
            {/* Controls Card */}
            <Card className={easterEggActive.darkTheme ? 'bg-gray-800 border-gray-600' : undefined}>
              <CardHeader>
                <CardTitle className={easterEggActive.darkTheme ? 'text-orange-400' : undefined}>
                  Game Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="drop-column" className={easterEggActive.darkTheme ? 'text-gray-300' : undefined}>
                    Drop Column: {dropColumn}
                  </Label>
                  <Slider
                    id="drop-column"
                    min={0}
                    max={12}
                    step={1}
                    value={[dropColumn]}
                    onValueChange={(value) => setDropColumn(value[0])}
                    className="mt-2"
                    disabled={isLoading || isAnimating}
                  />
                  <div className={`text-sm mt-1 ${
                    easterEggActive.darkTheme ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Use ← → arrow keys
                  </div>
                </div>

                <div>
                  <Label htmlFor="bet-amount" className={easterEggActive.darkTheme ? 'text-gray-300' : undefined}>
                    Bet Amount
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={easterEggActive.darkTheme ? 'text-gray-300' : 'text-gray-700'}>$</span>
                    <Input
                      id="bet-amount"
                      type="text"
                      value={betAmount}
                      onChange={(e) => handleBetAmountChange(e.target.value)}
                      disabled={isLoading || isAnimating}
                      className={easterEggActive.darkTheme ? 'bg-gray-700 border-gray-600 text-gray-100' : undefined}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="client-seed" className={easterEggActive.darkTheme ? 'text-gray-300' : undefined}>
                    Client Seed
                  </Label>
                  <Input
                    id="client-seed"
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    disabled={isLoading || isAnimating}
                    className={easterEggActive.darkTheme ? 'bg-gray-700 border-gray-600 text-gray-100' : undefined}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientSeed(generateClientSeed())}
                    className="mt-2"
                    disabled={isLoading || isAnimating}
                  >
                    Generate New
                  </Button>
                </div>

                <Button
                  onClick={handleDropBall}
                  disabled={isLoading || isAnimating}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Creating Round...' : isAnimating ? 'Dropping...' : 'Drop Ball (Space)'}
                </Button>
              </CardContent>
            </Card>

            {/* Results Card */}
            {gameResult && showResults && (
              <Card className={easterEggActive.darkTheme ? 'bg-gray-800 border-gray-600' : undefined}>
                <CardHeader>
                  <CardTitle className={easterEggActive.darkTheme ? 'text-orange-400' : undefined}>
                    Round Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className={easterEggActive.darkTheme ? 'text-gray-300' : 'text-gray-600'}>Landed in Bin:</span>
                    <span className={`font-bold ${easterEggActive.darkTheme ? 'text-orange-400' : 'text-gray-900'}`}>
                      {gameResult.binIndex}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={easterEggActive.darkTheme ? 'text-gray-300' : 'text-gray-600'}>Multiplier:</span>
                    <span className={`font-bold ${easterEggActive.darkTheme ? 'text-orange-400' : 'text-gray-900'}`}>
                      {gameResult.payoutMultiplier}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={easterEggActive.darkTheme ? 'text-gray-300' : 'text-gray-600'}>Bet Amount:</span>
                    <span className={easterEggActive.darkTheme ? 'text-gray-100' : 'text-gray-900'}>
                      {formatCents(gameResult.betCents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={easterEggActive.darkTheme ? 'text-gray-300' : 'text-gray-600'}>Win Amount:</span>
                    <span className={`font-bold text-lg ${
                      gameResult.winAmount > gameResult.betCents 
                        ? 'text-green-600' 
                        : easterEggActive.darkTheme ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCents(gameResult.winAmount)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/verify?roundId=${gameResult.roundId}`, '_blank')}
                      className="w-full"
                    >
                      Verify Round
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Easter Egg Hints */}
        <div className={`mt-8 text-center text-xs ${
          easterEggActive.darkTheme ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <p>Press &apos;T&apos; for a surprise • Type &quot;open sesame&quot; for another surprise</p>
          <p>Keyboard controls: ← → arrows to change drop column, Space to drop</p>
        </div>
      </div>
    </div>
  );
}