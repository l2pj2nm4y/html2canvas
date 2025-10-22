# html2canvas v2.0 - Rendering Implementation Plan

## Discovery: What's Already Done! 🎉

### ✅ ALREADY IMPLEMENTED
**object-fit** and **object-position** are FULLY implemented in the canvas renderer!
- Location: `src/render/canvas/canvas-renderer.ts:276-425`
- Function: `renderReplacedElement()` and `calculateObjectFitLayout()`
- Supports all 5 values: fill, contain, cover, none, scale-down
- Object-position is fully functional with length/percentage values

**This means 2 of our 20 properties already work!**

---

## Implementation Plan by Priority

### Phase 1: Easy Wins (1-3 days)
Properties that require minimal code changes.

#### 1. mix-blend-mode ⚡ EASY
**Complexity**: Low
**Estimated Time**: 2-3 hours
**Location**: `src/render/canvas/canvas-renderer.ts`

**Implementation**:
```typescript
// In renderStackingContext() before rendering element
if (container.styles.mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
    this.ctx.globalCompositeOperation = mapBlendMode(container.styles.mixBlendMode);
}
// After rendering
this.ctx.globalCompositeOperation = 'source-over'; // Reset
```

**Blend Mode Mapping**:
- NORMAL → 'source-over'
- MULTIPLY → 'multiply'
- SCREEN → 'screen'
- OVERLAY → 'overlay'
- DARKEN → 'darken'
- LIGHTEN → 'lighten'
- COLOR_DODGE → 'color-dodge'
- COLOR_BURN → 'color-burn'
- HARD_LIGHT → 'hard-light'
- SOFT_LIGHT → 'soft-light'
- DIFFERENCE → 'difference'
- EXCLUSION → 'exclusion'
- HUE → 'hue'
- SATURATION → 'saturation'
- COLOR → 'color'
- LUMINOSITY → 'luminosity'

**Files to Modify**:
- `src/render/canvas/canvas-renderer.ts` - Add blend mode application

---

#### 2. accent-color ⚡ EASY
**Complexity**: Low
**Estimated Time**: 2-3 hours
**Location**: Form element rendering functions

**Implementation**:
For checkboxes and radio buttons, use accent-color when drawing:
```typescript
if (container.styles.accentColor) {
    this.ctx.fillStyle = asString(container.styles.accentColor);
}
```

**Files to Modify**:
- `src/render/canvas/canvas-renderer.ts:536-599` - Checkbox/radio rendering

---

### Phase 2: Transform Properties (3-5 days)
Individual transform properties that need integration with existing transform system.

#### 3. rotate, scale, translate 🔄 MEDIUM
**Complexity**: Medium
**Estimated Time**: 1-2 days each
**Location**: Transform effects system

**Current State**:
- Existing `transform` property uses matrix
- Effects system handles transforms: `src/render/effects.ts`

**Implementation Strategy**:
1. Create new transform effect types for individual properties
2. Combine with existing transform matrix
3. Apply in correct order: translate → rotate → scale

**Files to Modify**:
- `src/render/effects.ts` - Add new effect types
- `src/dom/element-container.ts` - Build transform from individual properties
- `src/render/canvas/canvas-renderer.ts` - Apply transforms

**Transform Order** (CSS spec):
```
translate → rotate → scale → existing transform matrix
```

---

### Phase 3: Layout Properties (5-10 days)
Properties that affect layout calculation.

#### 4. aspect-ratio 📐 MEDIUM-HARD
**Complexity**: Medium-High
**Estimated Time**: 2-3 days
**Location**: Layout calculation system

**Implementation**:
- Modify layout calculation to respect aspect ratio constraints
- Apply before final size calculation
- Interact with width/height properties

**Files to Modify**:
- `src/css/layout/bounds.ts` - Layout calculation
- `src/dom/element-container.ts` - Size calculation with aspect ratio

---

#### 5. gap, row-gap, column-gap 📏 HARD
**Complexity**: High
**Estimated Time**: 5-7 days
**Location**: Flexbox/Grid layout engines

**Current State**:
- Need to verify if flexbox/grid layout engines exist
- If not, partial implementation for basic cases only

**Implementation Strategy**:
1. Locate existing flexbox/grid layout code
2. Add gap spacing to layout calculations
3. Adjust child positioning to account for gaps

**Files to Modify**:
- TBD - Need to locate flex/grid layout code
- Likely in `src/css/layout/` directory

---

### Phase 4: Information-Only Properties (No Rendering)
These properties don't affect visual rendering.

#### 6. scroll-snap-type, scroll-snap-align ℹ️ NO RENDERING NEEDED
**Complexity**: N/A
**Estimated Time**: 0 hours
**Reason**: These properties control scroll behavior, not visual appearance

---

#### 7. inset 📍 ALREADY HANDLED
**Complexity**: N/A
**Estimated Time**: 0 hours
**Reason**: Browser expands to top/right/bottom/left which are already supported

---

### Phase 5: Advanced Features (7-15 days)
Complex properties requiring significant new code.

#### 8. backdrop-filter 🌫️ VERY HARD
**Complexity**: Very High
**Estimated Time**: 7-10 days
**Location**: New filter effects pipeline

**Challenges**:
- Requires implementing entire CSS filter pipeline
- blur(), brightness(), contrast(), etc.
- Apply to content BEHIND element (not the element itself)
- Performance intensive

**Implementation Strategy**:
1. Render everything behind element to temporary canvas
2. Apply filters to temporary canvas
3. Composite filtered result
4. Render element on top

