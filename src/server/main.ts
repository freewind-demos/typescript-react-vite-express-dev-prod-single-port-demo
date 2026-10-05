import express from "express"; // 引入 Express
import { resolveServerPort, WEB_DIST_DIR } from "../shared/common/env.js"; // 引入端口与 dist 路径收口
import { createApiRouter } from "./api/readFile.js"; // 引入共用的 API 本体

// 生产模式启动入口：独立 Node 进程，静态页面 + API 同一个端口
const app = express();

// 静态产物提供前端页面（dist 路径由 WEB_ROOT 注入，不依赖 cwd 与相对层级）
app.use(express.static(WEB_DIST_DIR));

// 挂上与开发完全相同的 API 本体
app.use(createApiRouter());

// 监听端口
app.listen(resolveServerPort(), "127.0.0.1", () => {
  // 打印实际端口，便于确认
  console.log(`[single-port-demo] 生产服务已启动：http://127.0.0.1:${resolveServerPort()}`);
});
