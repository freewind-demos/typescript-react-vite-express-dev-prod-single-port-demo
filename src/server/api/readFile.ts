import fs from "node:fs/promises"; // 引入异步文件读写
import { Router } from "express"; // 引入 Express 路由工厂

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
      // 取查询参数 path，即用户输入的绝对路径
      const filePath = String(request.query.path ?? "");
      // 参数为空直接报参数错误
      if (!filePath) {
        response.status(400).json({ ok: false, error: "缺少 path 查询参数" });
        return;
      }
      // 必须是绝对路径，否则无法定位文件
      if (!filePath.startsWith("/")) {
        response.status(400).json({ ok: false, error: "path 必须是绝对路径" });
        return;
      }
      // 读成文本
      const content = await fs.readFile(filePath, "utf8");
      // 返回内容
      response.json({ ok: true, path: filePath, content });
    } catch (error) {
      // 文件不存在、不是目录、没权限等都在这里转成 JSON 错误
      const message = error instanceof Error ? error.message : String(error);
      // 返回 404
      response.status(404).json({ ok: false, error: message });
    }
  });

  // 返回路由
  return router;
};
