import path from "node:path"; // 引入 Node 路径工具

// 读取必填环境变量，缺失即报错，不做默认值兜底
function requireEnv(name: string): string {
  // 取值
  const value = process.env[name];
  // 缺失直接抛错，避免静默退化成错配置
  if (!value) {
    throw new Error(`[single-port-demo] 缺少环境变量 ${name}（必须由启动命令显式指定）`);
  }
  // 返回原始字符串，路径解析统一在下方用 path 收口
  return value;
}

// 端口：唯一来源是 APP_PORT，缺失或非法直接抛错
export const resolveServerPort = (): number => {
  // 转为数字
  const port = Number(process.env.APP_PORT);
  // 校验是正整数
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("[single-port-demo] 缺少合法的 APP_PORT 环境变量（端口必须显式指定）");
  }
  // 返回端口
  return port;
};

// 前端工程根目录：用于定位 dist 静态产物
export const WEB_ROOT_DIR = requireEnv("WEB_ROOT");

// 前端产物目录：生产环境由 express.static 提供
export const WEB_DIST_DIR = path.join(WEB_ROOT_DIR, "dist");

// 允许被读取的文件根目录：读取接口的路径白名单边界
export const FILES_ROOT_DIR = requireEnv("FILES_ROOT");
