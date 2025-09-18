import type {BBBubble} from "../elements/BBBubble.ts";

export enum Stage {
    BORN = 'bubble-born',
    GROWN = 'bubble-grown',
    DIED = 'bubble-died',
    RECYCLED = 'bubble-recycled',
}

export class BubbleLifeCycle {
    constructor(bubble: BBBubble, stage: Stage = Stage.DIED) {
        this.bubble = bubble;
        this.stage = stage;

        this.cycle();
    }

    private animationFrameId: number = -1;
    private cycle = async () => {
        await this.nextStage();
        this.animationFrameId = window.requestAnimationFrame(this.cycle)
    }

    isAtTheSameStageWith(other: BubbleLifeCycle): boolean {
        return this.stage === other.stage;
    }

    stop() {
        if (this.animationFrameId !== -1) {
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = -1;
        }
    }

    async reset() {
        this.stage = Stage.DIED;
    }

    async nextStage(): Promise<void> {
        if (this._transitioning) { return; }
        this._transitioning = true;
        const next = this.stageCycleMap.get(this.stage);
        if (next) {
            await this.goto(next);
        } else {
            this._transitioning = false;
            return;
        }

        if (this.bubble.behavior.after) {
            try {
                await this.bubble.behavior.after(this.stage);
            } catch (error) {
                console.error("after stage error:", error);
            }
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
        const randomDuratio = () => Math.random() * 5000;
        await new Promise((r) => setTimeout(r, 500 + randomDuratio()));

        try {
            await this.bubble.behavior.onDeath();
        } catch (e) {
            console.error("onDeath error:", e);
        }
        this.stage = Stage.DIED;
        this.bubble.dispatchEvent(new CustomEvent(Stage.DIED, { bubbles: true, composed: true }));
    }

    public get stable() {
        return !this._transitioning;
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

    private async recycle() {
        this.stage = Stage.RECYCLED;

        try {
            const randomDuratio = () => Math.random() * 5000;
            await new Promise((r) => setTimeout(r, 500 + randomDuratio()));
        } catch (e) {
            console.error("onRecycle error:", e);
        }
        
        this.bubble.dispatchEvent(new CustomEvent(Stage.RECYCLED, { bubbles: true, composed: true }));
    }

    private stageActionMap: Map<Stage, () => Promise<void>> = new Map([
        [Stage.DIED, this.died.bind(this)],
        [Stage.BORN, this.born.bind(this)],
        [Stage.GROWN, this.grown.bind(this)],
        [Stage.RECYCLED, this.recycle.bind(this)],
    ]);

    private stageCycleMap: Map<Stage, Stage> = new Map([
        [Stage.DIED, Stage.RECYCLED],
        [Stage.RECYCLED, Stage.BORN],
        [Stage.BORN, Stage.GROWN],
        [Stage.GROWN, Stage.DIED],
    ]);

    private stage: Stage;
    private bubble: BBBubble;
}