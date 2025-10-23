import {ElementPaint, parseStackingContexts, StackingContext} from '../stacking-context';
import {asString, Color, isTransparent} from '../../css/types/color';
import {ElementContainer, FLAGS} from '../../dom/element-container';
import {BORDER_STYLE} from '../../css/property-descriptors/border-style';
import {CSSParsedDeclaration} from '../../css';
import {TextContainer} from '../../dom/text-container';
import {Path, transformPath} from '../path';
import {BACKGROUND_CLIP} from '../../css/property-descriptors/background-clip';
import {BoundCurves, calculateBorderBoxPath, calculateContentBoxPath, calculatePaddingBoxPath} from '../bound-curves';
import {BezierCurve, isBezierCurve} from '../bezier-curve';
import {Vector} from '../vector';
import {CSSImageType, CSSURLImage, isLinearGradient, isRadialGradient} from '../../css/types/image';
import {
    parsePathForBorder,
    parsePathForBorderDoubleInner,
    parsePathForBorderDoubleOuter,
    parsePathForBorderRidgeInner,
    parsePathForBorderRidgeOuter,
    parsePathForBorderStroke
} from '../border';
import {calculateBackgroundRendering, getBackgroundValueForIndex} from '../background';
import {CSSValue, isDimensionToken} from '../../css/syntax/parser';
import {segmentGraphemes, TextBounds} from '../../css/layout/text';
import {ImageElementContainer} from '../../dom/replaced-elements/image-element-container';
import {contentBox} from '../box-sizing';
import {CanvasElementContainer} from '../../dom/replaced-elements/canvas-element-container';
import {SVGElementContainer} from '../../dom/replaced-elements/svg-element-container';
import {ReplacedElementContainer} from '../../dom/replaced-elements';
import {EffectTarget, IElementEffect, isClipEffect, isOpacityEffect, isTransformEffect} from '../effects';
import {contains} from '../../core/bitwise';
import {calculateGradientDirection, calculateRadius, processColorStops} from '../../css/types/functions/gradient';
import {FIFTY_PERCENT, getAbsoluteValue, LengthPercentage} from '../../css/types/length-percentage';
import {TEXT_DECORATION_LINE} from '../../css/property-descriptors/text-decoration-line';
import {TEXT_DECORATION_STYLE} from '../../css/property-descriptors/text-decoration-style';
import {FontMetrics} from '../font-metrics';
import {DISPLAY} from '../../css/property-descriptors/display';
import {Bounds} from '../../css/layout/bounds';
import {LIST_STYLE_TYPE} from '../../css/property-descriptors/list-style-type';
import {computeLineHeight} from '../../css/property-descriptors/line-height';
import {CHECKBOX, InputElementContainer, RADIO} from '../../dom/replaced-elements/input-element-container';
import {TEXT_ALIGN} from '../../css/property-descriptors/text-align';
import {TextareaElementContainer} from '../../dom/elements/textarea-element-container';
import {SelectElementContainer} from '../../dom/elements/select-element-container';
import {IFrameElementContainer} from '../../dom/replaced-elements/iframe-element-container';
import {TextShadow} from '../../css/property-descriptors/text-shadow';
import {PAINT_ORDER_LAYER} from '../../css/property-descriptors/paint-order';
import {Renderer} from '../renderer';
import {Context} from '../../core/context';
import {DIRECTION} from '../../css/property-descriptors/direction';
import {OBJECT_FIT} from '../../css/property-descriptors/object-fit';
import {MIX_BLEND_MODE, getCompositeOperation} from '../../css/property-descriptors/mix-blend-mode';
import {Filter, FILTER_TYPE} from '../../css/property-descriptors/filter';

export type RenderConfigurations = RenderOptions & {
    backgroundColor: Color | null;
};

export interface RenderOptions {
    scale: number;
    canvas?: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
}

