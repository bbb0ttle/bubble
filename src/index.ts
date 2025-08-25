import {css} from './style';
import {type Area} from './area';
import {Glass} from "./glass.ts";
import {BubbleEvent} from "./bubbleEvent.ts";

export class BBBubble extends HTMLElement {
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

    static get observedAttributes() {
        return ['size', 'immortal', 'x', 'y'];
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'size') {
            this.updateSize(parseInt(newValue, 10)).then();
        }

        if (name === 'immortal') {
            this._immortal = newValue == 'true';
        }

        if (name === 'x') {
            this.x = parseInt(newValue, 10);
            this.moveTo(this.x, this.y).then();
        }

        if (name === 'y') {
            this.y = parseInt(newValue, 10);
            this.moveTo(this.x, this.y).then();
        }
    }

    connectedCallback() {
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];

        // add click listener
        this.addEventListener('click', this.handleClick);

        // set immortal from attr
        const immortalAttr = this.getAttribute('immortal');
        this._immortal = immortalAttr == 'true';

        if (this._immortal) {
            this.updateSize(this.getNumAttr("size", 80));
            this.x = this.getNumAttr("x", 100);
            this.y = this.getNumAttr("y", 100);
        }
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
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
        if (this._immortal && value) {
            return;
        }

        if (!value) {
            this.bringBackToLife().then(() => {
                this._died = false;

                this.dispatchEvent(new CustomEvent(BubbleEvent.BORN, {
                    bubbles: true,
                }))
            });

            return;
        }

        this.riseToTheSurface().then(() => {
            this._growUp = false;
            this._died = true;

            this.dispatchEvent(new CustomEvent(BubbleEvent.DIED, {
                bubbles: true,
            }))
        })
    }

    private updateTouchable(canTouch: boolean) {
        this.bubbleElement!.style.pointerEvents = canTouch ? 'auto' : 'none';
    }

    private async handleClick() {
        this.scaleInOut().then();

        if (this._immortal) {
            const pe = this.parentElement as Glass
            pe.wakeBubblesUp().then();
        }

        if (this.died) {
            return;
        }

        await this.delay(this.getTransitionDuration());

        this.dispatchEvent(new CustomEvent(BubbleEvent.CLICKED, {
            bubbles: true,
        }))

        if (!this.growUp) {
            this.moveToComfortZone().then(() => {
                this._growUp = true;
            })
            return;
        }

        this.died = true;

    }

    private async scaleInOut() {
        const bubble = this.bubbleElement;
        bubble?.removeAttribute('idle');
        this.bubbleElement!.setAttribute('clicked', '');
        await this.delay(this.defaultDurationMs);
        bubble?.removeAttribute('clicked');
    }

    private getNumAttr(attrName: string, defaultValue: number): number {
        const attr = this.getAttribute(attrName);
        if (attr) {
            return parseInt(attr, 10);
        }
        return defaultValue;
    }

    private async moveTo(x: number, y: number, durationMs: number = -1) {
        if (durationMs > 0) {
            this.updateTransitionDuration(durationMs)
        }

        this.x = this.getSafeX(x);
        this.y = this.getSafeY(y);

        const bubble = this.bubbleElement;
        if (bubble) {
            bubble.style.top = `${this.y}px`;
            bubble.style.left = `${this.x}px`;
        }

        if (durationMs > 0) {
            await this.delay(durationMs);
        }
    }

    private updateTransitionDuration(ms: number) {
        const bubble = this.bubbleElement;

        if (bubble) {
            bubble.style.transitionDuration = `${ms}ms`;
        }
    }

    private getTransitionDuration() {
        // get ms
        const bubble = this.bubbleElement;
        if (bubble) {
            let style = bubble.style.transitionDuration;
            style.replace("ms", "");
            return parseInt(style, 10);
        }

        return this.defaultDurationMs;
    }

    private isOverlapWith(another: BBBubble) {
        // detect overlap by pos and size
        const distBetweenBubbles = Math.sqrt(
            Math.pow(this.x - another.x, 2) + Math.pow(this.y - another.y, 2));

        return distBetweenBubbles < (this.size + another.size) / 2;
    }


    private eat(another: BBBubble) {
        if (this.died || this._immortal) {
            return Promise.resolve(false);
        }

        if (another == null || another == this || another.died || another._immortal) {
            return Promise.resolve(true);
        }

        // return promise
        return new Promise<boolean>(async (resolve) => {
            another.updateSize(this.minSize).then();
            another.hide().then();

            await this.updateSize(this.getSafeSize(this.size + another.size * 0.2));

            const shouldAttract = another.y > this.y;
            if (shouldAttract) {
                const moveDuration = 50 + 50 * Math.random();
                await another.moveTo(this.x + this.size / 2, this.y + this.size / 2, moveDuration);
                another.died = true;
            }

            await this.moveToComfortZone();

            resolve(true);

        });
    }


    private async updateSize(newSize: number) {
        this.size = this.getSafeSize(newSize);

        const bubble = this.getBubbleElement();

        bubble!.style.width = `${this.size}px`;
        bubble!.style.height = `${this.size}px`;

        await this.delay(this.getTransitionDuration());
    }

    private async riseToTheSurface() {
        const duration =  this.getRiseDurationBySize(this.size);
        await this.moveTo(this.x, 0, duration);
        await this.hide();
        this.updateTouchable(false);
    }


    private async bringBackToLife() {
        this._growUp = false;

        if (!this._immortal) {
            await this.updateSize(this.getRandomSize());
            await this.moveToRandomPositionWithinBirthplace();
        } else {
            await this.updateSize(this.size);
            await this.moveTo(this.x, this.y);
        }

        await this.updateOpacity(this.getOpacityBySize(this.size));

        await this.show();

        this.updateTouchable(true);

        this.eatOthers();
    }

    private async hide() {
        this.pauseAnimation();
        this.getBubbleElement()?.removeAttribute('visible');
        this.getBubbleElement()?.setAttribute('hide', '');
        await this.delay(this.defaultDurationMs);
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

    private async show() {
        this.playAnimation();
        this.bubbleElement?.removeAttribute('hide');
        this.bubbleElement?.setAttribute('visible', '');
        await this.delay(this.defaultDurationMs);
    }

    private async updateOpacity(opacity: number) {
        this.bubbleElement!.style.opacity = `${opacity}`;
        await this.delay(this.getTransitionDuration());
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

        return Math.random() * 60 + this.minSize;
    }

    private async moveToComfortZone() {
        const y = this.getYOfComfortZone();

        if (y > this.y) {
            console.log('cancel. y:', y, 'is greater than current y:', this.y);
            return;
        }

        const duration = this.getRiseDurationBySize(this.size) + 100 * Math.random();
        await this.moveTo(this.x, y, duration);
        this.eatOthers();
        this._growUp = true;

        this.dispatchEvent(new CustomEvent(BubbleEvent.GROWN, {
            bubbles: true,
        }))
    }

    private eatOthers() {
        const pe = this.parentElement as Glass
        pe?.eatOthers(this);
    }

    private async moveToRandomPositionWithinBirthplace() {
        const x = this.getRandomXWithinBirthplace();
        const y = this.getRandomYWithingBirthplace();

        this._growUp = false;
        return this.moveTo(x, y, 10);
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

    private getOpacityBySize(size: number) {
        const ratio = (size - this.minSize) / (this.maxSize - this.minSize);
        return this.minOpacity + (this.maxOpacity - this.minOpacity) * ratio;
    }

    private getRiseDurationBySize(size: number) {
        const ratio = (size - this.minSize) / (this.maxSize - this.minSize);
        return this.maxRiseDuration - (this.maxRiseDuration - this.minRiseDuration) * (1 - ratio);
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
    private maxSize: number = 160;
    private minOpacity: number = .5;
    private maxOpacity: number = 1.0;
    private padding: number = 10;
    private maxRiseDuration = 600;
    private minRiseDuration = 200;
    private defaultDurationMs = 200;

    private _immortal: boolean = false;

    private _died: boolean = true;

    private _growUp: boolean = false;

    public get growUp() {
        return this._growUp;
    }

    public get immortal() {
        return this._immortal;
    }

    public get expanded() {
        return this._expanded;
    }

    public set expanded(value: boolean) {
        if (value === this._expanded) {
            return;
        }

        this._expanded = value;

        if (value) {
            this.expand().then(this.reposition.bind(this));
        } else {
            this.collapse().then(this.reposition.bind(this));
        }
    }

    private reposition() {
        return this.moveTo(this.x, this.y, 500)
    }

    private _tmpSize: number = 0;
    private _expanded: boolean = false;

    private expand() {
        this._tmpSize = this.size;
        return this.updateSize(this.maxSize);
    }

    private collapse() {
        if (this._tmpSize <= 0) {
            return Promise.resolve();
        }

        return this.updateSize(this._tmpSize);
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
