import { createVnode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    const app = {
      _component: rootComponent,
      mount(rootContainer) {
        console.log("正在创建根组件实例");
        // 基于根组件实例
        const vnode = createVnode(rootComponent);
        render(vnode, rootContainer);
      },
    };

    return app;
  };
}
