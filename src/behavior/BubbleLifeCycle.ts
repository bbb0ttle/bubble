import type {BBBubble} from "../elements/BBBubble.ts";

export enum Stage {
    BORN = 'bubble-born',
    GROWN = 'bubble-grown',
    DIED = 'bubble-died',
}

export class BubbleLifeCycle {
    constructor(bubble: BBBubble, stage: Stage = Stage.DIED) {
        this.bubble = bubble;
        this.stage = stage;
    }

    async nextStage(): Promise<void> {
        switch (this.stage) {
            case Stage.DIED:
                await this.bubble.behavior.onBorn();

                this.stage = Stage.BORN;
                this.bubble.dispatchEvent(new CustomEvent(Stage.BORN, { bubbles: true, composed: true }));

                break;
            case Stage.BORN:
                await this.bubble.behavior.onGrown();

                this.stage = Stage.GROWN;
                this.bubble.dispatchEvent(new CustomEvent(Stage.GROWN, { bubbles: true, composed: true }));

                break;
            case Stage.GROWN:
                await this.bubble.behavior.onDeath();

                this.stage = Stage.DIED;
                this.bubble.dispatchEvent(new CustomEvent(Stage.DIED, { bubbles: true, composed: true }));
                break;
        }
    }

    async to(stage: Stage): Promise<void> {
        while (this.stage !== stage) {
            await this.nextStage();
        }
    }

    private stage: Stage;
    private bubble: BBBubble;






}