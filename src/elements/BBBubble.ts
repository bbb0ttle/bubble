import {css} from "../style/style.ts";
import type {Position} from "../types/Position.ts";
import {AnimationController} from "../animation/AnimationController.ts";
import {BaseBubbleConfiguration, type BubbleConfiguration} from "../config/BubbleConfiguration.ts";
import {type BubbleBehavior } from "../behavior/BubbleBehavior.ts";
import {BubbleLifeCycle} from "../behavior/BubbleLifeCycle.ts";
import type {Glass} from "./Glass.ts";
import {NormalBubbleBehavior} from "../behavior/NormalBehavior.ts";

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
        this.behavior = new NormalBubbleBehavior(this);
        this.lifeCycle = new BubbleLifeCycle(this);
        this.space = this.parentElement as Glass;
    }

    connectedCallback() {
        // style
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];

        this.element = this.root.querySelector('.bubble');
        this.animationCtrl = new AnimationController(this.element!);
        this.addEventListener('click', this.behavior.onClick);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.behavior.onClick);
    }

    onParentConnect() {
        const originRect = this.space.glass!.getBoundingClientRect();

        this.spaceRect = {
            ...originRect,

            x: originRect.x + this.configuration.spacePadding,
            y: originRect.y + this.configuration.spacePadding,
            width: originRect.width - this.configuration.spacePadding * 2,
            height: originRect.height - this.configuration.spacePadding * 2
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
    }

    // public
    async learn(someNew: BubbleBehavior) {
        this.removeEventListener('click', this.behavior.onClick);
        this.behavior = someNew;
        this.addEventListener('click', this.behavior.onClick);
        await this.behavior.onBorn();
    }

    async moveTo(target: Position, duration: number = 200) {
        await this.animationCtrl.move(this.position, target, duration);
        this.position = target;
    }

    async scaleTo(targetSize: number) {
        const initSize = this.configuration.initSize;
        const safeSize = this.getSafeSize(targetSize);
        const scale = safeSize / initSize;
        await this.animationCtrl.scaleTo(this.size / initSize, scale, this.configuration.defaultAnimationDuration);
        this.size = safeSize;
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

        return { x, y };
    }

    centerPos() {
        return {
            x: this.position.x + this.size / 2,
            y: this.position.y + this.size / 2,
        }
    }

    idlePos() {
        const birthplace = this.birthplaceRect;
        if (!birthplace) {
            throw new Error("birthplace is null, please call onParentConnect() first");
        }

        const sizeRatio = this.size / this.configuration.maxSize;

        const y = birthplace.y - birthplace.height * sizeRatio * 3.0;

        return {
            x: this.position.x,
            y,
        }
    }

    topPos() {
        return {
            x: this.position.x,
            y: 0
        }
    }

    randomInitSize() {
        return Math.random() * this.configuration.sizeRandomRate + this.configuration.minSize;
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

    // 动画
    animationCtrl: AnimationController;

    // 行为
    behavior: BubbleBehavior;

    // 生命周期
    lifeCycle: BubbleLifeCycle;

    // 活动空间
    space: Glass;

    // 参数配置
    configuration: BubbleConfiguration;

    private element: HTMLElement | null = null;
    private opacity: number;
    private position: Position;
    private spaceRect: DOMRect | null = null;
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
}
