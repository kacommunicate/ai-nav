# AI 导航站

一个全栈 AI 工具导航网站：前台面向访客提供分类浏览、搜索、详情与访问排行；后台提供工具/分类/标签管理、数据看板、站点设置与操作日志。

技术栈：**NestJS 10 + Prisma 6 + Vue 3 + TypeScript**，默认 SQLite（零配置启动），可切换到 Postgres / MySQL。

---

## ✨ 功能特性

### 前台（面向访客）
| 功能 | 说明 |
| --- | --- |
| 首页 | 精选推荐、分类入口、最新收录、访问排行 |
| 分类浏览 | 按分类查看，支持排序、价格筛选、是否需网络工具筛选 |
| 关键词搜索 | 匹配名称 / 简介 / 链接 / 标签 |
| 标签筛选 | 点击标签快速筛选相关工具 |
| 工具详情 | 完整简介、价格标签、中文支持、跳转官网、复制链接、同类推荐 |
| 访问统计 | 每次跳转自动计数，驱动热门排行 |
| SEO 基础 | 站点名称 / 描述 / 关键词 / 公告可在后台配置 |

### 后台（`/admin`）
| 功能 | 说明 |
| --- | --- |
| 数据看板 | 工具数、分类数、访问总量、今日/近 7 天访问，趋势图与分类分布图 |
| 工具管理 | 增删改查、推荐置顶、状态切换（发布/待审核/下架）、排序、批量操作、JSON 批量导入 |
| 分类管理 | 增删改查、图标、主题色、排序、启停（有工具的分类禁止删除） |
| 标签管理 | 重命名（自动合并同名标签）、删除 |
| 站点设置 | 站点名称、描述、公告、ICP、页脚文字，带实时预览 |
| 操作日志 | 记录登录、创建、更新、删除、排序等操作 |
| 修改密码 | 带密码强度提示 |

---

## 🚀 快速开始

### 环境要求
- Node.js ≥ 18（推荐 20+）
- pnpm ≥ 9（`npm i -g pnpm`）
- 可选：Postgres 16（`docker compose up -d db` 即可起本地库）

### 1. 安装依赖

```bash
cd ai-nav
pnpm install
```

### 2. 初始化数据库

**本地开发推荐用 SQLite**（零配置，把 `.env` 保持默认即可）：

```bash
# 生成 Prisma Client
pnpm db:generate

# 创建数据库表结构
pnpm db:migrate
#   提示 "Enter a name" 时输入 init 后回车

# 写入种子数据（10 个分类 + 96 个真实 AI 工具 + 管理员账号）
pnpm db:seed
```

> schema 默认 provider 是 `postgresql`（生产用 Neon）。
> 本地想用 SQLite 的话，把 `server/prisma/schema.prisma` 的 `provider` 改成 `"sqlite"`，
> 再执行上面三步。两种方式二选一即可。

### 3. 启动开发服务

```bash
pnpm dev
```

| 服务 | 地址 |
| --- | --- |
| 前台首页 | http://localhost:5173 |
| 后台登录 | http://localhost:5173/admin/login |
| API 服务 | http://localhost:3001/api |
| Swagger 文档 | http://localhost:3001/api/docs |

**默认管理员账号**：`admin` / `admin123456`（登录后请立即修改密码）

> `pnpm dev` 会同时启动前后端；Vite 已配置 `/api` 代理到 3001 端口，无需额外处理跨域。

---

## 📁 目录结构

