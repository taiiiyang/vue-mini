/**
 *
 * 在此进行编译操作，作为整个编译环节的入口
 *
 */
import { baseParse } from "./parse";
import { transform } from "./transform";
import { generateCode } from "./codegen";
import {
  transformElement,
  transformText,
  transformExpression,
} from "./tranforms";
export const baseCompile = (template: string, options) => {
  const ast = baseParse(template);

  transform(
    ast,
    Object.assign(options, [
      transformElement,
      transformText,
      transformExpression,
    ])
  );

  // 调用该函数 返回渲染函数代码 通过渲染函数能够产生 vnode 
  return generateCode(ast)
};
