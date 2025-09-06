import {type BBBubble} from "../elements/BBBubble.ts";
import type {BubbleBehavior} from "./BubbleBehavior.ts";
import {Stage} from "./BubbleLifeCycle.ts";

export class NormalBubbleBehavior implements BubbleBehavior {
    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    after = async (s: Stage) => {
        if (s === Stage.GROWN || s === Stage.BORN) {
            await this.eatOthers();
        }
    }

    onBorn: () => Promise<void> = async () => {
        this.actor.display(false);

        await this.actor.scaleTo(this.actor.randomInitSize());

        await this.actor.goto(this.actor.randomInitPos(), 0);

        this.actor.display(true);

        await this.actor.fade(this.actor.randomInitOpacity());
    };

    onGrown: () => Promise<void> = async () => {
        await this.actor.goto(this.actor.idlePos(), this.actor.moveDuration() + 100 * Math.random());
    }

    onDeath: () => Promise<void> = async () => {
        await this.actor.goto(this.actor.topPos(), this.actor.moveDuration());
        await this.actor.fade(0);

        await this.actor.scaleTo(this.actor.configuration.initSize);

        this.actor.display(false);

        await this.actor.goto(this.actor.randomInitPos(), 0);

        this._eatCount = 0;
    };

    onClick: () => Promise<void> = async () => {
        await this.actor.bounce();
        await this.actor.lifeCycle.nextStage();
    };

    private async eatOthers() {
        const others = this.actor.getSiblings();
        if (!others.length) {
            return;
        }

        await Promise.all(others.map(this.tryEat.bind(this)));
    }

    private async tryEat(another: BBBubble) {
        if (!(this.actor.behavior instanceof NormalBubbleBehavior)) {
            return false;
        }

        if (another == this.actor) {
            return false;
        }

        if (!this.actor.isOverlapWith(another)) {
            return false;
        }

        if (this.actor.opacity <= 0 || another.opacity <= 0) {
            return false;
        }

        if (!another.lifeCycle.stable) {
            return false;
        }

        if (!(another.behavior instanceof NormalBubbleBehavior)) {
            return false;
        }

        if (this.actor.size > another.size) {
            return this.eat(another);
        } else {
            return another.behavior.eat(this.actor);
        }
    }

    private _eatCount = 0;

    private async eat(another: BBBubble) {
        const rate = this.actor.configuration.sizeGrowRate;

        if (!another.lifeCycle.stable) {
            return;
        }

        await Promise.all([
            another.goto({
                x: this.actor.position.x + (this.actor.size - another.size) / 2,
                y: this.actor.position.y + (this.actor.size - another.size) / 2
            }),
            another.lifeCycle.nextStage(true),
            this.actor.scaleTo(this.actor.size + another.size * rate)
        ]);

        await Promise.all([
            this.actor.goto(this.actor.idlePos(), this.actor.moveDuration()),
            Math.random() < 0.1
                ? this.actor.lifeCycle.nextStage()
                : Promise.resolve()
        ])

        this._eatCount++
        return true;
    }

    onForgot: () => Promise<void> = async() => {};

    onLearned(): Promise<void> {
        return Promise.resolve(undefined);
    }

    async onSick(): Promise<void> {
        await Promise.all([
            this.actor.fade(0),
            this.actor.scaleTo(this.actor.configuration.initSize),
        ]);
        this.actor.display(false);
        await this.actor.goto(this.actor.randomInitPos(), 0);
    }
}
