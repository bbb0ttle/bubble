import type {Position} from "./Position.ts";

export interface IMoveOption {
    target: Position;
    duration: number;
    force: boolean;
    onSuccess?: () => void;
}

export class MovePromise implements IMoveOption {
    done: Promise<void>

    resolve:  ((value: void | PromiseLike<void>) => void) = () => {};
    reject: ((reason?: any) => void) | undefined = () => {};

    public constructor(target: Position, duration: number, force: boolean) {
        this.target = target;
        this.duration = duration;
        this.force = force;

        this.done = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    target: Position;
    duration: number;
    force: boolean;
    onSuccess?: (() => void) | undefined;
}