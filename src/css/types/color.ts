import {CSSValue, nonFunctionArgSeparator, Parser} from '../syntax/parser';
import {TokenType} from '../syntax/tokenizer';
import {ITypeDescriptor} from '../ITypeDescriptor';
import {angle, deg} from './angle';
import {getAbsoluteValue, isLengthPercentage} from './length-percentage';
import {Context} from '../../core/context';
export type Color = number;

export const color: ITypeDescriptor<Color> = {
    name: 'color',
    parse: (context: Context, value: CSSValue): Color => {
        if (value.type === TokenType.FUNCTION) {
            const colorFunction = SUPPORTED_COLOR_FUNCTIONS[value.name];
            if (typeof colorFunction === 'undefined') {
                throw new Error(`Attempting to parse an unsupported color function "${value.name}"`);
            }
            return colorFunction(context, value.values);
        }

        if (value.type === TokenType.HASH_TOKEN) {
            if (value.value.length === 3) {
                const r = value.value.substring(0, 1);
                const g = value.value.substring(1, 2);
                const b = value.value.substring(2, 3);
                return pack(parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16), 1);
            }

            if (value.value.length === 4) {
                const r = value.value.substring(0, 1);
                const g = value.value.substring(1, 2);
                const b = value.value.substring(2, 3);
                const a = value.value.substring(3, 4);
                return pack(parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16), parseInt(a + a, 16) / 255);
            }

            if (value.value.length === 6) {
                const r = value.value.substring(0, 2);
                const g = value.value.substring(2, 4);
                const b = value.value.substring(4, 6);
                return pack(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), 1);
            }

            if (value.value.length === 8) {
                const r = value.value.substring(0, 2);
                const g = value.value.substring(2, 4);
                const b = value.value.substring(4, 6);
                const a = value.value.substring(6, 8);
                return pack(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), parseInt(a, 16) / 255);
            }
        }

        if (value.type === TokenType.IDENT_TOKEN) {
            const namedColor = COLORS[value.value.toUpperCase()];
            if (typeof namedColor !== 'undefined') {
                return namedColor;
            }
        }

        return COLORS.TRANSPARENT;
    }
};

export const isTransparent = (color: Color): boolean => (0xff & color) === 0;

export const asString = (color: Color): string => {
    const alpha = 0xff & color;
    const blue = 0xff & (color >> 8);
    const green = 0xff & (color >> 16);
    const red = 0xff & (color >> 24);
    return alpha < 255 ? `rgba(${red},${green},${blue},${alpha / 255})` : `rgb(${red},${green},${blue})`;
};

export const pack = (r: number, g: number, b: number, a: number): Color =>
    ((r << 24) | (g << 16) | (b << 8) | (Math.round(a * 255) << 0)) >>> 0;

const getTokenColorValue = (token: CSSValue, i: number): number => {
    if (token.type === TokenType.NUMBER_TOKEN) {
        return token.number;
    }

    if (token.type === TokenType.PERCENTAGE_TOKEN) {
        const max = i === 3 ? 1 : 255;
        return i === 3 ? (token.number / 100) * max : Math.round((token.number / 100) * max);
    }

    return 0;
};

const rgb = (_context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);

    if (tokens.length === 3) {
        const [r, g, b] = tokens.map(getTokenColorValue);
        return pack(r, g, b, 1);
    }

    if (tokens.length === 4) {
        const [r, g, b, a] = tokens.map(getTokenColorValue);
        return pack(r, g, b, a);
    }

    return 0;
};

function hue2rgb(t1: number, t2: number, hue: number): number {
    if (hue < 0) {
        hue += 1;
    }
    if (hue >= 1) {
        hue -= 1;
    }

    if (hue < 1 / 6) {
        return (t2 - t1) * hue * 6 + t1;
    } else if (hue < 1 / 2) {
        return t2;
    } else if (hue < 2 / 3) {
        return (t2 - t1) * 6 * (2 / 3 - hue) + t1;
    } else {
        return t1;
    }
}

