import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/utils';

describe('cn utility', () => {
    it('should merge class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
        expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('should merge conflicting Tailwind classes', () => {
        // twMerge should keep the last conflicting class
        expect(cn('px-4', 'px-6')).toBe('px-6');
    });

    it('should handle undefined and null values', () => {
        expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should handle empty inputs', () => {
        expect(cn()).toBe('');
    });

    it('should handle array inputs via clsx', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });
});
