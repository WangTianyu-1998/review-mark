import { spawn, exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { BeLinkReviewEnsureResult } from "@/types";

const execAsync = promisify(exec);

interface CheckCliInstallOptions {
  apiKey: string;
  silent?: boolean;
  agentPath?: string; // 新增：允许用户指定 agent 可执行文件路径
}

interface CheckCliInstallResult {
  isInstalled: boolean;
  message: string;
  actualAgentPath?: string; // 实际找到的 agent 路径
}

// 常见的 Cursor CLI 安装路径
const COMMON_AGENT_PATHS = [
  join(homedir(), ".cursor", "agent"),
  "/usr/local/bin/agent", // macOS Homebrew 或手动安装的常见路径
  "/opt/homebrew/bin/agent", // macOS Apple Silicon Homebrew 路径
];

async function findAgentExecutable(
  userAgentPath?: string
): Promise<string | null> {
  // 1. 优先使用用户指定的路径
  if (userAgentPath && existsSync(userAgentPath)) {
    return userAgentPath;
  }

  // 2. 尝试通过 which 命令在 PATH 中查找
  try {
    const { stdout } = await execAsync("which agent");
    const pathFromWhich = stdout.trim();
    if (pathFromWhich && existsSync(pathFromWhich)) {
      return pathFromWhich;
    }
  } catch (error) {
    // ignore error, continue to next method
  }

  // 3. 检查常见安装路径
  for (const path of COMMON_AGENT_PATHS) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

export async function isCheckCliInstall(
  options: CheckCliInstallOptions
): Promise<BeLinkReviewEnsureResult> {
  const { silent = false, agentPath: userAgentPath } = options;

  let actualAgentPath = await findAgentExecutable(userAgentPath);

  if (actualAgentPath) {
    if (!silent) {
      console.log(
        `[be-link-review] Cursor CLI (agent) 已在 ${actualAgentPath} 找到。`
      );
    }
    return { isInstalled: true, message: "Cursor CLI 已安装", actualAgentPath };
  }

  if (!silent) {
    console.log("[be-link-review] Cursor CLI (agent) 未找到，正在尝试安装...");
    console.log(
      "[be-link-review] 执行安装命令: curl https://cursor.com/install -fsS | bash"
    );
  }

  return new Promise((resolve, reject) => {
    const installProcess = spawn(
      "bash",
      ["-c", "curl https://cursor.com/install -fsS | bash"],
      {
        stdio: "inherit", // 将安装过程的输出直接显示给用户
      }
    );

    installProcess.on("close", async (code) => {
      if (code === 0) {
        // 安装成功后再次检查 agent 命令是否可用
        actualAgentPath = await findAgentExecutable(userAgentPath);
        if (actualAgentPath) {
          if (!silent) {
            console.log("[be-link-review] Cursor CLI 安装成功。");
          }
          resolve({
            isInstalled: true,
            message: "Cursor CLI 安装成功",
            actualAgentPath,
          });
        } else {
          reject(
            new Error(
              `[be-link-review] Cursor CLI 安装命令执行成功，但未找到 agent 可执行文件。请手动检查安装：curl https://cursor.com/install -fsS | bash。`
            )
          );
        }
      } else {
        reject(
          new Error(
            `[be-link-review] Cursor CLI 安装失败，退出码 ${code}。请手动安装：curl https://cursor.com/install -fsS | bash。`
          )
        );
      }
    });

    installProcess.on("error", (err) => {
      reject(
        new Error(
          `[be-link-review] 无法启动安装进程：${err.message}。请手动安装：curl https://cursor.com/install -fsS | bash`
        )
      );
    });
  });
}
