import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isIdentToken} from '../syntax/parser';
import {TokenType} from '../syntax/tokenizer';
import {Context} from '../../core/context';

export interface AspectRatio {
    auto: boolean;
    ratio: number | null;
}

const AUTO_ASPECT_RATIO: AspectRatio = {auto: true, ratio: null};

export const aspectRatio: IPropertyListDescriptor<AspectRatio> = {
    name: 'aspect-ratio',
    initialValue: 'auto',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): AspectRatio => {
        if (tokens.length === 1 && isIdentToken(tokens[0]) && tokens[0].value === 'auto') {
            return AUTO_ASPECT_RATIO;
        }

        // Handle ratio format: "16 / 9" (browser returns with spaces) or single number "1.5"
        // Filter out delimiter tokens (/) and extract numbers
        const numbers: number[] = [];

        for (const token of tokens) {
            if (token.type === TokenType.NUMBER_TOKEN) {
                numbers.push(token.number);
            }
        }

        if (numbers.length === 2) {
            // Ratio format like "16 / 9"
            const ratio = numbers[0] / numbers[1];
            return {auto: false, ratio};
        } else if (numbers.length === 1) {
            // Single number format like "1.5"
            return {auto: false, ratio: numbers[0]};
        }

        // Fallback to auto for invalid values
        return AUTO_ASPECT_RATIO;
    }
};
