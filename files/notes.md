# 演示笔记

- 同一个 Express 路由，在 dev 下由 Vite 中间件承载，在生产下由 Node server 承载。
- 前端只写相对路径 `/api/...`，因此谁在同一端口提供页面，谁就顺手提供 API。
