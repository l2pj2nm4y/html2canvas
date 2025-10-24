import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isNumberToken, nonWhiteSpace} from '../syntax/parser';
import {Context} from '../../core/context';
import {TokenType} from '../syntax/tokenizer';
import {DimensionToken, NumberValueToken} from '../syntax/tokenizer';

export interface BorderImageSlice {
    top: number;
    right: number;
    bottom: number;
    left: number;
    fill: boolean;
}

export const borderImageSlice: IPropertyListDescriptor<BorderImageSlice> = {
    name: 'border-image-slice',
    initialValue: '100%',
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (_context: Context, tokens: CSSValue[]): BorderImageSlice => {
        const values = tokens.filter(nonWhiteSpace);

        // Check for 'fill' keyword
        const fillIndex = values.findIndex(
            token => token.type === TokenType.IDENT_TOKEN && 'value' in token && token.value === 'fill'
        );
        const fill = fillIndex !== -1;

        // Remove 'fill' keyword from values
        const numericValues = fillIndex !== -1
            ? [...values.slice(0, fillIndex), ...values.slice(fillIndex + 1)]
            : values;

        // Parse numeric values (can be numbers or percentages)
        const parsed = numericValues
            .filter(token => isNumberToken(token))
            .map(token => {
                if ('number' in token) {
                    return (token as NumberValueToken | DimensionToken).number;
                }
                return 100; // default
            });

        if (parsed.length === 0) {
            return {top: 100, right: 100, bottom: 100, left: 100, fill: false};
        }

        // CSS shorthand: 1 value = all sides, 2 values = vertical/horizontal,
        // 3 values = top/horizontal/bottom, 4 values = top/right/bottom/left
        const top = parsed[0];
        const right = parsed[1] !== undefined ? parsed[1] : top;
        const bottom = parsed[2] !== undefined ? parsed[2] : top;
        const left = parsed[3] !== undefined ? parsed[3] : right;

        return {top, right, bottom, left, fill};
    }
};
