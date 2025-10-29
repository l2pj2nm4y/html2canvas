# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

html2canvas is a JavaScript library that renders HTML elements to canvas images in the browser. It creates screenshots by reading the DOM and applying CSS styles to build canvas representations, without server-side rendering or actual screenshot APIs.

**Key Constraint**: This library is browser-only and cannot be used in Node.js environments due to DOM dependencies.

## Build System

### Primary Build Commands

```bash
# Full build pipeline
npm run build

# Watch mode for development
npm run watch

# Build minified version
npm run build:minify
```

The build process:
1. Compiles TypeScript to CommonJS (`tsc --module commonjs`)
2. Bundles with Rollup to create UMD and ESM formats
3. Generates reftest list (`build:create-reftest-list`)
4. Builds test runner (`build:testrunner`)
5. Minifies output (`build:minify`)

**Build Output**:
- `dist/html2canvas.js` - UMD bundle (main entry)
- `dist/html2canvas.esm.js` - ES module bundle
- `dist/types/` - TypeScript declarations
- `dist/html2canvas.min.js` - Minified version

### Development Server

```bash
# Start test server on ports 8080 (main) and 8081 (CORS)
npm start
```

## Testing

### Test Types

**Unit Tests** (Jest):
```bash
npm run unittest              # Run all unit tests
npm run watch:unittest        # Watch mode for unit tests
```

**Reference Tests** (Visual regression):
```bash
npm run karma                 # Run karma tests (cross-browser)
npm run reftests-diff         # Generate snapshot diffs
```

**Full Test Suite**:
```bash
npm test                      # Runs lint + unittest + karma
```

### Test Organization

- **Unit tests**: `src/**/__tests__/*.ts` - Colocated with source code
- **Reference tests**: `tests/reftests/` - HTML files with expected visual outputs
- **Test server**: `tests/server.ts` - Development server for manual testing
- **Test runner**: `tests/testrunner.ts` - Karma test orchestration

### Running Specific Tests

```bash
# Run Jest tests matching a pattern
npm run unittest -- --testNamePattern="pattern"

# Run specific reftest
# (Manual: navigate to http://localhost:8080/tests/reftests/[test-name].html after starting server)
```

## Code Architecture

### Core Rendering Pipeline

1. **Document Cloning** (`src/dom/document-cloner.ts`)
   - Clones DOM tree into isolated iframe
   - Resolves external resources (images, fonts)
   - Applies inline styles for accuracy

2. **Element Parsing** (`src/dom/node-parser.ts`)
   - Parses DOM tree into ElementContainer hierarchy
   - Extracts computed CSS styles via property descriptors

3. **Stacking Context** (`src/render/stacking-context.ts`)
   - Builds paint order following CSS stacking rules
   - Handles z-index, transforms, opacity layers

4. **Canvas Rendering** (`src/render/canvas/canvas-renderer.ts`)
   - Primary renderer traversing stacking contexts
   - Paints backgrounds, borders, text, replaced elements
   - Handles clipping paths and effects

5. **Foreign Object Fallback** (`src/render/canvas/foreignobject-renderer.ts`)
   - Alternative SVG-based rendering path
   - Activated via `foreignObjectRendering` option

### Module Organization

**`src/core/`** - Foundation utilities
- `context.ts` - Global rendering context and logger
- `cache-storage.ts` - Resource caching (images, fonts)
- `features.ts` - Browser capability detection

**`src/css/`** - CSS parsing and computation
- `property-descriptors/` - Individual CSS property parsers (100+ properties)
- `layout/` - Box model and text layout calculations
- `types/` - CSS value types (colors, images, lengths)
- `syntax/` - CSS syntax parser

**`src/dom/`** - DOM processing
- `element-container.ts` - Base container for elements
- `text-container.ts` - Text node representation
- `elements/` - Special element handlers (textarea, select)
- `replaced-elements/` - Replaced element renderers (img, canvas, svg, iframe, input)

**`src/render/`** - Rendering algorithms
- `canvas/` - Canvas 2D rendering implementation
- `background.ts`, `border.ts` - Visual effect rendering
- `path.ts`, `bezier-curve.ts` - Geometry calculations
- `font-metrics.ts` - Text measurement

### Key Design Patterns

**Property Descriptors**: Each CSS property has a dedicated descriptor implementing parsing logic. Located in `src/css/property-descriptors/[property-name].ts`.

**Element Containers**: DOM elements are wrapped in container classes that provide rendering context. Replaced elements (img, canvas, etc.) have specialized containers.

**Stacking Contexts**: CSS rendering follows spec-compliant stacking context rules. Paint order is determined before rendering begins.

**Resource Loading**: Images and fonts are loaded asynchronously and cached. Cross-origin resources require proxy configuration or CORS.

## Code Quality

### Linting and Formatting

```bash
npm run lint                  # ESLint (max 0 warnings)
npm run format                # Prettier formatting
```

**TypeScript Strictness**: Project uses strict TypeScript settings:
- `noImplicitAny`, `noImplicitThis`
- `strictNullChecks`, `strictPropertyInitialization`
- `noUnusedLocals`, `noUnusedParameters`

