import type { BBBubble } from "../elements/BBBubble";
import type { BubbleBehavior } from "./BubbleBehavior";
import { DebugBehavior } from "./DebugBehavior";
import { ImmortalBehavior } from "./ImmortalBehavior";
import { NormalBubbleBehavior } from "./NormalBehavior";

type Constructor<T = {}> = new (...args: any[]) => T;

class BehaviorRegistry {
    private constructors = new Map<string, Constructor<BubbleBehavior>>();
    private instances = new Map<string, Map<BBBubble, BubbleBehavior>>();
 
    // 行为注册
    register<T extends BubbleBehavior>(key: string, constructor: Constructor<T>) {
      this.constructors.set(key, constructor);
    }
    
    // 按需获取行为实例
    get<T extends BubbleBehavior>(key: string, bubble: BBBubble): T {
      if (!this.isInstantiated(key, bubble)) {
        const Constructor = this.constructors.get(key);
        if (!Constructor) {
          throw new Error(`Service '${key}' not registered`);
        }
        const behavior = new Constructor(bubble);

        this.instances.set(key, new Map([
            [bubble, behavior]
        ]));
      }

      return this.instances.get(key)?.get(bubble) as T;
    }
    
    // 检查是否已实例化
    isInstantiated(key: string, bubble: BBBubble): boolean {
      return this.instances.has(key) && this.instances.get(key)!.has(bubble);
    }
}

const behaviorRegistryInst = new BehaviorRegistry();

behaviorRegistryInst.register('debug', DebugBehavior);
behaviorRegistryInst.register('default', NormalBubbleBehavior);
behaviorRegistryInst.register('immortal', ImmortalBehavior);

export {
    behaviorRegistryInst
}
