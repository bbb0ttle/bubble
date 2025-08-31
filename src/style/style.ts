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
        
        will-change: transform, opacity;
        
        display: grid;

        place-content: center;
        
        overflow: hidden;
        
        position: absolute;
        
        // box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        
        color: #efefef;
    }
    
    .bubble::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        opacity: .9;
        z-index: -1
    }
`
}