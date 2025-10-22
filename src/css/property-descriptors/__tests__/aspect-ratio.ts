import {aspectRatio} from '../aspect-ratio';
import {TokenType} from '../../syntax/tokenizer';

describe('aspect-ratio', () => {
    const context = {} as any;

    it('parses auto value', () => {
        const token = {type: TokenType.IDENT_TOKEN, value: 'auto'};
        const result = aspectRatio.parse(context, token as any);
        expect(result.auto).toBe(true);
        expect(result.ratio).toBe(null);
    });

    it('parses single number value', () => {
        const token = {type: TokenType.NUMBER_TOKEN, number: 1.5};
        const result = aspectRatio.parse(context, token as any);
        expect(result.auto).toBe(false);
        expect(result.ratio).toBe(1.5);
    });

    it('parses ratio format (16/9)', () => {
        const tokens = [
            {type: TokenType.NUMBER_TOKEN, number: 16},
            {type: TokenType.NUMBER_TOKEN, number: 9}
        ];
        const result = aspectRatio.parse(context, tokens as any);
        expect(result.auto).toBe(false);
        expect(result.ratio).toBeCloseTo(1.778, 3);
    });

    it('parses ratio format (4/3)', () => {
        const tokens = [
            {type: TokenType.NUMBER_TOKEN, number: 4},
            {type: TokenType.NUMBER_TOKEN, number: 3}
        ];
        const result = aspectRatio.parse(context, tokens as any);
        expect(result.auto).toBe(false);
        expect(result.ratio).toBeCloseTo(1.333, 3);
    });

    it('defaults to auto for invalid values', () => {
        const token = {type: TokenType.IDENT_TOKEN, value: 'invalid'};
        const result = aspectRatio.parse(context, token as any);
        expect(result.auto).toBe(true);
        expect(result.ratio).toBe(null);
    });

    it('has correct initial value', () => {
        expect(aspectRatio.initialValue).toBe('auto');
    });

    it('has correct property name', () => {
        expect(aspectRatio.name).toBe('aspect-ratio');
    });

    it('does not use prefix', () => {
        expect(aspectRatio.prefix).toBe(false);
    });
});
