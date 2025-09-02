import type {BBBubble} from "../elements/BBBubble.ts";
import type { Position } from "../types/Position.ts";

export interface BubbleBehavior {
    actor: BBBubble,

    // life cycle

    onBorn: () => Promise<void>;

    onGlassReady: () => Promise<void>;

    isReadyToGrow: () => boolean;

    onGrown: () => Promise<void>;

    isReadyToDie: () => boolean;

    onDeath: () => Promise<void>;

    onTouch: (another: BBBubble) => Promise<void>;

    onClick: () => Promise<void>;

    onForgot: () => Promise<void>

    // event
    onLongPress?: (pos: Position, originEvent: Event) => Promise<void>

    onShortPress?: (pos: Position, originEvent: Event) => Promise<void>

    onDrag?: (pos: Position, originEvent: Event) => Promise<void>

    onPointEvtCancel?: () => void;
}