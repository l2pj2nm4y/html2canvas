import {Bounds} from '../css/layout/bounds';
import {BACKGROUND_ORIGIN} from '../css/property-descriptors/background-origin';
import {ElementContainer} from '../dom/element-container';
import {BACKGROUND_SIZE, BackgroundSizeInfo} from '../css/property-descriptors/background-size';
import {Vector} from './vector';
import {BACKGROUND_REPEAT} from '../css/property-descriptors/background-repeat';
import {getAbsoluteValue, getAbsoluteValueForTuple, isLengthPercentage} from '../css/types/length-percentage';
import {CSSValue, isIdentToken} from '../css/syntax/parser';
import {StringValueToken} from '../css/syntax/tokenizer';
import {contentBox, paddingBox} from './box-sizing';
import {Path} from './path';
import {BACKGROUND_CLIP} from '../css/property-descriptors/background-clip';

export const calculateBackgroundPositioningArea = (
    backgroundOrigin: BACKGROUND_ORIGIN,
    element: ElementContainer
): Bounds => {
    if (backgroundOrigin === BACKGROUND_ORIGIN.BORDER_BOX) {
        return element.bounds;
    }

    if (backgroundOrigin === BACKGROUND_ORIGIN.CONTENT_BOX) {
        return contentBox(element);
    }

    return paddingBox(element);
};

export const calculateBackgroundPaintingArea = (backgroundClip: BACKGROUND_CLIP, element: ElementContainer): Bounds => {
    if (backgroundClip === BACKGROUND_CLIP.BORDER_BOX) {
        return element.bounds;
    }

    if (backgroundClip === BACKGROUND_CLIP.CONTENT_BOX) {
        return contentBox(element);
    }

    return paddingBox(element);
};

/**
 * Calculate adjusted image size for round/space background-repeat modes.
 * - ROUND: Scale image to fit exactly (no partial images)
 * - SPACE: Keep image size, but return original size (spacing handled in rendering)
 */
const calculateRoundSpaceSize = (
    repeat: BACKGROUND_REPEAT,
    imageWidth: number,
    imageHeight: number,
    areaWidth: number,
    areaHeight: number
): [number, number] => {
    let adjustedWidth = imageWidth;
    let adjustedHeight = imageHeight;

    // For ROUND, scale images to fit exactly
    if (repeat === BACKGROUND_REPEAT.ROUND || repeat === BACKGROUND_REPEAT.SPACE_ROUND || repeat === BACKGROUND_REPEAT.ROUND_SPACE) {
        // Calculate how many images fit in each dimension
        const numImagesX = Math.max(1, Math.round(areaWidth / imageWidth));
        const numImagesY = Math.max(1, Math.round(areaHeight / imageHeight));

        // For ROUND: scale both dimensions
        if (repeat === BACKGROUND_REPEAT.ROUND) {
            adjustedWidth = areaWidth / numImagesX;
            adjustedHeight = areaHeight / numImagesY;
        }
        // For SPACE_ROUND: only scale vertically
        else if (repeat === BACKGROUND_REPEAT.SPACE_ROUND) {
            adjustedHeight = areaHeight / numImagesY;
        }
        // For ROUND_SPACE: only scale horizontally
        else if (repeat === BACKGROUND_REPEAT.ROUND_SPACE) {
            adjustedWidth = areaWidth / numImagesX;
        }
    }

    return [adjustedWidth, adjustedHeight];
};

export const calculateBackgroundRendering = (
    container: ElementContainer,
    index: number,
    intrinsicSize: [number | null, number | null, number | null]
): [Path[], number, number, number, number] => {
    const backgroundPositioningArea = calculateBackgroundPositioningArea(
        getBackgroundValueForIndex(container.styles.backgroundOrigin, index),
        container
    );

    const backgroundPaintingArea = calculateBackgroundPaintingArea(
        getBackgroundValueForIndex(container.styles.backgroundClip, index),
        container
    );

    const backgroundImageSize = calculateBackgroundSize(
        getBackgroundValueForIndex(container.styles.backgroundSize, index),
        intrinsicSize,
        backgroundPositioningArea
    );

    let [sizeWidth, sizeHeight] = backgroundImageSize;

    // Adjust size for round/space repeat modes
    const repeatMode = getBackgroundValueForIndex(container.styles.backgroundRepeat, index);
    const adjustedSize = calculateRoundSpaceSize(
        repeatMode,
        sizeWidth,
        sizeHeight,
        backgroundPositioningArea.width,
        backgroundPositioningArea.height
    );
    sizeWidth = adjustedSize[0];
    sizeHeight = adjustedSize[1];

    const position = getAbsoluteValueForTuple(
        getBackgroundValueForIndex(container.styles.backgroundPosition, index),
        backgroundPositioningArea.width - sizeWidth,
        backgroundPositioningArea.height - sizeHeight
    );

    const path = calculateBackgroundRepeatPath(
        repeatMode,
        position,
        [sizeWidth, sizeHeight],
        backgroundPositioningArea,
        backgroundPaintingArea
    );

    const offsetX = Math.round(backgroundPositioningArea.left + position[0]);
    const offsetY = Math.round(backgroundPositioningArea.top + position[1]);

    return [path, offsetX, offsetY, sizeWidth, sizeHeight];
};

