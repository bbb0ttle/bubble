export class AnimationController {
  element: HTMLElement;
  animations: Map<string, Animation>;
  constructor(element: HTMLElement) {
    this.element = element;
    this.animations = new Map();
  }

  animate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
    // 取消之前的同名动画
    if (this.animations.has(name)) {
      this.animations.get(name)?.cancel();
    }

    const animation = this.element.animate(keyframes, {
      duration: 300,
      fill: 'forwards',
      composite: 'add', // 关键：叠加模式
      ...options
    });

    this.animations.set(name, animation);
    return animation;
  }

  public breathe(originSize: number) {
    this.animate('breathe', [
      { width: `${originSize * 0.9}px`, height: `${originSize * 0.9}px`, offset: 0 },
      { width: `${originSize * 1.1}px`, height: `${originSize * 1.1}px`, offset: 1 },
    ], {
        duration: 2000,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out',
    });
  }

  stopBreathing() {
    this.stop('breath');
  }

  stop(name: string) {
    if (this.animations.has(name)) {
      this.animations.get(name)?.cancel();
      this.animations.delete(name);
    }
  }
}
