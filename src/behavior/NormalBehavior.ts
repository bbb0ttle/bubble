import {type BBBubble} from "../elements/BBBubble.ts";
import type {BubbleBehavior} from "./BubbleBehavior.ts";
import {Stage} from "./BubbleLifeCycle.ts";

export class NormalBubbleBehavior implements BubbleBehavior {
    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    private _eatCount = 0;

    onBorn: () => Promise<void> = async () => {
        this.actor.display(false);

        await this.actor.scaleTo(this.actor.randomInitSize());

        await this.actor.moveTo(this.actor.randomInitPos(), 1);

        this.actor.display(true);

        this.actor.fade(this.actor.randomInitOpacity()).then();

        await this.eatEachOther();
    };

    onGrown: () => Promise<void> = async () => {
        await this.actor.moveTo(this.actor.idlePos(), this.actor.moveDuration() + 100 * Math.random());
        this.actor.fade(this.actor.randomInitOpacity()).then();

        await this.eatEachOther();
    }

    onDeath: () => Promise<void> = async () => {
        await this.actor.moveTo(this.actor.topPos(), this.actor.moveDuration());

        await this.actor.fade(0);

        await this.actor.scaleTo(this.actor.configuration.initSize);

        await this.actor.moveTo(this.actor.randomInitPos());

        this.actor.display(false);

        this._eatCount = 0;
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

    async eatEachOther() {
        const others = this.actor.getSiblings();
        if (!others.length) {
            return;
        }

        for (const another of others) {
            const anotherBubbleBehavior = another.behavior;
            if (!(anotherBubbleBehavior instanceof NormalBubbleBehavior)) {
                continue;
            }

            await (another.behavior as NormalBubbleBehavior).eatOthers();
        }
    }

    private async eatOthers() {
        const others = this.actor.getSiblings();
        if (!others.length) {
            return;
        }

        for (const another of others) {
            const eatResult = await this.tryEat(another);
            if (eatResult) {
                this._eatCount++;
            }
        }
    }

    private async tryEat(another: BBBubble) {
        if (!this.actor.isOverlapWith(another) || another == this.actor) {
            return false;
        }

        if (this.actor.lifeCycle.IsTransitioning || another.lifeCycle.IsTransitioning) {
            return false;
        }

        if (another.moving) {
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
        const moveDuration = 50 + 50 * Math.random();

        another.scaleTo(this.actor.configuration.minSize, moveDuration).then();
        another.fade(0, moveDuration).then();
        another.moveTo(this.actor.centerPos(), moveDuration).then(() => {
            another.display(false);
            another.lifeCycle.goto(Stage.DIED).then();
        });

        const rate = this.actor.configuration.sizeGrowRate;

        await this.actor.scaleTo(this.actor.size + another.size * rate);
        await this.actor.moveTo(this.actor.idlePos(), this.actor.moveDuration());

        return true;
    }

    isReadyToDie(): boolean {
        return true;
    }

    isReadyToGrow(): boolean {
        return this._eatCount >= 1
        // return true;
    }

    onGlassReady(): Promise<void> {
        return Promise.resolve(undefined);
    }
}
