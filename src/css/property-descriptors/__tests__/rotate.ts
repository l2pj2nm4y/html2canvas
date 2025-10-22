import {rotate} from '../rotate';

describe('rotate property', () => {
    it('should have correct property name', () => {
        expect(rotate.name).toBe('rotate');
    });

    it('should have correct initial value', () => {
        expect(rotate.initialValue).toBe('none');
    });

    it('should not have prefix', () => {
        expect(rotate.prefix).toBe(false);
    });
});
