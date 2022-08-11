/**
 *
 * 在此定义 初始化组件的方法
 *
 */

import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { emit } from "./componentEmits";
import { PublicInstanceProxyHandler } from "./componentPublicInstance";
import { proxyRefs } from "@vue-mini/reactivity";

export type Vnode = {
    children: Array<any> | string,
    props: Array<any>,
}

export interface Instance {
  type: {
    setup:null | Function
    render?
    template?
  };
  vnode: Vnode;
  next: Object;
  parent: any;
  props: Object;
  slots: Object;
  proxy: Object;
  provides: Object;
  isMounted: boolean;
  attrs: Object;
  ctx: Object;
  setupState: Object;
  emit: Function;
  render?:Function
}
export function createComponentInstance(vnode, parent) {
  const instance:Instance = {
    type: vnode.type,
    vnode,
    next: {},
    parent,
    props: {},
    slots: {},
    proxy: {},
    // 获取 parent 的 provides 值，这样就可以使用 provides 来初始化
    provides: parent ? parent.provides : {},
    isMounted: false,
    attrs: {},
    ctx: {},
    setupState: {},
    emit: (event, ...rawArgs) => {},
  };

  // 在 prod 下只是这个简单的结构
  instance.ctx = {
    _: instance,
  };

  // 这里将 emit 跟实例绑定起来，之后调用的时候就可以
  instance.emit = emit.bind(null, instance);

  return instance;
}

export function setupComponent(instance:Instance) {
  console.log("正在初始化组件");

  const { props, children } = instance.vnode;

  if (!props || !children)
    console.error("缺少props或children" + "component.ts");

  initProps(instance, props);
  initSlots(instance, children);

  // 源码里有两种 component
  // 分别是 基于 function 和 options 创建的
  // 这里使用 options 创建
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance:Instance) {
  // todo
  // 1. 先创建代理 proxy
  console.log("先创建 proxy");

  // 实质上是代理了 ctx 对象，在使用的时候直接使用 proxy 对象就可以了
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandler);

  // 用户声明的对象就是 instance.type
  // const Component = { render(){}, setup(){}}

  const Component = instance.type;
  // 调用 setup
  const { setup } = Component;

  if (setup) {
    // 设置当前 currentInstance 的值
    // 必须要在 setup 之前
    setCurrentInstance(instance);

    const setupContext = createSetupCtx(instance)

    // 执行用户设定的 setup 函数
    const setupResult = 
        setup && setup(instance.props, setupContext)
    // 将当前实例置空
    setCurrentInstance()
  }
}

// 处理 setup结果， 将其绑定到 setupState 上
function handleSetupResult(instance:Instance, setupResult:Object | Function) {
    if (typeof setupResult === "function") {
        // 如果返回的是 function 则代表是 render 逻辑
        instance.render = setupResult
    } else if (typeof setupResult === "object") {
        // 使用 proxyRefs 做处理，在模板中访问响应式数据就可以不使用 .value就能访问
        instance.setupState = proxyRefs(setupResult)
    }
    finishComponentSetup(instance)
}

function finishComponentSetup(instance:Instance) {
    const Component = instance.type

    // 如果组件内部没有定义 render 方法，我们就给他设置一个
    if (!instance.render) {
        // 如果 compile 有值，但当前组件没有render函数，则直接使用 compile 编译模板
        if (compile && !Component.render) {
            if (Component.template) {
                const template = Component.template
                Component.render = compile(template)
            }
        }
        // 将该渲染函数传递，调用mount可以直接渲染到页面
        instance.render = Component.render
    }
}

function createSetupCtx(instance:Instance) {
  console.log("初始化setup context");

  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {} //todo 实现函数暴露逻辑
  };
}

let currentInstance:Instance | undefined 

export function getCurrentInstance() {
    return currentInstance || {}
}
export function setCurrentInstance(instance?:Instance) {
  currentInstance = instance;
}

// 用于将模板编译为 h 函数的嵌套，接下来将其作为渲染函数
// 调用渲染函数就能生成虚拟DOM
let compile = (_) => {};
export function registerRuntimeCompiler(_compile) {
    compile = _compile
}