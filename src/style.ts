export function css(): string {
    return `
    ::host {
        display: inline-block;
    }
    
    .bubble {
        width: 128px;
        height: 128px;
        top: 100vh;
        left: 50vw;
        border-radius: 50%;
        transition:
            width 0.2s ease-in-out,
            height 0.2s ease-in-out,
            opacity 0.2s ease-in-out,
            top 0.2s ease-in-out,
            left 0.2s ease-in-out;
        
        display: grid;
        place-content: center;
        
        position: absolute;
        
        box-shadow: inset 0 -8px 16px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        
        color: #ccc;
    }
    
    [clicked] {
        animation: scale-in-out 0.2s;
    }
    
    [idle] {
        animation: idle 2s ease-in-out infinite;
    }

    [visible] {
        opacity: 1;
    }

    [hide] {
        opacity: 0 !important;
    }

    @keyframes scale-in-out {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
            opacity: 1;
        }
        100% {
            transform: scale(1);
        }
    }
    
    @keyframes idle {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
`
}