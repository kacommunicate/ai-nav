// 供 vite.config.ts 使用的全局声明。
// vite.config.ts 由 tsconfig.node.json（composite 项目）编译，
// 该项目的 include 不覆盖 src/**，所以这里单独声明。
declare const __API_BASE__: string;
