import {ElementContainer, FLAGS} from '../dom/element-container';
import {contains} from '../core/bitwise';
import {BoundCurves, calculateBorderBoxPath, calculatePaddingBoxPath} from './bound-curves';
import {ClipEffect, EffectTarget, IElementEffect, isClipEffect, OpacityEffect, TransformEffect} from './effects';
import {OVERFLOW} from '../css/property-descriptors/overflow';
import {equalPath} from './path';
import {DISPLAY} from '../css/property-descriptors/display';
import {OLElementContainer} from '../dom/elements/ol-element-container';
import {LIElementContainer} from '../dom/elements/li-element-container';
import {createCounterText} from '../css/types/functions/counter';
import {POSITION} from '../css/property-descriptors/position';
import {Matrix} from '../css/property-descriptors/transform';
import {getAbsoluteValue} from '../css/types/length-percentage';

/**
 * Multiply two 2D transformation matrices
 * Matrix format: [a, b, c, d, e, f] represents:
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 */
const multiplyMatrices = (m1: Matrix, m2: Matrix): Matrix => {
    return [
        m1[0] * m2[0] + m1[2] * m2[1],           // a
        m1[1] * m2[0] + m1[3] * m2[1],           // b
        m1[0] * m2[2] + m1[2] * m2[3],           // c
        m1[1] * m2[2] + m1[3] * m2[3],           // d
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],   // e
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5]    // f
    ];
};

export class StackingContext {
    element: ElementPaint;
    negativeZIndex: StackingContext[];
    zeroOrAutoZIndexOrTransformedOrOpacity: StackingContext[];
    positiveZIndex: StackingContext[];
    nonPositionedFloats: StackingContext[];
    nonPositionedInlineLevel: StackingContext[];
    inlineLevel: ElementPaint[];
    nonInlineLevel: ElementPaint[];

    constructor(container: ElementPaint) {
        this.element = container;
        this.inlineLevel = [];
        this.nonInlineLevel = [];
        this.negativeZIndex = [];
        this.zeroOrAutoZIndexOrTransformedOrOpacity = [];
        this.positiveZIndex = [];
        this.nonPositionedFloats = [];
        this.nonPositionedInlineLevel = [];
    }
}

export class ElementPaint {
    readonly effects: IElementEffect[] = [];
    readonly curves: BoundCurves;
    listValue?: string;

    constructor(readonly container: ElementContainer, readonly parent: ElementPaint | null) {
        this.curves = new BoundCurves(this.container);
        if (this.container.styles.opacity < 1) {
            this.effects.push(new OpacityEffect(this.container.styles.opacity));
        }

        // Combine transform property with individual transform properties (rotate, scale, translate)
        // According to CSS Transforms Level 2, the order is: translate → rotate → scale → transform
        const hasTransform = this.container.styles.transform !== null;
        const hasRotate = this.container.styles.rotate !== null;
        const hasScale = this.container.styles.scale !== null;
        const hasTranslate = this.container.styles.translate !== null;

        if (hasTransform || hasRotate || hasScale || hasTranslate) {
            const offsetX = this.container.bounds.left + (this.container.styles.transformOrigin[0] as {number: number}).number;
            const offsetY = this.container.bounds.top + (this.container.styles.transformOrigin[1] as {number: number}).number;

            // Start with identity matrix
            let matrix: Matrix = [1, 0, 0, 1, 0, 0];

            // Apply translate
            if (hasTranslate) {
                const translateValue = this.container.styles.translate;
                if (translateValue) {
                    // For translate, we need to get the absolute pixel values
                    // Using container bounds width/height as the reference for percentages
                    const tx = getAbsoluteValue(translateValue.x, this.container.bounds.width);
                    const ty = getAbsoluteValue(translateValue.y, this.container.bounds.height);
                    matrix = multiplyMatrices(matrix, [1, 0, 0, 1, tx, ty]);
                }
            }

            // Apply rotate
            if (hasRotate) {
                const angle = this.container.styles.rotate;
                if (angle !== null) {
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    matrix = multiplyMatrices(matrix, [cos, sin, -sin, cos, 0, 0]);
                }
            }

            // Apply scale
            if (hasScale) {
                const scaleValue = this.container.styles.scale;
                if (scaleValue) {
                    matrix = multiplyMatrices(matrix, [scaleValue.x, 0, 0, scaleValue.y, 0, 0]);
                }
            }

            // Apply transform property last
            if (hasTransform && this.container.styles.transform !== null) {
                matrix = multiplyMatrices(matrix, this.container.styles.transform);
            }

            this.effects.push(new TransformEffect(offsetX, offsetY, matrix));
        }

        if (this.container.styles.overflowX !== OVERFLOW.VISIBLE) {
            const borderBox = calculateBorderBoxPath(this.curves);
            const paddingBox = calculatePaddingBoxPath(this.curves);

            // Overflow only clips child content, never the element's own background
            // So we only create ClipEffect with CONTENT target
            if (equalPath(borderBox, paddingBox)) {
                this.effects.push(new ClipEffect(borderBox, EffectTarget.CONTENT));
            } else {
                // Border box and padding box differ (element has padding)
                // Clip content to padding box
                this.effects.push(new ClipEffect(paddingBox, EffectTarget.CONTENT));
            }
        }
    }

