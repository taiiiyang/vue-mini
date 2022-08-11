import { ShapeFlags } from "@vue-mini/shared";
import { createComponentInstance, setupComponent } from "./component"
import { queueJob } from "./scheduler"
import { effect } from "@vue-mini/reactivity";
import { Fragment, normalizeVnode, Text } from "./vnode";
import { shouldUpdateComponent } from "./componentRenderUtils";
import { createAppAPI } from "./createApp";

/**
 * 
 * @param options 
 * @description 创建渲染器，在内部调用 render，mount，patch 操作
 */
export function createRenderer(options) {

}