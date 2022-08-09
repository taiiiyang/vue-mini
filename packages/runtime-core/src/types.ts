import { ShapeFlags } from "@vue-mini/shared";

export type Children = string | Array<any> | undefined
export interface Vnode {
    el: any,
    component: any,
    key: string,
    type: string,
    props: object,
    children: Children,
    shapeFlag: ShapeFlags
}