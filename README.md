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

打开 http://127.0.0.1:52301 （dev）或 http://127.0.0.1:52302 （生产），输入相对路径如 `README.txt` 或 `notes.md`，点击「读取」。

## 注意事项

- 两个端口不重叠，dev 与生产服务可同时运行。
- 端口和路径全部由启动命令通过环境变量传入，代码里没有默认值；缺失 `APP_PORT` 或 `WEB_ROOT` 时服务直接报错退出，不会静默退化成别的端口。
- 可被读取的文件被限制在 `files/` 目录内，传入 `../package.json` 会被拒绝。
- `pnpm start` 只启动、不构建；上线流程是 `pnpm run build` 然后 `pnpm start`。
- 页面没有前端路由，因此不需要 history fallback。

## 教程

### 核心思路

单端口能成立只有一个前提：**前端所有请求都用相对路径**（`/api/...`），不写死 host 和 port。于是「谁在同一端口提供页面，谁就顺手提供 API」，跨端口代理配置完全不需要。剩下的问题只是：这个提供页面的 server 在开发时是 Vite，在生产时是 Node，两者怎么挂同一份 API。

### demo 原理

API 本体在 `src/server/api/readFile.ts`，导出 `createApiRouter()`，包含两个端点：`/api/health` 探活、`/api/read-file?path=` 读取指定文件。它不知道自己在哪个端口上，也不关心自己被谁挂载。

挂载方式有两处，各自只做一件事：

- `src/server/devServer.ts`（开发）用 Vite 的 `createServer()` 程序化启动，端口来自 `APP_PORT`，并挂上 `devApiPlugin()`。插件在 `configureServer` 里插一个中间件，命中 `/api/` 的请求转交一个 Express app，其余放行给 Vite 自己处理。因此 dev 下 Vite 独占一个端口，页面和 API 都在里面。
- `src/server/main.ts`（生产）是一个独立 Node 进程：`express.static(dist)` 提供构建产物页面，进程内 `app.listen(APP_PORT)` 监听，同一个端口上同时有页面和 API。

### 关键代码解读

配置收口在 `src/shared/common/env.ts`。`resolveServerPort()` 只认 `APP_PORT`，缺失或非法直接抛错；`WEB_ROOT` 由启动命令用 `$PWD` 现算注入，代码里不写 `../..` 相对层级也不读 `process.cwd()`。原因是源码目录与构建产物目录层级不同，且服务被 launchd 之类启动时 cwd 不可控——靠相对路径猜目录会表现为「dev 正常、生产读不到文件」。

`package.json` 里端口前缀写在真正启动服务的那条命令上，不能跨 `&&`：

```json
"dev":   "WEB_ROOT=\"$PWD\" FILES_ROOT=\"$PWD/files\" APP_PORT=52301 vite-node src/server/devServer.ts",
"build": "vite build && vite build --ssr src/server/main.ts --outDir dist-ssr/server",
"start": "WEB_ROOT=\"$PWD\" FILES_ROOT=\"$PWD/files\" APP_PORT=52302 node dist-ssr/server/main.js"
```

这也解释了为什么 `start` 不带 `build`：`APP_PORT=… pnpm build && pnpm start` 里前缀只作用于 `build`，第二条命令根本拿不到端口。

服务端同样用 Vite 构建产物跑，而不是 `tsx` 直跑源码。`dist-ssr/server/` 与 `src/server/` 同深度，入口才能解析到正确的位置；server 产物不放进 `dist/`，否则会被 `express.static` 整个静态暴露。

最后是安全边界。`resolveInsideFilesRoot()` 把请求里的相对路径解析成绝对路径后，与 `FILES_ROOT` 求相对关系，逃出根目录就拒绝。演示里 `../package.json` 返回 400，不存在的文件返回 404。

### 启动方式对照

- 页面来源：dev 是 Vite 实时编译，生产是 `dist/` 静态产物。
- API 挂载：dev 是 Vite 插件中间件，生产是进程内 Express 路由。
- 端口：dev 52301，生产 52302，互不冲突。
- 前端代码与 API 本体：两种模式完全一致，没有任何分支。