### Development Constraints

- **Target**: ES5 for broad browser compatibility
- **Browser Support**: IE9+, Firefox 3.5+, Chrome, Safari 6+, Opera 12+
- **Promise Requirement**: Consumers must provide Promise polyfill for older browsers
- **No Server-Side**: Code must work in browser environment only

## Release Process

```bash
npm run release               # Create versioned release with changelog
```

Uses `standard-version` for semantic versioning and CHANGELOG generation.

## Common Development Workflows

### Adding CSS Property Support

1. Create property descriptor in `src/css/property-descriptors/[property].ts`
2. Implement `IPropertyDescriptor` interface with parser
3. Register in `src/css/index.ts`
4. Add rendering logic in appropriate renderer
5. Create reftest in `tests/reftests/` demonstrating the property
6. Add unit tests in `src/css/property-descriptors/__tests__/`

### Debugging Rendering Issues

1. Start dev server: `npm start`
2. Navigate to `http://localhost:8080/tests/reftests/`
3. Create/modify HTML test file to reproduce issue
4. Use browser DevTools to inspect cloned iframe and canvas
5. Enable logging via `{logging: true}` option (default)
6. Check console for resource loading and parsing errors

### Adding Replaced Element Support

1. Create container class in `src/dom/replaced-elements/[element]-element-container.ts`
2. Extend `ReplacedElementContainer` base class
3. Implement intrinsic size calculation
4. Add rendering logic in `canvas-renderer.ts`
5. Create reftests demonstrating element rendering

## Version 2.0 Changes (In Progress)

### Breaking Changes
- **Target**: ES2015 (was ES5) - drops IE9-11 support
- **Browser Support**: Chrome 84+, Firefox 63+, Safari 14.1+, Edge 84+
- **Native Promises**: No polyfill required

### New HTML Element Support
- **`<details>` and `<summary>`**: HTML5 disclosure widgets
  - Supports `open` attribute to show/hide content
  - Summary elements display disclosure triangle markers (▶ closed, ▼ open)
  - Properly handles nested details elements
  - Implementation: [src/dom/elements/details-element-container.ts](src/dom/elements/details-element-container.ts), [src/dom/elements/summary-element-container.ts](src/dom/elements/summary-element-container.ts)
  - Rendering: List marker logic in [src/render/stacking-context.ts](src/render/stacking-context.ts), disclosure triangles in [src/css/types/functions/counter.ts](src/css/types/functions/counter.ts)
  - Test page: [tests/visual-suite/modern/details.html](tests/visual-suite/modern/details.html)

### New CSS Properties
- **`object-fit`**: Controls how replaced elements (img, video, canvas, svg) scale within containers
  - Values: `fill` (default), `contain`, `cover`, `none`, `scale-down`
  - Implementation: [src/css/property-descriptors/object-fit.ts](src/css/property-descriptors/object-fit.ts)

- **`object-position`**: Positions replaced elements within containers
  - Default: `50% 50%` (center)
  - Accepts length/percentage values like background-position
  - Implementation: [src/css/property-descriptors/object-position.ts](src/css/property-descriptors/object-position.ts)

- **`aspect-ratio`**: Maintains specific width-to-height ratios for elements
  - Default: `auto` (use natural aspect ratio)
  - Accepts: numbers (`1.5`), ratios (`16/9`, `4/3`), or `auto`
  - Implementation: [src/css/property-descriptors/aspect-ratio.ts](src/css/property-descriptors/aspect-ratio.ts)

- **`gap`, `row-gap`, `column-gap`**: Spacing control for flexbox and grid layouts
  - Default: `normal`
  - `gap` is shorthand: single value applies to both, two values set row and column separately
  - Accepts: length values (`10px`, `1rem`) and percentages (`5%`)
  - Implementation: [src/css/property-descriptors/gap.ts](src/css/property-descriptors/gap.ts)

- **`inset`, `top`, `right`, `bottom`, `left`**: Position offsets for positioned elements
  - Default: `auto`
  - `inset` is shorthand for all four sides (follows same pattern as margin/padding)
  - Used with `position: relative`, `absolute`, `fixed`, or `sticky`
  - Accepts: length values, percentages, `auto`
  - Implementation: [src/css/property-descriptors/inset.ts](src/css/property-descriptors/inset.ts)

- **`rotate`, `scale`, `translate`**: Individual transform properties
  - Modern alternative to the `transform` shorthand property
  - `rotate`: Accepts angle values (deg, grad, rad, turn), default `none`
  - `scale`: Accepts numbers (1 value = uniform, 2 values = x/y), default `none`
  - `translate`: Accepts length/percentage (1 value = x, 2 values = x/y), default `none`
  - Can be combined: all three properties work together independently
  - Implementations: [rotate.ts](src/css/property-descriptors/rotate.ts), [scale.ts](src/css/property-descriptors/scale.ts), [translate.ts](src/css/property-descriptors/translate.ts)

- **`mix-blend-mode`**: Layer blending and compositing
  - Default: `normal`
  - Supports 16 blend modes: multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity
  - Implementation: [mix-blend-mode.ts](src/css/property-descriptors/mix-blend-mode.ts)