const hsl = (context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    const [hue, saturation, lightness, alpha] = tokens;

    const h = (hue.type === TokenType.NUMBER_TOKEN ? deg(hue.number) : angle.parse(context, hue)) / (Math.PI * 2);
    const s = isLengthPercentage(saturation) ? saturation.number / 100 : 0;
    const l = isLengthPercentage(lightness) ? lightness.number / 100 : 0;
    const a = typeof alpha !== 'undefined' && isLengthPercentage(alpha) ? getAbsoluteValue(alpha, 1) : 1;

    if (s === 0) {
        return pack(l * 255, l * 255, l * 255, 1);
    }

    const t2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;

    const t1 = l * 2 - t2;
    const r = hue2rgb(t1, t2, h + 1 / 3);
    const g = hue2rgb(t1, t2, h);
    const b = hue2rgb(t1, t2, h - 1 / 3);
    return pack(r * 255, g * 255, b * 255, a);
};

// OKLCH to RGB conversion
// OKLCH uses perceptually uniform color space (Oklab with cylindrical coordinates)
// Parameters: lightness (0-1), chroma (0+), hue (0-360 degrees), alpha (0-1)
const oklch = (context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    const [lightnessToken, chromaToken, hueToken, alphaToken] = tokens;

    // Parse lightness (0-1 range, can be percentage or number)
    const L = lightnessToken.type === TokenType.PERCENTAGE_TOKEN
        ? lightnessToken.number / 100
        : lightnessToken.type === TokenType.NUMBER_TOKEN
        ? lightnessToken.number
        : 0;

    // Parse chroma (0+ range, typically 0-0.4)
    const C = chromaToken.type === TokenType.NUMBER_TOKEN ? chromaToken.number : 0;

    // Parse hue (0-360 degrees)
    const H = hueToken.type === TokenType.NUMBER_TOKEN
        ? deg(hueToken.number)
        : angle.parse(context, hueToken);

    // Parse alpha (optional, defaults to 1)
    const alpha = typeof alphaToken !== 'undefined' && isLengthPercentage(alphaToken)
        ? getAbsoluteValue(alphaToken, 1)
        : 1;

    // Convert OKLCH to Oklab
    const hueRadians = H;
    const a = C * Math.cos(hueRadians);
    const b = C * Math.sin(hueRadians);

    // Convert Oklab to linear RGB
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const r_linear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g_linear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b_linear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    // Apply gamma correction (linear RGB to sRGB)
    const gammaCorrect = (val: number): number => {
        if (val <= 0.0031308) {
            return 12.92 * val;
        }
        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    };

    let r = gammaCorrect(r_linear);
    let g = gammaCorrect(g_linear);
    let b_srgb = gammaCorrect(b_linear);

    // Clamp to valid RGB range [0, 1]
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b_srgb = Math.max(0, Math.min(1, b_srgb));

    // Convert to 0-255 range and pack
    return pack(Math.round(r * 255), Math.round(g * 255), Math.round(b_srgb * 255), alpha);
};

// OKLAB to RGB conversion
// OKLAB uses perceptually uniform color space
// Parameters: lightness (0-1), a (-0.4 to 0.4), b (-0.4 to 0.4), alpha (0-1)
const oklab = (_context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    const [lightnessToken, aToken, bToken, alphaToken] = tokens;

    // Parse lightness (0-1 range)
    const L = lightnessToken.type === TokenType.PERCENTAGE_TOKEN
        ? lightnessToken.number / 100
        : lightnessToken.type === TokenType.NUMBER_TOKEN
        ? lightnessToken.number
        : 0;

    // Parse a and b components
    const a = aToken.type === TokenType.NUMBER_TOKEN ? aToken.number : 0;
    const b = bToken.type === TokenType.NUMBER_TOKEN ? bToken.number : 0;

    // Parse alpha (optional, defaults to 1)
    const alpha = typeof alphaToken !== 'undefined' && isLengthPercentage(alphaToken)
        ? getAbsoluteValue(alphaToken, 1)
        : 1;

    // Convert Oklab to linear RGB (same as oklch conversion after converting to Oklab)
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const r_linear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g_linear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b_linear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    // Apply gamma correction
    const gammaCorrect = (val: number): number => {
        if (val <= 0.0031308) {
            return 12.92 * val;
        }
        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    };

    let r = gammaCorrect(r_linear);
    let g = gammaCorrect(g_linear);
    let b_srgb = gammaCorrect(b_linear);

    // Clamp to valid RGB range
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b_srgb = Math.max(0, Math.min(1, b_srgb));

    return pack(Math.round(r * 255), Math.round(g * 255), Math.round(b_srgb * 255), alpha);
};

