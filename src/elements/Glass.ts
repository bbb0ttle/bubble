import { BBBubble } from "./BBBubble.ts";

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

    private collectBubblesFromSlot() {
        const slot = this.root.querySelector('slot');
        if (slot) {
            this.bubbles = Array.from(slot.assignedElements()).filter(el => el instanceof BBBubble) as BBBubble[];
            this.bubbles.forEach(bubble => {
                bubble.onParentConnect();
            })
        } else {
            this.bubbles = [];
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

    public wakeBubblesUp() {
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

        this.setViewportHeight();

        this.collectBubblesFromSlot();

        window.addEventListener('resize', this.setViewportHeight);
        window.addEventListener('orientationchange', this.setViewportHeight);


        this.wakeBubblesUp();

        setInterval(() => {
            const bubble = this.getRandomBubble();
            bubble.lifeCycle.nextStage();
        }, 1000);

        console.log("parent connected")
    }

    public disconnectedCallback() {
        window.removeEventListener('resize', this.setViewportHeight);
        window.removeEventListener('orientationchange', this.setViewportHeight);
    }
}