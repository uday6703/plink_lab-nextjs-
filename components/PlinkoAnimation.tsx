'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { PegMap, GamePath, ROWS } from '@/lib/engine';

interface PlinkoAnimationProps {
  pegMap?: PegMap;
  path?: GamePath[];
  isAnimating: boolean;
  onAnimationComplete: () => void;
  dropColumn: number;
  enableSound?: boolean;
  tiltAngle?: number;
  isDarkTheme?: boolean;
}

export default function PlinkoAnimation({
  pegMap,
  path,
  isAnimating,
  onAnimationComplete,
  dropColumn,
  enableSound = true,
  tiltAngle = 0,
  isDarkTheme = false
}: PlinkoAnimationProps) {
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(-1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  const boardRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<any>(null);

  // Initialize Howler sound
  useEffect(() => {
    if (typeof window !== 'undefined' && enableSound) {
      import('howler').then(({ Howl }) => {
        soundRef.current = new Howl({
          src: ['/sounds/peg-hit.mp3', '/sounds/peg-hit.wav'], // Fallback formats
          volume: 0.3,
          preload: true,
        });
      });
    }
  }, [enableSound]);

  // Window resize handler for confetti
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  // Calculate board dimensions
  const BOARD_WIDTH = 600;
  const BOARD_HEIGHT = 500;
  const PEG_SIZE = 8;
  const BALL_SIZE = 12;
  
  const rowHeight = BOARD_HEIGHT / (ROWS + 2);

  // Calculate ball starting position
  const startX = (dropColumn / ROWS) * BOARD_WIDTH;
  const startY = 0;

  // Animation effect
  useEffect(() => {
    if (!isAnimating || !path || path.length === 0) {
      setCurrentStep(-1);
      setBallPosition({ x: startX, y: startY });
      return;
    }

    let stepIndex = 0;
    setBallPosition({ x: startX, y: startY });
    setCurrentStep(0);

    const animateStep = () => {
      if (stepIndex >= path.length) {
        // Final step: animate ball to the bottom bin
        const lastStep = path[path.length - 1];
        const finalBinX = (lastStep.column / ROWS) * BOARD_WIDTH;
        const finalBinY = BOARD_HEIGHT - 20; // Bottom of the board
        
        setBallPosition({ x: finalBinX, y: finalBinY });
        
        // Show results immediately, then confetti after a delay
        setTimeout(() => {
          onAnimationComplete(); // This will show the results
          
          // Show confetti after results are displayed
          setTimeout(() => {
            setShowConfetti(true);
            setTimeout(() => {
              setShowConfetti(false);
            }, 2000);
          }, 500); // 500ms delay before confetti starts
        }, 300);
        return;
      }

      const step = path[stepIndex];
      const targetX = (step.column / ROWS) * BOARD_WIDTH;
      const targetY = (step.row + 1) * rowHeight;

      // Play sound effect
      if (soundRef.current && enableSound) {
        soundRef.current.play();
      }

      // Animate to next position
      setBallPosition({ x: targetX, y: targetY });
      setCurrentStep(stepIndex);

      stepIndex++;
      setTimeout(animateStep, 300); // 300ms between steps
    };

    // Start animation after a brief delay
    setTimeout(animateStep, 500);
  }, [isAnimating, path, startX, startY, onAnimationComplete, enableSound]);

  if (!pegMap) {
    return (
      <div className={`w-full h-96 flex items-center justify-center ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'} rounded-lg`}>
        <div className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
          Start a round to see the board
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex justify-center items-center p-4">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.2}
          />
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div
        ref={boardRef}
        className={`relative ${isDarkTheme ? 'bg-gray-800 shadow-2xl border-gray-600' : 'bg-white shadow-lg border-gray-200'} border-2 rounded-xl overflow-hidden`}
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          transform: `rotate(${tiltAngle}deg)`,
          transition: 'transform 0.5s ease-out',
          filter: isDarkTheme ? 'sepia(100%) hue-rotate(200deg) saturate(200%) brightness(0.7)' : undefined,
        }}
      >
        {/* Peg Grid */}
        {pegMap.map((row, rowIndex) =>
          row.map((pegBias, pegIndex) => {
            const x = ((pegIndex + 0.5) / (row.length)) * BOARD_WIDTH;
            const y = (rowIndex + 1) * rowHeight;

            return (
              <div
                key={`peg-${rowIndex}-${pegIndex}`}
                className={`absolute rounded-full ${isDarkTheme ? 'bg-orange-400 shadow-orange-600' : 'bg-blue-500 shadow-blue-700'} shadow-md`}
                style={{
                  left: x - PEG_SIZE / 2,
                  top: y - PEG_SIZE / 2,
                  width: PEG_SIZE,
                  height: PEG_SIZE,
                  opacity: currentStep >= rowIndex ? 0.8 : 0.4,
                  transition: 'opacity 0.2s ease',
                }}
              />
            );
          })
        )}

        {/* Bin Lines */}
        {Array.from({ length: ROWS + 2 }, (_, i) => (
          <div
            key={`bin-line-${i}`}
            className={`absolute ${isDarkTheme ? 'bg-gray-600' : 'bg-gray-300'}`}
            style={{
              left: (i / (ROWS + 1)) * BOARD_WIDTH,
              top: BOARD_HEIGHT - 30,
              width: 1,
              height: 30,
            }}
          />
        ))}

        {/* Drop Zone Indicators */}
        {Array.from({ length: ROWS + 1 }, (_, i) => (
          <div
            key={`drop-zone-${i}`}
            className={`absolute transition-all duration-300 ${
              i === dropColumn 
                ? (isDarkTheme ? 'bg-orange-500 shadow-orange-400' : 'bg-green-500 shadow-green-400')
                : (isDarkTheme ? 'bg-gray-600' : 'bg-gray-200')
            } rounded-sm shadow-md`}
            style={{
              left: (i / ROWS) * BOARD_WIDTH - 10,
              top: -15,
              width: 20,
              height: 8,
            }}
          />
        ))}

        {/* Animated Ball */}
        <motion.div
          className={`absolute rounded-full ${isDarkTheme ? 'bg-red-500 shadow-red-600' : 'bg-red-500 shadow-red-700'} shadow-lg z-10`}
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            left: ballPosition.x - BALL_SIZE / 2,
            top: ballPosition.y - BALL_SIZE / 2,
          }}
          animate={{
            scale: isAnimating && currentStep >= 0 ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            repeat: isAnimating && currentStep >= 0 ? Infinity : 0,
          }}
        />

        {/* Bin Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <div
              key={`bin-${i}`}
              className={`flex-1 text-center py-1 text-xs font-bold ${
                isDarkTheme ? 'text-orange-300' : 'text-gray-700'
              }`}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* Scanline Effect for Tilt */}
      {Math.abs(tiltAngle) > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  );
}