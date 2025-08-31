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
        await this.actor.moveTo({ x: 80, y: 80 })

        this.born = true;
    }

    onClick(): Promise<void> {
        return Promise.resolve(undefined);
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

    onGlassReady(): Promise<void> {
        return this.onBorn()
    }

}