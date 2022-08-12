import { ShapeFlags } from "@vue-mini/shared";
import { Text, Fragment } from "./vnode";

export type Children = string | Array<Vnode> | undefined
export interface Vnode {
    el: any,
    component: any,
    key: string ,
    type: string | typeof Text | typeof Fragment,
    props: object,
    children: Children,
    shapeFlag: ShapeFlags
}