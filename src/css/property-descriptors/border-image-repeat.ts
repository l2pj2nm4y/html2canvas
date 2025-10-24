import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {CSSValue, nonWhiteSpace} from '../syntax/parser';
import {Context} from '../../core/context';
import {TokenType} from '../syntax/tokenizer';

export const enum BORDER_IMAGE_REPEAT {
    STRETCH = 0,
    REPEAT = 1,
    ROUND = 2,
    SPACE = 3
}

export interface BorderImageRepeatValues {
    horizontal: BORDER_IMAGE_REPEAT;
    vertical: BORDER_IMAGE_REPEAT;
}

const parseBorderImageRepeat = (value: string): BORDER_IMAGE_REPEAT => {
    switch (value) {
        case 'repeat':
            return BORDER_IMAGE_REPEAT.REPEAT;
        case 'round':
            return BORDER_IMAGE_REPEAT.ROUND;
        case 'space':
            return BORDER_IMAGE_REPEAT.SPACE;
        case 'stretch':
        default:
            return BORDER_IMAGE_REPEAT.STRETCH;
    }
};

export const borderImageRepeat: IPropertyListDescriptor<BorderImageRepeatValues> = {
    name: 'border-image-repeat',
    initialValue: 'stretch',
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (_context: Context, tokens: CSSValue[]): BorderImageRepeatValues => {
        const values = tokens
            .filter(nonWhiteSpace)
            .filter(token => token.type === TokenType.IDENT_TOKEN && 'value' in token)
            .map(token => (token as {value: string}).value);

        if (values.length === 0) {
            return {
                horizontal: BORDER_IMAGE_REPEAT.STRETCH,
                vertical: BORDER_IMAGE_REPEAT.STRETCH
            };
        }

        const horizontal = parseBorderImageRepeat(values[0]);
        const vertical = values[1] !== undefined ? parseBorderImageRepeat(values[1]) : horizontal;

        return {horizontal, vertical};
    }
};
