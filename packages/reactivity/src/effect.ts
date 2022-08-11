import { createDep } from "./dep";
import { extend } from "@vue-mini/shared";

const targetMap = new WeakMap();
let shouldTrack:boolean = true
let activeEffect:Function | null = null

export class ReactiveEffect {
  // 是否处于活动中
  active = true
  // 当前函数依赖的变量集合
  deps = []
  // 停止执行
  public onStop?: () => {}

  constructor(public effect: Function, public scheduler?) {
    console.log("创建reactiveEffect对象")
  }

  run() {
    console.log("run")
    // 如果在活动状态，则直接返回，不需要收集依赖，也就是effect没有变动的时候不需要重新收集
    if (!this.active) 
      // 此时 没有 activeEffect 不执行依赖收集
      return this.effect()

    shouldTrack = true

    // 改变全局的活动 effect
    activeEffect = this as any
    const result = this.effect()

    shouldTrack = false;
    activeEffect = null

    return result 
  }

  stop() {
    if(this.active) {
      // 清除所有依赖
      cleanupEffect(this)

      if (this.onStop) {
        this.onStop()
      }
      // 此时该函数已经没用了，就不需要再进行收集依赖操作，直接执行
      // 防止重复调用
      this.active = false
    }
  }
}
// 用来存储当前活动的effect 
export function effect(eff:Function, options = {}) {
    const _effect = new ReactiveEffect(eff)

    extend(_effect, options)
    // 执行传入进来的副作用函数， 在函数中会触发get 和 set 此时会将当前活动的副作用函数添加进依赖
    _effect.run()

    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    // 将run方法返回给用户，便于用户进行调用
    return runner
}

export function stop(runner) {
  runner.effect.stop()
}

export function cleanupEffect(effect) {
    // effect 封装过后的副作用函数
    // deps 依赖集合
    // dep 所有依赖的函数收集
    effect.deps.forEach(dep => {
        dep.delete(effect)
    });

    effect.deps.length = 0
}

// 向对应属性添加依赖 effect 副作用函数
// 在调用 get 时 正是我们想要进行 track 去保存 effect 的时候
export function track(target: object, key: string) {
  // 不需要追踪时直接返回
  if (!isTracking) return
  if (activeEffect) {
    // get the current map for this target（reactive object）
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // If it doesn't exist, create it
      targetMap.set(target, (depsMap = new Map()));
    }
    // Get the dependency object for this property
    let dep = depsMap.get(key);
    if (!dep) {
      // If it doesn't exist, create it
      depsMap.set(key, createDep());
    }
    // Add the effect to the dependency
    trackEffects(dep)
  }
}
// 执行副作用函数时使用 effect 封装再执行，这样在内部就能改变当前活动函数，然后将其收入对应的依赖集合中
export function trackEffects(dep) {
    // 如果已经有了同样的依赖函数， 就直接返回， 不做处理
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
        // 往当前活动函数中存储依赖项，便于之后移除
        (activeEffect as any).deps.push(dep)
    }
}

// 触发依赖函数
// set 时调用
export function trigger(target: object, key: string) {
  const depsMap = targetMap.get(target);
  // 检测对象中是否有依赖集合，如果没有直接返回
  if (!depsMap) return;
  let dep = depsMap.get(key);
  // 传递 set 集合 ，进行遍历并执行
  triggerEffects(dep);
}

// 是否需要追踪
export function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

export function triggerEffects(dep: Array<any>) {
  // 执行所有effect中的 run 方法
  for (const effect of dep) {
    if (effect.scheduler) {
      // 提供scheduler函数让用户自行调用，nextTick的施行原理就是这个
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}