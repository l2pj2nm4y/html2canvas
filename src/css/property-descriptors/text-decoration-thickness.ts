import {IPropertyTypeValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';

/**
 * text-decoration-thickness property
 * Specifies the thickness of text decoration lines
 * Accepts:
 * - auto (browser default, resolves to 1px)
 * - from-font (use font metrics, currently resolves to 1px)
 * - <length> values (px, em, rem, etc.)
 * - <percentage> values (relative to 1em)
 * Default: auto (1px)
 */
export const textDecorationThickness: IPropertyTypeValueDescriptor = {
    name: 'text-decoration-thickness',
    initialValue: '1px',
    prefix: false,
    type: PropertyDescriptorParsingType.TYPE_VALUE,
    format: 'length-percentage'
};
