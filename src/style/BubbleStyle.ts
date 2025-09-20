import type { BBBubble } from "../elements/BBBubble";
import {css} from "./style.ts";

export class BubbleStyle {
    constructor(bubble: BBBubble, initSize: number) {
        this.bubble = bubble;

        this.baseStyle = new CSSStyleSheet();
        this.extraStyle = new CSSStyleSheet();

        this.baseStyle.replaceSync(css(initSize));
        this.bubble.root.adoptedStyleSheets = [this.baseStyle, this.extraStyle];
    }

    private readonly extraStyle: CSSStyleSheet;
    private readonly baseStyle: CSSStyleSheet;

    private bubble: BBBubble;

    public replaceSync(s: string) {
        this.extraStyle.replaceSync(s);
    }

    public destroy() {
        this.bubble.root.adoptedStyleSheets = [this.baseStyle];
    }
}