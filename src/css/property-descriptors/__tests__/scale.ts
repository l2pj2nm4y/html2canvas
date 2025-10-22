import {scale} from '../scale';

describe('scale property', () => {
    it('should have correct property name', () => {
        expect(scale.name).toBe('scale');
    });

    it('should have correct initial value', () => {
        expect(scale.initialValue).toBe('none');
    });

    it('should not have prefix', () => {
        expect(scale.prefix).toBe(false);
    });
});
