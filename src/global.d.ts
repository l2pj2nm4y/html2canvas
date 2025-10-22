interface CSSStyleDeclaration {
    textDecorationColor: string;
    textDecorationLine: string;
    overflowWrap: string;
    objectFit: string;
    objectPosition: string;
    aspectRatio: string;
    gap: string;
    rowGap: string;
    columnGap: string;
    inset: string;
    top: string;
    right: string;
    bottom: string;
    left: string;
    rotate: string;
    scale: string;
    translate: string;
    accentColor: string;
    mixBlendMode: string;
    backdropFilter: string;
    objectViewBox: string;
    scrollSnapType: string;
    scrollSnapAlign: string;
}

interface DocumentType extends Node, ChildNode {
    readonly internalSubset: string | null;
}

interface Document {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fonts: any;
}
