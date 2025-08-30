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
                await this.born();
                break;
            case Stage.BORN:
                await this.grown();
                break;
            case Stage.GROWN:
                if (!this.bubble.behavior.isReadyToDie()) {
                    return;
                }
                await this.died();
                break;
        }
    }

    private async died() {
        await this.bubble.behavior.onDeath();

        this.stage = Stage.DIED;
        this.bubble.dispatchEvent(new CustomEvent(Stage.DIED, { bubbles: true, composed: true }));
    }

    private async born() {
        await this.bubble.behavior.onBorn();

        this.stage = Stage.BORN;
        this.bubble.dispatchEvent(new CustomEvent(Stage.BORN, { bubbles: true, composed: true }));
    }

    private stageActionMap: Map<Stage, () => Promise<void>> = new Map([
        [Stage.DIED, this.died.bind(this)],
        [Stage.BORN, this.born.bind(this)],
        [Stage.GROWN, this.grown.bind(this)],
    ]);

    async goto(stage: Stage): Promise<void> {
        const action = this.stageActionMap.get(stage);
        if (action) {
            await action();
        }
    }

    isAt(stage: Stage): boolean {
        return this.stage === stage;
    }

    private stage: Stage;
    private bubble: BBBubble;


    private async grown() {
        await this.bubble.behavior.onGrown();

        this.stage = Stage.GROWN;
        this.bubble.dispatchEvent(new CustomEvent(Stage.GROWN, { bubbles: true, composed: true }));
    }
}