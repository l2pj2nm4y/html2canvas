import {translate} from '../translate';

describe('translate property', () => {
    it('should have correct property name', () => {
        expect(translate.name).toBe('translate');
    });

    it('should have correct initial value', () => {
        expect(translate.initialValue).toBe('none');
    });

    it('should not have prefix', () => {
        expect(translate.prefix).toBe(false);
    });
});