export const isAuto = (token: CSSValue): boolean => isIdentToken(token) && token.value === BACKGROUND_SIZE.AUTO;

const hasIntrinsicValue = (value: number | null): value is number => typeof value === 'number';

export const calculateBackgroundSize = (
    size: BackgroundSizeInfo[],
    [intrinsicWidth, intrinsicHeight, intrinsicProportion]: [number | null, number | null, number | null],
    bounds: Bounds
): [number, number] => {
    const [first, second] = size;

    if (!first) {
        return [0, 0];
    }

    if (isLengthPercentage(first) && second && isLengthPercentage(second)) {
        return [getAbsoluteValue(first, bounds.width), getAbsoluteValue(second, bounds.height)];
    }

    const hasIntrinsicProportion = hasIntrinsicValue(intrinsicProportion);

    if (isIdentToken(first as CSSValue) && ((first as StringValueToken).value === BACKGROUND_SIZE.CONTAIN || (first as StringValueToken).value === BACKGROUND_SIZE.COVER)) {
        if (hasIntrinsicValue(intrinsicProportion)) {
            const targetRatio = bounds.width / bounds.height;

            return targetRatio < intrinsicProportion !== ((first as StringValueToken).value === BACKGROUND_SIZE.COVER)
                ? [bounds.width, bounds.width / intrinsicProportion]
                : [bounds.height * intrinsicProportion, bounds.height];
        }

        return [bounds.width, bounds.height];
    }

    const hasIntrinsicWidth = hasIntrinsicValue(intrinsicWidth);
    const hasIntrinsicHeight = hasIntrinsicValue(intrinsicHeight);
    const hasIntrinsicDimensions = hasIntrinsicWidth || hasIntrinsicHeight;

    // If the background-size is auto or auto auto:
    if (isAuto(first as CSSValue) && (!second || isAuto(second as CSSValue))) {
        // If the image has both horizontal and vertical intrinsic dimensions, it's rendered at that size.
        if (hasIntrinsicWidth && hasIntrinsicHeight) {
            return [intrinsicWidth as number, intrinsicHeight as number];
        }

        // If the image has no intrinsic dimensions and has no intrinsic proportions,
        // it's rendered at the size of the background positioning area.

        if (!hasIntrinsicProportion && !hasIntrinsicDimensions) {
            return [bounds.width, bounds.height];
        }

        // TODO If the image has no intrinsic dimensions but has intrinsic proportions, it's rendered as if contain had been specified instead.

        // If the image has only one intrinsic dimension and has intrinsic proportions, it's rendered at the size corresponding to that one dimension.
        // The other dimension is computed using the specified dimension and the intrinsic proportions.
        if (hasIntrinsicDimensions && hasIntrinsicProportion) {
            const width = hasIntrinsicWidth
                ? (intrinsicWidth as number)
                : (intrinsicHeight as number) * (intrinsicProportion as number);
            const height = hasIntrinsicHeight
                ? (intrinsicHeight as number)
                : (intrinsicWidth as number) / (intrinsicProportion as number);
            return [width, height];
        }

        // If the image has only one intrinsic dimension but has no intrinsic proportions,
        // it's rendered using the specified dimension and the other dimension of the background positioning area.
        const width = hasIntrinsicWidth ? (intrinsicWidth as number) : bounds.width;
        const height = hasIntrinsicHeight ? (intrinsicHeight as number) : bounds.height;
        return [width, height];
    }

    // If the image has intrinsic proportions, it's stretched to the specified dimension.
    // The unspecified dimension is computed using the specified dimension and the intrinsic proportions.
    if (hasIntrinsicProportion) {
        let width = 0;
        let height = 0;
        if (isLengthPercentage(first)) {
            width = getAbsoluteValue(first, bounds.width);
        } else if (isLengthPercentage(second)) {
            height = getAbsoluteValue(second, bounds.height);
        }

        if (isAuto(first as CSSValue)) {
            width = height * (intrinsicProportion as number);
        } else if (!second || isAuto(second as CSSValue)) {
            height = width / (intrinsicProportion as number);
        }

        return [width, height];
    }

    // If the image has no intrinsic proportions, it's stretched to the specified dimension.
    // The unspecified dimension is computed using the image's corresponding intrinsic dimension,
    // if there is one. If there is no such intrinsic dimension,
    // it becomes the corresponding dimension of the background positioning area.

    let width = null;
    let height = null;

    if (isLengthPercentage(first)) {
        width = getAbsoluteValue(first, bounds.width);
    } else if (second && isLengthPercentage(second)) {
        height = getAbsoluteValue(second, bounds.height);
    }

    if (width !== null && (!second || isAuto(second as CSSValue))) {
        height =
            hasIntrinsicWidth && hasIntrinsicHeight
                ? (width / (intrinsicWidth as number)) * (intrinsicHeight as number)
                : bounds.height;
    }

    if (height !== null && isAuto(first as CSSValue)) {
        width =
            hasIntrinsicWidth && hasIntrinsicHeight
                ? (height / (intrinsicHeight as number)) * (intrinsicWidth as number)
                : bounds.width;
    }

    if (width !== null && height !== null) {
        return [width, height];
    }

    throw new Error(`Unable to calculate background-size for element`);
};

