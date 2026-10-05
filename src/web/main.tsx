import { StrictMode } from "react"; // 引入 React 严格模式
import { createRoot } from "react-dom/client"; // 引入 React 挂载 API
import App from "./App"; // 引入页面组件
import "./App.css"; // 引入样式

// 挂载根节点
const container = document.querySelector<HTMLDivElement>("#root");

// 找不到根节点直接退出
if (!container) {
  throw new Error("找不到 #root 挂载点");
}

// 渲染页面：dev 与生产下这段代码完全一致，只有 API 由谁承载不同
createRoot(container).render(
  // 严格模式包裹
  <StrictMode>
    {/* 页面本体 */}
    <App />
  </StrictMode>,
);
