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

    if (options.hasOwnProperty('duration') && options.duration as number < 0) {
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
    this.animate('breathe', [
      {transform: 'translate(0px, -2px)'},
      {transform: 'translate(0px, 2px)'},
    ], {
        duration: 2000,
        direction: "alternate",
        iterations: Infinity,
        easing: 'ease-in-out',
        composite: 'accumulate',
    });
  }

  public moveTo(x0: number, y0: number, x: number, y: number, duration: number) {
    this.animate('move', [
      {transform: `translate(${x0}px, ${y0}px)`},
      {transform: `translate(${x}px, ${y}px)`},
    ], {
        duration: duration,
        iterations: 1,
        easing: 'ease-in-out',
        composite: 'replace',
    });
  }

  stopBreathing() {
    this.stop('breathe');
  }

  stop(name: string) {
    if (this.animations.has(name)) {
      this.animations.get(name)?.cancel();
      this.animations.delete(name);
    }
  }
}
