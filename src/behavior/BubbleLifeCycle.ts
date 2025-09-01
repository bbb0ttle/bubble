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

    get IsTransitioning(): boolean {
        return this._transitioning;
    }

    private _transitioning = false;
    async nextStage(): Promise<void> {
        if (this._transitioning) {
            return;
        }

        this._transitioning = true;

        const next = this.stageCycleMap.get(this.stage);
        if (next) {
            await this.goto(next);
        }

        this._transitioning = false;
    }

    async goto(stage: Stage): Promise<void> {
        const action = this.stageActionMap.get(stage);
        if (action) {
            await action();
        }
    }

    isAt(stage: Stage): boolean {
        return this.stage === stage;
    }


    private async born() {
        await this.bubble.behavior.onBorn();
        this.stage = Stage.BORN;
        this.bubble.dispatchEvent(new CustomEvent(Stage.BORN, { bubbles: true, composed: true }));
    }

    private async died() {
        if (!this.bubble.behavior.isReadyToDie()) {
            return;
        }
        await this.bubble.behavior.onDeath();
        this.stage = Stage.DIED;
        this.bubble.dispatchEvent(new CustomEvent(Stage.DIED, { bubbles: true, composed: true }));
    }

    private async grown() {
        if (!this.bubble.behavior.isReadyToGrow()) {
            return;
        }

        await this.bubble.behavior.onGrown();
        this.stage = Stage.GROWN;
        this.bubble.dispatchEvent(new CustomEvent(Stage.GROWN, { bubbles: true, composed: true }));
    }

    private stageActionMap: Map<Stage, () => Promise<void>> = new Map([
        [Stage.DIED, this.died.bind(this)],
        [Stage.BORN, this.born.bind(this)],
        [Stage.GROWN, this.grown.bind(this)],
    ]);

    private stageCycleMap: Map<Stage, Stage> = new Map([
        [Stage.DIED, Stage.BORN],
        [Stage.BORN, Stage.GROWN],
        [Stage.GROWN, Stage.DIED],
    ]);

    private stage: Stage;
    private bubble: BBBubble;
}