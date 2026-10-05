# Vite + Express 单端口两种启动方式 Demo

## 简介

演示同一个单端口 Node 服务在开发与生产下的两种启动方式：开发时由 Vite dev server 承载页面与 API，生产时由独立 Node 进程提供静态页面与 API。API 本体（读取指定文件）只有一份，两种模式共用。

## 快速开始

### 环境要求

Node.js 20+、pnpm。

### 运行

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm run typecheck

# 开发：Vite 一个端口同时提供页面与 API（APP_PORT=52306）
pnpm run dev

# 生产：构建前端与 server 产物，再启动 Node server（APP_PORT=52306）
pnpm run build
pnpm start
```

`start` 只启动、不构建，所以 `dist` 不存在时页面会 404，但 API 仍然可用——`express.static` 对缺失目录不报错，Express 找不到文件就交给后续路由，最后返回 404。首次运行或前端改过之后都要先 `pnpm run build`。

打开 http://127.0.0.1:52306 ，在输入框里填一个文件的绝对路径，点「读取」，内容会显示在下方文本域里。仓库自带的示例文件是 `files/notes.md` 与 `files/README.txt`，把它们拼到项目绝对路径后面即可。

## 注意事项

- dev 和生产用的是同一个端口 52306，两者不能同时跑。
- 端口来自环境变量 `APP_PORT`，由 `package.json` 的 scripts 注入。缺失时 `getEnvPort()` 兜底为 `-1`，Vite 与 `app.listen` 都会报端口非法。
- 服务端代码由 `vite build --ssr` 打成产物，`node` 直接跑编译结果，不加载 TS 源码。
- 服务端产物的目录不能放进 `dist/`，否则会被 `express.static` 整个静态暴露，server 源码和 sourcemap 都能被 HTTP 直接拉到。所以用 `dist-ssr/server/`。
- 读取接口只接受绝对路径，传入相对路径返回 400；文件不存在返回 404。
- 这个接口按用户给的绝对路径直接读文件，等于把服务器文件系统暴露给前端，仅适合本机演示，不要放到公网。
- 页面没有前端路由，因此不需要 history fallback。

## 教程

### 核心思路

单端口能成立只有一个前提：**前端所有请求都用相对路径**（`/api/...`），不写死 host 和 port。于是「谁在同一端口提供页面，谁就顺手提供 API」，跨端口代理配置完全不需要。剩下的问题只是：这个提供页面的 server 在开发时是 Vite，在生产时是 Node，两者怎么挂同一份 API。

### demo 原理

API 本体在 `src/server/api/readFile.ts`，导出 `createApiRouter()`，包含两个端点：`/api/health` 探活、`/api/read-file?path=` 按绝对路径读取文件。它不知道自己在哪个端口上，也不关心自己被谁挂载。

挂载方式有两处，各自只做一件事：

- `vite.config.ts`（开发）就是那个 dev server 的配置。`pnpm run dev` 只跑 `vite` 命令，没有自建的 Node 进程，Vite 自己监听端口。配置里 `plugins` 挂 `devApiPlugin()`，插件在 `configureServer` 里插一个中间件，命中 `/api/` 的请求转交一个 Express app，其余放行给 Vite 自己处理。
- `src/server/main.ts`（生产）是独立 Node 进程：`express.static(dist)` 提供构建产物页面，进程内 `app.listen()` 监听，同一个端口上同时有页面和 API。

### 为什么生产要 build 两次

```
"build": "vite build && vite build --ssr src/server/main.ts --outDir dist-ssr/server"
```

第一条 `vite build` 走默认路径：入口是 `index.html`，目标是浏览器，产物在 `dist/`。

第二条加 `--ssr` 换掉三件事：解析目标从浏览器换成 Node（`node:fs/promises` 这类内置模块留在外部，不打进 bundle）、入口从 `index.html` 换成 `src/server/main.ts`、输出改到 `dist-ssr/server/`。产物是 ESM，`node` 直接能跑。

服务端走构建期而不是 `tsx` 直跑源码，理由有两个：一是 TypeScript 和相对导入在构建期就解析完，运行时零转译；二是 Vite 插件挂在这条管线上，`enforce: "pre"` 的 transform 能改写 server 源码——像 `$FL$` 这类构建期占位符替换，`tsx` 的 esbuild loader 做不了。

### 关键代码解读

端口收口在 `src/common/env.ts`，dev 和生产都从这里取。Vite 不认 `APP_PORT`，所以值要在 `vite.config.ts` 里显式接到 `server.port`，同时开 `strictPort: true`——端口被占时直接报错退出，而不是自动换一个端口，自动换端口会让已经配好地址的客户端连不上。

`vite.config.ts` 会 import 服务端代码（`env.ts` 与 dev 插件），所以这份配置不再只是「产物放哪」，它同时是 dev server 的配置。好处是 dev 就是一个纯 `vite` 进程，代价是配置与运行时不再解耦。

`dist` 路径的定位值得单独说。`import.meta.dirname` 是**产物文件**的位置，不是源码的位置——`src/common/env.ts` 打包后被拉平到 `dist-ssr/server/main.js`，运行时 `import.meta.dirname` 指向的是产物层。所以如果写 `path.resolve(import.meta.dirname, "../../dist")`，这个 `../../` 是在预估产物深度，改 `--outDir` 就会指错。

`findRoot()` 换掉了这个预估：从 `import.meta.dirname` 逐级向上找 `package.json`，用命中的目录再拼 `dist`。这样代码里没有相对层级，源码位置和产物位置都能得到同一个根，切换 tsx 直跑还是 build 产物都不用改这行。

不能用 `process.cwd()` 代替——服务被 launchd 之类启动时工作目录不可控，从仓库外启动就找不到根。也不用 `tsconfig.json` 作锚点，子目录里常有多份（`tsconfig.app.json` 之类），容易误命中。

前端是 React 19，`src/web/main.tsx` 用 `createRoot` 挂载 `App`，`App.tsx` 里三个状态（路径、内容、读取中）都用 React Hook，样式是一个 CSS 文件。这个组件在 dev 和生产下没有任何分支判断——它只知道向 `/api/read-file` 发请求，谁来回答它，取决于当前跑的是哪种 server。

### 启动方式对照

- 页面来源：dev 是 Vite 实时编译，生产是 `dist/` 静态产物。
- API 挂载：dev 是 Vite 插件中间件，生产是进程内 Express 路由。
- 页面与 API 是否同源同进程：dev 是，只有一个 Vite 进程；生产是一个 Node 进程同时做静态服务和 API。
- 代码执行：dev 走 Vite 转译管线，生产跑编译产物。
- 热更新：dev 下页面有，API 代码改动需要重启；生产没有。
- 前端代码与 API 本体：两种模式完全一致，没有任何分支。
