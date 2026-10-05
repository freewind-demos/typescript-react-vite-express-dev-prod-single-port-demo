// 构建配置：只负责「产物放哪」与 React 插件，不引入任何服务端代码
import react from "@vitejs/plugin-react"; // 引入 React 插件
import { defineConfig } from "vite"; // 引入 Vite 配置工厂

// 导出配置
export default defineConfig({
  // 启用 React 插件，提供 JSX 转换与 Fast Refresh
  plugins: [react()],
  // 前端产物目录；生产环境由 express.static 提供页面
  build: { outDir: "dist" },
});
