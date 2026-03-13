
export function generateAIPrompt(diff: string): string {
  return `你是一名资深软件工程师，请 review 以下代码变更。
Git diff:
${diff}
请分析：
是否存在 bug
是否存在潜在逻辑问题
是否存在性能问题
是否存在代码风格问题
给出优化建议`;
}
