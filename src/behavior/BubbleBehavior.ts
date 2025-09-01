import type {BBBubble} from "../elements/BBBubble.ts";

export interface BubbleBehavior {
    actor: BBBubble,

    onBorn: () => Promise<void>;

    onGlassReady: () => Promise<void>;

    isReadyToGrow: () => boolean;

    onGrown: () => Promise<void>;

    isReadyToDie: () => boolean;

    onDeath: () => Promise<void>;

    onTouch: (another: BBBubble) => Promise<void>;

    onClick: () => Promise<void>;
}