// LCH to RGB conversion
// LCH uses CIE LAB color space with cylindrical coordinates (less perceptually uniform than OKLCH)
// Parameters: lightness (0-100 or %), chroma (0+), hue (0-360 degrees), alpha (0-1)
const lch = (context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    const [lightnessToken, chromaToken, hueToken, alphaToken] = tokens;

    // Parse lightness (0-100 range, can be percentage)
    const L = lightnessToken.type === TokenType.PERCENTAGE_TOKEN
        ? lightnessToken.number
        : lightnessToken.type === TokenType.NUMBER_TOKEN
        ? lightnessToken.number
        : 0;

    // Parse chroma (0+ range)
    const C = chromaToken.type === TokenType.NUMBER_TOKEN ? chromaToken.number : 0;

    // Parse hue (0-360 degrees)
    const H = hueToken.type === TokenType.NUMBER_TOKEN
        ? deg(hueToken.number)
        : angle.parse(context, hueToken);

    // Parse alpha (optional, defaults to 1)
    const alpha = typeof alphaToken !== 'undefined' && isLengthPercentage(alphaToken)
        ? getAbsoluteValue(alphaToken, 1)
        : 1;

    // Convert LCH to LAB
    const hueRadians = H;
    const a = C * Math.cos(hueRadians);
    const b = C * Math.sin(hueRadians);

    // Convert LAB to XYZ (using D65 white point)
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const xr = fx * fx * fx > 0.008856 ? fx * fx * fx : (fx - 16 / 116) / 7.787;
    const yr = fy * fy * fy > 0.008856 ? fy * fy * fy : (fy - 16 / 116) / 7.787;
    const zr = fz * fz * fz > 0.008856 ? fz * fz * fz : (fz - 16 / 116) / 7.787;

    // D65 reference white
    const X = xr * 0.95047;
    const Y = yr * 1.0;
    const Z = zr * 1.08883;

    // Convert XYZ to linear RGB
    let r_linear = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314;
    let g_linear = X * -0.969266 + Y * 1.8760108 + Z * 0.041556;
    let b_linear = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252;

    // Apply gamma correction (linear RGB to sRGB)
    const gammaCorrect = (val: number): number => {
        if (val <= 0.0031308) {
            return 12.92 * val;
        }
        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    };

    let r = gammaCorrect(r_linear);
    let g = gammaCorrect(g_linear);
    let b_srgb = gammaCorrect(b_linear);

    // Clamp to valid RGB range
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b_srgb = Math.max(0, Math.min(1, b_srgb));

    return pack(Math.round(r * 255), Math.round(g * 255), Math.round(b_srgb * 255), alpha);
};

