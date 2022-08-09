import { ShapeFlags } from "@vue-mini/shared";
import { createComponentInstance, setupComponent } from "./component"
import { queueJob } from "./scheduler"
import { effect } from "@vue-mini/reactivity";
import { Fragment, normalizeVnode, Text } from "./vnode";
import { shouldUpdateComponent } from "./componentRenderUtils";
import { createAppAPI } from "./createApp";

export function createRenderer(_) {

}