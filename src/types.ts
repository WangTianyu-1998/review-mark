export interface BeLinkReviewOptions {
  apiKey?: string;
  agentPath?: string; // 允许用户指定 agent 可执行文件路径
  ignore?: string[]; // 新增：允许用户指定忽略的文件或 glob 模式
  enableFeishu?: boolean; // 是否启用飞书通知，默认 true
}

export interface BeLinkReviewChatOptions {
  agentPath?: string;
  force?: boolean;
  outputFormat?: "json" | "text";
}

export interface BeLinkReviewEnsureResult {
  isInstalled: boolean;
  message: string;
  actualAgentPath?: string; // 实际找到的 agent 路径
}
