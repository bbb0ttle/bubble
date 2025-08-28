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

    static get observedAttributes() {
        return ['size', 'immortal', 'x', 'y'];
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        this.ensureAnimationCtrl();

        if (name === 'immortal') {
            this._immortal = newValue == 'true';
        }

        if (name === 'size') {
            this.updateSize(parseInt(newValue, 10));
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
        // style
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];

        // event
        this.addEventListener('click', this.handleClick);

        // animation
        this._animationCtrl = new AnimationController(this.bubbleElement!);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
    }

    tryEat(another: BBBubble) {
        if (!this.isOverlapWith(another) || this.immortal || another.immortal) {
            return Promise.resolve(false);
        }

        if (this.size < another.size) {
            return another.eat(this);
        } else {
            return this.eat(another);
        }
    }

    get AnimationCtrl() {
        return this._animationCtrl;
    }

    get died(): boolean {
        return this._died;
    }

    set died(value: boolean) {
        // set immortal to died
        if (this._immortal && value) {
            this._died = false;
            return;
        }

        // not change
        if (this._died == value) {
            return;
        }

        // set alive
        if (!value) {
            this.bringBackToLife().then(() => {
                this._died = false;

                this.bubbleElement!.style.display = "inline-block";

                this.dispatchEvent(new CustomEvent(BubbleEvent.BORN, {
                    bubbles: true,
                }))
            });

            return;
        }

        // set died;
        this.riseToTheSurface().then(() => {
            this._growUp = false;
            this._died = true;

            this.bubbleElement!.style.display = "none";

            this._animationCtrl!.stopBreathing();

            this.dispatchEvent(new CustomEvent(BubbleEvent.DIED, {
                bubbles: true,
            }))
        })
    }

    private ensureAnimationCtrl() {
        if (this._animationCtrl == null) {
            this._animationCtrl = new AnimationController(this.bubbleElement!);
        }
    }

    private updateTouchable(canTouch: boolean) {
        this.bubbleElement!.style.pointerEvents = canTouch ? 'auto' : 'none';
    }

    private async handleClick() {
        this._animationCtrl?.scaleInOut();

        if (this._immortal) {
            const pe = this.parentElement as Glass
            pe.wakeBubblesUp().then();
            this.fullscreen = !this.fullscreen;
        }

        if (this.died) {
            return;
        }

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

    private async moveTo(x: number, y: number, durationMs: number = -1) {
        const targetX = this.getSafeX(x);
        const targetY = this.getSafeY(y);

        const bubble = this.bubbleElement;
        if (bubble) {
            await this._animationCtrl?.moveTo(targetX, targetY, durationMs);
            this.x = targetX;
            this.y = targetY;
        }
    }

    private isOverlapWith(another: BBBubble) {
        const distBetweenBubbles = Math.sqrt(
            Math.pow(this.x - another.x, 2) + Math.pow(this.y - another.y, 2));

        return distBetweenBubbles < (this.size + another.size) / 2;
    }


    private eat(another: BBBubble) {
        if (this.died || this._immortal) {
            return Promise.resolve(false);
        }

        if (another == null || another == this || another.died || another._immortal) {
            return Promise.resolve(false);
        }

        // return promise
        return new Promise<boolean>(async (resolve) => {
            another.updateSize(this.minSize);
            another.AnimationCtrl!.hide(200);

            await this.updateSize(this.getSafeSize(this.size + another.size * 0.2));

            const shouldAttract = another.y > this.y;
            if (shouldAttract) {
                const moveDuration = 50 + 50 * Math.random();
                await another.moveTo(this.x + this.size / 2, this.y + this.size / 2, moveDuration);
            }

            another.died = true;

            await this.moveToComfortZone();

            resolve(true);

        });
    }

    private async updateSize(newSize: number, durationMs: number = -1) {
        const targetSize = this.getSafeSize(newSize);

        await this._animationCtrl!.scaleTo(targetSize, durationMs);

        this.size = targetSize;
    }

    private async riseToTheSurface() {
        await this.moveTo(this.x, 0, this.riseDuration);
        await this._animationCtrl!.hide(200);
        this.updateTouchable(false);
    }

    private async bringBackToLife() {
        if (!this._died) {
            return;
        }

        this._growUp = false;

        await this.updateSize(this.initSize);
        await this.moveTo(this.initPos.x, this.initPos.y);

        this._animationCtrl!.show(200, this.opacity);

        this.updateTouchable(true);

        this.eatOthers();
    }

    private getYOfComfortZone() {
        const birthplace = this.birthplace;
        const sizeRatio = this.size / this.maxSize;

        return birthplace.y - birthplace.height * sizeRatio * 3.0;
    }

    private async moveToComfortZone() {
        const y = this.getYOfComfortZone();

        if (y > this.y) {
            return;
        }

        const duration = this.riseDuration + 100 * Math.random();

        await this.moveTo(this.x, y, duration);

        await this.eatOthers();

        this._animationCtrl!.breathe()

        this._growUp = true;

        this.dispatchEvent(new CustomEvent(BubbleEvent.GROWN, {
            bubbles: true,
        }))
    }

    private eatOthers() {
        const pe = this.parentElement as Glass
        return pe?.eatOthers(this);
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

    private get opacity() {
        const ratio = (this.size - this.minSize) / (this.maxSize - this.minSize);
        return this.minOpacity + (this.maxOpacity - this.minOpacity) * ratio;
    }

    private get riseDuration() {
        const ratio = (this.size - this.minSize) / (this.maxSize - this.minSize);
        return this.maxRiseDuration - (this.maxRiseDuration - this.minRiseDuration) * (1 - ratio);
    }

    private get randomSize() {
        const sizeAttr = this.getAttribute('size');
        if (sizeAttr) {
            return parseInt(sizeAttr, 10);
        }

        return Math.random() * 60 + this.minSize;
    }

    private get randomPos(): Position {
        const x = Math.random() * this.birthplace.width + this.birthplace.x;
        const y = this.birthplace.height * 5 - this.size;

        return { x, y };
    }

    private get bubbleElement() {
        return this.root.querySelector('.bubble') as HTMLElement;
    }

    private get birthplace(): Area {
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

    private get parent() {
       return (this.parentElement as Glass).glass;
    }

    private size: number = 128;
    private x: number = 0;
    private y: number = 0;

    private get position() {
        return {
            x: this.x,
            y: this.y
        }
    }

    private minSize: number = 20;
    private maxSize: number = 160;
    private minOpacity: number = .5;
    private maxOpacity: number = 1.0;
    private padding: number = 10;
    private maxRiseDuration = 600;
    private minRiseDuration = 200;

    private _immortal: boolean = false;

    private _fullScreen: boolean = false;

    private get fullscreen() {
        return this._fullScreen;
    }

    private set fullscreen(full: boolean) {
        if (full) {

           this._animationCtrl?.enterFullscreen(this.space!);
           this.bubbleElement!.style.zIndex = "2";

        } else {

            this._animationCtrl?.exitFullscreen(this.size, this.position)
            this.bubbleElement!.style.zIndex = "1";
        } 

        this._fullScreen = full;
    }

    private get initSize() {
        if (this.immortal) {
            const sizeStr = this.getAttribute("size");
            return sizeStr ? parseFloat(sizeStr) : 60;
        }

        return this.randomSize;
    }

    private get initPos() {
        if (!this.immortal) {
            return this.randomPos;
        }

        const xStr = this.getAttribute("x");
        const yStr = this.getAttribute("y");

        return {
            x: xStr ? parseFloat(xStr) : 50,
            y: yStr ? parseFloat(yStr) : 50,
        }
    }

    private _died: boolean = true;

    private _growUp: boolean = false;

    private _animationCtrl: AnimationController | null = null;

    public get growUp() {
        return this._growUp;
    }

    public get immortal() {
        return this._immortal;
    }

    private set immortal(value: boolean) {
        if (value) {
            this.died = false;
        }
    }

    private get space() {
        return this.parent?.getBoundingClientRect();
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