// LAB to RGB conversion
// LAB uses CIE LAB color space (less perceptually uniform than OKLAB)
// Parameters: lightness (0-100 or %), a (-125 to 125), b (-125 to 125), alpha (0-1)
const lab = (_context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    const [lightnessToken, aToken, bToken, alphaToken] = tokens;

    // Parse lightness (0-100 range)
    const L = lightnessToken.type === TokenType.PERCENTAGE_TOKEN
        ? lightnessToken.number
        : lightnessToken.type === TokenType.NUMBER_TOKEN
        ? lightnessToken.number
        : 0;

    // Parse a and b components
    const a = aToken.type === TokenType.NUMBER_TOKEN ? aToken.number : 0;
    const b = bToken.type === TokenType.NUMBER_TOKEN ? bToken.number : 0;

    // Parse alpha (optional, defaults to 1)
    const alpha = typeof alphaToken !== 'undefined' && isLengthPercentage(alphaToken)
        ? getAbsoluteValue(alphaToken, 1)
        : 1;

    // Convert LAB to XYZ (same as LCH conversion after converting to LAB)
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const xr = fx * fx * fx > 0.008856 ? fx * fx * fx : (fx - 16 / 116) / 7.787;
    const yr = fy * fy * fy > 0.008856 ? fy * fy * fy : (fy - 16 / 116) / 7.787;
    const zr = fz * fz * fz > 0.008856 ? fz * fz * fz : (fz - 16 / 116) / 7.787;

    const X = xr * 0.95047;
    const Y = yr * 1.0;
    const Z = zr * 1.08883;

    // Convert XYZ to linear RGB
    let r_linear = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314;
    let g_linear = X * -0.969266 + Y * 1.8760108 + Z * 0.041556;
    let b_linear = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252;

    // Apply gamma correction
    const gammaCorrect = (val: number): number => {
        if (val <= 0.0031308) {
            return 12.92 * val;
        }
        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    };

    let r = gammaCorrect(r_linear);
    let g = gammaCorrect(g_linear);
    let b_srgb = gammaCorrect(b_linear);

    // Clamp to valid RGB range
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b_srgb = Math.max(0, Math.min(1, b_srgb));

    return pack(Math.round(r * 255), Math.round(g * 255), Math.round(b_srgb * 255), alpha);
};

// HWB to RGB conversion
// HWB (Hue, Whiteness, Blackness) - intuitive color model
// Parameters: hue (0-360 degrees), whiteness (0-100%), blackness (0-100%), alpha (0-1)
const hwb = (context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    const [hueToken, whitenessToken, blacknessToken, alphaToken] = tokens;

    // Parse hue (0-360 degrees)
    const H = (hueToken.type === TokenType.NUMBER_TOKEN ? deg(hueToken.number) : angle.parse(context, hueToken)) / (Math.PI * 2);

    // Parse whiteness and blackness (0-100%)
    const W = isLengthPercentage(whitenessToken) ? whitenessToken.number / 100 : 0;
    const B = isLengthPercentage(blacknessToken) ? blacknessToken.number / 100 : 0;

    // Parse alpha (optional, defaults to 1)
    const alpha = typeof alphaToken !== 'undefined' && isLengthPercentage(alphaToken)
        ? getAbsoluteValue(alphaToken, 1)
        : 1;

    // If W + B >= 1, result is gray
    if (W + B >= 1) {
        const gray = W / (W + B);
        return pack(Math.round(gray * 255), Math.round(gray * 255), Math.round(gray * 255), alpha);
    }

    // Convert HWB to RGB via HSV
    // First get pure hue RGB
    const hue6 = H * 6;
    const sector = Math.floor(hue6);
    const fraction = hue6 - sector;

    let r = 0, g = 0, b = 0;

    switch (sector % 6) {
        case 0:
            r = 1;
            g = fraction;
            b = 0;
            break;
        case 1:
            r = 1 - fraction;
            g = 1;
            b = 0;
            break;
        case 2:
            r = 0;
            g = 1;
            b = fraction;
            break;
        case 3:
            r = 0;
            g = 1 - fraction;
            b = 1;
            break;
        case 4:
            r = fraction;
            g = 0;
            b = 1;
            break;
        case 5:
            r = 1;
            g = 0;
            b = 1 - fraction;
            break;
    }

    // Apply whiteness and blackness
    r = r * (1 - W - B) + W;
    g = g * (1 - W - B) + W;
    b = b * (1 - W - B) + W;

    return pack(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), alpha);
};

