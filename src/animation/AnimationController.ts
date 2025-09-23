import type {Position} from "../types/Position.ts";
import type {BBBubble} from "../elements/BBBubble.ts";

export class AnimationController {
  element: HTMLElement;
  actor: BBBubble;
  animations: Map<string, Animation>;
  execPromiseMap: Map<string, Promise<void>> = new Map();
  constructor(bubble: BBBubble) {
    this.actor = bubble;
    this.element = bubble.element!;
    this.animations = new Map();
  }

  async animate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}) {

    const currentPromise = this.execPromiseMap.get(name) || Promise.resolve();

    return currentPromise.then(() => {
      const a = this.execAnimate(name, keyframes, options);
      return this.ensureAnimationFinish(a, (options.duration as number || 200) + 100, name);

    })
  }

  execAnimate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
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

  private movePromise: Promise<void> = Promise.resolve();

  async move(from: Position, to: Position, duration: number) {
    this.movePromise = this.movePromise.then(() => {
      if (from.x != this.actor.position.x || from.y != this.actor.position.y) {
        from = {x: this.actor.position.x, y: this.actor.position.y};
      }

      return this.animate('move', [
        {translate: `${from.x}px ${from.y}px 0`},
        {translate: `${to.x}px ${to.y}px 0`},
      ], {
        duration: duration,
        iterations: 1,
        easing: 'ease-out',
      });
    })

    await this.movePromise;
  }

  private async ensureAnimationFinish(a: Animation | undefined, timeout: number, name: string) {
    if (!a) {
      return;
    }

    let timeoutId: number | undefined;

    try {
      // 添加超时保护，比动画时长多一点时间
      await Promise.race([
        a.finished,
        new Promise((_, reject) => 
          timeoutId = setTimeout(() => reject(new Error('Animation timeout: ' + name)), timeout)
        )
      ]);
    } catch (error) {
      // 清理动画
      this.cancel(name);
      console.warn('Animation failed or timed out:', error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  public async scaleTo(start: number, end: number, duration: number) {
      return this.animate('scale', [
        {transform: `scale(${start})`},
        {transform: `scale(${end})`},
      ], {
        duration: duration,
        iterations: 1,
      });
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

  clear() {
    this.animations.forEach((_, name) => this.cancel(name));
    this.animations.clear();

    this.movePromise = Promise.resolve();
    this.fadePromise = Promise.resolve();
    this.execPromiseMap.clear();
  }

  private fadePromise: Promise<void> = Promise.resolve();

  async fade(opacity: number, targetOpacity: number, defaultAnimationDuration: number) {
    this.fadePromise = this.fadePromise.then(() => {
      if (opacity != this.actor.opacity) {
        opacity = this.actor.opacity;
      }

      return this.animate('fade', [
        {opacity: opacity},
        {opacity: targetOpacity},
      ], {
        duration: defaultAnimationDuration,
        iterations: 1,
        easing: 'ease-out',
      });
    });

    await this.fadePromise;
  }
}
