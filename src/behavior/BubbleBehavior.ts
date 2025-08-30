import type {BBBubble} from "../elements/BBBubble.ts";

export interface BubbleBehavior {
    actor: BBBubble,

    onBorn: () => Promise<void>;

    isReadyToDie: () => boolean;

    onGrown: () => Promise<void>;

    onDeath: () => Promise<void>;

    onTouch: (another: BBBubble) => Promise<void>;

    onClick: () => Promise<void>;
}