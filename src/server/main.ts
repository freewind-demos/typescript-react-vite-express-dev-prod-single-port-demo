import express from "express"; // 引入 Express
import { createApiRouter } from "./api/readFile"; // 引入共用的 API 本体
import { getEnvPort, getWebDistDir } from "../common/env"; // 引入端口与产物路径收口

// 生产模式启动入口：独立 Node 进程，静态页面 + API 同一个端口
const app = express();

// 静态产物提供前端页面；dist 由 vite build 产出，路径由项目根推导，与启动目录无关
app.use(express.static(getWebDistDir()));

// 挂上与开发完全相同的 API 本体
app.use(createApiRouter());

// 监听端口
app.listen(getEnvPort(), "127.0.0.1", () => {
  // 打印实际端口，便于确认
  console.log(
    `[single-port-demo] 生产服务已启动：http://127.0.0.1:${getEnvPort()}`,
  );
});
