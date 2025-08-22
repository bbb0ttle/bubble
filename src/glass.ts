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

    bubbles: BBBubble[] = [];

    collectBubblesFromSlot() {
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

  eatOthers = (a: BBBubble) => {
    return Promise.all(
      this.bubbles.map((o) => {
        return a.tryEat(o);
      })
    );
  }

  async feedBubblesSequentially() {
    await this.bubbles.reduce(
      (prevPromise, currentBubble) =>
        prevPromise.then(() => this.eatOthers(currentBubble).then()),
      Promise.resolve()
    );
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
                height: 100vh;
                overflow: hidden;
             }
            
            ::slotted(*) {
                position: absolute;
            }
        `);

        this.root.adoptedStyleSheets = [styleSheet];

        this.collectBubblesFromSlot();

        setTimeout(() => {
            this.feedBubblesSequentially();
        }, 500)
    }

    public disconnectedCallback() {
    }

}