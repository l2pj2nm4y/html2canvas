import {inset, top, right, bottom, left} from '../inset';

describe('inset properties', () => {
    describe('top', () => {
        it('should have correct property name', () => {
            expect(top.name).toBe('top');
        });

        it('should have correct initial value', () => {
            expect(top.initialValue).toBe('auto');
        });

        it('should not have prefix', () => {
            expect(top.prefix).toBe(false);
        });
    });

    describe('right', () => {
        it('should have correct property name', () => {
            expect(right.name).toBe('right');
        });

        it('should have correct initial value', () => {
            expect(right.initialValue).toBe('auto');
        });

        it('should not have prefix', () => {
            expect(right.prefix).toBe(false);
        });
    });

    describe('bottom', () => {
        it('should have correct property name', () => {
            expect(bottom.name).toBe('bottom');
        });

        it('should have correct initial value', () => {
            expect(bottom.initialValue).toBe('auto');
        });

        it('should not have prefix', () => {
            expect(bottom.prefix).toBe(false);
        });
    });

    describe('left', () => {
        it('should have correct property name', () => {
            expect(left.name).toBe('left');
        });

        it('should have correct initial value', () => {
            expect(left.initialValue).toBe('auto');
        });

        it('should not have prefix', () => {
            expect(left.prefix).toBe(false);
        });
    });

    describe('inset shorthand', () => {
        it('should have correct property name', () => {
            expect(inset.name).toBe('inset');
        });

        it('should have correct initial value', () => {
            expect(inset.initialValue).toBe('auto');
        });

        it('should not have prefix', () => {
            expect(inset.prefix).toBe(false);
        });
    });
});
