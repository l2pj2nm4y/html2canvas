import {mixBlendMode} from '../mix-blend-mode';

describe('mix-blend-mode property', () => {
    it('should have correct property name', () => {
        expect(mixBlendMode.name).toBe('mix-blend-mode');
    });

    it('should have correct initial value', () => {
        expect(mixBlendMode.initialValue).toBe('normal');
    });

    it('should not have prefix', () => {
        expect(mixBlendMode.prefix).toBe(false);
    });
});
