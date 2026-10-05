import { useState } from "react"; // 引入 React 状态 Hook

// 页面组件：输入绝对路径，点「读取」，内容显示在下方只读文本域
const App = (): React.JSX.Element => {
  // 输入框内容：默认填一个绝对路径，方便直接点读取看到效果
  const [path, setPath] = useState("/Users/peng.li/workspace/freewind-demos/typescript-react-vite-express-dev-prod-single-port-demo/files/notes.md");
  // 文本域展示的内容
  const [content, setContent] = useState("");
  // 是否正在读取
  const [loading, setLoading] = useState(false);

  // 点击读取：只发相对路径请求，不写死 host / port，因此 dev 与生产代码完全一致
  const handleRead = async (): Promise<void> => {
    // 标记读取中
    setLoading(true);
    try {
      // 调同一个接口，dev 与生产路径完全相同
      const response = await fetch(`/api/read-file?path=${encodeURIComponent(path)}`);
      // 解析 JSON
      const data = (await response.json()) as { ok: boolean; content?: string; error?: string };
      // 成功显示内容，失败把错误信息也放进文本域
      setContent(data.ok ? (data.content ?? "") : `错误：${data.error ?? "未知错误"}`);
    } catch (error) {
      // 网络异常同样展示在文本域里
      setContent(`请求失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // 结束读取中
      setLoading(false);
    }
  };

  // 渲染界面
  return (
    // 页面容器
    <main className="app">
      {/* 标题 */}
      <h1>单端口 Server 的两种启动方式</h1>
      {/* 说明 */}
      <p className="hint">
        开发：<code>pnpm run dev</code>（Vite 承载页面 + API）｜生产：<code>pnpm run build</code> 后 <code>pnpm start</code>（Node
        server 跑编译产物，承载页面 + API）
      </p>
      {/* 输入行 */}
      <div className="row">
        {/* 绝对路径输入框 */}
        <input
          value={path}
          placeholder="绝对路径，如 /Users/…/notes.md"
          onChange={(event) => {
            // 输入变化时同步状态
            setPath(event.target.value);
          }}
        />
        {/* 读取按钮 */}
        <button type="button" disabled={loading} onClick={() => {
          // 点击触发读取
          void handleRead();
        }}>
          {/* 读取中显示不同文案 */}
          {loading ? "读取中…" : "读取"}
        </button>
      </div>
      {/* 结果文本域 */}
      <textarea value={content} readOnly placeholder="读取到的内容会显示在这里" />
    </main>
  );
};

// 导出页面组件
export default App;
