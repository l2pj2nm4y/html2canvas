import {IPropertyTokenValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';

/**
 * backdrop-filter property
 * Applies graphical effects like blur or color shift to the area behind an element
 *
 * Common values:
 * - none (default)
 * - blur(5px)
 * - brightness(0.8)
 * - contrast(1.2)
 * - grayscale(0.5)
 * - Multiple filters can be combined
 *
 * Note: This is a complex property. For now, we parse it as a token value
 * to recognize it exists. Full rendering support would require filter implementation.
 */

export const backdropFilter: IPropertyTokenValueDescriptor = {
    name: 'backdrop-filter',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.TOKEN_VALUE
};
