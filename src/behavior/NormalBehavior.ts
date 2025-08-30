import  {type BBBubble} from "../elements/BBBubble.ts";
import type {BubbleBehavior} from "./BubbleBehavior.ts";
import {Stage} from "./BubbleLifeCycle.ts";

export class NormalBubbleBehavior implements BubbleBehavior {
    constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    private _eatCount = 0;

    onBorn: () => Promise<void> = async () => {
        // move to born position
        await this.actor.moveTo(this.actor.randomInitPos());

        await this.actor.scaleTo(this.actor.randomInitSize());

        this.actor.fade(this.actor.randomInitOpacity()).then();


        await this.eatOthers();

    };

    onGrown: () => Promise<void> = async () => {
        await this.actor.moveTo(this.actor.idlePos(), this.actor.moveDuration());
        this.actor.fade(this.actor.randomInitOpacity()).then();

        await this.eatOthers();
    }

    onDeath: () => Promise<void> = async () => {
        await this.actor.moveTo(this.actor.topPos(), this.actor.moveDuration());

        await this.actor.fade(0);

        await this.actor.scaleTo(this.actor.configuration.initSize);

        this._eatCount = 0;
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

    private async eatOthers() {
        if (!this.actor.getSiblings().length) {
            return;
        }

        for (const another of this.actor.getSiblings()) {
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

        if (this.actor.size < another.size) {
            return (another.behavior as NormalBubbleBehavior).eat(this.actor);
        } else {
            return this.eat(another);
        }
    }

    private async eat(another: BBBubble) {
        if (another.lifeCycle.isAt(Stage.DIED)) {
            return false;
        }

        if (this.actor.lifeCycle.isAt(Stage.DIED)) {
            return false;
        }

        another.scaleTo(this.actor.configuration.minSize).then();
        await another.fade(0, 100);

        await this.actor.scaleTo(this.actor.size + another.size * 0.2);

        const moveDuration = 50 + 50 * Math.random();
        another.fade(0, moveDuration).then();
        await another.moveTo(this.actor.centerPos(), moveDuration);

        another.lifeCycle.goto(Stage.DIED).then();
        await this.actor.moveTo(this.actor.idlePos(), this.actor.moveDuration());

        return true;
    }

    isReadyToDie(): boolean {
        if (this._eatCount <= 0) {
            return false;
        }

        return Math.random() < .5;
    }
}
