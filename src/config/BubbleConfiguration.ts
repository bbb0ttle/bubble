import type {Position} from "../types/Position.ts";

export interface BubbleConfiguration {
    initSize: number;

    initPos: Position;

    initOpacity: number;

    minSize: number;

    maxSize: number;

    defaultAnimationDuration: number
}

export class BaseBubbleConfiguration implements BubbleConfiguration {
    initSize: number = 20;

    minSize: number = 20;

    maxSize: number = 100;

    defaultAnimationDuration: number = 200;

    initPos: Position = {x: 0, y: 0};

    initOpacity: number = 0;
}