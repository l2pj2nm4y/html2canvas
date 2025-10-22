import {scrollSnapType, scrollSnapAlign} from '../scroll-snap';

describe('scroll-snap properties', () => {
    describe('scroll-snap-type', () => {
        it('should have correct property name', () => {
            expect(scrollSnapType.name).toBe('scroll-snap-type');
        });

        it('should have correct initial value', () => {
            expect(scrollSnapType.initialValue).toBe('none');
        });

        it('should not have prefix', () => {
            expect(scrollSnapType.prefix).toBe(false);
        });
    });

    describe('scroll-snap-align', () => {
        it('should have correct property name', () => {
            expect(scrollSnapAlign.name).toBe('scroll-snap-align');
        });

        it('should have correct initial value', () => {
            expect(scrollSnapAlign.initialValue).toBe('none');
        });

        it('should not have prefix', () => {
            expect(scrollSnapAlign.prefix).toBe(false);
        });
    });
});
