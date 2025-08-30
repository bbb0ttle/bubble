import { css } from "../style/style.ts";
import type {Position} from "../types/Position.ts";
import {AnimationController} from "../animation/AnimationController.ts";
import {BaseBubbleConfiguration, type BubbleConfiguration} from "../config/BubbleConfiguration.ts";
import {type BubbleBehavior, NormalBubbleBehavior} from "../behavior/BubbleBehavior.ts";
import {BubbleLifeCycle} from "../behavior/BubbleLifeCycle.ts";

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

        this.configuration = new BaseBubbleConfiguration();
        this.position = this.configuration.initPos;
        this.opacity = this.configuration.initOpacity;
        this.size = this.configuration.initSize;
        this.element = this.root.querySelector(".bubble");
        this.animationCtrl = new AnimationController(this);
        this.behavior = new NormalBubbleBehavior(this);
        this.lifeCycle = new BubbleLifeCycle(this);
    }

    connectedCallback() {
        // style
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];

        this.element = this.root.querySelector('.bubble');
        this.animationCtrl = new AnimationController(this.element!);
        this.addEventListener('click', this.behavior.onClick);

        this.moveTo({ x: 100, y: 100});
        this.scaleTo(60);
        this.fade(1);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.behavior.onClick);
    }

    // public
    async lean(someNew: BubbleBehavior) {
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
        const scale = targetSize / this.size;
        await this.animationCtrl.scaleTo(scale, this.configuration.defaultAnimationDuration);
        this.size = targetSize;
    }

    async fade(targetOpacity: number) {
        await this.animationCtrl.fade(this.opacity, targetOpacity, this.configuration.defaultAnimationDuration);
        this.opacity = targetOpacity;
    }

    // 尺寸
    size: number;

    // 动画
    animationCtrl: AnimationController;

    // 行为
    behavior: BubbleBehavior;

    // 生命周期
    lifeCycle: BubbleLifeCycle;

    // private
    private element: HTMLElement | null = null;
    private opacity: number;
    private position: Position;
    private configuration: BubbleConfiguration;
}
