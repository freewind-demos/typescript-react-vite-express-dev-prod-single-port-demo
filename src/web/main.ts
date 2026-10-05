import "./style.css"; // 引入样式

// 前端根节点
const root = document.querySelector<HTMLDivElement>("#app");

// 页面状态：当前输入的路径与最近一次读取结果
const state = { path: "README.txt", output: "" };

// 渲染页面：dev 与生产下这段代码完全一致，只有 API 由谁承载不同
const render = (): void => {
  // 没有根节点就直接退出
  if (!root) return;
  // 用模板字符串生成界面
  root.innerHTML = `
    <h1>单端口 Server 的两种启动方式</h1>
    <p class="hint">开发：<code>pnpm run dev</code>（Vite 承载页面 + API）｜生产：<code>pnpm run build &amp;&amp; pnpm start</code>（Node server 承载页面 + API）</p>
    <div class="row">
      <input id="path" value="${state.path}" placeholder="相对路径，如 README.txt" />
      <button id="read">读取</button>
    </div>
    <pre id="output">${state.output}</pre>
  `;

  // 输入框
  const input = root.querySelector<HTMLInputElement>("#path");
  // 按钮
  const button = root.querySelector<HTMLButtonElement>("#read");
  // 输出区
  const output = root.querySelector<HTMLPreElement>("#output");
  // 空值保护
  if (!input || !button || !output) return;

  // 点击读取：只发相对路径请求，不写死 host / port
  button.addEventListener("click", async () => {
    // 记住输入
    state.path = input.value;
    // 提示读取中
    output.textContent = "读取中…";
    try {
      // 调同一个接口，dev 与生产路径完全相同
      const response = await fetch(`/api/read-file?path=${encodeURIComponent(state.path)}`);
      // 解析 JSON
      const data = (await response.json()) as { ok: boolean; content?: string; error?: string };
      // 成功显示内容，失败显示错误
      output.textContent = data.ok ? (data.content ?? "") : `错误：${data.error ?? "未知错误"}`;
      // 存进状态
      state.output = output.textContent;
    } catch (error) {
      // 网络异常也展示出来
      output.textContent = `请求失败：${error instanceof Error ? error.message : String(error)}`;
    }
  });
};

// 首次渲染
render();
