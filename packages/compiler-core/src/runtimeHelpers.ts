export const TO_DISPLAY_STRING = Symbol("toDisplayString")
export const CREATE_ELEMENT_VNODE = Symbol("createElementVNode")

export const helperNameMap = {
    [TO_DISPLAY_STRING]: "toDisplayString" as const ,
    [CREATE_ELEMENT_VNODE]: "createElementVNode" as const,
}