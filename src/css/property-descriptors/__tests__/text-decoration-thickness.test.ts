import {textDecorationThickness} from '../text-decoration-thickness';

describe('text-decoration-thickness', () => {
    describe('property descriptor', () => {
        it('has correct name', () => {
            expect(textDecorationThickness.name).toBe('text-decoration-thickness');
        });

        it('has correct initial value', () => {
            expect(textDecorationThickness.initialValue).toBe('1px');
        });

        it('has correct type', () => {
            expect(textDecorationThickness.type).toBe(1); // PropertyDescriptorParsingType.VALUE
        });

        it('has correct format', () => {
            expect(textDecorationThickness.format).toBe('length-percentage');
        });
    });
});
