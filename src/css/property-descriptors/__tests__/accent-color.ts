import {accentColor} from '../accent-color';

describe('accent-color property', () => {
    it('should have correct property name', () => {
        expect(accentColor.name).toBe('accent-color');
    });

    it('should have correct initial value', () => {
        expect(accentColor.initialValue).toBe('auto');
    });

    it('should not have prefix', () => {
        expect(accentColor.prefix).toBe(false);
    });
});
