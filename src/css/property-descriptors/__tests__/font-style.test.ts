import {strictEqual} from 'assert';
import {fontStyle, FONT_STYLE} from '../font-style';
import {Parser} from '../../syntax/parser';
import {Context} from '../../../core/context';

const parse = (value: string) => fontStyle.parse({} as Context, Parser.parseValues(value));

describe('font-style', () => {
    describe('parsing', () => {
        it('normal', () => strictEqual(parse('normal'), FONT_STYLE.NORMAL));
        it('italic', () => strictEqual(parse('italic'), FONT_STYLE.ITALIC));
        it('oblique', () => strictEqual(parse('oblique'), FONT_STYLE.OBLIQUE));

        // CSS Fonts Level 4: oblique with angle
        it('oblique 10deg', () => strictEqual(parse('oblique 10deg'), FONT_STYLE.OBLIQUE));
        it('oblique -10deg', () => strictEqual(parse('oblique -10deg'), FONT_STYLE.OBLIQUE));
        it('oblique 0.5turn', () => strictEqual(parse('oblique 0.5turn'), FONT_STYLE.OBLIQUE));
        it('oblique 1.57rad', () => strictEqual(parse('oblique 1.57rad'), FONT_STYLE.OBLIQUE));
        it('oblique 100grad', () => strictEqual(parse('oblique 100grad'), FONT_STYLE.OBLIQUE));

        // Invalid values default to normal
        it('invalid value defaults to normal', () => strictEqual(parse('invalid'), FONT_STYLE.NORMAL));
    });
});
