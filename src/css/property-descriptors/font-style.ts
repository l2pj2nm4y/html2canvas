import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isIdentToken} from '../syntax/parser';
import {Context} from '../../core/context';

export const enum FONT_STYLE {
    NORMAL = 'normal',
    ITALIC = 'italic',
    OBLIQUE = 'oblique'
}

/**
 * font-style property
 * Accepts:
 * - normal
 * - italic
 * - oblique [<angle>] (CSS Fonts Level 4)
 *
 * The angle with oblique is optional and defaults to 14deg.
 * Angle is currently parsed but not used in rendering (browser handles the actual slant).
 */
export const fontStyle: IPropertyListDescriptor<FONT_STYLE> = {
    name: 'font-style',
    initialValue: 'normal',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]) => {
        const keyword = tokens.filter(isIdentToken)[0];

        if (!keyword) {
            return FONT_STYLE.NORMAL;
        }

        switch (keyword.value) {
            case 'oblique':
                // Optional angle is supported but not used in rendering
                // Browser handles the actual slant angle
                return FONT_STYLE.OBLIQUE;
            case 'italic':
                return FONT_STYLE.ITALIC;
            case 'normal':
            default:
                return FONT_STYLE.NORMAL;
        }
    }
};
