import { AnimationController } from "./AnimationController";
import type { Area } from "./Area";
import type { Position } from "./Position";
import { BubbleEvent } from "./BubbleEvent";
import { Glass } from "./Glass";
import { css } from "./style";

export class BBBubble extends HTMLElement {
    root: ShadowRoot;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = `
            <div class="bubble">
                <slot></slot>
            </div>
        `;
    }

    connectedCallback() {
        // style
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];
    }

    disconnectedCallback() {
    }
}