// color() function - generic color space function
// Supports: srgb, srgb-linear, display-p3, a98-rgb, prophoto-rgb, rec2020
// Parameters: colorspace c1 c2 c3 [/ alpha]
const colorFunction = (_context: Context, args: CSSValue[]): number => {
    const tokens = args.filter(nonFunctionArgSeparator);
    if (tokens.length < 4) return 0;

    const [colorspaceToken, c1Token, c2Token, c3Token, alphaToken] = tokens;

    if (colorspaceToken.type !== TokenType.IDENT_TOKEN) return 0;
    const colorspace = colorspaceToken.value.toLowerCase();

    // Parse color components (can be numbers or percentages, 0-1 range)
    const c1 = c1Token.type === TokenType.PERCENTAGE_TOKEN
        ? c1Token.number / 100
        : c1Token.type === TokenType.NUMBER_TOKEN
        ? c1Token.number
        : 0;

    const c2 = c2Token.type === TokenType.PERCENTAGE_TOKEN
        ? c2Token.number / 100
        : c2Token.type === TokenType.NUMBER_TOKEN
        ? c2Token.number
        : 0;

    const c3 = c3Token.type === TokenType.PERCENTAGE_TOKEN
        ? c3Token.number / 100
        : c3Token.type === TokenType.NUMBER_TOKEN
        ? c3Token.number
        : 0;

    // Parse alpha (optional, defaults to 1)
    const alpha = typeof alphaToken !== 'undefined' && isLengthPercentage(alphaToken)
        ? getAbsoluteValue(alphaToken, 1)
        : 1;

    let r = 0, g = 0, b = 0;

    switch (colorspace) {
        case 'srgb':
            // Already in sRGB, just clamp and return
            r = Math.max(0, Math.min(1, c1));
            g = Math.max(0, Math.min(1, c2));
            b = Math.max(0, Math.min(1, c3));
            break;

        case 'srgb-linear':
            // Linear sRGB to sRGB (apply gamma correction)
            const gammaCorrect = (val: number): number => {
                if (val <= 0.0031308) {
                    return 12.92 * val;
                }
                return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
            };
            r = Math.max(0, Math.min(1, gammaCorrect(c1)));
            g = Math.max(0, Math.min(1, gammaCorrect(c2)));
            b = Math.max(0, Math.min(1, gammaCorrect(c3)));
            break;

        case 'display-p3':
            // Display P3 to XYZ to sRGB
            // First convert Display P3 to linear
            const p3ToLinear = (val: number): number => {
                if (val <= 0.04045) {
                    return val / 12.92;
                }
                return Math.pow((val + 0.055) / 1.055, 2.4);
            };

            const r_p3_linear = p3ToLinear(c1);
            const g_p3_linear = p3ToLinear(c2);
            const b_p3_linear = p3ToLinear(c3);

            // P3 to XYZ (D65)
            const X_p3 = r_p3_linear * 0.4865709486 + g_p3_linear * 0.2656676932 + b_p3_linear * 0.1982172852;
            const Y_p3 = r_p3_linear * 0.2289745641 + g_p3_linear * 0.6917385218 + b_p3_linear * 0.0792869141;
            const Z_p3 = r_p3_linear * 0.0000000000 + g_p3_linear * 0.0451133819 + b_p3_linear * 1.0439443689;

            // XYZ to linear sRGB
            const r_linear = X_p3 * 3.2404542 + Y_p3 * -1.5371385 + Z_p3 * -0.4985314;
            const g_linear = X_p3 * -0.969266 + Y_p3 * 1.8760108 + Z_p3 * 0.041556;
            const b_linear = X_p3 * 0.0556434 + Y_p3 * -0.2040259 + Z_p3 * 1.0572252;

            // Linear sRGB to sRGB
            const toSRGB = (val: number): number => {
                if (val <= 0.0031308) {
                    return 12.92 * val;
                }
                return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
            };

            r = Math.max(0, Math.min(1, toSRGB(r_linear)));
            g = Math.max(0, Math.min(1, toSRGB(g_linear)));
            b = Math.max(0, Math.min(1, toSRGB(b_linear)));
            break;

        case 'a98-rgb':
        case 'prophoto-rgb':
        case 'rec2020':
            // For now, approximate these as sRGB (proper conversion requires complex matrix operations)
            // This is a reasonable fallback for compatibility
            r = Math.max(0, Math.min(1, c1));
            g = Math.max(0, Math.min(1, c2));
            b = Math.max(0, Math.min(1, c3));
            break;

        default:
            // Unknown colorspace, return black
            return 0;
    }

    return pack(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), alpha);
};

