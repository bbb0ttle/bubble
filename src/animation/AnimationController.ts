import type {Position} from "../types/Position.ts";

export class AnimationController {
  element: HTMLElement;
  animations: Map<string, Animation>;
  constructor(element: HTMLElement) {
    this.element = element;
    this.animations = new Map();
  }

  animate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
    if (this.animations.has(name)) {
      this.cancel(name);
    }

    if (options.hasOwnProperty('duration') && (options.duration as number) < 0) {
      delete options.duration;
    }

    const animation = this.element.animate(keyframes, {
      duration: 200,
      fill: 'forwards',
      composite: 'replace',
      ...options
    });

    this.animations.set(name, animation);
    return animation;
  }

  async move(from: Position, to: Position, duration: number) {
    const a = this.animate('move', [
      {translate: `${from.x}px ${from.y}px 0`},
      {translate: `${to.x}px ${to.y}px 0`},
    ], {
        duration: duration,
        iterations: 1,
        easing: 'ease-in-out',
    });

    await a.finished;

    return a;
  }

  public async scaleTo(start: number, end: number, duration: number) {
      const a = this.animate('scale', [
        {transform: `scale(${start})`},
        {transform: `scale(${end})`},
      ], {
        duration: duration,
        iterations: 1,
      });


      await a.finished;
  }


  cancel(name: string) {
    if (!this.animations.has(name)) {
      return;
    }

    if (!this.animations.get(name)) {
      return;
    }

    if (this.animations.get(name)?.playState !== 'idle') {
      return;
    }

    this.animations.get(name)?.cancel();
  }

  stop(name: string) {
    if (this.animations.has(name)) {
      this.cancel(name);
      this.animations.delete(name);
    }
  }

  async fade(opacity: number, targetOpacity: number, defaultAnimationDuration: number) {
    const a = this.animate('fade', [
      {opacity: opacity},
      {opacity: targetOpacity},
    ], {
      duration: defaultAnimationDuration,
      iterations: 1,
      easing: 'ease-in-out',
    });

    await a.finished;

    return a;
  }
}
