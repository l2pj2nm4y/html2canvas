import {IPropertyIdentValueDescriptor, PropertyDescriptorParsingType} from '../IPropertyDescriptor';
import {Context} from '../../core/context';

/**
 * mix-blend-mode property
 * Controls how an element's content blends with its background
 *
 * Supported values:
 * - normal (default)
 * - multiply, screen, overlay
 * - darken, lighten, color-dodge, color-burn
 * - hard-light, soft-light, difference, exclusion
 * - hue, saturation, color, luminosity
 */

export const enum MIX_BLEND_MODE {
    NORMAL = 0,
    MULTIPLY = 1,
    SCREEN = 2,
    OVERLAY = 3,
    DARKEN = 4,
    LIGHTEN = 5,
    COLOR_DODGE = 6,
    COLOR_BURN = 7,
    HARD_LIGHT = 8,
    SOFT_LIGHT = 9,
    DIFFERENCE = 10,
    EXCLUSION = 11,
    HUE = 12,
    SATURATION = 13,
    COLOR = 14,
    LUMINOSITY = 15
}

export const mixBlendMode: IPropertyIdentValueDescriptor<MIX_BLEND_MODE> = {
    name: 'mix-blend-mode',
    initialValue: 'normal',
    prefix: false,
    type: PropertyDescriptorParsingType.IDENT_VALUE,
    parse: (_context: Context, mode: string): MIX_BLEND_MODE => {
        switch (mode) {
            case 'multiply':
                return MIX_BLEND_MODE.MULTIPLY;
            case 'screen':
                return MIX_BLEND_MODE.SCREEN;
            case 'overlay':
                return MIX_BLEND_MODE.OVERLAY;
            case 'darken':
                return MIX_BLEND_MODE.DARKEN;
            case 'lighten':
                return MIX_BLEND_MODE.LIGHTEN;
            case 'color-dodge':
                return MIX_BLEND_MODE.COLOR_DODGE;
            case 'color-burn':
                return MIX_BLEND_MODE.COLOR_BURN;
            case 'hard-light':
                return MIX_BLEND_MODE.HARD_LIGHT;
            case 'soft-light':
                return MIX_BLEND_MODE.SOFT_LIGHT;
            case 'difference':
                return MIX_BLEND_MODE.DIFFERENCE;
            case 'exclusion':
                return MIX_BLEND_MODE.EXCLUSION;
            case 'hue':
                return MIX_BLEND_MODE.HUE;
            case 'saturation':
                return MIX_BLEND_MODE.SATURATION;
            case 'color':
                return MIX_BLEND_MODE.COLOR;
            case 'luminosity':
                return MIX_BLEND_MODE.LUMINOSITY;
        }

        return MIX_BLEND_MODE.NORMAL;
    }
};

/**
 * Map MIX_BLEND_MODE enum to Canvas API globalCompositeOperation values
 */
export const getCompositeOperation = (blendMode: MIX_BLEND_MODE): string => {
    switch (blendMode) {
        case MIX_BLEND_MODE.MULTIPLY:
            return 'multiply';
        case MIX_BLEND_MODE.SCREEN:
            return 'screen';
        case MIX_BLEND_MODE.OVERLAY:
            return 'overlay';
        case MIX_BLEND_MODE.DARKEN:
            return 'darken';
        case MIX_BLEND_MODE.LIGHTEN:
            return 'lighten';
        case MIX_BLEND_MODE.COLOR_DODGE:
            return 'color-dodge';
        case MIX_BLEND_MODE.COLOR_BURN:
            return 'color-burn';
        case MIX_BLEND_MODE.HARD_LIGHT:
            return 'hard-light';
        case MIX_BLEND_MODE.SOFT_LIGHT:
            return 'soft-light';
        case MIX_BLEND_MODE.DIFFERENCE:
            return 'difference';
        case MIX_BLEND_MODE.EXCLUSION:
            return 'exclusion';
        case MIX_BLEND_MODE.HUE:
            return 'hue';
        case MIX_BLEND_MODE.SATURATION:
            return 'saturation';
        case MIX_BLEND_MODE.COLOR:
            return 'color';
        case MIX_BLEND_MODE.LUMINOSITY:
            return 'luminosity';
        case MIX_BLEND_MODE.NORMAL:
        default:
            return 'source-over';
    }
};
