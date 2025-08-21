import { css } from './style';
import { type Area } from './area';

class BBBubble extends HTMLElement {
    root: ShadowRoot;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = `
            <div class="bubble" idle>
                <slot></slot>
            </div>
        `;
    }


    public pauseAnimation() {
        this.bubbleElement?.removeAttribute('idle');
    }

    public playAnimation() {
        this.bubbleElement?.setAttribute('idle', '');
    }

    public eat(anotherBubble: BBBubble) {
        anotherBubble.hide();
        this.updateSize(this.getSafeSize(this.size + anotherBubble.size * 0.5));
    }

    public moveTo(x: number, y: number) {
        const bubble = this.bubbleElement;
        if (bubble) {
            bubble.style.top = `${this.getSafeY(y)}px`;
            bubble.style.left = `${this.getSafeX(x)}px`;
        }
    }

    public hide() {
        this.updateSize(this.minSize);
        this.pauseAnimation();
        this.getBubbleElement()?.removeAttribute('show');
        this.getBubbleElement()?.setAttribute('hide', '');
    }

    public show() {
        this.playAnimation();
        this.bubbleElement?.removeAttribute('hide');
        this.bubbleElement?.setAttribute('show', '');
    }

    public updateSize(newSize: number) {
        this.size = this.getSafeSize(newSize);

        const bubble = this.getBubbleElement();

        bubble!.style.width = `${this.size}px`;
        bubble!.style.height = `${this.size}px`;
    }

    getBirthplace(): Area {
        const parentHeight = this.parentElement?.clientWidth || 0;
        const parentWidth = this.parentElement?.clientHeight || 0;

        const areaHeight = parentHeight * .2;
        const areaWidth = parentWidth;

        return {
            x: 0,
            y: parentHeight - areaHeight,
            width: areaWidth,
            height: areaHeight
        };
    }

    getRandomXWithinBirthplace() {
        const birthplace = this.getBirthplace();
        return Math.random() * birthplace.width + birthplace.x;
    }

    getRandomYWithingBirthplace() {
        const birthplace = this.getBirthplace();
        return Math.random() * birthplace.height + birthplace.y;
    }

    getRandomSize() {
        return Math.random() * 50 + this.minSize;
    }

    moveToRandomPositionWithinBirthplace() {
        const x = this.getRandomXWithinBirthplace();
        const y = this.getRandomYWithingBirthplace();

        this.moveTo(x, y);
    }

    getSafeX(x: number) {
        if (x < this.padding) {
            return this.padding;
        }

        // try get parent width
        let parentWidth = this.parentElement?.clientWidth || 0;
        if (x > parentWidth - this.size - this.padding) {
            return parentWidth - this.size - this.padding;
        }

        return x;
    }

    getSafeY(y: number) {
        if (y < this.padding) {
            return this.padding;
        }

        // try get parent height
        let parentHeight = this.parentElement?.clientHeight || 0;
        if (y > parentHeight - this.size - this.padding) {
            return parentHeight - this.size - this.padding;
        }

        return y;
    }

    private getBubbleElement(): HTMLElement | null {
        return this.root.querySelector('.bubble') as HTMLElement;
    }

    get bubbleElement() {
        return this.getBubbleElement();
    }

    size: number = 128;
    minSize: number = 30;
    maxSize: number = 300;
    padding: number = 50;

    getSafeSize(size: number): number {
        if (size < this.minSize) {
            return this.minSize;
        } else if (size > this.maxSize) {
            return this.maxSize;
        }
        return size;
    }

    static get observedAttributes() {
        return ['size'];
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'size') {
            this.updateSize(parseInt(newValue, 10));
        }
    }

    connectedCallback() {
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];

        // init size from attr
        const sizeAttr = this.getAttribute('size');
        if (sizeAttr) {
            this.updateSize(parseInt(sizeAttr, 10));
        } else {
            this.updateSize(this.getRandomSize());
        }

        this.moveToRandomPositionWithinBirthplace();
    }
}

if (!window.customElements.get('bb-bubble')) {
    window.BBBubble = BBBubble;
    window.customElements.define('bb-bubble', BBBubble);
}

declare global {
    interface Window {
        BBBubble: typeof BBBubble;
    }

    interface HTMLElementTagNameMap {
        'bubble': BBBubble;
    }
}