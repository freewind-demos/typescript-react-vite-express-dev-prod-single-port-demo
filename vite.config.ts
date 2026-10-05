import react from "@vitejs/plugin-react"; // 引入 React 插件
import { defineConfig } from "vite"; // 引入 Vite 配置工厂
import { devApiPlugin } from "./src/server/devApiPlugin"; // 引入 dev API 插件
import { getEnvPort } from "./src/common/env"; // 引入端口收口

// 导出配置：dev 直接跑 vite 命令，这个配置就是那个 dev server 的配置
export default defineConfig(({ command }) => ({
  // React 插件负责 JSX 转换与 Fast Refresh；dev API 插件把 API 挂成中间件
  plugins: [react(), devApiPlugin()],
  // 开发服务器端口：Vite 不认 APP_PORT，在这里显式接，strictPort 保证被占时直接报错
  // 惰性取值：vite build 也会加载这份配置，但 build 阶段不监听端口
  server: { port: getEnvPort(), strictPort: true },
  // 前端产物目录；生产环境由 express.static 提供页面
  build: { outDir: "dist" },
}));
