import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isDimensionToken, isNumberToken, nonWhiteSpace} from '../syntax/parser';
import {Context} from '../../core/context';
import {TokenType} from '../syntax/tokenizer';

export type BorderImageWidth = number | 'auto';

export interface BorderImageWidthValues {
    top: BorderImageWidth;
    right: BorderImageWidth;
    bottom: BorderImageWidth;
    left: BorderImageWidth;
}

export const borderImageWidth: IPropertyListDescriptor<BorderImageWidthValues> = {
    name: 'border-image-width',
    initialValue: '1',
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (_context: Context, tokens: CSSValue[]): BorderImageWidthValues => {
        const values = tokens.filter(nonWhiteSpace);

        const parsed = values.map(token => {
            if (token.type === TokenType.IDENT_TOKEN && token.value === 'auto') {
                return 'auto' as const;
            }
            if (isDimensionToken(token)) {
                return token.number;
            }
            if (isNumberToken(token)) {
                // Unitless numbers are multipliers of border-width
                return token.number;
            }
            return 1;
        });

        if (parsed.length === 0) {
            return {top: 1, right: 1, bottom: 1, left: 1};
        }

        // CSS shorthand: 1 value = all sides, 2 values = vertical/horizontal,
        // 3 values = top/horizontal/bottom, 4 values = top/right/bottom/left
        const top = parsed[0];
        const right = parsed[1] !== undefined ? parsed[1] : top;
        const bottom = parsed[2] !== undefined ? parsed[2] : top;
        const left = parsed[3] !== undefined ? parsed[3] : right;

        return {top, right, bottom, left};
    }
};
