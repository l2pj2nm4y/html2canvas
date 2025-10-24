# html2canvas Visual Testing Suite

Comprehensive visual testing framework for html2canvas CSS property rendering.

## Overview

The visual testing suite provides side-by-side comparison of HTML rendering vs html2canvas canvas output for all supported CSS properties.

**Current Stats**: 63 test pages | 9 categories | 44 CSS properties | 94% coverage

## New Comprehensive Tests

### Recently Added ✅

1. **overflow-comprehensive.html** (Layout)
   - 14 test scenarios covering all overflow edge cases
   - Different display types with overflow
   - Nested overflow containers
   - Positioned elements, transforms, z-index
   - Border-radius clipping
   - Transparent backgrounds
   - Directional overflow combinations

2. **background-color-comprehensive.html** (Background)
   - All color formats (hex, rgb, rgba, hsl, hsla, named)
   - Special values (transparent, currentColor, inherit)
   - Extreme values and opacity gradations
   - Background-clip variations
   - Combinations with borders, padding, transforms
   - Different display types
   - Blend modes

3. **background-image-comprehensive.html** (Background)
   - Linear gradients: all directions, angles, multi-stop, transparency
   - Radial gradients: shapes, positions, sizes, multi-stop
   - Conic gradients: positions, angles, hard stops
   - Repeating linear/radial gradients
   - Multiple backgrounds (2-4 layers)
   - SVG data URLs (circles, rects, patterns)
   - Extreme cases (11+ color stops, micro patterns)
   - 80+ gradient variations

## Test Structure

Each test file follows this pattern:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../shared/test-template.css">
    <script src="../../../dist/html2canvas.js"></script>
    <style>
        /* Test-specific styles */
    </style>
</head>
<body>
    <header>
        <h1>Test Title</h1>
        <p>Description</p>
    </header>

    <div class="controls">
        <button id="capture-btn">Capture Canvas</button>
        <span id="status"></span>
    </div>

    <div class="split-view">
        <div class="view-panel">
            <div class="panel-header">HTML Version</div>
            <div class="panel-content" id="html-samples">
                <!-- Test samples -->
            </div>
        </div>

        <div class="view-panel">
            <div class="panel-header">Canvas Version</div>
            <div class="panel-content" id="canvas-output">
                <!-- Canvas output rendered here -->
            </div>
        </div>
    </div>

    <footer>
        <a href="../index.html">← Back to Index</a>
    </footer>

    <script src="../shared/test-runner.js"></script>
</body>
</html>
```

## Creating New Comprehensive Tests

### Guidelines

1. **Organized Sections**: Group related tests with `<div class="test-section">`
2. **Clear Labels**: Use `.label` class to describe each test case
3. **Consistent Sizing**: Standard samples are 140x90px or 180x120px
4. **Edge Cases**: Include extreme values, combinations, transparency
5. **Visual Variety**: Use colors that show clear differences
6. **Self-Contained**: Use data URLs for images, no external dependencies

### Example Test Case

```html
<div class="test-section">
    <h3>Linear Gradients - Directions</h3>

    <div class="sample linear-to-right"></div>
    <div class="label">to right</div>

    <div class="sample linear-to-left"></div>
    <div class="label">to left</div>

    <!-- More variations... -->
</div>

<style>
.linear-to-right { background-image: linear-gradient(to right, #3498db, #2ecc71); }
.linear-to-left { background-image: linear-gradient(to left, #e74c3c, #f39c12); }
</style>
```

## Running Tests

1. **Start Development Server**:
   ```bash
   npm start
   ```

2. **Navigate to Test Suite**:
   ```
   http://localhost:8080/tests/visual-suite/
   ```

3. **Run Individual Test**:
   - Click on any test from the index
   - Click "Capture Canvas" button
   - Compare HTML (left) vs Canvas (right) output

4. **Visual Verification**:
   - HTML and Canvas versions should match exactly
   - Check colors, sizes, positions, clipping
   - Look for rendering artifacts or differences

## Test Categories

### 🎨 Background (7 tests)
- backgroundColor (basic + comprehensive)
- backgroundImage (basic + comprehensive)
- backgroundPosition
- backgroundRepeat
- backgroundSize

### 📐 Borders (4 tests)
- border*Color
- borderRadius
- border*Style
- border*Width

### 📦 Layout (7 tests)
- display
- float
- gap / rowGap / columnGap
- position
- overflow (basic + comprehensive)
- zIndex

### 📝 Text & Typography (12 tests)
- color
- fontFamily, fontSize, fontStyle, fontWeight
- letterSpacing, lineHeight
- textAlign, textDecoration, textShadow
- textTransform, webkitTextStroke

### 🔄 Transforms (5 tests)
- rotate, scale, translate
- transform
- transformOrigin

### ✨ Visual Effects (4 tests)
- boxShadow
- filter
- mixBlendMode
- opacity

### 📋 Lists (3 tests)
- listStyleImage
- listStylePosition
- listStyleType

### 🖼️ Objects (2 tests)
- objectFit
- objectPosition

### 🚀 Modern CSS (3 tests)
- accentColor
- aspectRatio
- scrollSnap

## Future Comprehensive Tests

See [COMPREHENSIVE_TESTS_PLAN.md](./COMPREHENSIVE_TESTS_PLAN.md) for detailed implementation plan.

**High Priority**:
- transform-comprehensive.html
- box-shadow-comprehensive.html
- border-radius-comprehensive.html
- position-comprehensive.html
- z-index-comprehensive.html

**Medium Priority**:
- text-comprehensive.html
- border-comprehensive.html
- filter-comprehensive.html

## Contributing

When adding new comprehensive tests:

1. Create test file in appropriate category folder
2. Add entry to `index.html` in correct category section
3. Update test count in category header
4. Update stats (Test Pages number)
5. Follow existing patterns and naming conventions
6. Include diverse test cases and edge cases
7. Document complex scenarios with comments

## Debugging

If tests fail or show differences:

1. **Check Console**: Look for errors or warnings
2. **Inspect Elements**: Use browser DevTools to compare
3. **Debug Mode**: Add `{logging: true}` to html2canvas options
4. **Capture Timing**: Some properties may need async loading
5. **Browser Support**: Check if property is supported

## Notes

- All tests use local html2canvas build (`dist/html2canvas.js`)
- Rebuild html2canvas (`npm run build`) after code changes
- Tests use data URLs to avoid CORS issues
- Some properties may have browser-specific rendering differences
- Canvas rendering is done client-side in browser

## Resources

- [html2canvas Documentation](https://html2canvas.hertzen.com)
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)
- [CSS Specification](https://www.w3.org/Style/CSS/)
