import {IPropertyValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, isIdentToken} from '../syntax/parser';
import {Context} from '../../core/context';
import {angle, isAngle} from '../types/angle';

/**
 * rotate property - Individual transform property for rotation
 * Accepts angle values: deg, grad, rad, turn
 * Default: none (0deg)
 */

export type Rotate = number | null;

export const rotate: IPropertyValueDescriptor<Rotate> = {
    name: 'rotate',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.VALUE,
    parse: (context: Context, token: CSSValue): Rotate => {
        if (isIdentToken(token) && token.value === 'none') {
            return null;
        }

        if (isAngle(token)) {
            return angle.parse(context, token);
        }

        return null;
    }
};
