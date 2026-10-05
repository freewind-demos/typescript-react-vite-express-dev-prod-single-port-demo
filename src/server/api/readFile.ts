import fs from "node:fs/promises"; // 引入异步文件读写
import path from "node:path"; // 引入 Node 路径工具
import { Router } from "express"; // 引入 Express 路由工厂
import { FILES_ROOT_DIR } from "../../shared/common/env.js"; // 引入文件根目录配置

// 解析请求中的相对路径，并阻止越界访问文件根目录之外的任意路径
const resolveInsideFilesRoot = (relativePath: string): string => {
  // 先拼成绝对路径
  const resolved = path.resolve(FILES_ROOT_DIR, relativePath);
  // 再与文件根目录求相对关系，逃出根目录时相对路径以 .. 开头
  const relativeToRoot = path.relative(FILES_ROOT_DIR, resolved);
  // 越界直接拒绝
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error(`路径越界：${relativePath}`);
  }
  // 返回可安全读取的绝对路径
  return resolved;
};

// API 本体：dev 与生产共用同一份，只负责处理请求，不关心自己挂在哪个端口上
export const createApiRouter = (): Router => {
  // 创建路由实例
  const router = Router();

  // 探活端点：dev 与生产都有
  router.get("/api/health", (_request, response) => {
    // 返回 ok
    response.json({ ok: true });
  });

  // 读取指定文件：示例接口，演示「同一份 API 挂在两种 server 上」
  router.get("/api/read-file", async (request, response) => {
    try {
      // 取查询参数 path
      const relativePath = String(request.query.path ?? "");
      // 参数为空直接报参数错误
      if (!relativePath) {
        response.status(400).json({ ok: false, error: "缺少 path 查询参数" });
        return;
      }
      // 解析成文件根目录内的绝对路径
      const absolutePath = resolveInsideFilesRoot(relativePath);
      // 读成文本
      const content = await fs.readFile(absolutePath, "utf8");
      // 返回内容
      response.json({ ok: true, path: relativePath, content });
    } catch (error) {
      // 统一转成 JSON 错误，文件不存在也走这里
      const message = error instanceof Error ? error.message : String(error);
      // 越界是客户端错误，其余（文件不存在等）都是 404
      const status = message.startsWith("路径越界") ? 400 : 404;
      // 返回错误
      response.status(status).json({ ok: false, error: message });
    }
  });

  // 返回路由
  return router;
};
