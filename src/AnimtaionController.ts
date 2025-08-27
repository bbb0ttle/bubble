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
      composite: 'replace',
      ...options
    });

    this.animations.set(name, animation);
    return animation;
  }

  public scaleInOut(originSize: number) {
    const peekSize = originSize * 1.1;
    const minSize = originSize * 0.9;

    this.animate('scaleInOut', [
      { width: `${peekSize}px`, height: `${peekSize}px`, offset: 0.5 },
      { width: `${minSize}px`, height: `${minSize}px`, offset: 0.8 },
      { width: `${originSize}px`, height: `${originSize}px`, offset: 1 },
    ], {
        duration: 200,
        iterations: 1,
        easing: 'ease-in-out',
    });

  }

  public breathe() {
    return;

    const originSizeStyle = this.element.style.width;
    originSizeStyle.replace('px', '');

    const originSize = parseInt(originSizeStyle, 10);

    this.animate('breathe', [
      { width: `${originSize}px`, height: `${originSize}px`, offset: 0 },
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
