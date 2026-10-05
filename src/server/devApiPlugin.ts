import express from "express"; // 引入 Express
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express"; // 引入 Express 请求响应类型
import type { Plugin } from "vite"; // 引入 Vite 插件类型
import { createApiRouter } from "./api/readFile"; // 引入共用的 API 本体

// 开发环境专用插件：把 API 本体挂成 Vite 中间件，与页面共用一个端口
export const devApiPlugin = (): Plugin => ({
  // 插件名
  name: "demo-dev-api",
  // Vite dev server 构建完成后把中间件插进去
  configureServer(server) {
    // 建一个最小 Express app 承载 API
    const app = express();
    // 挂上与生产完全相同的 API 本体
    app.use(createApiRouter());
    // 用 server.middlewares 挂载；命中 /api 由它处理，其余放行给 Vite
    server.middlewares.use((request, response, next) => {
      // 非 API 请求交回 Vite
      if (!request.url?.startsWith("/api/")) {
        next();
        return;
      }
      // API 请求交给 Express app；connect 的请求响应与 Express 声明的结构兼容，此处按 Express 类型收窄
      app(request as ExpressRequest, response as ExpressResponse, next);
    });
  },
});
