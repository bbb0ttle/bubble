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
    }

    tryEat(another: BBBubble) {
        if (!this.isOverlapWith(another)) {
            return Promise.resolve(false);
        }

        if (this.size < another.size) {
            return another.eat(this);
        } else {
            return this.eat(another);
        }
    }

    get died(): boolean {
        return this._died;
    }

    set died(value: boolean) {
        this._died = value;

        if (!value) {
            this.bringBackToLife().then();
            return;
        }

        this.riseToTheSurface().then(() => {
            this.moveToRandomPositionWithinBirthplace();
        });
    }

    private moveTo(x: number, y: number, durationMs: number = 200) {
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

    private isOverlapWith(another: BBBubble) {
        // detect overlap by pos and size
        const distBetweenBubbles = Math.sqrt(
            Math.pow(this.x - another.x, 2) + Math.pow(this.y - another.y, 2));

        return distBetweenBubbles < (this.size + another.size) / 2;
    }


    private  eat(another: BBBubble) {
        if (this.died) {
            return Promise.resolve(false);
        }

        if (another == null || another == this || another.died) {
            return Promise.resolve(true);
        }

        // return promise
        return new Promise<boolean>(async (resolve) => {
            this.updateSize(this.getSafeSize(this.size + another.size * 0.2));

            another.updateSize(this.minSize)
            another.hide()

            await this.delay(300);
            this.moveToComfortZone();

            const shouldAttract = another.y > this.y;
            if (shouldAttract) {
                const moveDuration = 50 + 50 * Math.random();
                another.moveTo(this.x + this.size / 2, this.y + this.size / 2, moveDuration);
                another.died = true;
            }

            resolve(true);

        });
    }


    private updateSize(newSize: number) {
        this.size = this.getSafeSize(newSize);

        const bubble = this.getBubbleElement();

        bubble!.style.width = `${this.size}px`;
        bubble!.style.height = `${this.size}px`;

        this.moveTo(this.x, this.y);
    }

    private async riseToTheSurface() {
        this.moveTo(this.x, 0);

        await this.delay(180);

        this.hide();
    }


    private async bringBackToLife() {
        this._growUp = false;

        this.updateSize(this.getRandomSize());

        this.moveToRandomPositionWithinBirthplace();

        const delay = 100 + 100 * Math.random();

        await this.delay(delay);

        this.show();
    }

    private hide() {
        this.pauseAnimation();
        this.getBubbleElement()?.removeAttribute('show');
        this.getBubbleElement()?.setAttribute('hide', '');
    }

    private pauseAnimation() {
        this.bubbleElement?.removeAttribute('idle');
    }

    private playAnimation() {
        this.bubbleElement?.setAttribute('idle', '');
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private show() {
        this.playAnimation();
        this.bubbleElement?.removeAttribute('hide');
        this.bubbleElement?.setAttribute('show', '');
    }

    private getBirthplace(): Area {
        const parentRect = this.parent?.getBoundingClientRect();

        if (!parentRect) {
            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        }

        const areaHeight = parentRect.height * .2;

        return {
            x: 0,
            y:  parentRect.height - areaHeight,
            width: parentRect.width,
            height: areaHeight
        };
    }

    private getRandomXWithinBirthplace() {
        const birthplace = this.getBirthplace();
        return Math.random() * birthplace.width + birthplace.x;
    }

    private getRandomYWithingBirthplace() {
        const birthplace = this.getBirthplace();
        return birthplace.height * 5 - this.size; // Math.random() * birthplace.height + birthplace.y;
    }

    private getYOfComfortZone() {
        const birthplace = this.getBirthplace();
        const sizeRatio = this.size / this.maxSize;

        return birthplace.y - birthplace.height * sizeRatio * 3.0;
    }

    private getRandomSize() {
        const sizeAttr = this.getAttribute('size');
        if (sizeAttr) {
            return parseInt(sizeAttr, 10);
        }

        return Math.random() * 50 + this.minSize;
    }

    private async moveToComfortZone() {
        const y = this.getYOfComfortZone();

        if (y > this.y) {
            console.log('cancel. y:', y, 'is greater than current y:', this.y);
            return;
        }

        const duration = 500 + 100 * Math.random();
        this.moveTo(this.x, y, duration);
        await this.delay(duration);
        this._growUp = true;
    }

    private moveToRandomPositionWithinBirthplace() {
        const x = this.getRandomXWithinBirthplace();
        const y = this.getRandomYWithingBirthplace();

        this._growUp = false;
        this.moveTo(x, y);
    }

    private getSafeX(x: number) {
        if (x < this.padding) {
            return this.padding;
        }

        let parentWidth = this.parent?.clientWidth || 0;
        if (x > parentWidth - this.size - this.padding) {
            return parentWidth - this.size - this.padding;
        }

        return x;
    }

    private getSafeY(y: number) {
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

    private get bubbleElement() {
        return this.getBubbleElement();
    }

    private get parent() {
       return (this.parentElement as Glass).glass;
    }

    private size: number = 128;
    private x: number = 0;
    private y: number = 0;

    private minSize: number = 20;
    private maxSize: number = 300;
    private padding: number = 10;

    private _died: boolean = false;

    private _growUp: boolean = false;

    public get growUp() {
        return this._growUp;
    }

    private getSafeSize(size: number): number {
        if (size < this.minSize) {
            return this.minSize;
        } else if (size > this.maxSize) {
            return this.maxSize;
        }
        return size;
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
