# AI 导航站 — 部署指南

前端部署到 **GitHub Pages**（静态免费），后端部署到 **Render / Railway**（Node + 数据库）。
两者通过环境变量对接，互不依赖。

> 想省事、不介意每月几美元，也可以只部署后端：后端现在能同进程托管前端产物，
> 一条 `docker compose up -d --build` 即可上线（见下文「方案 B」）。

---

## 部署架构

```
                      ┌─────────────────────────┐
   用户浏览器 ──────▶ │ GitHub Pages            │
                      │  Vue3 SPA（web/dist）   │
                      └────────────┬────────────┘
                                   │ HTTPS + JWT
                                   ▼
                      ┌─────────────────────────┐
                      │ Render / Railway        │
                      │  NestJS API  :3001      │
                      │  SQLite → /data (持久卷) │
                      └─────────────────────────┘
```

---

## 方案 A：前端 GitHub Pages + 后端 Render（推荐）

### 第 1 步：推送代码到 GitHub

```bash
cd F:\deepseek\ai-nav
git init
git add .
git commit -m "chore: 初始化 AI 导航站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

> `.gitignore` 已排除 `node_modules/`、`dist/` 和 `.env`，可安全提交。
> 注意 `.env` 不要提交 —— 里面有开发用的 JWT_SECRET 和管理员密码。

### 第 2 步：在 Render 部署后端

1. 打开 [render.com](https://render.com) 注册/登录，**New → Blueprint**。
2. 选择刚推送的仓库，Render 会读取 [render.yaml](render.yaml) 自动创建服务。
3. 面板里修改这几个值：
   | 变量 | 改成什么 |
   | --- | --- |
   | `JWT_SECRET` | 点 Generate 生成随机值（不要手写） |
   | `ADMIN_PASSWORD` | 你的强密码 |
   | `WEB_ORIGIN` | 你的 GitHub Pages 地址，如 `https://用户名.github.io` |
4. **磁盘**：Blueprint 会自动创建一个 1GB 磁盘挂在 `/data`。
   免费套餐的磁盘可能要确认一下已附加，否则重启会丢数据。
5. 点 Create / Deploy，等构建完成（首次约 3–5 分钟）。
6. 记下服务地址，形如 `https://ai-nav-api.onrender.com`。

验证后端：浏览器打开 `https://ai-nav-api.onrender.com/api/health`，
应返回 `{"status":"ok", ...}`。

> Render 免费套餐会在 15 分钟无访问后休眠，下次请求需 30–60 秒冷启动。

### 第 3 步：写入种子数据

Render 控制台 → 你的服务 → **Shell** 标签页，执行：

```bash
cd /app/server
pnpm run seed
```

会创建 10 个分类、96 个 AI 工具和管理员账号。

### 第 4 步：开启 GitHub Pages

1. 仓库页面 → **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
2. 仓库 → **Settings → Secrets and variables → Actions → Variables → New repository variable**：
   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://ai-nav-api.onrender.com/api` |
3. 推一次代码触发工作流（或到 Actions 页面手动 Run workflow）：

```bash
git commit --allow-empty -m "deploy: 触发 Pages 构建"
git push
```

4. Actions 跑完后，站点地址为 `https://<你的用户名>.github.io/<仓库名>/`。

### 第 5 步：验收

| 检查项 | 期望结果 |
| --- | --- |
| 打开首页 | 能看到精选推荐、分类入口 |
| 点「搜索」搜「Claude」 | 有结果 |
| 点任意工具卡片 | 跳转详情页 |
| 访问 `<域名>/admin/login` | 能打开后台登录页 |
| 用 `admin` + 你设的密码登录 | 进入数据看板 |
| 后台改站点名称 → 前台刷新 | 名称已更新 |

---

## 方案 B：只用后端，同进程托管前后端

