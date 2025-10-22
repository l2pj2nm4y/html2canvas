import {objectFit, OBJECT_FIT} from '../object-fit';

describe('object-fit', () => {
    const context = {} as any;

    it('parses fill value', () => {
        const result = objectFit.parse(context, 'fill');
        expect(result).toBe(OBJECT_FIT.FILL);
    });

    it('parses contain value', () => {
        const result = objectFit.parse(context, 'contain');
        expect(result).toBe(OBJECT_FIT.CONTAIN);
    });

    it('parses cover value', () => {
        const result = objectFit.parse(context, 'cover');
        expect(result).toBe(OBJECT_FIT.COVER);
    });

    it('parses none value', () => {
        const result = objectFit.parse(context, 'none');
        expect(result).toBe(OBJECT_FIT.NONE);
    });

    it('parses scale-down value', () => {
        const result = objectFit.parse(context, 'scale-down');
        expect(result).toBe(OBJECT_FIT.SCALE_DOWN);
    });

    it('defaults to fill for invalid values', () => {
        const result = objectFit.parse(context, 'invalid');
        expect(result).toBe(OBJECT_FIT.FILL);
    });

    it('defaults to fill for empty string', () => {
        const result = objectFit.parse(context, '');
        expect(result).toBe(OBJECT_FIT.FILL);
    });

    it('has correct initial value', () => {
        expect(objectFit.initialValue).toBe('fill');
    });

    it('has correct property name', () => {
        expect(objectFit.name).toBe('object-fit');
    });

    it('does not use prefix', () => {
        expect(objectFit.prefix).toBe(false);
    });
});