const MASK_OFFSET = 10000;

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class CanvasRenderer extends Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    private readonly _activeEffects: IElementEffect[] = [];
    private readonly fontMetrics: FontMetrics;

    constructor(context: Context, options: RenderConfigurations) {
        super(context, options);
        this.canvas = options.canvas ? options.canvas : document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        if (!options.canvas) {
            this.canvas.width = Math.floor(options.width * options.scale);
            this.canvas.height = Math.floor(options.height * options.scale);
            this.canvas.style.width = `${options.width}px`;
            this.canvas.style.height = `${options.height}px`;
        }
        this.fontMetrics = new FontMetrics(document);
        this.ctx.scale(this.options.scale, this.options.scale);
        this.ctx.translate(-options.x, -options.y);
        this.ctx.textBaseline = 'bottom';
        this._activeEffects = [];
        this.context.logger.debug(
            `Canvas renderer initialized (${options.width}x${options.height}) with scale ${options.scale}`
        );
    }

    applyEffects(effects: IElementEffect[]): void {
        while (this._activeEffects.length) {
            this.popEffect();
        }

        effects.forEach((effect) => this.applyEffect(effect));
    }

    applyEffect(effect: IElementEffect): void {
        this.ctx.save();
        if (isOpacityEffect(effect)) {
            this.ctx.globalAlpha = effect.opacity;
        }

        if (isTransformEffect(effect)) {
            this.ctx.translate(effect.offsetX, effect.offsetY);
            this.ctx.transform(
                effect.matrix[0],
                effect.matrix[1],
                effect.matrix[2],
                effect.matrix[3],
                effect.matrix[4],
                effect.matrix[5]
            );
            this.ctx.translate(-effect.offsetX, -effect.offsetY);
        }

        if (isClipEffect(effect)) {
            this.path(effect.path);
            this.ctx.clip();
        }

        this._activeEffects.push(effect);
    }

    popEffect(): void {
        this._activeEffects.pop();
        this.ctx.restore();
    }

    async renderStack(stack: StackingContext): Promise<void> {
        const styles = stack.element.container.styles;
        if (styles.isVisible()) {
            // Apply mix-blend-mode if not normal
            const previousCompositeOperation = this.ctx.globalCompositeOperation;
            if (styles.mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
                this.ctx.globalCompositeOperation = getCompositeOperation(styles.mixBlendMode);
            }

            await this.renderStackContent(stack);

            // Restore previous composite operation
            this.ctx.globalCompositeOperation = previousCompositeOperation;
        }
    }

    async renderNode(paint: ElementPaint): Promise<void> {
        if (contains(paint.container.flags, FLAGS.DEBUG_RENDER)) {
            debugger;
        }

        if (paint.container.styles.isVisible()) {
            // Handle CSS filters and transforms
            const rotateValue = paint.container.styles.rotate;
            const filters = paint.container.styles.filter;
            const hasFilters = filters.length > 0;
            const hasTransform = rotateValue !== null;

            // If we have filters, render to offscreen canvas first
            if (hasFilters) {
                const bounds = paint.container.bounds;
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = Math.ceil(bounds.width);
                offscreenCanvas.height = Math.ceil(bounds.height);
                const offscreenCtx = offscreenCanvas.getContext('2d');

                if (offscreenCtx) {
                    // Save current context state
                    const savedCtx = this.ctx;
                    this.ctx = offscreenCtx;

                    // Translate to draw at 0,0 on offscreen canvas
                    this.ctx.translate(-bounds.left, -bounds.top);

                    // Handle rotate transform on offscreen canvas if needed
                    if (rotateValue !== null) {
                        this.ctx.save();
                        const centerX = bounds.left + bounds.width / 2;
                        const centerY = bounds.top + bounds.height / 2;
                        this.ctx.translate(centerX, centerY);
                        this.ctx.rotate(rotateValue);
                        this.ctx.translate(-centerX, -centerY);
                    }

                    // Render to offscreen canvas
                    await this.renderNodeBackgroundAndBorders(paint);
                    await this.renderNodeContent(paint);

                    if (rotateValue !== null) {
                        this.ctx.restore();
                    }

                    // Restore original context
                    this.ctx = savedCtx;

                    // Apply filter and draw offscreen canvas to main canvas
                    this.ctx.save();
                    this.ctx.filter = filterToCanvasFilter(filters);
                    this.ctx.drawImage(offscreenCanvas, bounds.left, bounds.top);
                    this.ctx.restore();
                }
            } else {
                // No filters - render normally with optional rotate
                if (hasTransform && rotateValue !== null) {
                    this.ctx.save();
                    const centerX = paint.container.bounds.left + paint.container.bounds.width / 2;
                    const centerY = paint.container.bounds.top + paint.container.bounds.height / 2;
                    this.ctx.translate(centerX, centerY);
                    this.ctx.rotate(rotateValue);
                    this.ctx.translate(-centerX, -centerY);
                }

                await this.renderNodeBackgroundAndBorders(paint);
                await this.renderNodeContent(paint);

                if (hasTransform && rotateValue !== null) {
                    this.ctx.restore();
                }
            }
        }
    }

    /**
     * Draws a styled text decoration line (underline, overline, line-through)
     * Supports solid, double, dotted, dashed, and wavy styles
     */
    private drawDecorationLine(
        x: number,
        y: number,
        width: number,
        style: TEXT_DECORATION_STYLE,
        thickness: number
    ): void {
        const lineHeight = Math.max(1, Math.round(thickness));

        switch (style) {
            case TEXT_DECORATION_STYLE.SOLID:
                // Standard solid line
                this.ctx.fillRect(x, Math.round(y), width, lineHeight);
                break;

            case TEXT_DECORATION_STYLE.DOUBLE:
                // Two parallel lines with spacing proportional to thickness
                const doubleSpacing = Math.max(2, lineHeight + 1);
                this.ctx.fillRect(x, Math.round(y), width, lineHeight);
                this.ctx.fillRect(x, Math.round(y + doubleSpacing), width, lineHeight);
                break;

            case TEXT_DECORATION_STYLE.DOTTED:
                // Dotted line using small filled circles, scaled by thickness
                this.ctx.save();
                this.ctx.beginPath();
                const dotRadius = lineHeight / 2;
                const dotSpacing = Math.max(3, lineHeight * 2);
                for (let i = x; i < x + width; i += dotSpacing) {
                    this.ctx.arc(i, Math.round(y) + dotRadius, dotRadius, 0, Math.PI * 2);
                }
                this.ctx.fill();
                this.ctx.restore();
                break;

            case TEXT_DECORATION_STYLE.DASHED:
                // Dashed line using canvas dash pattern, scaled by thickness
                this.ctx.save();
                const dashLength = Math.max(4, lineHeight * 3);
                const gapLength = Math.max(3, lineHeight * 2);
                this.ctx.setLineDash([dashLength, gapLength]);
                this.ctx.lineWidth = lineHeight;
                this.ctx.beginPath();
                this.ctx.moveTo(x, Math.round(y) + lineHeight / 2);
                this.ctx.lineTo(x + width, Math.round(y) + lineHeight / 2);
                this.ctx.stroke();
                this.ctx.restore();
                break;

            case TEXT_DECORATION_STYLE.WAVY:
                // Wavy line using quadratic curves, scaled by thickness
                this.ctx.save();
                this.ctx.lineWidth = lineHeight;
                this.ctx.beginPath();
                const waveHeight = Math.max(1.5, lineHeight);
                const waveLength = Math.max(6, lineHeight * 4);
                let currentX = x;

                this.ctx.moveTo(currentX, Math.round(y) + lineHeight / 2);

                while (currentX < x + width) {
                    const nextX = Math.min(currentX + waveLength / 2, x + width);
                    this.ctx.quadraticCurveTo(
                        currentX + waveLength / 4,
                        Math.round(y) + lineHeight / 2 - waveHeight,
                        nextX,
                        Math.round(y) + lineHeight / 2
                    );
                    currentX = nextX;

                    if (currentX < x + width) {
                        const nextX2 = Math.min(currentX + waveLength / 2, x + width);
                        this.ctx.quadraticCurveTo(
                            currentX + waveLength / 4,
                            Math.round(y) + lineHeight / 2 + waveHeight,
                            nextX2,
                            Math.round(y) + lineHeight / 2
                        );
                        currentX = nextX2;
                    }
                }

                this.ctx.stroke();
                this.ctx.restore();
                break;
        }
    }

    renderTextWithLetterSpacing(text: TextBounds, letterSpacing: number, baseline: number): void {
        if (letterSpacing === 0) {
            this.ctx.fillText(text.text, text.bounds.left, text.bounds.top + baseline);
        } else {
            const letters = segmentGraphemes(text.text);
            letters.reduce((left, letter) => {
                this.ctx.fillText(letter, left, text.bounds.top + baseline);

                return left + this.ctx.measureText(letter).width;
            }, text.bounds.left);
        }
    }

    private createFontStyle(styles: CSSParsedDeclaration): string[] {
        const fontVariant = styles.fontVariant
            .filter((variant) => variant === 'normal' || variant === 'small-caps')
            .join('');
        const fontFamily = fixIOSSystemFonts(styles.fontFamily).join(', ');
        const fontSize = isDimensionToken(styles.fontSize as CSSValue)
            ? `${(styles.fontSize as {number: number; unit: string}).number}${(styles.fontSize as {number: number; unit: string}).unit}`
            : `${(styles.fontSize as {number: number}).number}px`;

        return [
            [styles.fontStyle, fontVariant, styles.fontWeight, fontSize, fontFamily].join(' '),
            fontFamily,
            fontSize
        ];
    }

    async renderTextNode(text: TextContainer, styles: CSSParsedDeclaration): Promise<void> {
        const [font, fontFamily, fontSize] = this.createFontStyle(styles);

        this.ctx.font = font;

        this.ctx.direction = styles.direction === DIRECTION.RTL ? 'rtl' : 'ltr';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
        const {baseline, middle} = this.fontMetrics.getMetrics(fontFamily, fontSize);
        const paintOrder = styles.paintOrder;

        text.textBounds.forEach((text) => {
            paintOrder.forEach((paintOrderLayer) => {
                switch (paintOrderLayer) {
                    case PAINT_ORDER_LAYER.FILL:
                        // Use webkitTextFillColor if set, otherwise fallback to color
                        this.ctx.fillStyle = asString(styles.webkitTextFillColor);
                        this.renderTextWithLetterSpacing(text, styles.letterSpacing, baseline);
                        const textShadows: TextShadow = styles.textShadow;

                        if (textShadows.length && text.text.trim().length) {
                            textShadows
                                .slice(0)
                                .reverse()
                                .forEach((textShadow) => {
                                    this.ctx.shadowColor = asString(textShadow.color);
                                    this.ctx.shadowOffsetX = textShadow.offsetX.number * this.options.scale;
                                    this.ctx.shadowOffsetY = textShadow.offsetY.number * this.options.scale;
                                    this.ctx.shadowBlur = textShadow.blur.number;

                                    this.renderTextWithLetterSpacing(text, styles.letterSpacing, baseline);
                                });

                            this.ctx.shadowColor = '';
                            this.ctx.shadowOffsetX = 0;
                            this.ctx.shadowOffsetY = 0;
                            this.ctx.shadowBlur = 0;
                        }

                        if (styles.textDecorationLine.length) {
                            this.ctx.fillStyle = asString(styles.textDecorationColor || styles.color);
                            this.ctx.strokeStyle = asString(styles.textDecorationColor || styles.color);

                            const decorationStyle = styles.textDecorationStyle;
                            // Calculate thickness from CSS value (default to 1px if 'auto')
                            const thickness = getAbsoluteValue(styles.textDecorationThickness, text.bounds.height);
                            const underlineOffset = 2; // Offset below baseline for underlines

                            styles.textDecorationLine.forEach((textDecorationLine) => {
                                switch (textDecorationLine) {
                                    case TEXT_DECORATION_LINE.UNDERLINE:
                                        // Underlines should be positioned slightly below the baseline
                                        // CSS spec: "at or under the alphabetic baseline"
                                        // Browsers typically render 1-2px below baseline to avoid descenders
                                        this.drawDecorationLine(
                                            text.bounds.left,
                                            text.bounds.top + baseline + underlineOffset,
                                            text.bounds.width,
                                            decorationStyle,
                                            thickness
                                        );
                                        break;

                                    case TEXT_DECORATION_LINE.OVERLINE:
                                        this.drawDecorationLine(
                                            text.bounds.left,
                                            text.bounds.top,
                                            text.bounds.width,
                                            decorationStyle,
                                            thickness
                                        );
                                        break;

                                    case TEXT_DECORATION_LINE.LINE_THROUGH:
                                        this.drawDecorationLine(
                                            text.bounds.left,
                                            text.bounds.top + middle,
                                            text.bounds.width,
                                            decorationStyle,
                                            thickness
                                        );
                                        break;
                                }
                            });
                        }
                        break;
                    case PAINT_ORDER_LAYER.STROKE:
                        if (styles.webkitTextStrokeWidth && text.text.trim().length) {
                            this.ctx.strokeStyle = asString(styles.webkitTextStrokeColor);
                            this.ctx.lineWidth = styles.webkitTextStrokeWidth;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            this.ctx.lineJoin = !!(window as any).chrome ? 'miter' : 'round';
                            this.ctx.strokeText(text.text, text.bounds.left, text.bounds.top + baseline);
                        }
                        this.ctx.strokeStyle = '';
                        this.ctx.lineWidth = 0;
                        this.ctx.lineJoin = 'miter';
                        break;
                }
            });
        });
    }

    renderReplacedElement(
        container: ReplacedElementContainer,
        curves: BoundCurves,
        image: HTMLImageElement | HTMLCanvasElement
    ): void {
        if (!image || container.intrinsicWidth <= 0 || container.intrinsicHeight <= 0) {
            return;
        }

        const box = contentBox(container);
        const objectFit = container.styles.objectFit;
        const objectPosition = container.styles.objectPosition;

        // Calculate source and destination rectangles based on object-fit
        const {sourceRect, destRect} = this.calculateObjectFitLayout(
            container.intrinsicWidth,
            container.intrinsicHeight,
            box,
            objectFit,
            objectPosition
        );

        const path = calculatePaddingBoxPath(curves);
        this.path(path);
        this.ctx.save();
        this.ctx.clip();

        this.ctx.drawImage(
            image,
            sourceRect.x,
            sourceRect.y,
            sourceRect.width,
            sourceRect.height,
            destRect.x,
            destRect.y,
            destRect.width,
            destRect.height
        );

        this.ctx.restore();
    }

    private calculateObjectFitLayout(
        intrinsicWidth: number,
        intrinsicHeight: number,
        box: Bounds,
        objectFit: OBJECT_FIT,
        objectPosition: LengthPercentage[]
    ): {sourceRect: Rectangle; destRect: Rectangle} {
        const containerAspect = box.width / box.height;
        const imageAspect = intrinsicWidth / intrinsicHeight;

        let destWidth = box.width;
        let destHeight = box.height;
        let destX = box.left;
        let destY = box.top;

        switch (objectFit) {
            case OBJECT_FIT.CONTAIN:
                // Scale to fit within container (preserve aspect ratio)
                if (imageAspect > containerAspect) {
                    // Image wider than container
                    destHeight = box.width / imageAspect;
                } else {
                    // Image taller than container
                    destWidth = box.height * imageAspect;
                }
                break;

            case OBJECT_FIT.COVER:
                // Scale to cover container (preserve aspect ratio, may crop)
                if (imageAspect > containerAspect) {
                    // Image wider than container
                    destWidth = box.height * imageAspect;
                } else {
                    // Image taller than container
                    destHeight = box.width / imageAspect;
                }
                break;

            case OBJECT_FIT.NONE:
                // Original size (no scaling)
                destWidth = intrinsicWidth;
                destHeight = intrinsicHeight;
                break;

            case OBJECT_FIT.SCALE_DOWN:
                // Smaller of 'none' or 'contain'
                if (intrinsicWidth <= box.width && intrinsicHeight <= box.height) {
                    // Image fits naturally - use 'none'
                    destWidth = intrinsicWidth;
                    destHeight = intrinsicHeight;
                } else {
                    // Image too large - use 'contain'
                    if (imageAspect > containerAspect) {
                        destHeight = box.width / imageAspect;
                        destWidth = box.width;
                    } else {
                        destWidth = box.height * imageAspect;
                        destHeight = box.height;
                    }
                }
                break;

            case OBJECT_FIT.FILL:
            default:
                // Stretch to fill (default behavior)
                // destWidth and destHeight already set to box dimensions
                break;
        }

        // Apply object-position
        const posX = objectPosition[0];
        const posY = objectPosition.length > 1 ? objectPosition[1] : objectPosition[0];
        const xOffset = getAbsoluteValue(posX, box.width - destWidth);
        const yOffset = getAbsoluteValue(posY, box.height - destHeight);
        destX += xOffset;
        destY += yOffset;

        // Calculate source rectangle
        // For most cases, we use the entire source image
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = intrinsicWidth;
        let sourceHeight = intrinsicHeight;

        // For 'cover', we may need to clip the source image to show only the visible portion
        if (objectFit === OBJECT_FIT.COVER) {
            const scaleX = destWidth / intrinsicWidth;
            const scaleY = destHeight / intrinsicHeight;

            // Calculate the portion of destination that's visible within the container
            const visibleLeft = Math.max(destX, box.left);
            const visibleTop = Math.max(destY, box.top);
            const visibleRight = Math.min(destX + destWidth, box.left + box.width);
            const visibleBottom = Math.min(destY + destHeight, box.top + box.height);

            // Convert visible destination area to source coordinates
            sourceX = (visibleLeft - destX) / scaleX;
            sourceY = (visibleTop - destY) / scaleY;
            sourceWidth = (visibleRight - visibleLeft) / scaleX;
            sourceHeight = (visibleBottom - visibleTop) / scaleY;

            // Adjust destination to match visible area
            destX = visibleLeft;
            destY = visibleTop;
            destWidth = visibleRight - visibleLeft;
            destHeight = visibleBottom - visibleTop;
        }

        return {
            sourceRect: {x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight},
            destRect: {x: destX, y: destY, width: destWidth, height: destHeight}
        };
    }

    async renderNodeContent(paint: ElementPaint): Promise<void> {
        this.applyEffects(paint.getEffects(EffectTarget.CONTENT));
        const container = paint.container;
        const curves = paint.curves;
        const styles = container.styles;
        for (const child of container.textNodes) {
            await this.renderTextNode(child, styles);
        }

        if (container instanceof ImageElementContainer) {
            try {
                const image = await this.context.cache.match(container.src);
                this.renderReplacedElement(container, curves, image);
            } catch (e) {
                this.context.logger.error(`Error loading image ${container.src}`);
            }
        }

        if (container instanceof CanvasElementContainer) {
            this.renderReplacedElement(container, curves, container.canvas);
        }

        if (container instanceof SVGElementContainer) {
            try {
                const image = await this.context.cache.match(container.svg);
                this.renderReplacedElement(container, curves, image);
            } catch (e) {
                this.context.logger.error(`Error loading svg ${container.svg.substring(0, 255)}`);
            }
        }

        if (container instanceof IFrameElementContainer && container.tree) {
            const iframeRenderer = new CanvasRenderer(this.context, {
                scale: this.options.scale,
                backgroundColor: container.backgroundColor,
                x: 0,
                y: 0,
                width: container.width,
                height: container.height
            });

            const canvas = await iframeRenderer.render(container.tree);
            if (container.width && container.height) {
                this.ctx.drawImage(
                    canvas,
                    0,
                    0,
                    container.width,
                    container.height,
                    container.bounds.left,
                    container.bounds.top,
                    container.bounds.width,
                    container.bounds.height
                );
            }
        }

        if (container instanceof InputElementContainer) {
            const size = Math.min(container.bounds.width, container.bounds.height);

            if (container.type === CHECKBOX) {
                if (container.checked) {
                    this.ctx.save();

                    // Draw white checkmark
                    // Background is already rendered via renderNodeBackgroundAndBorders
                    this.path([
                        new Vector(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79),
                        new Vector(container.bounds.left + size * 0.16, container.bounds.top + size * 0.5549),
                        new Vector(container.bounds.left + size * 0.27347, container.bounds.top + size * 0.44071),
                        new Vector(container.bounds.left + size * 0.39694, container.bounds.top + size * 0.5649),
                        new Vector(container.bounds.left + size * 0.72983, container.bounds.top + size * 0.23),
                        new Vector(container.bounds.left + size * 0.84, container.bounds.top + size * 0.34085),
                        new Vector(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79)
                    ]);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fill();
                    this.ctx.restore();
                }
            } else if (container.type === RADIO) {
                if (container.checked) {
                    this.ctx.save();

                    // Draw accent-colored dot in center
                    // Background (white) and border (accent color) already rendered via renderNodeBackgroundAndBorders
                    const accentColorValue = container.styles.accentColor !== null
                        ? container.styles.accentColor
                        : 0x2a2a2aff;

                    this.ctx.beginPath();
                    this.ctx.arc(
                        container.bounds.left + size / 2,
                        container.bounds.top + size / 2,
                        size / 4,
                        0,
                        Math.PI * 2,
                        true
                    );
                    this.ctx.fillStyle = asString(accentColorValue);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
        }

        if (isTextInputElement(container) && container.value.length) {
            const [fontFamily, fontSize] = this.createFontStyle(styles);
            const {baseline} = this.fontMetrics.getMetrics(fontFamily, fontSize);

            this.ctx.font = fontFamily;
            this.ctx.fillStyle = asString(styles.color);

            this.ctx.textBaseline = 'alphabetic';
            this.ctx.textAlign = canvasTextAlign(container.styles.textAlign);

            const bounds = contentBox(container);

            let x = 0;

            switch (container.styles.textAlign) {
                case TEXT_ALIGN.CENTER:
                    x += bounds.width / 2;
                    break;
                case TEXT_ALIGN.RIGHT:
                    x += bounds.width;
                    break;
            }

            const textBounds = bounds.add(x, 0, 0, -bounds.height / 2 + 1);

            this.ctx.save();
            this.path([
                new Vector(bounds.left, bounds.top),
                new Vector(bounds.left + bounds.width, bounds.top),
                new Vector(bounds.left + bounds.width, bounds.top + bounds.height),
                new Vector(bounds.left, bounds.top + bounds.height)
            ]);

            this.ctx.clip();
            this.renderTextWithLetterSpacing(
                new TextBounds(container.value, textBounds),
                styles.letterSpacing,
                baseline
            );
            this.ctx.restore();
            this.ctx.textBaseline = 'alphabetic';
            this.ctx.textAlign = 'left';
        }

        if (contains(container.styles.display, DISPLAY.LIST_ITEM)) {
            if (container.styles.listStyleImage !== null) {
                const img = container.styles.listStyleImage;
                if (img.type === CSSImageType.URL) {
                    let image;
                    const url = (img as CSSURLImage).url;
                    try {
                        image = await this.context.cache.match(url);
                        this.ctx.drawImage(image, container.bounds.left - (image.width + 10), container.bounds.top);
                    } catch (e) {
                        this.context.logger.error(`Error loading list-style-image ${url}`);
                    }
                }
            } else if (paint.listValue && container.styles.listStyleType !== LIST_STYLE_TYPE.NONE) {
                const [fontFamily] = this.createFontStyle(styles);

                this.ctx.font = fontFamily;
                this.ctx.fillStyle = asString(styles.color);

                this.ctx.textBaseline = 'middle';
                this.ctx.textAlign = 'right';
                const bounds = new Bounds(
                    container.bounds.left,
                    container.bounds.top + getAbsoluteValue(container.styles.paddingTop, container.bounds.width),
                    container.bounds.width,
                    computeLineHeight(styles.lineHeight, (styles.fontSize as {number: number}).number) / 2 + 1
                );

                this.renderTextWithLetterSpacing(
                    new TextBounds(paint.listValue, bounds),
                    styles.letterSpacing,
                    computeLineHeight(styles.lineHeight, (styles.fontSize as {number: number}).number) / 2 + 2
                );
                this.ctx.textBaseline = 'bottom';
                this.ctx.textAlign = 'left';
            }
        }
    }

    async renderStackContent(stack: StackingContext): Promise<void> {
        if (contains(stack.element.container.flags, FLAGS.DEBUG_RENDER)) {
            debugger;
        }
        // https://www.w3.org/TR/css-position-3/#painting-order
        // 1. the background and borders of the element forming the stacking context.
        await this.renderNodeBackgroundAndBorders(stack.element);
        // 2. the child stacking contexts with negative stack levels (most negative first).
        for (const child of stack.negativeZIndex) {
            await this.renderStack(child);
        }
        // 3. For all its in-flow, non-positioned, block-level descendants in tree order:
        await this.renderNodeContent(stack.element);

        for (const child of stack.nonInlineLevel) {
            await this.renderNode(child);
        }
        // 4. All non-positioned floating descendants, in tree order. For each one of these,
        // treat the element as if it created a new stacking context, but any positioned descendants and descendants
        // which actually create a new stacking context should be considered part of the parent stacking context,
        // not this new one.
        for (const child of stack.nonPositionedFloats) {
            await this.renderStack(child);
        }
        // 5. the in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks.
        for (const child of stack.nonPositionedInlineLevel) {
            await this.renderStack(child);
        }
        for (const child of stack.inlineLevel) {
            await this.renderNode(child);
        }
        // 6. All positioned, opacity or transform descendants, in tree order that fall into the following categories:
        //  All positioned descendants with 'z-index: auto' or 'z-index: 0', in tree order.
        //  For those with 'z-index: auto', treat the element as if it created a new stacking context,
        //  but any positioned descendants and descendants which actually create a new stacking context should be
        //  considered part of the parent stacking context, not this new one. For those with 'z-index: 0',
        //  treat the stacking context generated atomically.
        //
        //  All opacity descendants with opacity less than 1
        //
        //  All transform descendants with transform other than none
        for (const child of stack.zeroOrAutoZIndexOrTransformedOrOpacity) {
            await this.renderStack(child);
        }
        // 7. Stacking contexts formed by positioned descendants with z-indices greater than or equal to 1 in z-index
        // order (smallest first) then tree order.
        for (const child of stack.positiveZIndex) {
            await this.renderStack(child);
        }
    }

    mask(paths: Path[]): void {
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.lineTo(0, 0);
        this.formatPath(paths.slice(0).reverse());
        this.ctx.closePath();
    }

    path(paths: Path[]): void {
        this.ctx.beginPath();
        this.formatPath(paths);
        this.ctx.closePath();
    }

    formatPath(paths: Path[]): void {
        paths.forEach((point, index) => {
            const start: Vector = isBezierCurve(point) ? point.start : point;
            if (index === 0) {
                this.ctx.moveTo(start.x, start.y);
            } else {
                this.ctx.lineTo(start.x, start.y);
            }

            if (isBezierCurve(point)) {
                this.ctx.bezierCurveTo(
                    point.startControl.x,
                    point.startControl.y,
                    point.endControl.x,
                    point.endControl.y,
                    point.end.x,
                    point.end.y
                );
            }
        });
    }

    renderRepeat(path: Path[], pattern: CanvasPattern | CanvasGradient, offsetX: number, offsetY: number): void {
        this.path(path);
        this.ctx.fillStyle = pattern;
        this.ctx.translate(offsetX, offsetY);
        this.ctx.fill();
        this.ctx.translate(-offsetX, -offsetY);
    }

    resizeImage(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement | HTMLImageElement {
        if (image.width === width && image.height === height) {
            return image;
        }

        const ownerDocument = this.canvas.ownerDocument ?? document;
        const canvas = ownerDocument.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
        return canvas;
    }

    async renderBackgroundImage(container: ElementContainer): Promise<void> {
        let index = container.styles.backgroundImage.length - 1;
        for (const backgroundImage of container.styles.backgroundImage.slice(0).reverse()) {
            if (backgroundImage.type === CSSImageType.URL) {
                let image;
                const url = (backgroundImage as CSSURLImage).url;
                try {
                    image = await this.context.cache.match(url);
                } catch (e) {
                    this.context.logger.error(`Error loading background-image ${url}`);
                }

                if (image) {
                    const [path, x, y, width, height] = calculateBackgroundRendering(container, index, [
                        image.width,
                        image.height,
                        image.width / image.height
                    ]);
                    const pattern = this.ctx.createPattern(
                        this.resizeImage(image, width, height),
                        'repeat'
                    ) as CanvasPattern;
                    this.renderRepeat(path, pattern, x, y);
                }
            } else if (isLinearGradient(backgroundImage)) {
                const [path, x, y, width, height] = calculateBackgroundRendering(container, index, [null, null, null]);
                const [lineLength, x0, x1, y0, y1] = calculateGradientDirection(backgroundImage.angle, width, height);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

                processColorStops(backgroundImage.stops, lineLength).forEach((colorStop) =>
                    gradient.addColorStop(colorStop.stop, asString(colorStop.color))
                );

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                if (width > 0 && height > 0) {
                    const pattern = this.ctx.createPattern(canvas, 'repeat') as CanvasPattern;
                    this.renderRepeat(path, pattern, x, y);
                }
            } else if (isRadialGradient(backgroundImage)) {
                const [path, left, top, width, height] = calculateBackgroundRendering(container, index, [
                    null,
                    null,
                    null
                ]);
                const position = backgroundImage.position.length === 0 ? [FIFTY_PERCENT] : backgroundImage.position;
                const x = getAbsoluteValue(position[0], width);
                const y = getAbsoluteValue(position[position.length - 1], height);

                const [rx, ry] = calculateRadius(backgroundImage, x, y, width, height);
                if (rx > 0 && ry > 0) {
                    const radialGradient = this.ctx.createRadialGradient(left + x, top + y, 0, left + x, top + y, rx);

                    processColorStops(backgroundImage.stops, rx * 2).forEach((colorStop) =>
                        radialGradient.addColorStop(colorStop.stop, asString(colorStop.color))
                    );

                    this.path(path);
                    this.ctx.fillStyle = radialGradient;
                    if (rx !== ry) {
                        // transforms for elliptical radial gradient
                        const midX = container.bounds.left + 0.5 * container.bounds.width;
                        const midY = container.bounds.top + 0.5 * container.bounds.height;
                        const f = ry / rx;
                        const invF = 1 / f;

                        this.ctx.save();
                        this.ctx.translate(midX, midY);
                        this.ctx.transform(1, 0, 0, f, 0, 0);
                        this.ctx.translate(-midX, -midY);

                        this.ctx.fillRect(left, invF * (top - midY) + midY, width, height * invF);
                        this.ctx.restore();
                    } else {
                        this.ctx.fill();
                    }
                }
            }
            index--;
        }
    }

    async renderSolidBorder(color: Color, side: number, curvePoints: BoundCurves): Promise<void> {
        this.path(parsePathForBorder(curvePoints, side));
        this.ctx.fillStyle = asString(color);
        this.ctx.fill();
    }

    async renderDoubleBorder(color: Color, width: number, side: number, curvePoints: BoundCurves): Promise<void> {
        if (width < 3) {
            await this.renderSolidBorder(color, side, curvePoints);
            return;
        }

        const outerPaths = parsePathForBorderDoubleOuter(curvePoints, side);
        this.path(outerPaths);
        this.ctx.fillStyle = asString(color);
        this.ctx.fill();
        const innerPaths = parsePathForBorderDoubleInner(curvePoints, side);
        this.path(innerPaths);
        this.ctx.fill();
    }

    /**
     * Render 3D border styles (groove, ridge, inset, outset).
     * These styles create a 3D effect by using lighter and darker color variations.
     * Groove and ridge use a split-border technique (outer and inner halves with different colors).
     */
    async render3DBorder(
        color: Color,
        _width: number,
        style: BORDER_STYLE,
        side: number,
        curvePoints: BoundCurves
    ): Promise<void> {
        // Calculate lighter and darker color variations for 3D effect
        const lighterColor = this.getLighterColor(color);
        const darkerColor = this.getDarkerColor(color);

        // Groove and ridge need split rendering (two-tone effect) using midpoint
        if (style === BORDER_STYLE.GROOVE || style === BORDER_STYLE.RIDGE) {
            // Determine outer and inner colors based on style and side
            // side: 0=top, 1=right, 2=bottom, 3=left
            let outerColor: Color, innerColor: Color;

            if (style === BORDER_STYLE.GROOVE) {
                // Groove: appears carved in
                // Top/Left: dark outer half, light inner half
                // Bottom/Right: light outer half, dark inner half
                if (side === 0 || side === 3) {
                    outerColor = darkerColor;
                    innerColor = lighterColor;
                } else {
                    outerColor = lighterColor;
                    innerColor = darkerColor;
                }
            } else {
                // Ridge: appears raised (opposite of groove)
                // Top/Left: light outer half, dark inner half
                // Bottom/Right: dark outer half, light inner half
                if (side === 0 || side === 3) {
                    outerColor = lighterColor;
                    innerColor = darkerColor;
                } else {
                    outerColor = darkerColor;
                    innerColor = lighterColor;
                }
            }

            // Render outer half (border edge to midpoint)
            const outerPaths = parsePathForBorderRidgeOuter(curvePoints, side);
            this.path(outerPaths);
            this.ctx.fillStyle = asString(outerColor);
            this.ctx.fill();

            // Render inner half (midpoint to padding edge)
            const innerPaths = parsePathForBorderRidgeInner(curvePoints, side);
            this.path(innerPaths);
            this.ctx.fillStyle = asString(innerColor);
            this.ctx.fill();
        } else {
            // Inset and outset use single-color per side
            let borderColor: Color;

            if (style === BORDER_STYLE.INSET) {
                // Inset: dark on top/left, light on bottom/right (entire box pressed in)
                borderColor = side === 0 || side === 3 ? darkerColor : lighterColor;
            } else {
                // Outset: light on top/left, dark on bottom/right (entire box raised)
                borderColor = side === 0 || side === 3 ? lighterColor : darkerColor;
            }

            // Render the border with the calculated color
            await this.renderSolidBorder(borderColor, side, curvePoints);
        }
    }

    /**
     * Calculate a lighter version of a color for 3D border effects.
     * Matches browser behavior by blending with white.
     */
    private getLighterColor(color: Color): Color {
        const alpha = 0xff & color;
        const blue = 0xff & (color >> 8);
        const green = 0xff & (color >> 16);
        const red = 0xff & (color >> 24);

        // Blend with white - approximately 1/3 towards white matches browsers best
        // Formula: color + (255 - color) * factor
        const factor = 0.333; // 33% towards white

        const newR = Math.min(255, Math.round(red + (255 - red) * factor));
        const newG = Math.min(255, Math.round(green + (255 - green) * factor));
        const newB = Math.min(255, Math.round(blue + (255 - blue) * factor));

        return ((newR << 24) | (newG << 16) | (newB << 8) | alpha) >>> 0;
    }

    /**
     * Calculate a darker version of a color for 3D border effects.
     * Matches browser behavior by blending with black.
     */
    private getDarkerColor(color: Color): Color {
        const alpha = 0xff & color;
        const blue = 0xff & (color >> 8);
        const green = 0xff & (color >> 16);
        const red = 0xff & (color >> 24);

        // Blend with black (browsers typically use approximately 50% blend)
        // Formula: color * (1 - factor)
        const factor = 0.5; // Darken by 50%

        const newR = Math.max(0, Math.round(red * (1 - factor)));
        const newG = Math.max(0, Math.round(green * (1 - factor)));
        const newB = Math.max(0, Math.round(blue * (1 - factor)));

        return ((newR << 24) | (newG << 16) | (newB << 8) | alpha) >>> 0;
    }

    async renderNodeBackgroundAndBorders(paint: ElementPaint): Promise<void> {
        this.applyEffects(paint.getEffects(EffectTarget.BACKGROUND_BORDERS));
        const styles = paint.container.styles;
        const hasBackground = !isTransparent(styles.backgroundColor) || styles.backgroundImage.length;

        const borders = [
            {style: styles.borderTopStyle, color: styles.borderTopColor, width: styles.borderTopWidth},
            {style: styles.borderRightStyle, color: styles.borderRightColor, width: styles.borderRightWidth},
            {style: styles.borderBottomStyle, color: styles.borderBottomColor, width: styles.borderBottomWidth},
            {style: styles.borderLeftStyle, color: styles.borderLeftColor, width: styles.borderLeftWidth}
        ];

        const backgroundPaintingArea = calculateBackgroundCurvedPaintingArea(
            getBackgroundValueForIndex(styles.backgroundClip, 0),
            paint.curves
        );

        if (hasBackground || styles.boxShadow.length) {
            this.ctx.save();
            this.path(backgroundPaintingArea);
            this.ctx.clip();

            if (!isTransparent(styles.backgroundColor)) {
                this.ctx.fillStyle = asString(styles.backgroundColor);
                this.ctx.fill();
            }

            await this.renderBackgroundImage(paint.container);

            this.ctx.restore();

            styles.boxShadow
                .slice(0)
                .reverse()
                .forEach((shadow) => {
                    this.ctx.save();
                    const borderBoxArea = calculateBorderBoxPath(paint.curves);
                    const maskOffset = shadow.inset ? 0 : MASK_OFFSET;
                    const shadowPaintingArea = transformPath(
                        borderBoxArea,
                        -maskOffset + (shadow.inset ? 1 : -1) * shadow.spread.number,
                        (shadow.inset ? 1 : -1) * shadow.spread.number,
                        shadow.spread.number * (shadow.inset ? -2 : 2),
                        shadow.spread.number * (shadow.inset ? -2 : 2)
                    );

                    if (shadow.inset) {
                        this.path(borderBoxArea);
                        this.ctx.clip();
                        this.mask(shadowPaintingArea);
                    } else {
                        this.mask(borderBoxArea);
                        this.ctx.clip();
                        this.path(shadowPaintingArea);
                    }

                    this.ctx.shadowOffsetX = shadow.offsetX.number + maskOffset;
                    this.ctx.shadowOffsetY = shadow.offsetY.number;
                    this.ctx.shadowColor = asString(shadow.color);
                    this.ctx.shadowBlur = shadow.blur.number;
                    this.ctx.fillStyle = shadow.inset ? asString(shadow.color) : 'rgba(0,0,0,1)';

                    this.ctx.fill();
                    this.ctx.restore();
                });
        }

        let side = 0;
        for (const border of borders) {
            if (border.style !== BORDER_STYLE.NONE && !isTransparent(border.color) && border.width > 0) {
                if (border.style === BORDER_STYLE.DASHED) {
                    await this.renderDashedDottedBorder(
                        border.color,
                        border.width,
                        side,
                        paint.curves,
                        BORDER_STYLE.DASHED
                    );
                } else if (border.style === BORDER_STYLE.DOTTED) {
                    await this.renderDashedDottedBorder(
                        border.color,
                        border.width,
                        side,
                        paint.curves,
                        BORDER_STYLE.DOTTED
                    );
                } else if (border.style === BORDER_STYLE.DOUBLE) {
                    await this.renderDoubleBorder(border.color, border.width, side, paint.curves);
                } else if (
                    border.style === BORDER_STYLE.GROOVE ||
                    border.style === BORDER_STYLE.RIDGE ||
                    border.style === BORDER_STYLE.INSET ||
                    border.style === BORDER_STYLE.OUTSET
                ) {
                    await this.render3DBorder(border.color, border.width, border.style, side, paint.curves);
                } else {
                    await this.renderSolidBorder(border.color, side, paint.curves);
                }
            }
            side++;
        }
    }

    async renderDashedDottedBorder(
        color: Color,
        width: number,
        side: number,
        curvePoints: BoundCurves,
        style: BORDER_STYLE
    ): Promise<void> {
        this.ctx.save();

        const strokePaths = parsePathForBorderStroke(curvePoints, side);
        const boxPaths = parsePathForBorder(curvePoints, side);

        if (style === BORDER_STYLE.DASHED) {
            this.path(boxPaths);
            this.ctx.clip();
        }

        let startX, startY, endX, endY;
        if (isBezierCurve(boxPaths[0])) {
            startX = (boxPaths[0] as BezierCurve).start.x;
            startY = (boxPaths[0] as BezierCurve).start.y;
        } else {
            startX = (boxPaths[0] as Vector).x;
            startY = (boxPaths[0] as Vector).y;
        }
        if (isBezierCurve(boxPaths[1])) {
            endX = (boxPaths[1] as BezierCurve).end.x;
            endY = (boxPaths[1] as BezierCurve).end.y;
        } else {
            endX = (boxPaths[1] as Vector).x;
            endY = (boxPaths[1] as Vector).y;
        }

        let length;
        if (side === 0 || side === 2) {
            length = Math.abs(startX - endX);
        } else {
            length = Math.abs(startY - endY);
        }

        this.ctx.beginPath();
        if (style === BORDER_STYLE.DOTTED) {
            this.formatPath(strokePaths);
        } else {
            this.formatPath(boxPaths.slice(0, 2));
        }

        let dashLength = width < 3 ? width * 3 : width * 2;
        let spaceLength = width < 3 ? width * 2 : width;
        if (style === BORDER_STYLE.DOTTED) {
            dashLength = width;
            spaceLength = width;
        }

        let useLineDash = true;
        if (length <= dashLength * 2) {
            useLineDash = false;
        } else if (length <= dashLength * 2 + spaceLength) {
            const multiplier = length / (2 * dashLength + spaceLength);
            dashLength *= multiplier;
            spaceLength *= multiplier;
        } else {
            const numberOfDashes = Math.floor((length + spaceLength) / (dashLength + spaceLength));
            const minSpace = (length - numberOfDashes * dashLength) / (numberOfDashes - 1);
            const maxSpace = (length - (numberOfDashes + 1) * dashLength) / numberOfDashes;
            spaceLength =
                maxSpace <= 0 || Math.abs(spaceLength - minSpace) < Math.abs(spaceLength - maxSpace)
                    ? minSpace
                    : maxSpace;
        }

        if (useLineDash) {
            if (style === BORDER_STYLE.DOTTED) {
                this.ctx.setLineDash([0, dashLength + spaceLength]);
            } else {
                this.ctx.setLineDash([dashLength, spaceLength]);
            }
        }

        if (style === BORDER_STYLE.DOTTED) {
            this.ctx.lineCap = 'round';
            this.ctx.lineWidth = width;
        } else {
            this.ctx.lineWidth = width * 2 + 1.1;
        }
        this.ctx.strokeStyle = asString(color);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // dashed round edge gap
        if (style === BORDER_STYLE.DASHED) {
            if (isBezierCurve(boxPaths[0])) {
                const path1 = boxPaths[3] as BezierCurve;
                const path2 = boxPaths[0] as BezierCurve;
                this.ctx.beginPath();
                this.formatPath([new Vector(path1.end.x, path1.end.y), new Vector(path2.start.x, path2.start.y)]);
                this.ctx.stroke();
            }
            if (isBezierCurve(boxPaths[1])) {
                const path1 = boxPaths[1] as BezierCurve;
                const path2 = boxPaths[2] as BezierCurve;
                this.ctx.beginPath();
                this.formatPath([new Vector(path1.end.x, path1.end.y), new Vector(path2.start.x, path2.start.y)]);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    async render(element: ElementContainer): Promise<HTMLCanvasElement> {
        if (this.options.backgroundColor) {
            this.ctx.fillStyle = asString(this.options.backgroundColor);
            this.ctx.fillRect(this.options.x, this.options.y, this.options.width, this.options.height);
        }

        const stack = parseStackingContexts(element);

        await this.renderStack(stack);
        this.applyEffects([]);
        return this.canvas;
    }
}

const isTextInputElement = (
    container: ElementContainer
): container is InputElementContainer | TextareaElementContainer | SelectElementContainer => {
    if (container instanceof TextareaElementContainer) {
        return true;
    } else if (container instanceof SelectElementContainer) {
        return true;
    } else if (container instanceof InputElementContainer && container.type !== RADIO && container.type !== CHECKBOX) {
        return true;
    }
    return false;
};

const calculateBackgroundCurvedPaintingArea = (clip: BACKGROUND_CLIP, curves: BoundCurves): Path[] => {
    switch (clip) {
        case BACKGROUND_CLIP.BORDER_BOX:
            return calculateBorderBoxPath(curves);
        case BACKGROUND_CLIP.CONTENT_BOX:
            return calculateContentBoxPath(curves);
        case BACKGROUND_CLIP.PADDING_BOX:
        default:
            return calculatePaddingBoxPath(curves);
    }
};

const canvasTextAlign = (textAlign: TEXT_ALIGN): CanvasTextAlign => {
    switch (textAlign) {
        case TEXT_ALIGN.CENTER:
            return 'center';
        case TEXT_ALIGN.RIGHT:
            return 'right';
        case TEXT_ALIGN.LEFT:
        default:
            return 'left';
    }
};

// see https://github.com/niklasvh/html2canvas/pull/2645
const iOSBrokenFonts = ['-apple-system', 'system-ui'];

const fixIOSSystemFonts = (fontFamilies: string[]): string[] => {
    return /iPhone OS 15_(0|1)/.test(window.navigator.userAgent)
        ? fontFamilies.filter((fontFamily) => iOSBrokenFonts.indexOf(fontFamily) === -1)
        : fontFamilies;
};

const filterToCanvasFilter = (filters: Filter[]): string => {
    if (filters.length === 0) {
        return 'none';
    }

    const filterString = filters
        .map((filter) => {
            switch (filter.type) {
                case FILTER_TYPE.BLUR:
                    return `blur(${getAbsoluteValue(filter.radius, 0)}px)`;
                case FILTER_TYPE.BRIGHTNESS:
                    return `brightness(${filter.amount})`;
                case FILTER_TYPE.CONTRAST:
                    return `contrast(${filter.amount})`;
                case FILTER_TYPE.GRAYSCALE:
                    return `grayscale(${filter.amount})`;
                case FILTER_TYPE.HUE_ROTATE:
                    const hueDeg = (filter.angle * 180) / Math.PI;
                    return `hue-rotate(${hueDeg}deg)`;
                case FILTER_TYPE.INVERT:
                    return `invert(${filter.amount})`;
                case FILTER_TYPE.OPACITY:
                    return `opacity(${filter.amount})`;
                case FILTER_TYPE.SATURATE:
                    return `saturate(${filter.amount})`;
                case FILTER_TYPE.SEPIA:
                    return `sepia(${filter.amount})`;
                default:
                    return '';
            }
        })
        .filter((f) => f !== '')
        .join(' ');

    return filterString;
};