```
ai-nav/
├── package.json              # 根脚本（pnpm workspace）
├── pnpm-workspace.yaml
├── .env.example              # 环境变量模板
├── Dockerfile                # 生产镜像（前后端合并）
├── docker-compose.yml        # 一键部署（含 Postgres）
├── server/Dockerfile.api     # 生产镜像（仅后端，前端分离部署用）
├── koyeb.yaml                # Koyeb 部署配置
├── DEPLOY.md                 # 公网部署指南（GitHub Pages + Koyeb + Neon）
├── .github/workflows/        # GitHub Pages 自动部署
│
├── server/                   # NestJS 后端
│   ├── prisma/
│   │   ├── schema.prisma     # 数据模型（10 个模型）
│   │   └── seed.ts           # 种子数据（96 个工具）
│   └── src/
│       ├── main.ts           # 入口（全局前缀 /api、Swagger）
│       ├── app.module.ts
│       ├── prisma/           # Prisma 服务
│       ├── auth/             # JWT 登录、守卫、角色
│       ├── tools/            # 工具 CRUD + 点击统计 + 导入
│       ├── categories/       # 分类 CRUD
│       ├── tags/             # 标签管理
│       ├── stats/            # 统计看板
│       ├── settings/         # 站点设置
│       └── audit/            # 操作日志
│
└── web/                      # Vue 3 前端
    ├── index.html
    └── src/
        ├── main.ts
        ├── router/           # 路由 + 鉴权守卫
        ├── stores/           # Pinia（auth / site）
        ├── api/              # Axios 封装（自动带 Token）
        ├── types/            # 共享类型
        ├── layouts/          # 前台 / 后台布局
        ├── components/       # ToolCard 等
        └── views/
            ├── HomeView.vue           # 首页
            ├── CategoryView.vue       # 分类页
            ├── SearchView.vue         # 搜索页
            ├── ToolDetailView.vue     # 详情页
            ├── AboutView.vue          # 关于页
            └── admin/                 # 后台 7 个页面
```

---

## 🗄 数据库模型

核心模型关系：

```
Category 1 ──< Tool >── 1 Tag        (ToolTag 多对多关联表)
Tool 1 ──< ClickLog                  (每次跳转记录一条)
User 1 ──< AuditLog                  (后台操作审计)
SiteSetting (单例)                   (站点配置)
```

| 模型 | 说明 |
| --- | --- |
| `Category` | 分类（slug 唯一、图标、主题色、排序） |
| `Tool` | 工具（URL、简介、价格模式、是否需网络工具、中文支持、推荐、状态、点击量） |
| `Tag` / `ToolTag` | 标签与多对多关联 |
| `ClickLog` | 点击日志（IP、UA、来源） |
| `User` | 管理员账号（bcrypt 加密） |
| `AuditLog` | 操作审计 |
| `SiteSetting` | 站点设置（单例，id 固定为 `default`） |

枚举：`Pricing`（FREE / FREEMIUM / PAID / TRIAL）、`ToolStatus`（PUBLISHED / PENDING / OFFLINE）、`UserRole`（ADMIN / EDITOR）

---

## 🔌 API 概览

全局前缀 `/api`。标注 🔓 的为公开接口，其余需要 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | 🔓 `/auth/login` | 登录，返回 JWT |
| GET | 🔓 `/auth/me` | 当前登录用户（实际需 Token） |
| GET | 🔓 `/settings` | 站点设置 |
| GET | 🔓 `/categories` | 分类列表（含工具数） |
| GET | 🔓 `/tags` | 标签列表 |
| GET | 🔓 `/tools` | 工具列表（分页 + 筛选 + 搜索） |
| GET | 🔓 `/tools/top` | 热门排行 |
| GET | 🔓 `/tools/:idOrSlug` | 工具详情 |
| POST | 🔓 `/tools/:id/click` | 记录点击并返回跳转地址 |
| GET | `/tools/admin/list` | 后台工具列表 |
| POST | `/tools/admin` | 新增工具 |
| PUT | `/tools/admin/:id` | 更新工具 |
| DELETE | `/tools/admin/:id` | 删除工具 |
| PUT | `/tools/admin/batch/sort` | 批量排序 |
| POST | `/tools/admin/import` | JSON 批量导入 |
| GET | `/categories/admin/list` | 后台分类列表 |
| POST/PUT/DELETE | `/categories/admin[/:id]` | 分类管理 |
| PUT | `/admin/stats/overview` · `trend` · `by-category` | 统计数据 |
| GET | `/admin/audit-logs` | 操作日志 |
| PUT | `/settings` | 更新站点设置 |
| POST | `/auth/change-password` | 修改密码 |

完整交互式文档见启动后的 `http://localhost:3001/api/docs`。

---

## 🐳 Docker 部署

### 方式一：前后端合并（单容器托管全站）

```bash
# 1. 修改 docker-compose.yml 中的密码与 JWT_SECRET
# 2. 启动
docker compose up -d --build

# 3. 写入种子数据（首次）
docker compose exec app sh -c "cd /app/server && pnpm run seed"
```

