import {ElementContainer} from '../element-container';
import {Context} from '../../core/context';
import {DISPLAY} from '../../css/property-descriptors/display';
import {LIST_STYLE_TYPE} from '../../css/property-descriptors/list-style-type';

export class SummaryElementContainer extends ElementContainer {
    readonly detailsOpen: boolean;

    constructor(context: Context, element: HTMLElement) {
        super(context, element);

        // Summary elements display as list-item with a disclosure triangle marker
        // The marker is a rightward-pointing triangle when closed, downward when open
        // Store the open state from the original DOM element
        const detailsParent = element.parentElement;
        this.detailsOpen = !!(detailsParent && detailsParent.tagName === 'DETAILS' && (detailsParent as HTMLDetailsElement).open);

        // Only modify display and list style if the computed style doesn't already include list-item
        // This prevents interfering with existing styling
        const hasListItem = (this.styles.display & DISPLAY.LIST_ITEM) !== 0;

        if (!hasListItem) {
            // Ensure display includes list-item for marker rendering
            // Browser default for summary is display: list-item
            this.styles.display = this.styles.display | DISPLAY.LIST_ITEM;

            // Set the list style type to disclosure-closed or disclosure-open
            // These are special marker types for details/summary
            // The actual marker type will be set during stacking context processing
            // based on the parent DetailsElementContainer's open state
            this.styles.listStyleType = this.detailsOpen ? LIST_STYLE_TYPE.DISCLOSURE_OPEN : LIST_STYLE_TYPE.DISCLOSURE_CLOSED;
        }
    }
}
