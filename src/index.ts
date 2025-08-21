class BBBubble extends HTMLElement {
    root: ShadowRoot;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = `
            <div class="bubble" idle>
                <slot></slot>
            </div>
        `;
    }

    public pauseAnimation() {
        this.getBubbleElement()?.removeAttribute('idle');
    }

    public playAnimation() {
        this.getBubbleElement()?.setAttribute('idle', '');
    }

    public moveTo(x: number, y: number) {
        const bubble = this.getBubbleElement();
        if (bubble) {
            bubble.style.top = `${y}px`;
            bubble.style.left = `${x}px`;
        }
    }

    public updateSize(newSize: number) {
        this.size = this.getSafeSize(newSize);

        const bubble = this.getBubbleElement();

        bubble!.style.width = `${this.size}px`;
        bubble!.style.height = `${this.size}px`;
    }

    private getBubbleElement(): HTMLElement | null {
        return this.root.querySelector('.bubble') as HTMLElement;
    }

    size: number = 128;
    minSize: number = 30;
    maxSize: number = 300;

    getSafeSize(size: number): number {
        if (size < this.minSize) {
            return this.minSize;
        } else if (size > this.maxSize) {
            return this.maxSize;
        }
        return size;
    }

    static get observedAttributes() {
        return ['size'];
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'size') {
            this.updateSize(parseInt(newValue, 10));
        }
    }

    connectedCallback() {
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
        this.root.adoptedStyleSheets = [stylesheet];

        // init size from attr
        const sizeAttr = this.getAttribute('size');
        if (sizeAttr) {
            this.updateSize(parseInt(sizeAttr, 10));
        }

    }
}

if (!window.customElements.get('bb-bubble')) {
    window.BBBubble = BBBubble;
    window.customElements.define('bb-bubble', BBBubble);
}

declare global {
    interface Window {
        BBBubble: typeof BBBubble;
    }

    interface HTMLElementTagNameMap {
        'bubble': BBBubble;
    }
}

function css(): string {
    return `
    ::host {
        display: inline-block;
    }

    .bubble {
        width: 128px;
        height: 128px;
        top: 0px;
        left: 0px;
        border-radius: 50%;
        transition: width 0.2s ease-in-out, height 0.2s ease-in-out, top 0.2s ease-in-out, left 0.2s ease-in-out;
        
        display: grid;
        place-content: center;
        
        position: absolute;
        
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)
    }
    
    [idle] {
        animation: idle 2s ease-in-out infinite;
    }
    
    @keyframes idle {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.03);
        }
        100% {
            transform: scale(1);
        }
    }
`
}
