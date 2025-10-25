import {ElementContainer} from '../element-container';
import {Context} from '../../core/context';

export class DetailsElementContainer extends ElementContainer {
    readonly open: boolean;

    constructor(context: Context, element: HTMLDetailsElement) {
        super(context, element);
        // Store the open state - the node parser will use this to determine
        // whether to render the details content or just the summary
        this.open = element.open;
    }
}
