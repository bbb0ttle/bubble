import type {Position} from "./Position.ts";

export interface IMoveOption {
    target: Position;
    duration: number;
    force: boolean;
    onSuccess?: () => void;
}