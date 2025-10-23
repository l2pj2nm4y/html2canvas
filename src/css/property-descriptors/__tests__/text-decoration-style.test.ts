import {strictEqual} from 'assert';
import {textDecorationStyle, TEXT_DECORATION_STYLE} from '../text-decoration-style';
import {Context} from '../../../core/context';

const parse = (value: string) => textDecorationStyle.parse({} as Context, value);

describe('text-decoration-style', () => {
    describe('parsing', () => {
        it('solid', () => strictEqual(parse('solid'), TEXT_DECORATION_STYLE.SOLID));
        it('double', () => strictEqual(parse('double'), TEXT_DECORATION_STYLE.DOUBLE));
        it('dotted', () => strictEqual(parse('dotted'), TEXT_DECORATION_STYLE.DOTTED));
        it('dashed', () => strictEqual(parse('dashed'), TEXT_DECORATION_STYLE.DASHED));
        it('wavy', () => strictEqual(parse('wavy'), TEXT_DECORATION_STYLE.WAVY));

        // Invalid values default to solid
        it('invalid value defaults to solid', () => strictEqual(parse('invalid'), TEXT_DECORATION_STYLE.SOLID));
        it('empty value defaults to solid', () => strictEqual(parse(''), TEXT_DECORATION_STYLE.SOLID));
    });
});
