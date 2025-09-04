import type {BubbleBehavior} from "./BubbleBehavior.ts";
import  {type BBBubble} from "../elements/BBBubble.ts";

export class ImmortalBehavior implements BubbleBehavior {
    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    private born = false;

    isReadyToDie(): boolean {
        return false;
    }

    isReadyToGrow(): boolean {
        return false;
    }

    async onBorn(): Promise<void> {
        if (this.born) {
            return;
        }

        this.actor.display(false);
        await this.actor.scaleTo(80);
        this.actor.display(true)
        this.actor.fade(this.actor.randomInitOpacity()).then();
        await this.actor.moveTo({ x: 50, y: 50 })

        this.born = true;
    }

    onClick = async () => {
        await this.actor.bounce();

        const siblings = this.actor.getSiblings();
        for (const s of siblings) {
            await this.delay(Math.random() * 200);
            s.lifeCycle.nextStage().then();
        }
    }

    private delay(ms: number) {
        return new Promise((r) => {
            setTimeout(r, ms)
        })
    }

    onDeath(): Promise<void> {
        return Promise.resolve(undefined);
    }

    onGrown(): Promise<void> {
        return Promise.resolve(undefined);
    }

    onTouch(_another: BBBubble): Promise<void> {
        return Promise.resolve(undefined);
    }

    onForgot: () => Promise<void> = async() => {};

}