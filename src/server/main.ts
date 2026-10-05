import express from "express"; // 引入 Express
import { createApiRouter } from "./api/readFile"; // 引入共用的 API 本体
import { getEnvPort } from "../common/env"; // 引入端口收口（APP_PORT 缺失时为 -1，listen 会报端口非法）

// 生产模式启动入口：独立 Node 进程，静态页面 + API 同一个端口
const app = express();

// 静态产物提供前端页面；dist 由 pnpm build 产出，start 不含构建，需先跑一次 build
app.use(express.static("dist"));

// 挂上与开发完全相同的 API 本体
app.use(createApiRouter());

// 监听端口
app.listen(getEnvPort(), "127.0.0.1", () => {
  // 打印实际端口，便于确认
  console.log(
    `[single-port-demo] 生产服务已启动：http://127.0.0.1:${getEnvPort()}`,
  );
});