const SUPPORTED_COLOR_FUNCTIONS: {
    [key: string]: (context: Context, args: CSSValue[]) => number;
} = {
    hsl: hsl,
    hsla: hsl,
    rgb: rgb,
    rgba: rgb,
    oklch: oklch,
    oklab: oklab,
    lch: lch,
    lab: lab,
    hwb: hwb,
    color: colorFunction
};

export const parseColor = (context: Context, value: string): Color =>
    color.parse(context, Parser.create(value).parseComponentValue());

export const COLORS: {[key: string]: Color} = {
    ALICEBLUE: 0xf0f8ffff,
    ANTIQUEWHITE: 0xfaebd7ff,
    AQUA: 0x00ffffff,
    AQUAMARINE: 0x7fffd4ff,
    AZURE: 0xf0ffffff,
    BEIGE: 0xf5f5dcff,
    BISQUE: 0xffe4c4ff,
    BLACK: 0x000000ff,
    BLANCHEDALMOND: 0xffebcdff,
    BLUE: 0x0000ffff,
    BLUEVIOLET: 0x8a2be2ff,
    BROWN: 0xa52a2aff,
    BURLYWOOD: 0xdeb887ff,
    CADETBLUE: 0x5f9ea0ff,
    CHARTREUSE: 0x7fff00ff,
    CHOCOLATE: 0xd2691eff,
    CORAL: 0xff7f50ff,
    CORNFLOWERBLUE: 0x6495edff,
    CORNSILK: 0xfff8dcff,
    CRIMSON: 0xdc143cff,
    CYAN: 0x00ffffff,
    DARKBLUE: 0x00008bff,
    DARKCYAN: 0x008b8bff,
    DARKGOLDENROD: 0xb886bbff,
    DARKGRAY: 0xa9a9a9ff,
    DARKGREEN: 0x006400ff,
    DARKGREY: 0xa9a9a9ff,
    DARKKHAKI: 0xbdb76bff,
    DARKMAGENTA: 0x8b008bff,
    DARKOLIVEGREEN: 0x556b2fff,
    DARKORANGE: 0xff8c00ff,
    DARKORCHID: 0x9932ccff,
    DARKRED: 0x8b0000ff,
    DARKSALMON: 0xe9967aff,
    DARKSEAGREEN: 0x8fbc8fff,
    DARKSLATEBLUE: 0x483d8bff,
    DARKSLATEGRAY: 0x2f4f4fff,
    DARKSLATEGREY: 0x2f4f4fff,
    DARKTURQUOISE: 0x00ced1ff,
    DARKVIOLET: 0x9400d3ff,
    DEEPPINK: 0xff1493ff,
    DEEPSKYBLUE: 0x00bfffff,
    DIMGRAY: 0x696969ff,
    DIMGREY: 0x696969ff,
    DODGERBLUE: 0x1e90ffff,
    FIREBRICK: 0xb22222ff,
    FLORALWHITE: 0xfffaf0ff,
    FORESTGREEN: 0x228b22ff,
    FUCHSIA: 0xff00ffff,
    GAINSBORO: 0xdcdcdcff,
    GHOSTWHITE: 0xf8f8ffff,
    GOLD: 0xffd700ff,
    GOLDENROD: 0xdaa520ff,
    GRAY: 0x808080ff,
    GREEN: 0x008000ff,
    GREENYELLOW: 0xadff2fff,
    GREY: 0x808080ff,
    HONEYDEW: 0xf0fff0ff,
    HOTPINK: 0xff69b4ff,
    INDIANRED: 0xcd5c5cff,
    INDIGO: 0x4b0082ff,
    IVORY: 0xfffff0ff,
    KHAKI: 0xf0e68cff,
    LAVENDER: 0xe6e6faff,
    LAVENDERBLUSH: 0xfff0f5ff,
    LAWNGREEN: 0x7cfc00ff,
    LEMONCHIFFON: 0xfffacdff,
    LIGHTBLUE: 0xadd8e6ff,
    LIGHTCORAL: 0xf08080ff,
    LIGHTCYAN: 0xe0ffffff,
    LIGHTGOLDENRODYELLOW: 0xfafad2ff,
    LIGHTGRAY: 0xd3d3d3ff,
    LIGHTGREEN: 0x90ee90ff,
    LIGHTGREY: 0xd3d3d3ff,
    LIGHTPINK: 0xffb6c1ff,
    LIGHTSALMON: 0xffa07aff,
    LIGHTSEAGREEN: 0x20b2aaff,
    LIGHTSKYBLUE: 0x87cefaff,
    LIGHTSLATEGRAY: 0x778899ff,
    LIGHTSLATEGREY: 0x778899ff,
    LIGHTSTEELBLUE: 0xb0c4deff,
    LIGHTYELLOW: 0xffffe0ff,
    LIME: 0x00ff00ff,
    LIMEGREEN: 0x32cd32ff,
    LINEN: 0xfaf0e6ff,
    MAGENTA: 0xff00ffff,
    MAROON: 0x800000ff,
    MEDIUMAQUAMARINE: 0x66cdaaff,
    MEDIUMBLUE: 0x0000cdff,
    MEDIUMORCHID: 0xba55d3ff,
    MEDIUMPURPLE: 0x9370dbff,
    MEDIUMSEAGREEN: 0x3cb371ff,
    MEDIUMSLATEBLUE: 0x7b68eeff,
    MEDIUMSPRINGGREEN: 0x00fa9aff,
    MEDIUMTURQUOISE: 0x48d1ccff,
    MEDIUMVIOLETRED: 0xc71585ff,
    MIDNIGHTBLUE: 0x191970ff,
    MINTCREAM: 0xf5fffaff,
    MISTYROSE: 0xffe4e1ff,
    MOCCASIN: 0xffe4b5ff,
    NAVAJOWHITE: 0xffdeadff,
    NAVY: 0x000080ff,
    OLDLACE: 0xfdf5e6ff,
    OLIVE: 0x808000ff,
    OLIVEDRAB: 0x6b8e23ff,
    ORANGE: 0xffa500ff,
    ORANGERED: 0xff4500ff,
    ORCHID: 0xda70d6ff,
    PALEGOLDENROD: 0xeee8aaff,
    PALEGREEN: 0x98fb98ff,
    PALETURQUOISE: 0xafeeeeff,
    PALEVIOLETRED: 0xdb7093ff,
    PAPAYAWHIP: 0xffefd5ff,
    PEACHPUFF: 0xffdab9ff,
    PERU: 0xcd853fff,
    PINK: 0xffc0cbff,
    PLUM: 0xdda0ddff,
    POWDERBLUE: 0xb0e0e6ff,
    PURPLE: 0x800080ff,
    REBECCAPURPLE: 0x663399ff,
    RED: 0xff0000ff,
    ROSYBROWN: 0xbc8f8fff,
    ROYALBLUE: 0x4169e1ff,
    SADDLEBROWN: 0x8b4513ff,
    SALMON: 0xfa8072ff,
    SANDYBROWN: 0xf4a460ff,
    SEAGREEN: 0x2e8b57ff,
    SEASHELL: 0xfff5eeff,
    SIENNA: 0xa0522dff,
    SILVER: 0xc0c0c0ff,
    SKYBLUE: 0x87ceebff,
    SLATEBLUE: 0x6a5acdff,
    SLATEGRAY: 0x708090ff,
    SLATEGREY: 0x708090ff,
    SNOW: 0xfffafaff,
    SPRINGGREEN: 0x00ff7fff,
    STEELBLUE: 0x4682b4ff,
    TAN: 0xd2b48cff,
    TEAL: 0x008080ff,
    THISTLE: 0xd8bfd8ff,
    TOMATO: 0xff6347ff,
    TRANSPARENT: 0x00000000,
    TURQUOISE: 0x40e0d0ff,
    VIOLET: 0xee82eeff,
    WHEAT: 0xf5deb3ff,
    WHITE: 0xffffffff,
    WHITESMOKE: 0xf5f5f5ff,
    YELLOW: 0xffff00ff,
    YELLOWGREEN: 0x9acd32ff
};
