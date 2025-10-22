import {DimensionToken, FLAG_INTEGER, NumberValueToken, TokenType} from '../syntax/tokenizer';
import {CSSValue, isDimensionToken} from '../syntax/parser';
import {isLength} from './length';

/**
 * CalcValue represents a CSS calc() expression combining percentage and length values.
 * Example: calc(100% - 10px) for "right 10px" positioning
 */
export interface CalcValue {
    type: 'CALC';
    percentage: number;  // Base percentage value (e.g., 100 for right/bottom edge)
    offset: number;      // Pixel offset (negative for subtraction)
    unit: string;        // Unit for offset: 'px', 'em', 'rem', etc.
}

export type LengthPercentage = DimensionToken | NumberValueToken | CalcValue;
export type LengthPercentageTuple = [LengthPercentage] | [LengthPercentage, LengthPercentage];

export const isCalcValue = (token: LengthPercentage): token is CalcValue =>
    typeof token === 'object' && 'type' in token && token.type === 'CALC';

export const isLengthPercentage = (token: CSSValue | CalcValue): token is LengthPercentage =>
    isCalcValue(token as LengthPercentage) || token.type === TokenType.PERCENTAGE_TOKEN || isLength(token as CSSValue);

export const parseLengthPercentageTuple = (tokens: LengthPercentage[]): LengthPercentageTuple =>
    tokens.length > 1 ? [tokens[0], tokens[1]] : [tokens[0]];
export const ZERO_LENGTH: NumberValueToken = {
    type: TokenType.NUMBER_TOKEN,
    number: 0,
    flags: FLAG_INTEGER
};

export const FIFTY_PERCENT: NumberValueToken = {
    type: TokenType.PERCENTAGE_TOKEN,
    number: 50,
    flags: FLAG_INTEGER
};

export const HUNDRED_PERCENT: NumberValueToken = {
    type: TokenType.PERCENTAGE_TOKEN,
    number: 100,
    flags: FLAG_INTEGER
};

export const getAbsoluteValueForTuple = (
    tuple: LengthPercentageTuple,
    width: number,
    height: number
): [number, number] => {
    const [x, y] = tuple;
    return [getAbsoluteValue(x, width), getAbsoluteValue(typeof y !== 'undefined' ? y : x, height)];
};
export const getAbsoluteValue = (token: LengthPercentage, parent: number): number => {
    // Handle calc() expressions: calc(percentage% + offset)
    if (isCalcValue(token)) {
        const percentValue = (token.percentage / 100) * parent;
        let pixelOffset = token.offset;

        // Convert non-pixel units to pixels
        if (token.unit === 'em' || token.unit === 'rem') {
            pixelOffset = pixelOffset * 16; // TODO use correct font-size
        }

        return percentValue + pixelOffset;
    }

    if (token.type === TokenType.PERCENTAGE_TOKEN) {
        return (token.number / 100) * parent;
    }

    if (isDimensionToken(token)) {
        switch (token.unit) {
            case 'rem':
            case 'em':
                return 16 * token.number; // TODO use correct font-size
            case 'px':
            default:
                return token.number;
        }
    }

    return token.number;
};
