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
        for (const sibling of siblings)
        {
            await sibling.lifeCycle.nextStage();
        }
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

    onForgot: () => Promise<void> = async() => {};

}