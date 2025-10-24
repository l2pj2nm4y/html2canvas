import {IPropertyTokenValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';

// border-image is a shorthand property that will be expanded by the browser
// into border-image-source, border-image-slice, border-image-width,
// border-image-outset, and border-image-repeat
// We just need to mark it as TOKEN_VALUE so it gets parsed correctly
export const borderImage: IPropertyTokenValueDescriptor = {
    name: 'border-image',
    initialValue: 'none',
    type: PropertyDescriptorParsingType.TOKEN_VALUE,
    prefix: false
};
