export class AnimationController {
  element: HTMLElement;
  animations: Map<string, Animation>;
  constructor(element: HTMLElement) {
    this.element = element;
    this.animations = new Map();
  }

  animate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
    if (this.animations.has(name)) {
      this.animations.get(name)?.cancel();
    }

    const animation = this.element.animate(keyframes, {
      duration: 300,
      fill: 'forwards',
      composite: 'accumulate',
      ...options
    });

    this.animations.set(name, animation);
    return animation;
  }

  public breathe(originSize: number) {
    return;

    this.animate('breathe', [
      { width: `${originSize}px`, height: `${originSize}px`, offset: 0 },
      { width: `${originSize * 1.05}px`, height: `${originSize * 1.05}px`, offset: 1 },
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