- **`accent-color`**: Form control theming
  - Default: `auto` (browser default)
  - Accepts any valid color value
  - Implementation: [accent-color.ts](src/css/property-descriptors/accent-color.ts)

- **`backdrop-filter`**: Background effects
  - Default: `none`
  - Supports filter functions: blur(), brightness(), contrast(), grayscale(), etc.
  - Implementation: [backdrop-filter.ts](src/css/property-descriptors/backdrop-filter.ts)

- **`object-view-box`**: Advanced replaced element cropping
  - Default: `none`
  - Accepts: inset(), rect(), xywh() functions
  - Implementation: [object-view-box.ts](src/css/property-descriptors/object-view-box.ts)

- **`scroll-snap-type`, `scroll-snap-align`**: Scroll snapping
  - `scroll-snap-type`: Controls snap enforcement (none, x, y, both, block, inline)
  - `scroll-snap-align`: Snap position alignment (none, start, end, center)
  - Implementation: [scroll-snap.ts](src/css/property-descriptors/scroll-snap.ts)

- **Modern Color Functions**: Complete CSS Color Module Level 4 support
  - **`oklch()`**: Perceptually uniform cylindrical color space (Oklab-based)
    - Parameters: lightness (0-1 or %), chroma (0+), hue (0-360deg), alpha (optional)
    - Example: `oklch(0.21 0.034 264.665)` (dark blue-gray)
    - Best for perceptually uniform gradients and color manipulation

  - **`oklab()`**: Perceptually uniform rectangular color space
    - Parameters: lightness (0-1 or %), a (-0.4 to 0.4), b (-0.4 to 0.4), alpha (optional)
    - Example: `oklab(0.5 0.1 -0.1)` (purple)
    - Direct rectangular coordinates in Oklab space

  - **`lch()`**: CIE LCH cylindrical color space (LAB-based)
    - Parameters: lightness (0-100 or %), chroma (0+), hue (0-360deg), alpha (optional)
    - Example: `lch(50 50 180)` (cyan)
    - Industry-standard perceptual color space

  - **`lab()`**: CIE LAB rectangular color space
    - Parameters: lightness (0-100 or %), a (-125 to 125), b (-125 to 125), alpha (optional)
    - Example: `lab(50 40 -20)` (cyan-green)
    - Direct LAB coordinates for precise color specification

  - **`hwb()`**: Hue, Whiteness, Blackness color model
    - Parameters: hue (0-360deg), whiteness (0-100%), blackness (0-100%), alpha (optional)
    - Example: `hwb(194 0% 0%)` (cyan)
    - Intuitive color model based on paint mixing

  - **`color()`**: Generic color space function
    - Supported spaces: `srgb`, `srgb-linear`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`
    - Parameters: colorspace c1 c2 c3 [/ alpha]
    - Examples: `color(srgb 1 0 0)`, `color(display-p3 1 0.5 0)`
    - Allows explicit color space specification for wide-gamut displays

  - Implementation: [src/css/types/color.ts](src/css/types/color.ts)
  - Test page: [tests/visual-suite/modern/all-color-functions.html](tests/visual-suite/modern/all-color-functions.html)
  - Unit tests: 32 tests covering all color functions with alpha, percentages, and edge cases
  - Note: All colors converted to sRGB for canvas rendering with proper gamma correction and clamping

- **`border-image-*`**: Border image properties (PARTIAL IMPLEMENTATION)
  - `border-image-source`: Image/gradient source for borders
  - `border-image-slice`: 9-slice grid subdivision
  - `border-image-width`: Border image dimensions
  - `border-image-outset`: Border extension beyond border box
  - `border-image-repeat`: Tiling behavior (stretch/repeat/round/space)
  - Implementation: [border-image-*.ts](src/css/property-descriptors/)
  - **✅ SUPPORTED**: Linear gradients with all angles
  - **❌ NOT IMPLEMENTED**: Radial gradients, conic gradients, image sources (url)
  - **⚠️ PARTIAL**: border-image-slice, border-image-repeat (parsed but not used in rendering)

### Implementation Details
The rendering logic in [canvas-renderer.ts:276-429](src/render/canvas/canvas-renderer.ts#L276-L429) handles:
- Aspect ratio preservation for contain/cover
- Custom positioning via object-position
- Source clipping for cover mode to avoid rendering outside container
- Scale-down logic (smaller of 'none' or 'contain')

The border-image rendering in [canvas-renderer.ts:1154-1241](src/render/canvas/canvas-renderer.ts#L1154-L1241) handles:
- Linear gradient borders with proper angle calculation
- Per-side gradient clipping
- All border widths (uniform and asymmetric)
- Integration with existing border rendering pipeline

## Important Notes

- **Cross-Origin Resources**: Images/fonts from different origins require proxy or CORS configuration
- **Rendering Accuracy**: Not 100% pixel-perfect due to DOM-based approach vs real screenshots
- **Experimental Status**: Project still marked experimental; breaking changes may occur
- **Performance**: Large DOMs and complex CSS can impact rendering performance
- **Same-Origin Policy**: Cannot circumvent browser security restrictions
