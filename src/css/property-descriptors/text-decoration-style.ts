import {IPropertyIdentValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {Context} from '../../core/context';

export const enum TEXT_DECORATION_STYLE {
    SOLID = 'solid',
    DOUBLE = 'double',
    DOTTED = 'dotted',
    DASHED = 'dashed',
    WAVY = 'wavy'
}

export const textDecorationStyle: IPropertyIdentValueDescriptor<TEXT_DECORATION_STYLE> = {
    name: 'text-decoration-style',
    initialValue: 'solid',
    prefix: false,
    type: PropertyDescriptorParsingType.IDENT_VALUE,
    parse: (_context: Context, style: string) => {
        switch (style) {
            case 'double':
                return TEXT_DECORATION_STYLE.DOUBLE;
            case 'dotted':
                return TEXT_DECORATION_STYLE.DOTTED;
            case 'dashed':
                return TEXT_DECORATION_STYLE.DASHED;
            case 'wavy':
                return TEXT_DECORATION_STYLE.WAVY;
            case 'solid':
            default:
                return TEXT_DECORATION_STYLE.SOLID;
        }
    }
};
