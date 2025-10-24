import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isDimensionToken, isNumberToken, nonWhiteSpace} from '../syntax/parser';
import {Context} from '../../core/context';

export interface BorderImageOutset {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export const borderImageOutset: IPropertyListDescriptor<BorderImageOutset> = {
    name: 'border-image-outset',
    initialValue: '0',
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (_context: Context, tokens: CSSValue[]): BorderImageOutset => {
        const values = tokens.filter(nonWhiteSpace);

        const parsed = values
            .map(token => {
                if (isDimensionToken(token)) {
                    return token.number;
                }
                if (isNumberToken(token)) {
                    // Unitless numbers are multipliers of border-width
                    return token.number;
                }
                return 0;
            });

        if (parsed.length === 0) {
            return {top: 0, right: 0, bottom: 0, left: 0};
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