export const getBackgroundValueForIndex = <T>(values: T[], index: number): T => {
    const value = values[index];
    if (typeof value === 'undefined') {
        return values[0];
    }

    return value;
};

export const calculateBackgroundRepeatPath = (
    repeat: BACKGROUND_REPEAT,
    [x, y]: [number, number],
    [width, height]: [number, number],
    backgroundPositioningArea: Bounds,
    backgroundPaintingArea: Bounds
): [Vector, Vector, Vector, Vector] => {
    switch (repeat) {
        case BACKGROUND_REPEAT.REPEAT_X:
            return [
                new Vector(Math.round(backgroundPositioningArea.left), Math.round(backgroundPositioningArea.top + y)),
                new Vector(
                    Math.round(backgroundPositioningArea.left + backgroundPositioningArea.width),
                    Math.round(backgroundPositioningArea.top + y)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left + backgroundPositioningArea.width),
                    Math.round(height + backgroundPositioningArea.top + y)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left),
                    Math.round(height + backgroundPositioningArea.top + y)
                )
            ];
        case BACKGROUND_REPEAT.REPEAT_Y:
            return [
                new Vector(Math.round(backgroundPositioningArea.left + x), Math.round(backgroundPositioningArea.top)),
                new Vector(
                    Math.round(backgroundPositioningArea.left + x + width),
                    Math.round(backgroundPositioningArea.top)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left + x + width),
                    Math.round(backgroundPositioningArea.height + backgroundPositioningArea.top)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left + x),
                    Math.round(backgroundPositioningArea.height + backgroundPositioningArea.top)
                )
            ];
        case BACKGROUND_REPEAT.NO_REPEAT:
            return [
                new Vector(
                    Math.round(backgroundPositioningArea.left + x),
                    Math.round(backgroundPositioningArea.top + y)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left + x + width),
                    Math.round(backgroundPositioningArea.top + y)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left + x + width),
                    Math.round(backgroundPositioningArea.top + y + height)
                ),
                new Vector(
                    Math.round(backgroundPositioningArea.left + x),
                    Math.round(backgroundPositioningArea.top + y + height)
                )
            ];
        case BACKGROUND_REPEAT.SPACE:
        case BACKGROUND_REPEAT.ROUND:
        case BACKGROUND_REPEAT.SPACE_ROUND:
        case BACKGROUND_REPEAT.ROUND_SPACE:
        case BACKGROUND_REPEAT.REPEAT:
        default:
            // For SPACE/ROUND: images are scaled/spaced to fit, then repeated in full painting area
            // For REPEAT: standard tiled repeat
            return [
                new Vector(Math.round(backgroundPaintingArea.left), Math.round(backgroundPaintingArea.top)),
                new Vector(
                    Math.round(backgroundPaintingArea.left + backgroundPaintingArea.width),
                    Math.round(backgroundPaintingArea.top)
                ),
                new Vector(
                    Math.round(backgroundPaintingArea.left + backgroundPaintingArea.width),
                    Math.round(backgroundPaintingArea.height + backgroundPaintingArea.top)
                ),
                new Vector(
                    Math.round(backgroundPaintingArea.left),
                    Math.round(backgroundPaintingArea.height + backgroundPaintingArea.top)
                )
            ];
    }
};
