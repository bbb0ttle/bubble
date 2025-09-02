import type {BubbleBehavior} from "./BubbleBehavior.ts";
import  {type BBBubble} from "../elements/BBBubble.ts";
import type { Position } from "../types/Position.ts";

export class DebugBehavior implements BubbleBehavior {
    actor: BBBubble;

    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    onForgot: () => Promise<void> = async() => {};

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

    onGlassReady(): Promise<void> {
        return Promise.resolve(undefined);
    }

    onDrag?: ((pos: Position, originEvent: Event) => Promise<void>) | undefined = async (pos, _evt) => {
        pos.x -= this.actor.size / 2;
        pos.y -= this.actor.size / 2;
        await this.actor.moveTo(pos, 0);
    };

    onPointEvtCancel?: (() => void) | undefined = () => {
        this.actor.element?.style.removeProperty("translate");
        console.log("style removed");
        this.actor.moveTo(this.actor.randomInitPos());
    };

}