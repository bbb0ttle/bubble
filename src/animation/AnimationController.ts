import type { AnimationParam } from "../types/AnimationParam.ts";
import type {Position} from "../types/Position.ts";
import { Queue } from "../utils/queue.ts";
import type {BBBubble} from "../elements/BBBubble.ts";

export class AnimationController {
  element: HTMLElement;
  actor: BBBubble;
  animations: Map<string, Animation>;
  animationsQueue: Map<string, Queue<AnimationParam>> = new Map();
  constructor(bubble: BBBubble) {
    this.actor = bubble;
    this.element = bubble.element!;
    this.animations = new Map();
  }

  execLock: Map<string, boolean> = new Map();

  async animate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}) {
    if (!this.animationsQueue.has(name)) {
      this.animationsQueue.set(name, new Queue<AnimationParam>());
    }

    const queue = this.animationsQueue.get(name);

    if (queue) {
      queue.enqueue({name, keyframes, options});
    }

    if (this.execLock.get(name)) {
      return;
    }

    this.execLock.set(name, true);

    while (queue && !queue.isEmpty()) {
      const param = queue.dequeue()!;
      const a = this.execAnimate(param.name, param.keyframes, param.options);
      await this.ensureAnimationFinish(a, (param.options.duration as number || 200) + 100, param.name);
    }

    this.execLock.set(name, false);
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

  private movePromise: Promise<void | string> = Promise.resolve("INIT");

  async move(from: Position, to: Position, duration: number) {
    this.movePromise = this.movePromise.then((state) => {
      if (state !== "INIT") {
        from = this.actor.position
      }

      return this.animate('move', [
        {translate: `${from.x}px ${from.y}px 0`},
        {translate: `${to.x}px ${to.y}px 0`},
      ], {
        duration: duration,
        iterations: 1,
        easing: 'ease-in-out',
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

    this.movePromise = Promise.resolve("INIT");

    this.animationsQueue.forEach((queue) => queue.clear());
  }

  async fade(opacity: number, targetOpacity: number, defaultAnimationDuration: number) {
    return this.animate('fade', [
      {opacity: opacity},
      {opacity: targetOpacity},
    ], {
      duration: defaultAnimationDuration,
      iterations: 1,
      easing: 'ease-in-out',
    });
  }
}