    getEffects(target: EffectTarget): IElementEffect[] {
        let inFlow = [POSITION.ABSOLUTE, POSITION.FIXED].indexOf(this.container.styles.position) === -1;
        let parent = this.parent;
        const effects = this.effects.slice(0);
        while (parent) {
            const croplessEffects = parent.effects.filter((effect) => !isClipEffect(effect));
            if (inFlow || parent.container.styles.position !== POSITION.STATIC || !parent.parent) {
                effects.unshift(...croplessEffects);
                inFlow = [POSITION.ABSOLUTE, POSITION.FIXED].indexOf(parent.container.styles.position) === -1;
                if (parent.container.styles.overflowX !== OVERFLOW.VISIBLE) {
                    const borderBox = calculateBorderBoxPath(parent.curves);
                    const paddingBox = calculatePaddingBoxPath(parent.curves);
                    if (!equalPath(borderBox, paddingBox)) {
                        effects.unshift(
                            new ClipEffect(paddingBox, EffectTarget.BACKGROUND_BORDERS | EffectTarget.CONTENT)
                        );
                    }
                }
            } else {
                effects.unshift(...croplessEffects);
            }

            parent = parent.parent;
        }

        return effects.filter((effect) => contains(effect.target, target));
    }
}

const parseStackTree = (
    parent: ElementPaint,
    stackingContext: StackingContext,
    realStackingContext: StackingContext,
    listItems: ElementPaint[]
) => {
    parent.container.elements.forEach((child) => {
        const treatAsRealStackingContext = contains(child.flags, FLAGS.CREATES_REAL_STACKING_CONTEXT);
        const createsStackingContext = contains(child.flags, FLAGS.CREATES_STACKING_CONTEXT);
        const paintContainer = new ElementPaint(child, parent);
        if (contains(child.styles.display, DISPLAY.LIST_ITEM)) {
            listItems.push(paintContainer);
        }

        const listOwnerItems = contains(child.flags, FLAGS.IS_LIST_OWNER) ? [] : listItems;

        if (treatAsRealStackingContext || createsStackingContext) {
            const parentStack =
                treatAsRealStackingContext || child.styles.isPositioned() ? realStackingContext : stackingContext;

            const stack = new StackingContext(paintContainer);

            if (child.styles.isPositioned() || child.styles.opacity < 1 || child.styles.isTransformed()) {
                const order = child.styles.zIndex.order;
                if (order < 0) {
                    let index = 0;

                    parentStack.negativeZIndex.some((current, i) => {
                        if (order > current.element.container.styles.zIndex.order) {
                            index = i;
                            return false;
                        } else if (index > 0) {
                            return true;
                        }

                        return false;
                    });
                    parentStack.negativeZIndex.splice(index, 0, stack);
                } else if (order > 0) {
                    let index = 0;
                    parentStack.positiveZIndex.some((current, i) => {
                        if (order >= current.element.container.styles.zIndex.order) {
                            index = i + 1;
                            return false;
                        } else if (index > 0) {
                            return true;
                        }

                        return false;
                    });
                    parentStack.positiveZIndex.splice(index, 0, stack);
                } else {
                    parentStack.zeroOrAutoZIndexOrTransformedOrOpacity.push(stack);
                }
            } else {
                if (child.styles.isFloating()) {
                    parentStack.nonPositionedFloats.push(stack);
                } else {
                    parentStack.nonPositionedInlineLevel.push(stack);
                }
            }

            parseStackTree(
                paintContainer,
                stack,
                treatAsRealStackingContext ? stack : realStackingContext,
                listOwnerItems
            );
        } else {
            // inline-block, inline-flex, inline-grid create block formatting contexts
            // and must paint in block phase (parent before children) not inline phase
            // Only pure inline elements (like <span>) paint in inline phase
            if (child.styles.isPaintedAsInline()) {
                stackingContext.inlineLevel.push(paintContainer);
            } else {
                stackingContext.nonInlineLevel.push(paintContainer);
            }

            parseStackTree(paintContainer, stackingContext, realStackingContext, listOwnerItems);
        }

        if (contains(child.flags, FLAGS.IS_LIST_OWNER)) {
            processListItems(child, listOwnerItems);
        }
    });
};

const processListItems = (owner: ElementContainer, elements: ElementPaint[]) => {
    let numbering = owner instanceof OLElementContainer ? owner.start : 1;
    const reversed = owner instanceof OLElementContainer ? owner.reversed : false;
    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];
        if (
            item.container instanceof LIElementContainer &&
            typeof item.container.value === 'number' &&
            item.container.value !== 0
        ) {
            numbering = item.container.value;
        }

        item.listValue = createCounterText(numbering, item.container.styles.listStyleType, true);

        numbering += reversed ? -1 : 1;
    }
};

export const parseStackingContexts = (container: ElementContainer): StackingContext => {
    const paintContainer = new ElementPaint(container, null);
    const root = new StackingContext(paintContainer);
    const listItems: ElementPaint[] = [];
    parseStackTree(paintContainer, root, root, listItems);
    processListItems(paintContainer.container, listItems);
    return root;
};
