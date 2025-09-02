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
        await this.actor.scaleTo(200);
        this._pos = {x: 100, y: 200};
        await this.actor.moveTo(this._pos);
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

    private _pos: Position = { x: 0, y: 0 };
    async onLongPress(_pos: Position, _evt: Event): Promise<void> {

        this.actor.bounce(this.actor.size * 1.5).then()
    }

    onDrag?: ((pos: Position, originEvent: Event) => Promise<void>) | undefined = async (pos, _evt) => {
        this._pos = pos;
        pos.x -= this.actor.size / 2;
        pos.y -= this.actor.size / 2;
        await this.actor.moveTo(pos, 0);
    };

    onPointEvtCancel?: (() => void) | undefined = () => {
        this.actor.element?.style.removeProperty("translate");
        console.log("style removed");
        this.actor.moveTo(this._pos).then();
    };

}