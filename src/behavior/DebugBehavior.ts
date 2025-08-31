import type {BubbleBehavior} from "./BubbleBehavior.ts";
import type {BBBubble} from "../elements/BBBubble.ts";

export class DebugBehavior implements BubbleBehavior {
    actor: BBBubble;

    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    isReadyToDie(): boolean {
        return false;
    }

    isReadyToGrow(): boolean {
        return false;
    }

    async onBorn(): Promise<void> {
        await this.actor.scaleTo(600);
        await this.actor.moveTo({ x: 1000, y: 2000});
        await this.actor.fade(1);
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

}