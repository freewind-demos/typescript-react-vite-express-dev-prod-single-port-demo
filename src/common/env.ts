import fs from "node:fs"; // 引入同步文件读取
import path from "node:path"; // 引入 Node 路径工具

// 端口：Vite 配置与生产 server 共用；APP_PORT 缺失时兜底为 -1，Vite 与 listen 都会报端口非法
export const getEnvPort = () => Number(process.env.APP_PORT ?? -1);

// 向上查找含 package.json 的目录作为项目根；源码与产物都不在根目录，需要跨层级定位
const findRoot = (start: string): string => {
  // 从当前层开始逐级上溯
  let dir = start;
  for (;;) {
    // 本层有 package.json 即认定是项目根
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    // 到达文件系统根仍未找到则报错，不做默认值兜底
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        "[single-port-demo] 未向上找到 package.json，项目根定位失败",
      );
    }
    // 继续上溯
    dir = parent;
  }
};

// 项目根目录：从当前模块位置向上找
// import.meta.dirname 是产物文件的位置，不是源码位置；打包时模块被拉平到产物层，位置会变
const getRootDir = (): string => findRoot(import.meta.dirname);

// 前端产物目录：由 vite build 产出
// 不写相对层级（如 ../../dist），因为层级随打包位置变化，从根拼绝对路径两种位置都成立
export const getWebDistDir = (): string => path.join(getRootDir(), "dist");
