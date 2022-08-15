/**
 *
 * 将生成的 ast 转化成 render 字符串
 * 代码生成阶段最后会生成一个字符串，然后用new Function将其转换为render函数
 *
 */
import { isString } from "@vue-mini/shared";
import { NodeTypes, RootNode } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperNameMap,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";

export interface Context {
  code: string;
  runtimeModuleName: string;
  runtimeGlobalName: string;
  mode: "function" | "module";
  helper: (key: symbol) => `_${string}`;
  push: (code: string) => void;
  newline: () => void;
}

export function generateCode(ast: RootNode, options = {}) {
  const context = createCodeGenContext(ast, options)
  const { push, mode } = context

  if (mode === "module") {
    genModulePreamble(ast, context)
  } else {
    genFunctionPreamble(ast, context)
  }

  // 定义render函数
  const functionName = "render"

  const args = ["_ctx"]

  const signature = args.join(', ')
  // 将生成的节点返回
  push(`function ${functionName}(${signature}) {`)
  push('return ')
  genNode(ast.codegenNode, context) 
  push('}')
}

function genNode(node, context:Context) {
  // 读取 node ，根据不同 type 生成对应代码块
  switch(node.type) {
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genSimpleExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    default : 
      break
  }
}

function genText(node, context:Context) {
  const { push } = context
  push(`'${node.content}'`)
}

function genCompoundExpression(node, context:Context) {
  const { push } = context

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (isString(child)) {
      push(`${child}`)
    } else {
      genNode(child, context)
    }
  }
}

function genElement(node, context:Context) {
  const { push, helper } = context
  const { tag, props, children } = node

  // 这就相当于 h 函数了
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullableArgs([tag, props, children]), context)
  push(')')
}

// 将数组转换成 "node1, node2, node3"
// 如果是函数参数 "(node1, node2, node3)"
// 如果是数组 "[node1, node2, node3]"
function genNodeList(nodes: any[], context:Context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (isString(node)) {
      push(`${node}`)
    } else {
      genNode(node, context)
    }

    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNullableArgs(args: Array<any>) {
  // 去除末尾为 null 值
  let i = args.length
  while(i--) {
    if (args[i] !== null) break
  }
  // 把 falsy 值换成 null
  return args.slice(0, i + 1).map(arg => arg || "null")
}

function genSimpleExpression(node, context:Context) {
  context.push(node.content)
}

function genInterpolation(node, context:Context) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`) `)
}
// 模块预处理
function genModulePreamble(ast:RootNode, context:Context) {
  // import 语句
  const { push, newline, runtimeModuleName }  = context
  // import { toDisplayString as _toDisplayString } from "Vue"
  if (ast.helpers.length) {
    const code = `import { ${ast.helpers
      .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
      .join(',')} } from ${JSON.stringify(runtimeModuleName)}`
      
    push(code)
  }

  newline()
  push("export ")
}

function genFunctionPreamble(ast:RootNode, context:Context) {
  const { push, runtimeGlobalName, newline } = context
  const VueBinging = runtimeGlobalName

  const aliasHelper = (s: symbol) => `${helperNameMap[s]} : _${helperNameMap[s]}`

  if (ast.helpers.length) {
    push(`
    
      const {${ast.helpers.map(aliasHelper).join(',')}} = ${VueBinging}

    `)

  }

  newline()
  push('return ')
}

function createCodeGenContext(
  ast: object,
  { runtimeModuleName = "vue", runtimeGlobalName = "Vue", mode = "function" as const }
): Context {
  const context: Context = {
    code: "",
    runtimeGlobalName,
    runtimeModuleName,
    mode,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    push(code) {
      context.code += code;
    },
    newline() {
      context.code += "\n";
    },
  };

  return context;
}
