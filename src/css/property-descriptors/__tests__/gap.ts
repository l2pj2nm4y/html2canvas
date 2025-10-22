import {gap, rowGap, columnGap} from '../gap';

describe('gap properties', () => {
    describe('rowGap', () => {
        it('should have correct property name', () => {
            expect(rowGap.name).toBe('row-gap');
        });

        it('should have correct initial value', () => {
            expect(rowGap.initialValue).toBe('normal');
        });

        it('should not have prefix', () => {
            expect(rowGap.prefix).toBe(false);
        });
    });

    describe('columnGap', () => {
        it('should have correct property name', () => {
            expect(columnGap.name).toBe('column-gap');
        });

        it('should have correct initial value', () => {
            expect(columnGap.initialValue).toBe('normal');
        });

        it('should not have prefix', () => {
            expect(columnGap.prefix).toBe(false);
        });
    });

    describe('gap shorthand', () => {
        it('should have correct property name', () => {
            expect(gap.name).toBe('gap');
        });

        it('should have correct initial value', () => {
            expect(gap.initialValue).toBe('normal');
        });

        it('should not have prefix', () => {
            expect(gap.prefix).toBe(false);
        });
    });
});
