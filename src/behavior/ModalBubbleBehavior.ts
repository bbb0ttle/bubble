import  { type BBBubble } from "../elements/BBBubble";
import type { Position } from "../types/Position";
import type { BubbleBehavior } from "./BubbleBehavior";
import pkgJons from "../../package.json" assert { type: "json" };

export class ModalBubbleBehavior implements BubbleBehavior{
    public constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    private born = false;

    private _pos: Position = { x: 0, y: 0 };
    private _size: number = 50;

    onShortPress?: ((pos: Position, originEvent: Event) => Promise<void>) | undefined = async () => {
        await this.onClick();
    };

    onBorn: () => Promise<void> = async () => {
        if (this.born) {
            return;
        }

        this.actor.display(false);
        await this.actor.scaleTo(this._size);
        this.actor.display(true)
        const rect = this.actor.spaceRect!;

        this._pos = { x: rect.width - 80, y: rect.height - 80 };

        await this.actor.goto(this._pos, 200, true);

        this.actor.fade(this.actor.randomInitOpacity()).then();

        this.born = true;
    };

    isReadyToGrow: () => boolean = () => {
        return false;
    };

    onGrown: () => Promise<void> = async () => {
        return;
    };

    isReadyToDie: () => boolean = () => false;

    onDeath: () => Promise<void> = async () => {};

    onTouch: (another: BBBubble) => Promise<void> = async() => {};

    onClick: () => Promise<void> = async () => {
        this._fullscreen = !this._fullscreen;

        if (this._fullscreen) {
            await this.enterFullscreen(this.actor.spaceRect!);
        } else {
            await this.exitFullscreen();
        }
        
    };

    private _fullscreen = false;

    private async enterFullscreen(space: DOMRect) {
        if (!space) {
            return;
        }


        const duration = 200;
        const max = 300;

        const targetSize = Math.min(space.height, space.width, max);
        const targetPos = {
            x: (space.width - targetSize) / 2,
            y: (space.height - targetSize) / 2
        }

        const posStop0 = {
            x: targetPos.x - 6,
            y: targetPos.y - 6
        }

        const posStop1 = {
            x: targetPos.x + 4,
            y: targetPos.y + 4
        }

        this.actor.scaleTo(targetSize, .5 * duration, true);

        this.actor.styleInfo.replaceSync(`
            .bubble {
                background: #fff;
                z-index: 2;
            }
        `);

        const posBounce = async () => {
            await this.actor.goto(posStop0, duration * .5, true);
            await this.actor.goto(posStop1, duration * .3, true);
            await this.actor.goto(targetPos, duration * .2, true);
        }

        const sizeBounce = async () => {
            await this.actor.scaleTo(targetSize * 1.1, .5 * duration, true);
            await this.actor.scaleTo(targetSize * 0.8, .3 * duration, true);
            await this.actor.scaleTo(targetSize, .2 * duration, true);
        }

        await Promise.all([
            posBounce(),
            sizeBounce()
        ]);

        this.actor.innerHTML = `bbbubble ${pkgJons.version}</br>made for soda`;


    }

    onForgot: () => Promise<void> = async() => {};

    private async exitFullscreen() {
        const duration = 100;

        const size = this._size;

        const posStop0 = {
            x: this._pos.x + 6,
            y: this._pos.y + 6
        }

        const posStop1 = {
            x: this._pos.x - 4,
            y: this._pos.y - 4
        }

        this.actor.scaleTo(size, duration * .2).then();
        this.actor.innerHTML = "";

        await this.actor.goto(posStop0, duration * .5, true);
        await this.actor.goto(posStop1, duration * .3, true);
        await this.actor.goto(this._pos, duration * .2, true);


        this.actor.styleInfo.replaceSync(`
            .bubble {
                background: none;
                z-index: 1;
            }
        `);
      }

    async onLearned(): Promise<void> {
    }
}