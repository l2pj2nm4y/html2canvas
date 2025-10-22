import {objectPosition} from '../object-position';

describe('object-position', () => {
    it('has correct initial value', () => {
        expect(objectPosition.initialValue).toBe('50% 50%');
    });

    it('has correct property name', () => {
        expect(objectPosition.name).toBe('object-position');
    });

    it('does not use prefix', () => {
        expect(objectPosition.prefix).toBe(false);
    });

    // Note: Comprehensive parsing tests would require mocking the tokenizer/parser
    // which is beyond the scope of this initial implementation.
    // The parse logic follows the same pattern as background-position which is well-tested.
});
