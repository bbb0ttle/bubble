import type { Position } from "../types/Position.ts";

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
      composite: 'add',
      ...options
    });

    this.animations.set(name, animation);
    return animation;
  }

  async move(from: Position, to: Position, duration: number) {
    const a = this.animate('move', [
      {transform: `translate3d(${from.x}px, ${from.y}px, 0)`},
      {transform: `translate3d(${to.x}px, ${to.y}px, 0)`},
    ], {
        duration: duration,
        iterations: 1,
        easing: 'ease-in-out',
    });

    await a.finished;

    a.commitStyles();

    return a;
  }

  public async scaleTo(end: number, duration: number) {
      const a = this.animate('scale', [
        {transform: `scale(${1})`},
        {transform: `scale(${end})`},
      ], {
        duration: duration,
        iterations: 1,
      });

      await a.finished;
  }

  stopBreathing() {
    this.stop('breathe');
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

    a.commitStyles();

    return a;
  }
}
