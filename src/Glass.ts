import { BBBubble } from "./BBBubble";

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

    private setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        console.log("vh", vh)
        document.documentElement.style.setProperty('--myvh', `${vh}px`);
    }

    // 初始设置

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
                height: calc(var(--myvh, 1myvh) * 100);
                overflow: hidden;
                contain: layout style paint;
             }
            
            ::slotted(*) {
                position: absolute;
            }
        `);

        this.root.adoptedStyleSheets = [styleSheet];

        this.collectBubblesFromSlot();

        window.addEventListener('resize', this.setViewportHeight);
        window.addEventListener('orientationchange', this.setViewportHeight);

        this.setViewportHeight();

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
        window.removeEventListener('resize', this.setViewportHeight);
        window.removeEventListener('orientationchange', this.setViewportHeight);
    }
}