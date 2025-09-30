import {BBBubble} from "./BBBubble.ts";
import {Stage} from "../behavior/BubbleLifeCycle.ts";
import { NormalBubbleBehavior } from "../behavior/NormalBehavior.ts";

export class Glass extends HTMLElement {
    root: ShadowRoot;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = `
            <div class="glass">
                <slot></slot>
            </div>
        `;
    }

    public bubbles: BBBubble[] = [];

    private async collectBubblesFromSlot() {
        const slot = this.root.querySelector('slot');
        if (!slot) {
            return [];
        }

        this.bubbles = Array.from(slot.assignedElements()).filter(el => el instanceof BBBubble) as BBBubble[];
        for (const bubble of this.bubbles) {
            await bubble.onParentConnect();
        }
    }

    private setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--myvh', `${vh}px`);
    }

    private getRandomBubble() {
        const bubbles = this.bubbles.filter(bubble => bubble.behavior instanceof NormalBubbleBehavior);
        const index = Math.floor(Math.random() * bubbles.length);
        return bubbles[index];
    }

    public async getRandomDiedBubble() {
        const diedBubbles = this.bubbles.filter(bubble => {
            if (!(bubble.behavior instanceof NormalBubbleBehavior)) {
                return false;
            }

            return bubble.lifeCycle.isAt(Stage.RECYCLED);
        });

        if (diedBubbles.length !== 0) {
            const dice = Math.floor(Math.random() * diedBubbles.length);
            return diedBubbles[dice];
        }

        const bubble = this.getRandomBubble();

        await bubble.fade(0);

        bubble.lifeCycle.stop();

        return bubble;
    }

    public get glass(): HTMLElement | null {
        return this.root.querySelector('.glass') as HTMLElement;
    }

    public connectedCallback() {
        const styleSheet = new CSSStyleSheet();

        styleSheet.replaceSync(`
            .glass {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 9999;
                width: 100vw;
                height: calc(var(--myvh, 1myvh) * 100);
                overflow: hidden;
                contain: layout style paint;
             }
            
            ::slotted(*) {
                position: absolute;
            }
        `);

        this.root.adoptedStyleSheets = [styleSheet];

        this.setViewportHeight();

        window.addEventListener('resize', this.setViewportHeight);
        window.addEventListener('orientationchange', this.setViewportHeight);

        this.collectBubblesFromSlot();
    }

    public disconnectedCallback() {
        window.removeEventListener('resize', this.setViewportHeight);
        window.removeEventListener('orientationchange', this.setViewportHeight);
    }
}