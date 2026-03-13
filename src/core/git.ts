import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// 固定的忽略文件模式，这些文件将永远不会被审查
const FIXED_IGNORE_PATTERNS = [];

export async function getGitDiff(
  userIgnorePatterns: string[] = [],
  cwd: string = process.cwd()
): Promise<string> {
  // 检查是否在 git 仓库中
  try {
    await execAsync("git rev-parse --git-dir", { cwd });
  } catch (error) {
    console.error(`[be-link-review] 当前目录不是 git 仓库: ${cwd}`);
    return "";
  }

  // 合并固定忽略模式和用户提供的忽略模式
  const allIgnorePatterns = [...new Set([...userIgnorePatterns])];
  const excludeArgs = allIgnorePatterns
    .map((pattern) => `:(exclude)${pattern}`)
    .join(" ");

  let diff = "";
  const baseCommand = `git diff --no-color --relative ${excludeArgs}`;

  try {
    // 优先使用 git diff --cached 获取暂存区的改动
    const { stdout: cachedDiff } = await execAsync(`${baseCommand} --cached`, {
      cwd,
    });
    diff = cachedDiff.trim();
    if (diff) {
      console.log("[be-link-review] 检测到暂存区改动");
    }
  } catch (error: any) {
    console.warn(`[be-link-review] 获取暂存区 diff 失败: ${error.message}`);
  }

  if (!diff) {
    try {
      // 如果暂存区没有改动，则获取工作区和 HEAD 的改动
      const { stdout: headDiff } = await execAsync(`${baseCommand} HEAD`, {
        cwd,
      });
      diff = headDiff.trim();
      if (diff) {
        console.log("[be-link-review] 检测到工作区改动（相对于 HEAD）");
      }
    } catch (error: any) {
      console.warn(`[be-link-review] 获取工作区 diff 失败: ${error.message}`);
    }
  }

  if (!diff) {
    console.log("[be-link-review] 未检测到代码改动（已检查暂存区和工作区）");
  }

  return diff;
}
