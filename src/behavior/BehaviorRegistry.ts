import type { BBBubble } from "../elements/BBBubble";
import type { BubbleBehavior } from "./BubbleBehavior";
import { DebugBehavior } from "./DebugBehavior";
import { ImmortalBehavior } from "./ImmortalBehavior";
import { ModalBubbleBehavior } from "./ModalBubbleBehavior";
import { NormalBubbleBehavior } from "./NormalBehavior";

const builtInBehaviorMap = new Map<string, Constructor<BubbleBehavior>>([
    ['debug', DebugBehavior],
    ['default', NormalBubbleBehavior],
    ['immortal', ImmortalBehavior],
    ['modal', ModalBubbleBehavior],
]);

type Constructor<T = {}> = new (...args: any[]) => T;

export class BehaviorRegistry {
    private constructors = new Map<string, Constructor<BubbleBehavior>>();
    private instances = new Map<string, BubbleBehavior>();

    private readonly bubble: BBBubble;

    constructor(bubble: BBBubble) {
        this.bubble = bubble;
      // 注册内置行为
      for (const [key, Constructor] of builtInBehaviorMap.entries()) {
        this.register(key, Constructor);
      }
    }
 
    // 行为注册
    register<T extends BubbleBehavior>(key: string, constructor: Constructor<T>) {
      this.constructors.set(key, constructor);
    }
    
    // 按需获取行为实例
    get<T extends BubbleBehavior>(key: string): T | undefined {
      if (!this.isInstantiated(key)) {
        const Constructor = this.constructors.get(key);
        if (!Constructor) {
            return;
        }

        const behavior = new Constructor(this.bubble);

        this.instances.set(key,  behavior);
      }

      return this.instances.get(key) as T;
    }
    
    // 检查是否已实例化
    isInstantiated(key: string): boolean {
      return this.instances.has(key);
    }
}