后端现在支持托管 `web/dist`（见 [main.ts](server/src/main.ts) 的 `useStaticAssets`）。
适合有自己的服务器、或想省掉跨域配置的场景。

```bash
# 1. 改掉占位值
#    docker-compose.yml 里所有 change_me
#    .env 里 JWT_SECRET、ADMIN_PASSWORD

# 2. 构建并启动（含 MySQL）
docker compose up -d --build

# 3. 写入种子数据
docker compose exec app sh -c "cd /app/server && pnpm run seed"
```

访问 `http://localhost:3001` 即为完整站点，API 在 `/api`，文档在 `/api/docs`。

只用 SQLite 不要 MySQL：

```bash
docker build -t ai-nav .
docker run -d -p 3001:3001 \
  -e JWT_SECRET="你的随机长字符串" \
  -e ADMIN_PASSWORD="你的强密码" \
  -e DATABASE_URL="file:/data/prod.db" \
  -v ai-nav-data:/data \
  ai-nav
docker exec -it <容器ID> sh -c "cd /app/server && pnpm run seed"
```

> 之前 [Dockerfile](Dockerfile) 复制了 `web/dist` 但后端没有托管逻辑，
> 前台页面实际打不开；现已修复，同进程托管可用。

---

## 前后端分离时的关键配置

| 位置 | 变量 | 作用 |
| --- | --- | --- |
| 前端构建 | `VITE_BASE` | GitHub Pages 子路径，形如 `/仓库名/`。工作流已按仓库名自动推导 |
| 前端构建 | `VITE_API_URL` | 后端完整地址。**留空则用同源 `/api`**，前后端分离必须填 |
| 后端运行 | `WEB_ORIGIN` | 允许的跨域来源，逗号分隔多个。含 GitHub Pages 域名才能通过 CORS |
| 后端运行 | `DATABASE_URL` | `file:/data/prod.db` 指向持久卷 |
| 后端运行 | `JWT_SECRET` | 生产必须改，32 位以上随机串 |

> 前端把 API 地址烧进了构建产物，所以改 `VITE_API_URL` 后必须重新部署 Pages。

---

## 常见问题

**Pages 能打开，但数据全是空的 / 请求失败**
→ 十有八九是 `VITE_API_URL` 没配或配错。到仓库 Variables 里确认，然后重新跑 Actions。
浏览器 F12 → Network 看请求实际打到哪个域名。

**登录时报 CORS 错误**
→ 后端的 `WEB_ORIGIN` 没包含你的 Pages 地址。注意 `https://` 和结尾 `/` 要写对，
多个来源用逗号分隔，不要带空格以外的多余字符。

**后台能登录，但刷新页面 404**
→ GitHub Pages 不支持 SPA 回退。已在 [404.html](web/public/404.html) +
[index.html](web/index.html) 里做了 hash 还原，深链应该可用；若仍不行，
建议给 Pages 绑自定义域名并在后端同域部署，或改用方案 B。

**Render 重启后数据没了**
→ 磁盘没挂上。确认服务详情页 Volumes 里有 `/data`，且 `DATABASE_URL` 指向它。

**想换成 MySQL**
→ 1) [schema.prisma](server/prisma/schema.prisma) 的 `provider` 改 `"mysql"`；
2) `DATABASE_URL` 改成 `mysql://user:pass@host:3306/db`；
3) 删掉旧迁移目录后重新 `pnpm db:migrate` + `pnpm db:seed`。

---

## 安全检查清单

- [ ] `JWT_SECRET` 已改为 32 位以上随机字符串
- [ ] `ADMIN_PASSWORD` 已改，且不是 `admin123456`
- [ ] `.env` 没有被提交进仓库（`git log --stat -- .env` 应为空）
- [ ] 数据库用了持久卷或托管数据库
- [ ] 已登录后台改一次密码（seed 的初始密码只用于首次进入）
- [ ] 需要备案的话，在后台「站点设置」填 ICP 备案号
