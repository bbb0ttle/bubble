import type {BBBubble} from "../elements/BBBubble.ts";

export enum Stage {
    BORN = 'bubble-born',
    GROWN = 'bubble-grown',
    DIED = 'bubble-died',
    SICK = 'bubble-sick',
}

export class BubbleLifeCycle {
    constructor(bubble: BBBubble, stage: Stage = Stage.DIED) {
        this.bubble = bubble;
        this.stage = stage;
    }

    isAtTheSameStageWith(other: BubbleLifeCycle): boolean {
        return this.stage === other.stage;
    }

    async nextStage(isSick: boolean = false): Promise<void> {
        if (this._transitioning) {
            return;
        }

        this._transitioning = true;

        if (isSick) {
            try {
                await this.bubble.behavior.onSick();
            } catch (error) {
                console.error("onSick error:", error);
            }

            this._transitioning = false;
            return;
        }

        const next = this.stageCycleMap.get(this.stage);
        if (next) {
            await this.goto(next);
        }

        this._transitioning = false;
    }

    isAt(stage: Stage): boolean {
        return this.stage === stage;
    }

    private async goto(stage: Stage): Promise<void> {
        const action = this.stageActionMap.get(stage);
        if (action) {
            try {
                await action();
            } catch (e) {
                console.error("lifecycle action error:", e);
            }
        }
    }

    private async born() {
        try {
            await this.bubble.behavior.onBorn();
        } catch (e) {
            console.error("onBorn error:", e);
        }

        this.stage = Stage.BORN;
        this.bubble.dispatchEvent(new CustomEvent(Stage.BORN, { bubbles: true, composed: true }));
    }

    private async died() {
        try {
            await this.bubble.behavior.onDeath();
        } catch (e) {
            console.error("onDeath error:", e);
        }
        this.stage = Stage.DIED;
        this.bubble.dispatchEvent(new CustomEvent(Stage.DIED, { bubbles: true, composed: true }));
    }

    private _transitioning = false;

    private async grown() {
        try {
            await this.bubble.behavior.onGrown();
        } catch (e) {
            console.error("onGrown error:", e);
        }
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