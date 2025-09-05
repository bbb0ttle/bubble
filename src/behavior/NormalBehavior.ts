import {type BBBubble} from "../elements/BBBubble.ts";
import type {BubbleBehavior} from "./BubbleBehavior.ts";

export class NormalBubbleBehavior implements BubbleBehavior {
    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    onBorn: () => Promise<void> = async () => {
        this.actor.display(false);

        await this.actor.scaleTo(this.actor.randomInitSize());

        await this.actor.goto(this.actor.randomInitPos(), 0);

        this.actor.display(true);

        await this.actor.fade(this.actor.randomInitOpacity());

        await this.eatOthers();
    };

    onGrown: () => Promise<void> = async () => {
        await this.actor.goto(this.actor.idlePos(), this.actor.moveDuration() + 100 * Math.random());
        await this.eatOthers();
    }

    onDeath: () => Promise<void> = async () => {
        await this.actor.goto(this.actor.topPos(), this.actor.moveDuration());
        await this.actor.fade(0);

        await this.actor.scaleTo(this.actor.configuration.initSize);

        this.actor.display(false);

        await this.actor.goto(this.actor.randomInitPos(), 0);
    };

    onTouch: (another: BBBubble) => Promise<void> = async (another: BBBubble) => {
        // eat the smaller one
        if (this.actor === another) {
            return;
        }
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

        if (!(another.behavior instanceof NormalBubbleBehavior)) {
            return false;
        }

        if (this.actor.size < another.size) {
            return another.behavior.eat(this.actor);
        } else {
            return this.eat(another);
        }
    }

    private async eat(another: BBBubble) {
        const rate = this.actor.configuration.sizeGrowRate;

        await Promise.all([
            another.lifeCycle.nextStage(true),
            this.actor.scaleTo(this.actor.size + another.size * rate)
        ]);

        await Promise.all([
            this.actor.goto(this.actor.position, this.actor.moveDuration()),
            this.actor.lifeCycle.nextStage()
        ])

        return true;
    }

    onForgot: () => Promise<void> = async() => {};

    isReadyToDie(): boolean {
        return true;
    }

    isReadyToGrow(): boolean {
        return true;
    }

    onLearned(): Promise<void> {
        return Promise.resolve(undefined);
    }

    async onSick(): Promise<void> {
        await this.actor.fade(0);
        await this.actor.scaleTo(this.actor.configuration.initSize);
        this.actor.display(false);
        await this.actor.goto(this.actor.randomInitPos(), 0);
    }
}
