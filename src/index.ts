import {css} from './style';
import {type Area} from './area';
import {Glass} from "./glass.ts";

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
        if (this.died) {
            return Promise.resolve(false);
        }

        if (another == null || another == this || another.died) {
            return Promise.resolve(true);
        }

        // return promise
        return new Promise<boolean>(async (resolve) => {
            this.updateSize(this.getSafeSize(this.size + another.size * 0.1));

            another.died = true;
            another.moveTo(this.x + this.size / 2, this.y + this.size / 2);

            await this.delay(100);

            resolve(true);

            this.moveToComfortZone();

        });
    }

    public tryEat(another: BBBubble) {
        if (!this.isOverlapWith(another)) {
            return Promise.resolve(false);
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

    public moveTo(x: number, y: number, durationMs: number = 200) {
        this.x = this.getSafeX(x);
        this.y = this.getSafeY(y);

        // update top, left transition duration


        const bubble = this.bubbleElement;
        if (bubble) {
            bubble.style.transitionDuration = `${durationMs}ms`;
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
            this.bringBackToLife();
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

    public async riseToTheSurface() {
        this.moveTo(this.x, 0);

        await this.delay(180);

        this.hide();
    }


    public async bringBackToLife() {
        this.updateSize(this.getRandomSize());

        this.moveToRandomPositionWithinBirthplace();

        const delay = 100 + 100 * Math.random();

        await this.delay(delay);

        this.show();
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

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    show() {
        this.playAnimation();
        this.bubbleElement?.removeAttribute('hide');
        this.bubbleElement?.setAttribute('show', '');
    }


    getBirthplace(): Area {
        const parentHeight = this.parent?.clientWidth || 0;
        const parentWidth = this.parent?.clientHeight || 0;

        console.log(this.parent);

        const areaHeight = parentHeight * .2;
        return {
            x: 0,
            y: parentHeight - areaHeight,
            width: parentWidth,
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

    getYOfComfortZone() {
        const birthplace = this.getBirthplace();
        const sizeRatio = this.size / this.maxSize;

        return birthplace.y - birthplace.height * sizeRatio;
    }

    getRandomSize() {
        const sizeAttr = this.getAttribute('size');
        if (sizeAttr) {
            return parseInt(sizeAttr, 10);
        }

        return Math.random() * 50 + this.minSize;
    }

    moveToComfortZone() {
        const y = this.getYOfComfortZone();

        if (y > this.y) {
            console.log('cancel. y:', y, 'is greater than current y:', this.y);
            return;
        }

        this.moveTo(this.x, y, 500 + 100 * Math.random());
        console.log("moved.")
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

        let parentWidth = this.parent?.clientWidth || 0;
        if (x > parentWidth - this.size - this.padding) {
            return parentWidth - this.size - this.padding;
        }

        return x;
    }

    getSafeY(y: number) {
        if (y < this.padding) {
            return this.padding;
        }

        let parentHeight = this.parent?.clientHeight || 0;
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

    get parent() {
       return (this.parentElement as Glass).glass;
    }

    size: number = 128;
    x: number = 0;
    y: number = 0;

    minSize: number = 20;
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

        this.bringBackToLife()
    }
}

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
