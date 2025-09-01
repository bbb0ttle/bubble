import {Glass} from "./elements/Glass.ts";
import {BBBubble} from './elements/BBBubble.ts';
import {behaviorRegistryInst as behaviorRegistry} from "./behavior/BehaviorRegistry.ts";

if (!window.customElements.get('bb-bubble')) {
    window.BBBubble = BBBubble;
    window.customElements.define('bb-bubble', BBBubble);
}

if (!window.customElements.get('bb-glass')) {
    window.Glass = Glass;
    window.customElements.define('bb-glass', Glass);
}

declare global {
    interface Window {
        BBBubble: typeof BBBubble;
        Glass: typeof Glass;
    }

    interface HTMLElementTagNameMap {
        'bb-bubble': BBBubble;
        'bb-glass': Glass;
    }
}

export {
    behaviorRegistry, BBBubble, Glass
};

export type { BubbleBehavior } from "./behavior/BubbleBehavior.ts";
export type { Position } from "./types/Position.ts";


