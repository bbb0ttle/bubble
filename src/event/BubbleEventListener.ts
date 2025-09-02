import type { BBBubble } from "../elements/BBBubble";

interface LongPressOptions {
    duration?: number;
    threshold?: number; // Movement threshold in pixels
  }
  
export class BubbleEventListener {
    private element: HTMLElement;
    private pressTimer: number | null = null;
    private duration: number;
    private threshold: number;
    private isLongPress: boolean = false;
    private startCoords: { x: number; y: number } | null = null;

    private targetBubble: BBBubble;
  
    constructor(bubble: BBBubble, options: LongPressOptions = {}) {
      this.targetBubble = bubble;
      this.element = bubble.element!;
      this.duration = options.duration || 500;
      this.threshold = options.threshold || bubble.spaceRect?.width || 100;
      this.attachEventListeners();
    }
  
    private attachEventListeners(): void {
      // Mouse events
      this.element.addEventListener('mousedown', this.handleStart.bind(this));
      this.element.addEventListener('mouseup', this.handleEnd.bind(this));
      this.element.addEventListener('mouseleave', this.handleCancel.bind(this));
      this.element.addEventListener('mousemove', this.handleMove.bind(this));
      this.element.addEventListener('click', this.targetBubble.behavior.onClick.bind(this));
  
      // Touch events
      this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
      this.element.addEventListener('touchend', this.handleEnd.bind(this));
      this.element.addEventListener('touchcancel', this.handleCancel.bind(this));
      this.element.addEventListener('touchmove', this.handleMove.bind(this));
    }
  
    private getEventCoords(event: MouseEvent | TouchEvent): { x: number; y: number } {
      if (event instanceof TouchEvent) {
        const touch = event.touches[0] || event.changedTouches[0];
        return { x: touch.clientX, y: touch.clientY };
      }
      return { x: event.clientX, y: event.clientY };
    }
  
    private handleStart(event: MouseEvent | TouchEvent): void {
      this.isLongPress = false;
      this.startCoords = this.getEventCoords(event);
      
      this.pressTimer = window.setTimeout(() => {
        this.isLongPress = true;
        this.onLongPress(event);
      }, this.duration);
    }
  
    private handleEnd(event: MouseEvent | TouchEvent): void {
      if (this.pressTimer) {
        clearTimeout(this.pressTimer);
        this.pressTimer = null;
      }
  
      if (!this.isLongPress) {
        this.onShortPress(event);
      }
  
      this.startCoords = null;
    }
  
    private handleCancel(): void {
      if (this.pressTimer) {
        clearTimeout(this.pressTimer);
        this.pressTimer = null;
      }
      this.startCoords = null;
    }
  
    private handleMove(event: MouseEvent | TouchEvent): void {
      if (!this.startCoords || !this.pressTimer) return;
  
      const currentCoords = this.getEventCoords(event);
      const distance = Math.sqrt(
        Math.pow(currentCoords.x - this.startCoords.x, 2) +
        Math.pow(currentCoords.y - this.startCoords.y, 2)
      );
  
      if (distance > this.threshold) {
        this.handleCancel();
      }
    }
  
    private onLongPress(event: MouseEvent | TouchEvent): void {
      console.log('Long press detected!');
      event.preventDefault();
      
      const customEvent = new CustomEvent('bubble-pressed', { 
        detail: { 
          originalEvent: event,
          coords: this.startCoords 
        } 
      });
      
      this.element.dispatchEvent(customEvent);

      if (this.startCoords && this.targetBubble.behavior?.onLongPress) {
        this.targetBubble.behavior?.onLongPress(this.startCoords, event);
      }
    }
  
    private onShortPress(event: MouseEvent | TouchEvent): void {
      console.log('Short press detected!');
      
      const customEvent = new CustomEvent('bubble-touched', { 
        detail: { 
          originalEvent: event,
          coords: this.startCoords 
        } 
      });
      
      this.element.dispatchEvent(customEvent);
      if (this.startCoords && this.targetBubble.behavior?.onShortPress) {
        this.targetBubble.behavior?.onShortPress(this.startCoords, event);
      }

      this.targetBubble.behavior?.onClick();
    }
  
    public destroy(): void {
      if (this.pressTimer) {
        clearTimeout(this.pressTimer);
      }
      
      // Remove mouse listeners
      this.element.removeEventListener('mousedown', this.handleStart);
      this.element.removeEventListener('mouseup', this.handleEnd);
      this.element.removeEventListener('mouseleave', this.handleCancel);
      this.element.removeEventListener('mousemove', this.handleMove);
      this.element.removeEventListener('click', this.targetBubble.behavior.onClick);
      
      // Remove touch listeners
      this.element.removeEventListener('touchstart', this.handleStart);
      this.element.removeEventListener('touchend', this.handleEnd);
      this.element.removeEventListener('touchcancel', this.handleCancel);
      this.element.removeEventListener('touchmove', this.handleMove);
    }
  }