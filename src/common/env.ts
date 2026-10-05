// 端口：Vite 配置读取用；APP_PORT 缺失时兜底为 -1，让 Vite 报端口非法
export const getEnvPort = () => Number(process.env.APP_PORT ?? -1);