访问 http://localhost:3001（前后端由同一进程托管，NestJS 直接伺服 `web/dist`）。
默认使用 Postgres 16，数据存在 `pg-data` 卷中，重启不丢。

### 方式二：仅 SQLite 单容器

```bash
docker build -t ai-nav .
docker run -d -p 3001:3001 \
  -e JWT_SECRET=your-long-random-secret \
  -e ADMIN_PASSWORD=your-strong-password \
  -e DATABASE_URL="file:/data/prod.db" \
  -v ai-nav-data:/data \
  ai-nav
```

> 请挂载卷到 `/data`，否则容器重建后 SQLite 数据会丢失。
> 注意：schema 默认 provider 是 `postgresql`，用 SQLite 前需先改回 `"sqlite"`。

---

## ☁️ 公网部署（GitHub Pages + Koyeb + Neon）

免费方案，**全程无需信用卡**：

- 前端 → GitHub Pages（静态托管）
- 后端 → Koyeb 免费实例（Docker）
- 数据库 → Neon 免费 Postgres

详细步骤见 [DEPLOY.md](DEPLOY.md)。

要点：数据库 schema 已默认 `postgresql`；后端用 [server/Dockerfile.api](server/Dockerfile.api) 单独构建；前端通过 `VITE_API_URL` 指向 Koyeb 域名，后端用 `WEB_ORIGIN` 放行跨域。

---

## 🔄 数据库切换

当前默认 provider 为 `postgresql`（配合 Neon / Docker 免费部署）。

**切到 SQLite（本地零配置开发）：**
1. 编辑 `server/prisma/schema.prisma`，将 `provider` 改为 `"sqlite"`
2. 编辑根目录 `.env`：`DB_PROVIDER="sqlite"`，`DATABASE_URL="file:./dev.db"`
3. 重新执行 `pnpm db:migrate` + `pnpm db:seed`

**切到 MySQL：**
1. `server/prisma/schema.prisma` 的 `provider` 改为 `"mysql"`
2. `DATABASE_URL` 改为 `mysql://user:password@127.0.0.1:3306/ai_nav`
3. 重建迁移并写入种子数据：
   ```bash
   rm -rf server/prisma/migrations
   pnpm db:migrate     # 输入 init
   pnpm db:seed
   ```

---

## 🛠 常用命令

```bash
pnpm dev              # 同时启动前后端（开发模式）
pnpm dev:server       # 仅后端
pnpm dev:web          # 仅前端

pnpm build            # 构建生产包
pnpm start            # 启动生产服务（需先 build）

pnpm db:studio        # 打开 Prisma 可视化数据库管理
pnpm db:reset         # 重置数据库（清空 + 重新迁移）
pnpm db:seed          # 重新写入种子数据
```

---

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 后端端口 |
| `DB_PROVIDER` | `postgresql` | `postgresql` / `sqlite` / `mysql` |
| `DATABASE_URL` | — | 数据库连接串（Postgres 需带 `?sslmode=require`） |
| `JWT_SECRET` | 开发默认值 | **生产必须修改** |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |
| `ADMIN_USERNAME` | `admin` | 种子管理员账号 |
| `ADMIN_PASSWORD` | `admin123456` | 种子管理员密码 |
| `WEB_ORIGIN` | `http://localhost:5173` | 前端地址（CORS），多个用逗号分隔 |

---

## 🔒 生产部署清单

- [ ] 修改 `JWT_SECRET` 为 32 位以上随机字符串
- [ ] 修改默认管理员密码（或通过 seed 前的环境变量设置强密码）
- [ ] 数据库换成 Neon Postgres 或自建数据库，并配强密码
- [ ] 修改 `docker-compose.yml` 中所有 `change_me` 占位值
- [ ] 如备案，在后台「站点设置」填写 ICP 备案号
- [ ] 配置 Nginx 反向代理 + HTTPS（可选）

完整检查清单见 [DEPLOY.md](DEPLOY.md#安全检查清单)。

---

## 📝 说明

- 种子数据中的 96 个工具来自互联网公开信息整理，链接均指向官方网站；如信息有误，可在后台直接编辑修正。
- 工具图标未配置时，会自动根据名称生成渐变色首字母图标，无需上传图片也能有统一的视觉风格。
- 点击统计在跳转时异步记录，失败不影响用户正常访问。
