export function css(): string {
    return `
    ::host {
        display: inline-block;
    }
    
    ::slotted(*) {
        object-fit: cover;
    }
    
    .bubble {
        opacity: 0;
        width: 20px;
        height: 20px;
        top: 0px;
        left: 0px;
        border-radius: 50%;
        transition:
            width 0.2s ease-in-out,
            height 0.2s ease-in-out,
            opacity 0.2s ease-in-out,
            transform .2s ease-in-out;

        will-change: transform, width, height, opacity;

        -webkit-transform: translate3d(0, 0, 0);
        
        display: grid;
        place-content: center;
        
        overflow: hidden;
        
        position: absolute;
        
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        
        color: #efefef;

        background: #fff;
    }
`
}