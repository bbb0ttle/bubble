import {css} from "../style/style.ts";
import type {Position} from "../types/Position.ts";
import {AnimationController} from "../animation/AnimationController.ts";
import {BaseBubbleConfiguration, type BubbleConfiguration} from "../config/BubbleConfiguration.ts";
import {type BubbleBehavior} from "../behavior/BubbleBehavior.ts";
import {BubbleLifeCycle} from "../behavior/BubbleLifeCycle.ts";
import type {Glass} from "./Glass.ts";
import {BehaviorRegistry} from "../behavior/BehaviorRegistry.ts";
import {BubbleEventListener} from "../event/BubbleEventListener.ts";
import {Queue} from "../utils/queue.ts";
import {MovePromise} from "../types/MoveOption.ts";

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

        if (this.parentElement?.tagName !== "BB-GLASS") {
            throw new Error("BBBubble must be a child of BBGlass, eg. <bb-glass><bb-bubble></bb-bubble></bb-glass>");
        }

        this.configuration = new BaseBubbleConfiguration();
        this.position = this.configuration.initPos;
        this.opacity = this.configuration.initOpacity;
        this.size = this.configuration.initSize;
        this.element = this.root.querySelector(".bubble");
        this.animationCtrl = new AnimationController(this);
        this.behaviorRegistry = new BehaviorRegistry(this);
        this.behavior = this.behaviorRegistry.get(this.getAttribute("type") ?? "default")!;
        this.lifeCycle = new BubbleLifeCycle(this);
        this.space = this.parentElement as Glass;
        this.eventListener = new BubbleEventListener(this);
    }

    static get observedAttributes() {
        return ["type"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === "type" && oldValue !== newValue) {
            const behavior = this.behaviorRegistry.get(newValue);
            this.learn(behavior).then();
        }
    }

    connectedCallback() {
        // style
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css(this.configuration.initSize));
        this.root.adoptedStyleSheets = [stylesheet];

        this.element = this.root.querySelector('.bubble');
        this.animationCtrl = new AnimationController(this.element!);

        this.dispatchEvent(new CustomEvent('bubble-connected', {
            bubbles: true,
        }))
    }

    disconnectedCallback() {
        this.eventListener.destroy();
    }

    async onParentConnect() {
        const originRect = this.space.glass!.getBoundingClientRect();

        this.spaceRect = {
            ...originRect,

            x: 0,
            y: 0,
            width: originRect.width,
            height: originRect.height,
        };

        const areaHeight = this.spaceRect.height * .2;

        const payload = {
            x: this.spaceRect.x,
            y: this.spaceRect.height - areaHeight,
            width: this.spaceRect.width,
            height: areaHeight
        }

        this.birthplaceRect = {
            toJSON(): any {
                return JSON.stringify(payload);
            },
            bottom: 0,
            left: 0,
            right: 0,
            top: payload.y,
            ...payload
        }

        this.dispatchEvent(new CustomEvent('bubble-connected', {
            bubbles: true,
        }))

        await this.learn(this.getBehaviorByType());
    }

    private getBehaviorByType() {
        return this.behaviorRegistry.get(this.getAttribute("type") ?? "default");
    }

    async learn(someNew: BubbleBehavior | undefined) {
        if (!someNew) {
            return;
        }

        await this.behavior?.onForgot();

        this.behavior = someNew;

        await someNew.onLearned();
    }

    gotoParamQueue: Queue<MovePromise> = new Queue();

    async goto(target: Position, duration: number = 200, force = false) {
        const movePromise = new MovePromise(target, duration, force);
        await this.addMovePromise(movePromise);
        await movePromise.done;
    }

    private async addMovePromise(movePromise: MovePromise) {
        this.gotoParamQueue.enqueue(movePromise);

        while (!this.gotoParamQueue.isEmpty()) {
          await this.consumeFromQueue()
        }
    }

    private async consumeFromQueue() {
        if (this.gotoParamQueue.isEmpty()) {
            return;
        }

        const next = this.gotoParamQueue.dequeue()!;
        await this.move(next.target, next.duration, next.force)
        next.resolve()
    }

    private async move(target: Position, duration: number = 200, force = false) {
        target = force ? target : this.getSafePos(target);

        if (duration == 0) {
            requestAnimationFrame(() => {
                this.element!.style.setProperty("translate", `${target.x}px ${target.y}px`, 'important');
            })

            this.position = target;
            return;
        }

        this.element!.style.removeProperty("translate");

        await this.animationCtrl.move(this.position, target, duration);
        this.position = target;
    }

    display(show: boolean) {
        if (!this.element) {
            return;
        }

        this.element.style.setProperty("display", show ? "grid" : "none");
    }

    private scaling = false;
    async scaleTo(targetSize: number, duration: number = this.configuration.defaultAnimationDuration, force = false) {
        if (this.scaling) {
            return;
        }
        this.scaling = true;
        const safeSize = force ? targetSize : this.getSafeSize(targetSize);
        this.element!.style.transitionDuration = duration + 'ms';
        await new Promise(resolve => {
            this.updateSize(safeSize);

            setTimeout(resolve, duration);
        })
        this.size = safeSize;
        this.scaling = false;
    }

    async bounce(size = -1) {
        const duration = this.configuration.defaultAnimationDuration;
        if (size < 0) {
            size = this.size;
        }
        await this.scaleTo(size * 1.1, duration * .5);
        await this.scaleTo(size * 0.9, duration * .3);
        await this.scaleTo(size , duration * .2);
    }

    async fade(targetOpacity: number, duration: number = this.configuration.defaultAnimationDuration) {
        await this.animationCtrl.fade(this.opacity, targetOpacity, duration);
        this.opacity = targetOpacity;
    }

    getSiblings(): BBBubble[] {
        if (!this.space) {
            return [];
        }

        return this.space.bubbles.filter(b => b!= this);
    }

    isOverlapWith(another: BBBubble): boolean {
        const distBetweenBubbles = Math.sqrt(
            Math.pow(this.position.x - another.position.x, 2) + Math.pow(this.position.y - another.position.y, 2));

        return distBetweenBubbles < (this.size + another.size) / 2;
    }

    randomInitPos() {
        if (!this.birthplaceRect) {
            throw new Error("spaceRect is null, please call onParentConnect() first");
        }

        const x = Math.random() * this.birthplaceRect.width + this.birthplaceRect.x;
        const y = this.birthplaceRect.height * 5 - this.size;

        return this.getSafePos({ x, y })
    }

    centerPos() {
        return this.getSafePos({
            x: this.position.x + this.size / 2,
            y: this.position.y + this.size / 2,
        });
    }

    idlePos() {
        const birthplace = this.birthplaceRect;
        if (!birthplace) {
            throw new Error("birthplace is null, please call onParentConnect() first");
        }

        const sizeRatio = this.size / this.configuration.maxSize;

        const y = birthplace.y - birthplace.height * sizeRatio * 3.0;

        return this.getSafePos({
            x: this.position.x,
            y,
        });
    }

    topPos() {
        return this.getSafePos({
            x: this.position.x,
            y: 0
        });
    }

    randomInitSize() {
        return this.getSafeSize(Math.random() * this.configuration.sizeRandomRate + this.configuration.minSize);
    }

    randomInitOpacity() {
        const { minSize, maxSize, maxOpacity, minOpacity } = this.configuration;
        const ratio = (this.size - minSize) / (maxSize - minSize);
        return minOpacity + (maxOpacity - minOpacity) * ratio;
    }

    moveDuration() {
        const {
            minSize, maxSize, minMoveDuration, maxMoveDuration
        } = this.configuration;
        const ratio = (this.size - minSize) / (maxSize - minSize);
        return maxMoveDuration - (maxMoveDuration - minMoveDuration) * (1 - ratio);
    }

    // 尺寸
    size: number;

    // 位置
    position: Position;

    // 动画
    animationCtrl: AnimationController;

    // 行为
    behaviorRegistry: BehaviorRegistry;
    behavior: BubbleBehavior;

    // 交互事件
    eventListener: BubbleEventListener;

    // 生命周期
    lifeCycle: BubbleLifeCycle;

    // 活动空间
    space: Glass;
    spaceRect: DOMRect | null = null;

    // 参数配置
    configuration: BubbleConfiguration;

    element: HTMLElement | null = null;

    opacity: number;
    private birthplaceRect: DOMRect | null = null;

    private getSafeSize(size: number): number {
        const { minSize, maxSize } = this.configuration;
        if (size < minSize) {
            return minSize;
        } else if (size > maxSize) {
            return maxSize;
        }
        return size;
    }

    private updateSize(size: number) {
        if (this.element) {
            this.element.style.width = `${size}px`;
            this.element.style.height = `${size}px`;
        }
    }

    private getSafePos(pos: Position): Position {
        return {
            x: this.getSafeX(pos.x),
            y: this.getSafeY(pos.y)
        }
    }

    private getSafeX(x: number) {
        const { spacePadding } = this.configuration;

        if (x < spacePadding) {
            return spacePadding;
        }

        const rightBound = x + this.size;

        let parentWidth = this.spaceRect?.width || 0;
        if (rightBound > parentWidth - spacePadding) {
            return parentWidth - spacePadding - this.size;
        }

        return x;
    }

    private getSafeY(y: number) {
        const { spacePadding } = this.configuration;

        if (y < spacePadding) {
            return spacePadding;
        }

        let parentHeight = this.spaceRect?.height || 0;
        const bottomBound = y + this.size;
        if (bottomBound > parentHeight - spacePadding) {
            return parentHeight - spacePadding - this.size;
        }

        return y;
    }
}
