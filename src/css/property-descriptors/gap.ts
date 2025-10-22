import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue} from '../syntax/parser';
import {isLengthPercentage, LengthPercentage} from '../types/length-percentage';
import {Context} from '../../core/context';

/**
 * Gap properties for flexbox and grid layouts
 * gap is shorthand for row-gap and column-gap
 */

export type Gap = LengthPercentage;

export const rowGap: IPropertyListDescriptor<Gap> = {
    name: 'row-gap',
    initialValue: 'normal',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): Gap => {
        const filtered = tokens.filter(isLengthPercentage);
        return filtered.length > 0 ? filtered[0] : {type: 0, number: 0, flags: 0};
    }
};

export const columnGap: IPropertyListDescriptor<Gap> = {
    name: 'column-gap',
    initialValue: 'normal',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): Gap => {
        const filtered = tokens.filter(isLengthPercentage);
        return filtered.length > 0 ? filtered[0] : {type: 0, number: 0, flags: 0};
    }
};

/**
 * gap is a shorthand property
 * - One value: sets both row-gap and column-gap
 * - Two values: first is row-gap, second is column-gap
 */
export interface GapShorthand {
    rowGap: Gap;
    columnGap: Gap;
}

export const gap: IPropertyListDescriptor<GapShorthand> = {
    name: 'gap',
    initialValue: 'normal',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): GapShorthand => {
        const filtered = tokens.filter(isLengthPercentage);
        const defaultGap: Gap = {type: 0, number: 0, flags: 0};

        if (filtered.length === 0) {
            return {rowGap: defaultGap, columnGap: defaultGap};
        }

        if (filtered.length === 1) {
            // Single value: apply to both row and column
            return {rowGap: filtered[0], columnGap: filtered[0]};
        }

        // Two values: row-gap column-gap
        return {rowGap: filtered[0], columnGap: filtered[1]};
    }
};
