import type { BBBubble } from "../elements/BBBubble";

export class ExternalStyle {
    constructor(bubble: BBBubble) {
        this.extraStyle = new CSSStyleSheet();
        this.bubble = bubble;
        this.bubble.root.adoptedStyleSheets = [...this.bubble.root.adoptedStyleSheets, this.extraStyle];
    }

    private extraStyle: CSSStyleSheet;
    private bubble: BBBubble;

    public replaceSync(s: string) {
        this.extraStyle.replaceSync(s);
    }

    public destroy() {
        this.bubble.root.adoptedStyleSheets = this.bubble.root.adoptedStyleSheets.filter(s => s !== this.extraStyle);
    }
}