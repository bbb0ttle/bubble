class BBBubble extends HTMLElement {
    root: ShadowRoot;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = `
            <div class="bubble" idle float>
                <slot></slot>
            </div>
        `;
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

    updateSize(newSize: number) {
        this.size = this.getSafeSize(newSize);
        (this.root.querySelector('.bubble') as HTMLElement)!.style.width = `${this.size}px`;
        (this.root.querySelector('.bubble') as HTMLElement)!.style.height = `${this.size}px`;
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

        // init size from attr
        const sizeAttr = this.getAttribute('size');
        if (sizeAttr) {
            this.updateSize(parseInt(sizeAttr, 10));
        }

        this.root.adoptedStyleSheets = [stylesheet];
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
        border-radius: 50%;
        
        display: grid;
        place-content: center;
        
        position: absolute;
        
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)
    }
    
    [idle] {
        animation: idle 2s ease-in-out infinite;
    }
    
    [float] {
        animation: float 2s ease-in-out infinite;
    }
    
    [float][idle] {
        animation: float 2s ease-in-out infinite, idle 2s ease-in-out infinite;
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
    
    @keyframes float {
        0% {
            top: 8px;
        }
        50% {
            top: 5px;
        }
        100% {
            top: 8px
        }
    }
`
}
