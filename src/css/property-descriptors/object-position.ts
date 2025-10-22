import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue} from '../syntax/parser';
import {isLengthPercentage, LengthPercentageTuple, parseLengthPercentageTuple, LengthPercentage} from '../types/length-percentage';
import {Context} from '../../core/context';

export type ObjectPosition = LengthPercentageTuple;

export const objectPosition: IPropertyListDescriptor<ObjectPosition> = {
    name: 'object-position',
    initialValue: '50% 50%', // Default: center center
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (_context: Context, tokens: CSSValue[]): ObjectPosition => {
        const values = tokens.filter(isLengthPercentage) as LengthPercentage[];
        return parseLengthPercentageTuple(values);
    }
};
