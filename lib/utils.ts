import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents to dollar string
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Parse dollar string to cents
 */
export function parseDollars(dollarString: string): number {
  const cleaned = dollarString.replace(/[$,]/g, '');
  return Math.round(parseFloat(cleaned) * 100);
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random client seed suggestion
 */
export function generateClientSeed(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate hex string format
 */
export function isValidHex(hex: string): boolean {
  return /^[a-fA-F0-9]+$/.test(hex);
}

/**
 * Format hash for display (truncate with ellipsis)
 */
export function formatHash(hash: string, length: number = 8): string {
  if (hash.length <= length * 2) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}

/**
 * Sleep utility for animations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function utility
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
