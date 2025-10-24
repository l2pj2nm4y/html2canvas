# Comprehensive Visual Tests - Implementation Plan

## Completed ✅

1. **overflow-comprehensive.html** - Extensive overflow testing
   - Different display types (block, flex, grid, inline-block)
   - Nested overflow containers
   - Positioned elements with overflow
   - Transforms with overflow
   - Border-radius clipping
   - Transparent backgrounds
   - Z-index layering
   - Directional overflow (x/y combinations)

2. **background-color-comprehensive.html** - All color formats and edge cases
   - Hex (3-digit, 6-digit)
   - RGB, RGBA with various alpha values
   - HSL, HSLA
   - Named colors (extended set)
   - Special values (transparent, currentColor, inherit)
   - Extreme values (pure black/white, near black/white)
   - Opacity layering and gradations
   - With borders, padding, transforms
   - Background-clip variations
   - Different display types
   - Blend modes

3. **background-image-comprehensive.html** - All gradient types and patterns
   - Linear gradients (all directions, angles, multi-stop, transparency)
   - Radial gradients (shapes, positions, sizes)
   - Conic gradients (positions, angles, hard stops)
   - Repeating linear/radial gradients
   - Multiple backgrounds
   - SVG data URLs
   - Combinations with other properties

## High Priority - To Create

### Transforms (Critical for html2canvas)
**transform-comprehensive.html**
- All transform functions combined
- transform-origin variations
- Nested transforms
- 3D transforms (rotateX, rotateY, rotateZ, scale3d, translate3d)
- Matrix transforms
- Transforms with overflow
- Transforms on different display types
- Perspective

### Box Shadow (Visual effects)
**box-shadow-comprehensive.html**
- Single shadows (all offsets)
- Multiple shadows (2, 3, 5+)
- Inset shadows
- Large blur radius
- Large spread
- Negative spreads
- Colored shadows
- Shadows with transparency
- Shadows on rounded corners
- Shadows with transforms

### Border Radius (Common property)
**border-radius-comprehensive.html**
- Individual corners
- Elliptical corners
- Extreme values
- Percentage values
- Different units (px, em, %)
- With borders
- With backgrounds
- With overflow
- Asymmetric radii

### Position & Z-Index (Layout critical)
**position-comprehensive.html**
- Static, relative, absolute, fixed, sticky
- Complex stacking contexts
- Nested positioning
- With transforms
- With overflow

**z-index-comprehensive.html** (Currently missing!)
- Positive/negative values
- Stacking contexts
- Nested z-index
- With transforms (creates stacking context)
- With opacity (creates stacking context)
- Auto vs specific values

## Medium Priority

### Text Properties
**text-comprehensive.html**
- All text-decoration variations
- Text-shadow with multiple shadows
- Letter-spacing extreme values
- Line-height edge cases
- Text-overflow with various scenarios
- Word-break and overflow-wrap
- Writing modes

### Borders
**border-comprehensive.html**
- All border styles on one element
- Asymmetric borders
- Transparent borders
- Gradient borders
- Border-image
- Borders with border-radius

### Filters
**filter-comprehensive.html**
- All filter functions
- Multiple filters combined
- Extreme values
- Filters on different elements
- Backdrop-filter

## Low Priority (Existing tests are adequate)

### Background Position/Repeat/Size
- Current tests cover basics
- Add edge cases: calc() values, multiple backgrounds with different positions

### Display/Float/Gap
- Current tests adequate
- Add more flexbox/grid gap combinations

### Lists
- Current tests likely adequate
- Add nested lists, custom list styles

### Objects (object-fit, object-position)
- Create tests for replaced elements (img, video, canvas, svg)
- All object-fit values
- Custom object-position values

### Modern CSS
**aspect-ratio-comprehensive.html**
- All ratio formats
- With width/height constraints
- On different elements

**accent-color-comprehensive.html**
- All form controls
- Different color formats

## Test Template Structure

Each comprehensive test should include:

1. **Test Sections** - Grouped by feature variation
2. **Clear Labels** - Property values or descriptions
3. **Edge Cases** - Extreme values, combinations
4. **Browser Contexts** - Different display types, positioning
5. **Visual Variety** - Colors, sizes for easy visual comparison

## Implementation Notes

- Use data URLs for images to avoid external dependencies
- Include comments explaining complex test cases
- Keep samples consistent size (140x90 or 180x120)
- Use descriptive CSS class names
- Group related tests in sections with headers
- Test both positive and negative values where applicable
- Include transparency variations
- Test with transforms, overflow, and other common combinations

## Success Criteria

A comprehensive test should:
- Cover all CSS spec values for the property
- Include edge cases and extreme values
- Test combinations with other properties
- Work across different element types
- Provide visual differentiation for comparison
- Match HTML and Canvas output exactly
