import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isIdentToken} from '../syntax/parser';
import {Context} from '../../core/context';
import {isLengthPercentage, LengthPercentage} from '../types/length-percentage';

/**
 * translate property - Individual transform property for translation
 * Accepts:
 * - none (no translation)
 * - One length/percentage (x offset, y defaults to 0)
 * - Two length/percentage values (x, y offsets)
 * Default: none (0, 0)
 */

export interface Translate {
    x: LengthPercentage;
    y: LengthPercentage;
}

const ZERO_TRANSLATE: LengthPercentage = {type: 0, number: 0, flags: 0};

export const translate: IPropertyListDescriptor<Translate | null> = {
    name: 'translate',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): Translate | null => {
        if (tokens.length === 1 && isIdentToken(tokens[0]) && tokens[0].value === 'none') {
            return null;
        }

        const lengths = tokens.filter(isLengthPercentage);

        if (lengths.length === 0) {
            return {x: ZERO_TRANSLATE, y: ZERO_TRANSLATE};
        }

        if (lengths.length === 1) {
            // Single value: x offset, y defaults to 0
            return {x: lengths[0], y: ZERO_TRANSLATE};
        }

        // Two values: x and y offsets
        return {x: lengths[0], y: lengths[1]};
    }
};
