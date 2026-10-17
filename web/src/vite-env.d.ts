/// <reference types="vite/client" />

// 构建期由 vite.config.ts 通过 define 注入。
// 前端代码通过 src/api/index.ts 的 API_BASE 消费，不直接引用此常量。
declare const __API_BASE__: string;
