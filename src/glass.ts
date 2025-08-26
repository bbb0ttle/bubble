import { BBBubble } from "./index.ts";

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

    private bubbles: BBBubble[] = [];

    private collectBubblesFromSlot() {
        const slot = this.root.querySelector('slot');
        if (slot) {
            this.bubbles = Array.from(slot.assignedElements()).filter(el => el instanceof BBBubble) as BBBubble[];
        } else {
            this.bubbles = [];
        }
    }

    public eatOthers = (a: BBBubble) => {
        return this.bubbles.reduce(
            (prevPromise, currentBubble) =>
                prevPromise.then(() => a.tryEat(currentBubble).then()),
            Promise.resolve()
        );
    }

    private getRandomBubble() {
        const index = Math.floor(Math.random() * this.bubbles.length);
        return this.bubbles[index];
    }

    public wakeBubblesUp() {
        return this.bubbles.filter(b => b.died).reduce(
            (prevPromise, currentBubble) =>
                prevPromise.then(async () => {
                    currentBubble.died = false;
                    await this.delay(50 + Math.random() * 100);
                }),
            Promise.resolve()
        );
    }

    public get glass(): HTMLElement | null {
        return this.root.querySelector('.glass') as HTMLElement;
    }

    public async connectedCallback() {
        const styleSheet = new CSSStyleSheet();

        styleSheet.replaceSync(`
            .glass {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 9999;
                width: 100vw;
                height: 100vh;
                height: 100dvh;
                overflow: hidden;
             }
            
            ::slotted(*) {
                position: absolute;
            }
        `);

        this.root.adoptedStyleSheets = [styleSheet];

        this.collectBubblesFromSlot();

        this.wakeBubblesUp();

        await this.delay(2000);

        setInterval(() => {
            const bubble = this.getRandomBubble();
            if (bubble.immortal || bubble.expanded) {
                return;
            }

            if (bubble.growUp && !bubble.died) {
                bubble.died = true;
                return;
            }

            if (!bubble.growUp && bubble.died) {
                bubble.died = false;
                return;
            }
        }, 600);
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public disconnectedCallback() {
    }

}