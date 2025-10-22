import {PropertyDescriptorParsingType, IPropertyListDescriptor} from '../IPropertyDescriptor';
import {CSSValue, isIdentWithValue} from '../syntax/parser';
import {Context} from '../../core/context';
import {TokenType} from '../syntax/tokenizer';
import {angle, isAngle} from '../types/angle';
import {LengthPercentage, ZERO_LENGTH} from '../types/length-percentage';
import {isLength} from '../types/length';

export enum FILTER_TYPE {
    BLUR = 0,
    BRIGHTNESS = 1,
    CONTRAST = 2,
    DROP_SHADOW = 3,
    GRAYSCALE = 4,
    HUE_ROTATE = 5,
    INVERT = 6,
    OPACITY = 7,
    SATURATE = 8,
    SEPIA = 9
}

export interface FilterBlur {
    type: FILTER_TYPE.BLUR;
    radius: LengthPercentage;
}

export interface FilterBrightness {
    type: FILTER_TYPE.BRIGHTNESS;
    amount: number;
}

export interface FilterContrast {
    type: FILTER_TYPE.CONTRAST;
    amount: number;
}

export interface FilterDropShadow {
    type: FILTER_TYPE.DROP_SHADOW;
    offsetX: LengthPercentage;
    offsetY: LengthPercentage;
    blur: LengthPercentage;
    color: number;
}

export interface FilterGrayscale {
    type: FILTER_TYPE.GRAYSCALE;
    amount: number;
}

export interface FilterHueRotate {
    type: FILTER_TYPE.HUE_ROTATE;
    angle: number; // radians
}

export interface FilterInvert {
    type: FILTER_TYPE.INVERT;
    amount: number;
}

export interface FilterOpacity {
    type: FILTER_TYPE.OPACITY;
    amount: number;
}

export interface FilterSaturate {
    type: FILTER_TYPE.SATURATE;
    amount: number;
}

export interface FilterSepia {
    type: FILTER_TYPE.SEPIA;
    amount: number;
}

export type Filter =
    | FilterBlur
    | FilterBrightness
    | FilterContrast
    | FilterDropShadow
    | FilterGrayscale
    | FilterHueRotate
    | FilterInvert
    | FilterOpacity
    | FilterSaturate
    | FilterSepia;

const parseFilterValue = (token: CSSValue): number => {
    if (token.type === TokenType.PERCENTAGE_TOKEN) {
        return token.number / 100;
    }
    if (token.type === TokenType.NUMBER_TOKEN) {
        return token.number;
    }
    return 1;
};

export const filter: IPropertyListDescriptor<Filter[]> = {
    name: 'filter',
    initialValue: 'none',
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (context: Context, tokens: CSSValue[]): Filter[] => {
        if (tokens.length === 1 && isIdentWithValue(tokens[0], 'none')) {
            return [];
        }

        const filters: Filter[] = [];

        for (const token of tokens) {
            if (token.type === TokenType.FUNCTION) {
                const funcToken = token as any;
                const name = funcToken.name.toLowerCase();
                const args = funcToken.values || [];

                switch (name) {
                    case 'blur':
                        filters.push({
                            type: FILTER_TYPE.BLUR,
                            radius: args.length > 0 && isLength(args[0]) ? args[0] : ZERO_LENGTH
                        });
                        break;

                    case 'brightness':
                        filters.push({
                            type: FILTER_TYPE.BRIGHTNESS,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    case 'contrast':
                        filters.push({
                            type: FILTER_TYPE.CONTRAST,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    case 'grayscale':
                        filters.push({
                            type: FILTER_TYPE.GRAYSCALE,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    case 'hue-rotate':
                        filters.push({
                            type: FILTER_TYPE.HUE_ROTATE,
                            angle: args.length > 0 && isAngle(args[0]) ? angle.parse(context, args[0]) : 0
                        });
                        break;

                    case 'invert':
                        filters.push({
                            type: FILTER_TYPE.INVERT,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    case 'opacity':
                        filters.push({
                            type: FILTER_TYPE.OPACITY,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    case 'saturate':
                        filters.push({
                            type: FILTER_TYPE.SATURATE,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    case 'sepia':
                        filters.push({
                            type: FILTER_TYPE.SEPIA,
                            amount: args.length > 0 ? parseFilterValue(args[0]) : 1
                        });
                        break;

                    // drop-shadow is complex and requires additional implementation
                    // For now, we'll skip it but leave structure for future implementation
                }
            }
        }

        return filters;
    }
};
