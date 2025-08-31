import type {Position} from "../types/Position.ts";

export interface BubbleConfiguration {
    initSize: number;

    initPos: Position;

    initOpacity: number;

    minOpacity: number;

    maxOpacity: number;

    spacePadding: number;

    minSize: number;

    maxSize: number;

    sizeGrowRate: number;

    maxMoveDuration: number;

    minMoveDuration: number;

    sizeRandomRate: number;

    defaultAnimationDuration: number
}

export class BaseBubbleConfiguration implements BubbleConfiguration {
    initSize: number = 100;

    minSize: number = 20;

    sizeRandomRate: number = 60;

    maxSize: number = 160;

    defaultAnimationDuration: number = 200;

    spacePadding: number = 10;

    initPos: Position = {x: 0, y: 0};

    initOpacity: number = 0;

    maxOpacity: number = 0.9;

    minOpacity: number = 0.5;

    sizeGrowRate: number = 0.2;

    maxMoveDuration: number = 600;

    minMoveDuration: number = 200;
}