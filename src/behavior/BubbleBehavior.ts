import type {BBBubble} from "../elements/BBBubble.ts";

export interface BubbleBehavior {
    actor: BBBubble,

    onBorn: () => Promise<void>;

    onGrown: () => Promise<void>;

    onDeath: () => Promise<void>;

    onTouch: (another: BBBubble) => Promise<void>;

    onClick: () => Promise<void>;
}

export class NormalBubbleBehavior implements BubbleBehavior {
    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    onBorn: () => Promise<void> = async () => {
        // move to born position


    };

    onGrown: () => Promise<void> = async () => {

    }

    onDeath: () => Promise<void> = async () => {
        // rise to the surface and hide
    };

    onTouch: (another: BBBubble) => Promise<void> = async (another: BBBubble) => {
        // eat the smaller one
        if (this.actor === another) {
            return;
        }
    };

    onClick: () => Promise<void> = async () => {
        await this.actor.lifeCycle.nextStage();
    };

}