import { css } from './style';
import { type Area } from './area';

export class BBBubble extends HTMLElement {
    root: ShadowRoot;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = `
            <div class="bubble" idle hide>
                <slot></slot>
            </div>
        `;
    }

    public eat(another: BBBubble) {
        if (another == null || another == this || another.died) {
            return Promise.resolve();
        }

        // return promise
        return new Promise<void>((resolve) => {
            this.updateSize(this.getSafeSize(this.size + another.size * 0.5));
            another.died = true;
            another.moveTo(this.x, this.y);

            setTimeout(() => {
                resolve();
            }, 200);
        });
    }

    public tryEat(another: BBBubble) {
        if (!this.isOverlapWith(another)) {
            return Promise.resolve();
        }

        if (this.size < another.size) {
            return another.eat(this);
        } else {
            return this.eat(another);
        }
    }

    public isOverlapWith(another: BBBubble) {
        // detect overlap by pos and size
        const distBetweenBubbles = Math.sqrt(
            Math.pow(this.x - another.x, 2) + Math.pow(this.y - another.y, 2));

        return distBetweenBubbles < (this.size + another.size) / 2;
    }

    public moveTo(x: number, y: number) {
        this.x = this.getSafeX(x);
        this.y = this.getSafeY(y);

        const bubble = this.bubbleElement;
        if (bubble) {
            bubble.style.top = `${this.y}px`;
            bubble.style.left = `${this.x}px`;
        }
    }

    public get died(): boolean {
        return this._died;
    }

    public set died(value: boolean) {
        this._died = value;

        if (!value) {
            this.moveToRandomPositionWithinBirthplace();

            // delay .2s and show
            setTimeout(() => {
                this.show();
            }, 200);

            return;
        }

        this.hide();
    }

    public updateSize(newSize: number) {
        this.size = this.getSafeSize(newSize);

        const bubble = this.getBubbleElement();

        bubble!.style.width = `${this.size}px`;
        bubble!.style.height = `${this.size}px`;

        this.moveTo(this.x, this.y);
    }

    hide() {
        this.updateSize(this.minSize);
        this.pauseAnimation();
        this.getBubbleElement()?.removeAttribute('show');
        this.getBubbleElement()?.setAttribute('hide', '');
    }

    pauseAnimation() {
        this.bubbleElement?.removeAttribute('idle');
    }

    playAnimation() {
        this.bubbleElement?.setAttribute('idle', '');
    }


    show() {
        this.playAnimation();
        this.bubbleElement?.removeAttribute('hide');
        this.bubbleElement?.setAttribute('show', '');
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
    x: number = 0;
    y: number = 0;

    minSize: number = 30;
    maxSize: number = 300;
    padding: number = 50;

    _died: boolean = false;

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

        this.show();
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