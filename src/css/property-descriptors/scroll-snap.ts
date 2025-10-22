import {IPropertyListDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {Context} from '../../core/context';
import {CSSValue} from '../syntax/parser';

/**
 * scroll-snap-type property
 * Defines how strictly snap points are enforced on the scroll container
 *
 * Values: none | [ x | y | block | inline | both ] [ mandatory | proximity ]?
 * Simplified to common values for now
 */

export const enum SCROLL_SNAP_TYPE {
    NONE = 0,
    X = 1,
    Y = 2,
    BOTH = 3,
    BLOCK = 4,
    INLINE = 5
}

export const scrollSnapType: IPropertyListDescriptor<SCROLL_SNAP_TYPE> = {
    name: 'scroll-snap-type',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): SCROLL_SNAP_TYPE => {
        if (tokens.length === 0) {
            return SCROLL_SNAP_TYPE.NONE;
        }

        // Handle compound values like "x mandatory" or "y proximity"
        // For simplicity, we extract the axis value from first token
        const firstToken = tokens[0];
        if (firstToken.type !== 0 /* IDENT_TOKEN */) {
            return SCROLL_SNAP_TYPE.NONE;
        }

        const axis = (firstToken as any).value;

        switch (axis) {
            case 'x':
                return SCROLL_SNAP_TYPE.X;
            case 'y':
                return SCROLL_SNAP_TYPE.Y;
            case 'both':
                return SCROLL_SNAP_TYPE.BOTH;
            case 'block':
                return SCROLL_SNAP_TYPE.BLOCK;
            case 'inline':
                return SCROLL_SNAP_TYPE.INLINE;
        }

        return SCROLL_SNAP_TYPE.NONE;
    }
};

/**
 * scroll-snap-align property
 * Specifies the box's snap position as an alignment of its snap area within its snap container
 *
 * Values: none | [ start | end | center ]{1,2}
 */

export const enum SCROLL_SNAP_ALIGN {
    NONE = 0,
    START = 1,
    END = 2,
    CENTER = 3
}

export const scrollSnapAlign: IPropertyListDescriptor<SCROLL_SNAP_ALIGN> = {
    name: 'scroll-snap-align',
    initialValue: 'none',
    prefix: false,
    type: PropertyDescriptorParsingType.LIST,
    parse: (_context: Context, tokens: CSSValue[]): SCROLL_SNAP_ALIGN => {
        if (tokens.length === 0) {
            return SCROLL_SNAP_ALIGN.NONE;
        }

        // Handle compound values like "start end"
        // For simplicity, we take the first value
        const firstToken = tokens[0];
        if (firstToken.type !== 0 /* IDENT_TOKEN */) {
            return SCROLL_SNAP_ALIGN.NONE;
        }

        const align = (firstToken as any).value;

        switch (align) {
            case 'start':
                return SCROLL_SNAP_ALIGN.START;
            case 'end':
                return SCROLL_SNAP_ALIGN.END;
            case 'center':
                return SCROLL_SNAP_ALIGN.CENTER;
        }

        return SCROLL_SNAP_ALIGN.NONE;
    }
};
