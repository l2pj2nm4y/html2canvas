import {IPropertyIdentValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {Context} from '../../core/context';

export const enum OBJECT_FIT {
    FILL = 0,      // Default: stretch to fill container (current behavior)
    CONTAIN = 1,   // Scale to fit within container (preserve aspect ratio)
    COVER = 2,     // Scale to cover container (preserve aspect ratio, may crop)
    NONE = 3,      // Original size (no scaling)
    SCALE_DOWN = 4 // Smaller of 'none' or 'contain'
}

export const objectFit: IPropertyIdentValueDescriptor<OBJECT_FIT> = {
    name: 'object-fit',
    initialValue: 'fill',
    prefix: false,
    type: PropertyDescriptorParsingType.IDENT_VALUE,
    parse: (_context: Context, fit: string): OBJECT_FIT => {
        switch (fit) {
            case 'contain':
                return OBJECT_FIT.CONTAIN;
            case 'cover':
                return OBJECT_FIT.COVER;
            case 'none':
                return OBJECT_FIT.NONE;
            case 'scale-down':
                return OBJECT_FIT.SCALE_DOWN;
            default:
                return OBJECT_FIT.FILL;
        }
    }
};
