import type {BBBubble} from "../elements/BBBubble.ts";
import type { Position } from "../types/Position.ts";
import type {Stage} from "./BubbleLifeCycle.ts";

export interface BubbleBehavior {
    actor: BBBubble,

    // life cycle
    onLearned: () => Promise<void>;

    onForgot: () => Promise<void>

    onBorn: () => Promise<void>;

    onGrown: () => Promise<void>;

    onSick: () => Promise<void>;

    onDeath: () => Promise<void>;

    after?: (stage: Stage) => Promise<void>;

    // event
    onClick: () => Promise<void>;

    onLongPress?: (pos: Position, originEvent: Event) => Promise<void>

    onShortPress?: (pos: Position, originEvent: Event) => Promise<void>

    onDrag?: (pos: Position, originEvent: Event) => Promise<void>

    onPointEvtCancel?: () => void;
}