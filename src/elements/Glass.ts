import {BBBubble} from "./BBBubble.ts";
import {NormalBubbleBehavior} from "../behavior/NormalBehavior.ts";
import {Stage} from "../behavior/BubbleLifeCycle.ts";

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
        console.log("vh", vh)
        document.documentElement.style.setProperty('--myvh', `${vh}px`);
    }

    private getRandomBubble() {
        const index = Math.floor(Math.random() * this.bubbles.length);
        return this.bubbles[index];
    }

    public async wakeBubblesUp() {
        for (const bubble of this.bubbles) {
            await bubble?.lifeCycle.nextStage();
            if (bubble.behavior instanceof NormalBubbleBehavior) {
                await bubble.behavior.eatEachOther();
            }
        }
    }

    public async getRandomDiedBubble() {
        const diedBubbles = this.bubbles.filter(bubble => bubble.lifeCycle.isAt(Stage.DIED));
        if (diedBubbles.length !== 0) {
            const dice = Math.floor(Math.random() * diedBubbles.length);
            return diedBubbles[dice];
        }

        const randomBubble = this.getRandomBubble();
        await randomBubble.lifeCycle.goto(Stage.DIED)

        return randomBubble;
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

        this.collectBubblesFromSlot().then(() => {
            this.wakeBubblesUp.bind(this)

            setInterval(() => {
                const bubble = this.getRandomBubble();
                bubble.lifeCycle.nextStage().then();
            }, 600);
        });
    }

    public disconnectedCallback() {
        window.removeEventListener('resize', this.setViewportHeight);
        window.removeEventListener('orientationchange', this.setViewportHeight);
    }
}