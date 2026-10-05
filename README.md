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

# 开发：Vite 一个端口同时提供页面与 API（APP_PORT=52301）
pnpm run dev

# 生产：先构建，再启动独立 Node 进程（APP_PORT=52302）
pnpm run build
pnpm start
```

打开 http://127.0.0.1:52301 （dev）或 http://127.0.0.1:52302 （生产），在输入框里填一个文件的绝对路径，点「读取」，内容会显示在下方文本域里。仓库自带的示例文件路径是 `files/notes.md` 与 `files/README.txt`，把它们拼到项目绝对路径后面即可。

## 注意事项

- 两个端口不重叠，dev 与生产服务可同时运行。
- 端口和路径全部由启动命令通过环境变量传入，代码里没有默认值；缺失 `APP_PORT` 或 `WEB_ROOT` 时服务直接报错退出，不会静默退化成别的端口。
- `vite.config.ts` 会 import 服务端代码（`env.ts` 与 dev 插件），所以这份配置不再只是「产物放哪」，它同时是 dev server 的配置。好处是 dev 就是一个纯 `vite` 进程，代价是配置与运行时不再解耦。
- 读取接口只接受绝对路径，传入相对路径会返回 400；文件不存在返回 404。
- 这个接口按用户给的绝对路径直接读文件，等于把服务器文件系统暴露给前端，仅适合本机演示，不要放到公网。
- `pnpm start` 只启动、不构建；上线流程是 `pnpm run build` 然后 `pnpm start`。
- 页面没有前端路由，因此不需要 history fallback。

## 教程

### 核心思路

单端口能成立只有一个前提：**前端所有请求都用相对路径**（`/api/...`），不写死 host 和 port。于是「谁在同一端口提供页面，谁就顺手提供 API」，跨端口代理配置完全不需要。剩下的问题只是：这个提供页面的 server 在开发时是 Vite，在生产时是 Node，两者怎么挂同一份 API。

### demo 原理

API 本体在 `src/server/api/readFile.ts`，导出 `createApiRouter()`，包含两个端点：`/api/health` 探活、`/api/read-file?path=` 按绝对路径读取文件。它不知道自己在哪个端口上，也不关心自己被谁挂载。

挂载方式有两处，各自只做一件事：

- `vite.config.ts`（开发）就是那个 dev server 的配置。`pnpm run dev` 只跑 `vite` 命令，没有自建的 Node 进程，Vite 自己监听端口。配置里 `plugins` 挂 `devApiPlugin()`，插件在 `configureServer` 里插一个中间件，命中 `/api/` 的请求转交一个 Express app，其余放行给 Vite 自己处理。因此 dev 下 Vite 独占一个端口，页面和 API 都在里面。
- `src/server/main.ts`（生产）是一个独立 Node 进程：`express.static(dist)` 提供构建产物页面，进程内 `app.listen(APP_PORT)` 监听，同一个端口上同时有页面和 API。

### 关键代码解读

配置收口在 `src/shared/common/env.ts`。`resolveServerPort()` 只认 `APP_PORT`，缺失或非法直接抛错；`WEB_ROOT` 由启动命令用 `$PWD` 现算注入，代码里不写 `../..` 相对层级也不读 `process.cwd()`。原因是源码目录与构建产物目录层级不同，且服务被 launchd 之类启动时 cwd 不可控——靠相对路径猜目录会表现为「dev 正常、生产读不到文件」。

`package.json` 里端口前缀写在真正启动服务的那条命令上，不能跨 `&&`：

```json
"dev":   "APP_PORT=52301 vite",
"build": "vite build && vite build --ssr src/server/main.ts --outDir dist-ssr/server",
"start": "WEB_ROOT=\"$PWD\" APP_PORT=52302 node dist-ssr/server/main.js"
```

dev 只需注入端口；`WEB_ROOT` 只有生产需要，因为只有生产要读 `dist`。这也是为什么 `env.ts` 里两个取值函数是惰性的：`vite build` 会加载同一个 `vite.config.ts`，如果配置在模块加载时就要求 `WEB_ROOT`，构建会直接失败。

`strictPort: true` 必须开：端口被占时 Vite 直接报错退出，而不是自动换一个端口。自动换端口会让已经配好地址的客户端连不上。

这也解释了为什么 `start` 不带 `build`：`APP_PORT=… pnpm build && pnpm start` 里前缀只作用于 `build`，第二条命令根本拿不到端口。

服务端同样用 Vite 构建产物跑，而不是 `tsx` 直跑源码。`dist-ssr/server/` 与 `src/server/` 同深度，入口才能解析到正确的位置；server 产物不放进 `dist/`，否则会被 `express.static` 整个静态暴露。

前端是 React 19，`src/web/main.tsx` 用 `createRoot` 挂载 `App`，`App.tsx` 里三个状态（路径、内容、读取中）都用 React Hook，样式是一个 CSS 文件。这个组件在 dev 和生产下没有任何分支判断——它只知道向 `/api/read-file` 发请求，谁来回答它，取决于当前跑的是哪种 server。

### 启动方式对照

- 页面来源：dev 是 Vite 实时编译，生产是 `dist/` 静态产物。
- API 挂载：dev 是 Vite 插件中间件，生产是进程内 Express 路由。
- 端口：dev 52301，生产 52302，互不冲突。
- 前端代码与 API 本体：两种模式完全一致，没有任何分支。