**Recommendation**:
- Consider using CSS filters on a temporary canvas
- Or use StackBlur library for blur effect
- **Defer this property** - very complex, low priority

**Files to Create**:
- `src/render/filters.ts` - Filter effects implementation
- `src/render/canvas/backdrop-renderer.ts` - Backdrop-specific rendering

---

#### 9. object-view-box 🔍 HARD
**Complexity**: High
**Estimated Time**: 3-5 days
**Location**: Image rendering system

**Implementation**:
- Parse inset() function to get crop values
- Modify source rectangle calculation in renderReplacedElement
- Apply viewport transformation

**Files to Modify**:
- `src/render/canvas/canvas-renderer.ts:318-425` - Modify calculateObjectFitLayout
- `src/css/property-descriptors/object-view-box.ts` - Parse inset() function properly

---

## Implementation Order (Recommended)

### Week 1: Quick Wins
1. **Day 1-2**: mix-blend-mode ✅
2. **Day 2-3**: accent-color ✅
3. **Day 3-5**: Test and verify basic rendering

### Week 2: Transforms
4. **Day 1-2**: translate property
5. **Day 3**: rotate property
6. **Day 4**: scale property
7. **Day 5**: Test transform combinations

### Week 3: Layout
8. **Day 1-3**: aspect-ratio implementation
9. **Day 4-5**: gap properties (basic support)

### Week 4: Advanced (Optional)
10. **Day 1-3**: object-view-box
11. **Day 4-5**: Testing and bug fixes

### Deferred for Later
- **backdrop-filter**: Too complex, defer indefinitely
- Gap properties advanced scenarios (grid)

---

## Summary Table

| Property | Status | Complexity | Est. Time | Priority |
|----------|--------|------------|-----------|----------|
| object-fit | ✅ Done | - | 0h | - |
| object-position | ✅ Done | - | 0h | - |
| mix-blend-mode | ✅ Done | Low | 2-3h | High |
| accent-color | ✅ Done | Low | 2-3h | High |
| rotate | ✅ Done | Low | 2h | High |
| scale | ✅ Works Automatically | - | 0h | - |
| translate | ✅ Works Automatically | - | 0h | - |
| aspect-ratio | ✅ Works Automatically | - | 0h | - |
| gap | ✅ Works Automatically | - | 0h | - |
| row-gap | ✅ Works Automatically | - | 0h | - |
| column-gap | ✅ Works Automatically | - | 0h | - |
| scroll-snap-type | ✅ Done | - | 0h | - |
| scroll-snap-align | ✅ Done | - | 0h | - |
| inset | ✅ Done | - | 0h | - |
| object-view-box | 📋 Planned | High | 24-40h | Low |
| backdrop-filter | ⏸️ Deferred | Very High | 56-80h | Very Low |

**Total Estimated Effort**:
- **High Priority** (mix-blend, accent, transforms): 26-35 hours (3-4 days)
- **Medium Priority** (aspect-ratio, gap): 56-64 hours (7-8 days)
- **Low Priority** (object-view-box): 24-40 hours (3-5 days)
- **Deferred** (backdrop-filter): 56-80 hours (7-10 days)

**Realistic Timeline**: 2-3 weeks for high + medium priority items

---

## Implementation Progress

### ✅ Completed (5 properties)
1. ✅ **mix-blend-mode** - Implemented in [canvas-renderer.ts:138-152](src/render/canvas/canvas-renderer.ts#L138-L152)
   - Added `getCompositeOperation()` mapping function
   - Applied blend mode using `globalCompositeOperation`
   - Verified working in demo

2. ✅ **accent-color** - Implemented in [canvas-renderer.ts:499-565](src/render/canvas/canvas-renderer.ts#L499-L565)
   - Modified checkbox/radio rendering
   - Draw full control background with accent color
   - White foreground (checkmark/dot)
   - Verified matching HTML original

3. ✅ **translate** - Works automatically via getBoundingClientRect()
   - Browser applies translation during layout
   - getBoundingClientRect() returns translated position
   - No canvas code needed - verified working

4. ✅ **rotate** - Implemented in [canvas-renderer.ts:159-184](src/render/canvas/canvas-renderer.ts#L159-L184)
   - getBoundingClientRect() returns bounding box size (larger than original)
   - Canvas rotation applied around element center in renderNode()
   - Required because content needs visual rotation, not just bounding box

5. ✅ **scale** - Works automatically via getBoundingClientRect()
   - Browser applies scaling during layout
   - getBoundingClientRect() returns scaled dimensions
   - No canvas code needed - verified working

### ✅ Layout Properties - Work Automatically!
**Important Discovery**: aspect-ratio and gap properties work automatically because html2canvas uses `getBoundingClientRect()` which returns the browser's final computed layout. No additional implementation needed!

- ✅ aspect-ratio: Browser calculates, html2canvas captures
- ✅ gap: Browser calculates spacing, html2canvas captures positions
- ✅ row-gap, column-gap: Same as gap

**Verified**: Visual testing confirms perfect match between HTML and canvas output.

### ⏸️ Deferred
- object-view-box (24-40h) - Low priority
- backdrop-filter (56-80h) - Very complex, very low priority

## Next Steps

1. ✅ Verify object-fit/object-position work correctly
2. ✅ Implement mix-blend-mode
3. ✅ Implement accent-color
4. ✅ Implement transform properties (translate, rotate, scale)
5. 🎯 **NEXT**: Tackle aspect-ratio and gap (requires layout system changes)
6. 📊 Create visual regression tests
7. ⏸️ Defer backdrop-filter and object-view-box
