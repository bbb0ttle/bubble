export function css(): string {
    return `
    ::host {
        display: inline-block;
    }
    
    ::slotted(*) {
        object-fit: cover;
    }
    
    .bubble {
        width: 20px;
        height: 20px;
        opacity: 0;

        border-radius: 50%;
        
        will-change: transform, opacity;

        transition: transform .2s ease-in-out;

        transform: translate3d(0, 0, 0);
        
        display: grid;

        place-content: center;
        
        overflow: hidden;
        
        position: absolute;
        
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        
        color: #efefef;
    }
`
}