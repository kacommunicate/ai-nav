# ============================================================
#  AI 导航站 — 生产 Dockerfile
#  多阶段构建：server + web 打包后由单一 Node 进程托管
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN pnpm install --no-frozen-lockfile

# ---------- 构建后端 ----------
FROM node:20-alpine AS build-server
WORKDIR /app
RUN npm install -g pnpm@9
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY server ./server
WORKDIR /app/server
RUN pnpm exec prisma generate && pnpm run build

# ---------- 构建前端 ----------
FROM node:20-alpine AS build-web
WORKDIR /app
RUN npm install -g pnpm@9
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY web ./web
WORKDIR /app/web
RUN pnpm run build

# ---------- 运行时 ----------
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build-server /app/node_modules ./node_modules
COPY --from=build-server /app/server/node_modules ./server/node_modules
COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-server /app/server/prisma ./server/prisma
COPY --from=build-web /app/web/dist ./web/dist
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/

WORKDIR /app/server
EXPOSE 3001

# 启动时执行迁移 + 启动服务
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
