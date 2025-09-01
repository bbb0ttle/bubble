import type { BBBubble } from "../elements/BBBubble";
import type { Position } from "../types/Position";
import type { BubbleBehavior } from "./BubbleBehavior";

export class ModalBubbleBehavior implements BubbleBehavior{
    public constructor(bubble: BBBubble) {
        this.actor = bubble;
    }

    actor: BBBubble;

    private born = false;

    private _pos: Position = { x: 0, y: 0 };
    private _size: number = 50;

    onBorn: () => Promise<void> = async () => {
        if (this.born) {
            return;
        }

        this.actor.display(false);
        await this.actor.scaleTo(this._size);
        this.actor.display(true)
        this.actor.fade(this.actor.randomInitOpacity()).then();

        const rect = this.actor.spaceRect!;

        this._pos = { x: rect.width / 2 - this._size / 2, y: rect.height - 100 };

        await this.actor.moveTo(this._pos);

        this.born = true;
    };

    onGlassReady: () => Promise<void> = async () => {
        await this.onBorn();
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

    private _ver: string = "0.2.3-a.34";

    private _fullscreen = false;

    private async enterFullscreen(space: DOMRect) {
        if (!space) {
            return;
        }

        const whRatio = space.width / space.height;

        const offset = Math.abs(space.width - space.height) / 2;

        const xOffset = whRatio > 1 ? offset : 0;
        const yOffset = whRatio > 1 ? 0 : offset;
  
  
        const duration = 200;
        const padding = 10;

        const targetSize = Math.min(space.height, space.width) - padding * 2;

        this.actor.moveTo({ x: xOffset + padding, y: yOffset + padding }, duration * .2, true);
  
        await this.actor.scaleTo(targetSize * 1.1, .5 * duration, true);
        this.actor.innerHTML = `bbbubble@${this._ver}</br>Made by bbki.ng`;
        await this.actor.scaleTo(targetSize * 0.9, .3 * duration, true)
        await this.actor.scaleTo(targetSize, .2 * duration, true);
  
        this.actor.element!.style.zIndex = "2";
        this.actor.element!.style.background= "#fff";

    }

    private async exitFullscreen() {
        const duration = 100;

        const size = this._size;

        const targetPos = {
            x: this._pos.x,
            y: this._pos.y + 5
        }

        this.actor.scaleTo(size, duration).then();
        this.actor.innerHTML = "";

        await this.actor.moveTo(targetPos, duration, true);
        await this.actor.moveTo(this._pos, duration * .2, true).then();


        this.actor.element!.style.zIndex = "1";
        this.actor.element!.style.background= "none";
      }
}