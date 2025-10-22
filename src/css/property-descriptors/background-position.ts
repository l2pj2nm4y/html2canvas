import {PropertyDescriptorParsingType, IPropertyListDescriptor} from '../IPropertyDescriptor';
import {CSSValue, parseFunctionArgs, isIdentToken} from '../syntax/parser';
import {isLengthPercentage, LengthPercentageTuple, parseLengthPercentageTuple, ZERO_LENGTH, HUNDRED_PERCENT} from '../types/length-percentage';
import {Context} from '../../core/context';
import {TokenType} from '../syntax/tokenizer';

export type BackgroundPosition = BackgroundImagePosition[];

export type BackgroundImagePosition = LengthPercentageTuple;

// Helper to parse 4-value syntax: "right 10px bottom 15px"
const parseFourValueSyntax = (values: CSSValue[]): CSSValue[] => {
    // Check if we have 4-value syntax: keyword + length/percentage + keyword + length/percentage
    if (values.length === 4) {
        const [first, second, third, fourth] = values;

        if (isIdentToken(first) && isLengthPercentage(second) &&
            isIdentToken(third) && isLengthPercentage(fourth)) {

            // Map keywords to their axis
            const firstKeyword = first.value.toLowerCase();
            const thirdKeyword = third.value.toLowerCase();

            // right/left control x-axis, top/bottom control y-axis
            const isFirstHorizontal = firstKeyword === 'right' || firstKeyword === 'left';

            let xValue: CSSValue = ZERO_LENGTH;
            let yValue: CSSValue = ZERO_LENGTH;

            // Determine x position
            if (isFirstHorizontal) {
                if (firstKeyword === 'right') {
                    // right offset needs special handling
                    if (second.type === TokenType.PERCENTAGE_TOKEN) {
                        // For percentages: right 25% = 100% - 25% = 75%
                        xValue = {
                            type: TokenType.PERCENTAGE_TOKEN,
                            number: 100 - second.number,
                            flags: second.flags
                        };
                    } else {
                        // For pixel offsets: right 10px would need calc(100% - 10px)
                        // which isn't supported in current type system
                        // Limitation: falls back to 100% (right edge)
                        xValue = HUNDRED_PERCENT;
                    }
                } else {
                    // left offset
                    xValue = second;
                }
            } else {
                // First is vertical (top/bottom), so third must be horizontal
                if (thirdKeyword === 'right') {
                    if (fourth.type === TokenType.PERCENTAGE_TOKEN) {
                        xValue = {
                            type: TokenType.PERCENTAGE_TOKEN,
                            number: 100 - fourth.number,
                            flags: fourth.flags
                        };
                    } else {
                        xValue = HUNDRED_PERCENT;
                    }
                } else {
                    xValue = fourth;
                }
            }

            // Determine y position
            if (!isFirstHorizontal) {
                if (firstKeyword === 'bottom') {
                    if (second.type === TokenType.PERCENTAGE_TOKEN) {
                        yValue = {
                            type: TokenType.PERCENTAGE_TOKEN,
                            number: 100 - second.number,
                            flags: second.flags
                        };
                    } else {
                        // For pixel offsets: bottom 15px would need calc(100% - 15px)
                        // Limitation: falls back to 100% (bottom edge)
                        yValue = HUNDRED_PERCENT;
                    }
                } else {
                    // top offset
                    yValue = second;
                }
            } else {
                // First is horizontal, so third must be vertical
                if (thirdKeyword === 'bottom') {
                    if (fourth.type === TokenType.PERCENTAGE_TOKEN) {
                        yValue = {
                            type: TokenType.PERCENTAGE_TOKEN,
                            number: 100 - fourth.number,
                            flags: fourth.flags
                        };
                    } else {
                        // Limitation: falls back to 100% (bottom edge)
                        yValue = HUNDRED_PERCENT;
                    }
                } else {
                    yValue = fourth;
                }
            }

            return [xValue, yValue];
        }
    }

    // Not 4-value syntax, return as-is (filtered to length/percentage)
    return values.filter(isLengthPercentage);
};

export const backgroundPosition: IPropertyListDescriptor<BackgroundPosition> = {
    name: 'background-position',
    initialValue: '0% 0%',
    type: PropertyDescriptorParsingType.LIST,
    prefix: false,
    parse: (_context: Context, tokens: CSSValue[]): BackgroundPosition => {
        return parseFunctionArgs(tokens)
            .map(parseFourValueSyntax)
            .map(parseLengthPercentageTuple);
    }
};
