import {
    IPropertyTokenValueDescriptor,
    IPropertyListDescriptor,
    PropertyDescriptorParsingType
} from '../IPropertyDescriptor';
import {CSSValue} from '../syntax/parser';
import {Context} from '../../core/context';

/**
 * Position offset properties for positioned elements
 * inset is a shorthand for top, right, bottom, and left
 */

const offsetForSide = (side: string): IPropertyTokenValueDescriptor => ({
    name: side,
    initialValue: 'auto',
    prefix: false,
    type: PropertyDescriptorParsingType.TOKEN_VALUE
});

export const top: IPropertyTokenValueDescriptor = offsetForSide('top');
export const right: IPropertyTokenValueDescriptor = offsetForSide('right');
export const bottom: IPropertyTokenValueDescriptor = offsetForSide('bottom');
export const left: IPropertyTokenValueDescriptor = offsetForSide('left');

/**
 * inset is a shorthand property for top, right, bottom, and left
 * - One value: applies to all four sides
 * - Two values: first is top/bottom, second is left/right
 * - Three values: top, left/right, bottom
 * - Four values: top, right, bottom, left (clockwise from top)
 *
 * Note: Browser expands shorthand to four values, so we store all tokens
 */
export const inset: IPropertyListDescriptor<CSSValue[]> = {
    name: 'inset',
    initialValue: 'auto',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): CSSValue[] => {
        // Just return the tokens as-is for now
        // Future: could parse into {top, right, bottom, left} object
        return tokens;
    }
};
