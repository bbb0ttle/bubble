import type { Position } from "./Position";

export class AnimationController {
  element: HTMLElement;
  animations: Map<string, Animation>;
  constructor(element: HTMLElement) {
    this.element = element;
    this.animations = new Map();
  }

  getWHValues(element: HTMLElement) {
      const style = window.getComputedStyle(element);
      const width = style.width;
      const height = style.height;

      width.replace("px", "");
      height.replace("px", "");
      
      return { width: parseInt(width), height: parseInt(height) };
  }

  getTranslateValues(element: HTMLElement) {
      const style = window.getComputedStyle(element);
      // @ts-ignore
      const transform = style.transform || style.webkitTransform || style.mozTransform;
      
      if (transform === 'none' || !transform) {
          return { x: 0, y: 0 };
      }
      
      const matrix = transform.match(/matrix.*\((.+)\)/);
      if (matrix) {
          const values = matrix[1].split(', ');
          return {
              x: parseFloat(values[4]) || 0, // tx value
              y: parseFloat(values[5]) || 0  // ty value
          };
      }
      
      const translateMatch = transform.match(/translate(?:3d)?\(([^)]+)\)/);
      if (translateMatch) {
          const values = translateMatch[1].split(',').map((v: string) => parseFloat(v.trim()));
          return {
              x: values[0] || 0,
              y: values[1] || 0
          };
      }
      
      return { x: 0, y: 0 };
  }

  animate(name: string, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
    if (this.animations.has(name)) {
      this.cancel(name);
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

  public async scaleInOut() {
    const { width: originSize } = this.element.getBoundingClientRect();

    const peekSize = originSize * 1.1;
    const minSize = originSize * 0.9;

    const a = this.animate('scaleInOut', [
      { width: `${peekSize}px`, height: `${peekSize}px`, offset: 0.5 },
      { width: `${minSize}px`, height: `${minSize}px`, offset: 0.8 },
      { width: `${originSize}px`, height: `${originSize}px`, offset: 1 },
    ], {
        duration: 200,
        iterations: 1,
        easing: 'linear',
        composite: 'replace',
    })

    await a.finished;

    a.commitStyles();

    this.stop('hide');
  }

  public async show(duration: number, targetOpacity: number = 1) {
    const { opacity } = getComputedStyle(this.element);
    const a = this.animate('show', [
      { opacity },
      { opacity: targetOpacity }
    ], { iterations: 1, duration })

    await a.finished;

    if (this.isNotRender()) {
      return;
    }

    a.commitStyles();

    this.stop('show');
  }

  private isNotRender(): boolean {
    const computedStyle = window.getComputedStyle(this.element);
    return computedStyle.display === 'none';
  }

  public async hide(duration: number) {
    const { opacity } = getComputedStyle(this.element);
    const a = this.animate('hide', [
      { opacity },
      { opacity: 0 }
    ], { iterations: 1, duration })

    await a.finished;

    if (this.isNotRender()) {
      return;
    }

    a.commitStyles();
  }

  async enterFullscreen(space: DOMRect) {
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

      this.moveTo(xOffset + padding, yOffset + padding, duration * .2);

      await this.scaleTo(targetSize * 1.1, .5 * duration);
      await this.scaleTo(targetSize * 0.9, .3 * duration)
      await this.scaleTo(targetSize, .2 * duration);

  }

  async exitFullscreen(size: number, pos: Position) {
    const duration = 200;

    this.moveTo(pos.x, pos.y, duration * .2);

    await this.scaleTo(size * 0.9, .5 * duration);
    await this.scaleTo(size * 1.1, .3 * duration)
    await this.scaleTo(size, .2 * duration);

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

  public moveTo(x: number, y: number, duration: number) {

    const { x: x0, y: y0 } = this.getTranslateValues(this.element);

    return new Promise((resolve) => {
      this.animate('move', [
        {transform: `translate(${x0}px, ${y0}px)`},
        {transform: `translate(${x}px, ${y}px)`},
      ], {
          duration: duration,
          iterations: 1,
          easing: 'ease-in-out',
          composite: 'replace',
      }).onfinish = resolve;
    });

  }

  public async scaleTo(size: number, duration: number) {
    const { width: originSize } = this.getWHValues(this.element);

    return new Promise((resolve) => {
      this.animate('scale', [
        { width: `${originSize}px`, height: `${originSize}px`},
        { width: `${size}px`, height: `${size}px`},
      ], {
        duration: duration,
        iterations: 1,
        composite: 'replace'
      }).onfinish = resolve;
    })
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

    this.animations.get(name)?.cancel;
  }

  stop(name: string) {
    if (this.animations.has(name)) {
      this.cancel(name);
      this.animations.delete(name);
    }
  }
}
