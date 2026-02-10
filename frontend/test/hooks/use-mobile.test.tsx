import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../../hooks/use-mobile';

describe('useIsMobile hook', () => {
    let listeners: (() => void)[] = [];
    const originalInnerWidth = window.innerWidth;

    beforeEach(() => {
        listeners = [];
        // Mock matchMedia
        vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
            matches: false,
            media: query,
            addEventListener: (_event: string, cb: () => void) => {
                listeners.push(cb);
            },
            removeEventListener: vi.fn(),
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })));
        // Reset innerWidth
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore window.innerWidth
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    });

    it('should return false for desktop viewport', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(false);
    });

    it('should return true for mobile viewport', () => {
        Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(true);
    });

    it('should update when viewport changes', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        // Simulate resize to mobile and trigger listeners
        act(() => {
            Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
            listeners.forEach(cb => cb());
        });

        expect(result.current).toBe(true);
    });
});
