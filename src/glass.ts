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

        this.bubbles.forEach(b => {
            b.died = false;
        })
    }

    private eatOthers = (a: BBBubble) => {
        return Promise.all(
            this.bubbles.map((o) => {
                return a.tryEat(o);
            })
        );
    }

    private getRandomBubble() {
        const index = Math.floor(Math.random() * this.bubbles.length);
        return this.bubbles[index];
    }

    private async feedBubblesSequentially() {
        await this.bubbles.reduce(
            (prevPromise, currentBubble) =>
                prevPromise.then(() => this.eatOthers(currentBubble).then()),
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
                overflow: hidden;
             }
            
            ::slotted(*) {
                position: absolute;
            }
        `);

        this.root.adoptedStyleSheets = [styleSheet];

        this.collectBubblesFromSlot();

        await this.delay(500);

        this.feedBubblesSequentially();

        await this.delay(2000);

        setInterval(() => {
            const bubble = this.getRandomBubble();

            this.feedBubblesSequentially();

            if (bubble.growUp && !bubble.died) {
                bubble.died = true;
                return;
            }

            if (!bubble.growUp && bubble.died) {
                bubble.died = false;
            }
        }, 500 + Math.random() * 500);
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public disconnectedCallback() {
    }

}