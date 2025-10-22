import {IPropertyValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue} from '../syntax/parser';
import {Color, color} from '../types/color';
import {Context} from '../../core/context';

/**
 * accent-color property
 * Sets the accent color for user-interface controls (checkboxes, radio buttons, etc.)
 *
 * Values:
 * - auto (uses browser default)
 * - Any valid color value
 */

export const accentColor: IPropertyValueDescriptor<Color | null> = {
    name: 'accent-color',
    initialValue: 'auto',
    prefix: false,
    type: PropertyDescriptorParsingType.VALUE,
    parse: (context: Context, token: CSSValue): Color | null => {
        // Check for 'auto' keyword
        if (token.type === 3 /* IDENT_TOKEN */ && (token as any).value === 'auto') {
            return null;
        }

        // Parse as color
        return color.parse(context, token);
    }
};
