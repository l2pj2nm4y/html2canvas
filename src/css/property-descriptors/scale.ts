import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isIdentToken} from '../syntax/parser';
import {Context} from '../../core/context';
import {TokenType} from '../syntax/tokenizer';

/**
 * scale property - Individual transform property for scaling
 * Accepts:
 * - none (no scaling)
 * - One number (uniform scaling)
 * - Two numbers (x, y scaling)
 * Default: none (1, 1)
 */

export interface Scale {
    x: number;
    y: number;
}

const DEFAULT_SCALE: Scale = {x: 1, y: 1};

export const scale: IPropertyListDescriptor<Scale | null> = {
    name: 'scale',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): Scale | null => {
        if (tokens.length === 1 && isIdentToken(tokens[0]) && tokens[0].value === 'none') {
            return null;
        }

        const numbers = tokens.filter(token => token.type === TokenType.NUMBER_TOKEN);

        if (numbers.length === 0) {
            return DEFAULT_SCALE;
        }

        if (numbers.length === 1) {
            const scaleValue = numbers[0].type === TokenType.NUMBER_TOKEN ? numbers[0].number : 1;
            return {x: scaleValue, y: scaleValue};
        }

        // Two values: x and y
        const xValue = numbers[0].type === TokenType.NUMBER_TOKEN ? numbers[0].number : 1;
        const yValue = numbers[1].type === TokenType.NUMBER_TOKEN ? numbers[1].number : 1;
        return {x: xValue, y: yValue};
    }
};
