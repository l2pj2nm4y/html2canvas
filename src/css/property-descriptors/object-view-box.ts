import {IPropertyTokenValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';

/**
 * object-view-box property
 * Specifies a "view box" for a replaced element (similar to SVG viewBox)
 *
 * Values:
 * - none (default)
 * - inset(<length-percentage>{1,4})
 * - rect(<top> <right> <bottom> <left>)
 * - xywh(<x> <y> <width> <height>)
 *
 * Note: This is a complex property. For now, we parse it as a token value
 * to recognize it exists. Full parsing would require geometric calculations.
 */

export const objectViewBox: IPropertyTokenValueDescriptor = {
    name: 'object-view-box',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.TOKEN_VALUE
};
