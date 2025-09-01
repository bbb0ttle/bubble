export function css(initSize: number): string {
    return `
    ::host {
        display: inline-block;
    }
    
    ::slotted(*) {
        object-fit: cover;
    }
    
    .bubble {
        width: ${initSize}px;
        height: ${initSize}px;
        opacity: 0;

        border-radius: 50%;
        
        transition: width 0.2s ease-in-out, height 0.2s ease-in-out;
        
        will-change: transform, opacity;
        
        display: grid;

        place-content: center;
        
        overflow: hidden;
        
        position: absolute;
        
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        
        color: #ccc;
        font-size: 14px;
    }
`
}