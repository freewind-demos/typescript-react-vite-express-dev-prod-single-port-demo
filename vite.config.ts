// 构建配置：只负责「产物放哪」，不引入任何服务端代码（服务端由 src/server/devServer.ts 程序化启动）
import { defineConfig } from "vite"; // 引入 Vite 配置工厂

// 导出配置
export default defineConfig({
  // 前端产物目录；生产环境由 express.static 提供页面
  build: { outDir: "dist" },
});
