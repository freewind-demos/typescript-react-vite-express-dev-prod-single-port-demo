import { createServer } from "vite"; // 引入 Vite 程序化启动 API
import { resolveServerPort } from "../shared/common/env.js"; // 引入端口收口
import { devApiPlugin } from "./devApiPlugin.js"; // 引入 dev API 插件

// 开发模式启动入口：Vite 自己监听端口，同时承载页面与 API
const viteServer = await createServer({
  // 端口显式来自 APP_PORT，strictPort 保证被占时直接报错而不是自动换端口
  server: { host: "127.0.0.1", port: resolveServerPort(), strictPort: true },
  // 挂上 dev API 插件
  plugins: [devApiPlugin()],
});

// 开始监听
await viteServer.listen();
