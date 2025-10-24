# border-image Implementation

This directory contains the implementation for the `border-image` CSS property family.

## Overview

The `border-image` property allows using gradients or images as borders instead of solid colors. This is a complex CSS feature with multiple sub-properties.

## Implementation Status

### ✅ Fully Implemented

**Linear Gradients**:
- All angle values (0deg, 45deg, 90deg, 180deg, etc.)
- Multiple color stops
- All border widths (uniform and asymmetric)
- Proper CSS angle convention (0deg = upward, increases clockwise)

**Example**:
```css
border: 8px solid;
border-image: linear-gradient(45deg, #3498db, #e74c3c) 1;
```

### ❌ Not Implemented

**Gradient Types**:
- Radial gradients (`radial-gradient()`)
- Conic gradients (`conic-gradient()`)
- Repeating gradients (`repeating-linear-gradient()`, `repeating-radial-gradient()`)

**Image Sources**:
- URL images (`url()`)
- SVG images
- Data URIs

**Advanced Features**:
- `border-image-slice` - 9-slice grid subdivision (parsed but not used)
- `border-image-repeat` - Tiling modes (stretch/repeat/round/space) (parsed but not used)
- `border-image-width` - Width multipliers (parsed but not used)
- `border-image-outset` - Border extension (parsed but not used)

## Files

### Property Descriptors

1. **[border-image-source.ts](./border-image-source.ts)**
   - Parses the image/gradient source
   - Returns `ICSSImage | null`
   - Supports linear gradients via existing gradient parser

2. **[border-image-slice.ts](./border-image-slice.ts)**
   - Defines how to slice the border image into 9 regions
   - Returns `{top, right, bottom, left, fill}` values
   - Parsed but NOT used in rendering (TODO)

3. **[border-image-width.ts](./border-image-width.ts)**
   - Controls border image dimensions
   - Can be length, number (multiplier), or 'auto'
   - Parsed but NOT used in rendering (TODO)

4. **[border-image-outset.ts](./border-image-outset.ts)**
   - Extends border beyond border box
   - Accepts length or number values
   - Parsed but NOT used in rendering (TODO)

5. **[border-image-repeat.ts](./border-image-repeat.ts)**
   - Controls tiling behavior
   - Values: `stretch` (default), `repeat`, `round`, `space`
   - Parsed but NOT used in rendering (TODO)

### Rendering

**Location**: [src/render/canvas/canvas-renderer.ts](../../render/canvas/canvas-renderer.ts)

**Key Functions**:
- `renderBorderImage()` (lines 1154-1188) - Main entry point
- `renderBorderImageSide()` (lines 1190-1241) - Renders individual border sides

**Algorithm**:
1. Check if `borderImageSource` is set
2. For linear gradients, iterate over 4 border sides
3. For each side:
   - Create clipping path using existing border path logic
   - Calculate gradient direction using `calculateGradientDirection()`
   - Create canvas gradient with proper coordinates
   - Apply color stops
   - Fill the clipped region

## Testing

**Comprehensive Test**: [tests/visual-suite/borders/border-image-comprehensive.html](../../../tests/visual-suite/borders/border-image-comprehensive.html)

**Test Coverage**:
- ✅ Linear gradients (6 tests)
- ✅ Different border widths (3 tests)
- ✅ Asymmetric borders (2 tests)
- ❌ Radial gradients (2 tests - marked as not implemented)
- ❌ Conic gradients (1 test - marked as not implemented)
- ❌ Image sources (1 test - marked as not implemented)
- ⚠️ border-image-slice (1 test - partial support)
- ⚠️ border-image-repeat (2 tests - partial support)

## Future Work

### High Priority

1. **Radial Gradients**
   - Add `CSSImageType.RADIAL_GRADIENT` case
   - Calculate radial gradient coordinates
   - Apply to border regions

2. **Image Sources**
   - Support `url()` images
   - Handle image loading and caching
   - Apply 9-slice subdivision

### Medium Priority

3. **border-image-slice**
   - Implement 9-slice grid subdivision
   - Slice gradient/image into 9 regions
   - Render corners, edges, and center separately

4. **border-image-repeat**
   - Implement `repeat` mode (tile the image)
   - Implement `round` mode (tile and scale to fit)
   - Implement `space` mode (tile with spacing)

### Low Priority

5. **border-image-width**
   - Use multipliers with actual border width
   - Handle `auto` value

6. **border-image-outset**
   - Extend border drawing area beyond border box

## Technical Notes

### Gradient Angle Convention

CSS gradients use a special angle convention:
- `0deg` = upward (to top)
- `90deg` = to right
- `180deg` = downward (to bottom)
- `270deg` = to left

The `calculateGradientDirection()` function in [gradient.ts](../types/functions/gradient.ts) handles this correctly.

### Why Browser Expands Shorthand

The browser's CSS parser automatically expands the `border-image` shorthand:
```css
border-image: linear-gradient(45deg, blue, red) 1;
```

Becomes:
```css
border-image-source: linear-gradient(45deg, blue, red);
border-image-slice: 1;
border-image-width: 1;
border-image-outset: 0;
border-image-repeat: stretch;
```

This is why we only parse individual sub-properties, not the shorthand itself.

### Clipping Strategy

Each border side is rendered independently:
1. Calculate border path for the side using `parsePathForBorder()`
2. Apply as clipping path
3. Render gradient across entire element (clipped to border)
4. Restore context

This approach works for simple gradients but needs enhancement for slice/repeat modes.

## Related Code

- **Gradient parsing**: [src/css/types/functions/gradient.ts](../types/functions/gradient.ts)
- **Border path calculation**: [src/render/border.ts](../../render/border.ts)
- **Background rendering** (similar logic): [src/render/background.ts](../../render/background.ts)
- **Bound curves** (border geometry): [src/render/bound-curves.ts](../../render/bound-curves.ts)

## References

- [MDN: border-image](https://developer.mozilla.org/en-US/docs/Web/CSS/border-image)
- [CSS Backgrounds and Borders Module Level 3](https://www.w3.org/TR/css-backgrounds-3/#border-images)
- [CSS Images Module Level 3](https://www.w3.org/TR/css-images-3/)
