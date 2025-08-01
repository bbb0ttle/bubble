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

    connectedCallback() {
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css());
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
