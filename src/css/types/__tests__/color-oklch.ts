import {color} from '../color';
import {Parser} from '../../syntax/parser';
import {Context} from '../../../core/context';

const parse = (value: string) => color.parse({} as Context, Parser.parseValue(value));

describe('modern color functions', () => {
    describe('oklch()', () => {
        it('should parse oklch(0.21 0.034 264.665) - dark blue-gray', () => {
            // This is the color from the government website
            const result = parse('oklch(0.21 0.034 264.665)');
            // Should be a dark blue-gray color
            expect(result).toBeGreaterThan(0);
        });

        it('should parse oklch(0.5 0.15 250) - medium blue', () => {
            const result = parse('oklch(0.5 0.15 250)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse oklch(0.6 0.2 30) - red-orange', () => {
            const result = parse('oklch(0.6 0.2 30)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle oklch with alpha', () => {
            const result = parse('oklch(0.5 0.15 250 / 0.5)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle oklch with percentage lightness', () => {
            const result = parse('oklch(50% 0.15 250)');
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('oklab()', () => {
        it('should parse oklab(0.5 0.1 -0.1) - purple', () => {
            const result = parse('oklab(0.5 0.1 -0.1)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse oklab(0.7 0.08 0.12) - orange', () => {
            const result = parse('oklab(0.7 0.08 0.12)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse oklab(0.6 -0.1 -0.08) - cyan', () => {
            const result = parse('oklab(0.6 -0.1 -0.08)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle oklab with alpha', () => {
            const result = parse('oklab(0.5 0.1 -0.1 / 0.8)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle oklab with percentage lightness', () => {
            const result = parse('oklab(70% 0.08 0.12)');
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('lch()', () => {
        it('should parse lch(50 50 180) - cyan', () => {
            const result = parse('lch(50 50 180)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse lch(80 60 30) - yellow-orange', () => {
            const result = parse('lch(80 60 30)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse lch(40 80 280) - purple', () => {
            const result = parse('lch(40 80 280)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle lch with alpha', () => {
            const result = parse('lch(50 50 180 / 0.7)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle lch with percentage lightness', () => {
            const result = parse('lch(50% 50 180)');
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('lab()', () => {
        it('should parse lab(50 40 -20) - cyan-green', () => {
            const result = parse('lab(50 40 -20)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse lab(80 20 60) - yellow', () => {
            const result = parse('lab(80 20 60)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse lab(30 40 -40) - blue-purple', () => {
            const result = parse('lab(30 40 -40)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle lab with alpha', () => {
            const result = parse('lab(50 40 -20 / 0.6)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle lab with percentage lightness', () => {
            const result = parse('lab(50% 40 -20)');
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('hwb()', () => {
        it('should parse hwb(194 0% 0%) - cyan', () => {
            const result = parse('hwb(194 0% 0%)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse hwb(0 0% 0%) - red', () => {
            const result = parse('hwb(0 0% 0%)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse hwb(120 20% 20%) - desaturated green', () => {
            const result = parse('hwb(120 20% 20%)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle hwb with alpha', () => {
            const result = parse('hwb(194 0% 0% / 0.5)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle hwb with W+B >= 1 (gray)', () => {
            const result = parse('hwb(0 50% 50%)');
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('color()', () => {
        it('should parse color(srgb 1 0 0) - red', () => {
            const result = parse('color(srgb 1 0 0)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse color(srgb-linear 0.5 0.5 0.5) - gray', () => {
            const result = parse('color(srgb-linear 0.5 0.5 0.5)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse color(display-p3 1 0 0) - P3 red', () => {
            const result = parse('color(display-p3 1 0 0)');
            expect(result).toBeGreaterThan(0);
        });

        it('should parse color(srgb 100% 50% 0%) - orange', () => {
            const result = parse('color(srgb 100% 50% 0%)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle color() with alpha', () => {
            const result = parse('color(srgb 1 0 0 / 0.5)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle color(a98-rgb) - fallback to sRGB', () => {
            const result = parse('color(a98-rgb 1 0 0)');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle color(rec2020) - fallback to sRGB', () => {
            const result = parse('color(rec2020 1 0 0)');
            expect(result).toBeGreaterThan(0);
        });
    });
});
