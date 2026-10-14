import LZString from 'lz-string';
import type { AppState } from '../types';

/**
 * Encodes the entire app state into a URL hash string
 */
export function compressStateToUrl(state: AppState): string {
  try {
    const jsonStr = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#data=${compressed}`;
  } catch (err) {
    console.error('Failed to compress state to URL:', err);
    return window.location.href;
  }
}

/**
 * Decompresses app state from URL hash if present
 */
export function decompressStateFromUrl(): AppState | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#data=')) return null;

    const compressed = hash.split('#data=')[1];
    if (!compressed) return null;

    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return null;

    const state = JSON.parse(decompressed) as AppState;
    if (state && Array.isArray(state.members) && Array.isArray(state.expenses)) {
      return state;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse state from URL hash:', err);
    return null;
  }
}
