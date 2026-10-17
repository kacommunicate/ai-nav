# AI 导航站 — 部署指南（GitHub Pages + Koyeb + Neon）

免费方案，**全程无需信用卡**。

前端部署到 **GitHub Pages**（静态托管），后端部署到 **Koyeb**（免费 Node 容器），
数据库用 **Neon** 免费 Postgres。三者通过环境变量对接。

> 想省事、不介意花钱：可只用 Docker 单容器托管前后端，见下文「方案 B」。
> 需要绑卡的 Render 方案已废弃，见 [render.yaml](render.yaml) 顶部说明。

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
                      │ Koyeb（免费实例）        │
                      │  NestJS API  :3001      │
                      └────────────┬────────────┘
                                   │ SSL
                                   ▼
                      ┌─────────────────────────┐
                      │ Neon 免费 Postgres       │
                      │  表结构 + 96 个工具数据  │
                      └─────────────────────────┘
```

---

## 第 1 步：建 Neon 数据库

1. 打开 [neon.tech](https://neon.tech)，用 GitHub 登录。
2. **New Project** → 名字填 `ai-nav` → Region 选 **Singapore**（国内访问相对快）。
3. 创建后复制连接串，形如：

   ```
   postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/db?sslmode=require
   ```

4. **`?sslmode=require` 不能丢** —— Neon 强制 SSL。

> schema 已默认 `postgresql`，无需改代码。

---

## 第 2 步：Koyeb 部署后端

1. 打开 [app.koyeb.com](https://app.koyeb.com)，用 GitHub 登录。
2. **Create Service** → **GitHub** → 选中你的仓库。
3. Build 配置：

   | 项 | 值 |
   | --- | --- |
   | Build system | `Dockerfile` |
   | Dockerfile | `server/Dockerfile.api` |
   | Work directory | 保持仓库根目录，**不要**填 `server/` |

4. Region 选 **Singapore**，Instance 选 **Free**。
5. 添加环境变量：

   | 变量 | 值 |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `DATABASE_URL` | 第 1 步的 Neon 连接串 |
   | `JWT_SECRET` | 随机 32 位以上串（见下） |
   | `JWT_EXPIRES_IN` | `7d` |
   | `WEB_ORIGIN` | `https://<你的GitHub用户名>.github.io` |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | 你的强密码 |

   生成 `JWT_SECRET`（任选其一）：

   ```bash
   openssl rand -hex 32
   # 或
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. Advanced → Health check：路径 `/api/health`，端口 `3001`。
7. **Deploy**，等状态变 **Running**。
8. 记下公网地址，形如 `https://ai-nav-api-xxxx.koyeb.app`。
9. 验证：浏览器打开 `<地址>/api/health` → 应返回 `{"status":"ok",...}`。

---

## 第 3 步：导入种子数据

Koyeb → 你的 Service → **Console** 标签页：

```bash
cd /app/server && pnpm exec prisma migrate deploy && pnpm run seed
```

- `migrate deploy` 建表（schema 已是 postgresql）
- `seed` 写入 10 个分类 + 96 个工具 + 管理员账号
- **只需执行一次**
- 必须用 `pnpm exec prisma`，镜像里没有全局 prisma CLI

---

## 第 4 步：GitHub Pages 部署前端

1. 仓库 → **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
2. 仓库 → **Settings → Secrets and variables → Actions → Variables → New repository variable**：

   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<第2步的Koyeb地址>/api` |

   **结尾必须带 `/api`**，这是最常见的错。

3. 推送触发构建（已推过可推空提交）：

   ```bash
   git commit --allow-empty -m "触发 Pages 构建" && git push
   ```

4. Actions 出现绿勾后，站点地址：
   ```
   https://<你的用户名>.github.io/<仓库名>/
   ```

---

## 第 5 步：验收

| 检查项 | 期望结果 |
| --- | --- |
| 打开首页 | 精选推荐、分类入口正常显示 |
| 搜索框搜 `Claude` | 有结果 |
| 点工具卡片 | 跳转详情页 |
| 访问 `<域名>/admin/login` | 后台登录页能打开 |
| 用 `admin` + 你设的密码登录 | 进入数据看板，有工具数和访问统计 |
| 后台「站点设置」改名称 | 前台刷新后生效 |

---

## 方案 B：Docker 单容器托管全站

后端支持托管 `web/dist`（见 [main.ts](server/src/main.ts) 的 `useStaticAssets`），
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

访问 `http://localhost:3001`，API 在 `/api`，文档在 `/api/docs`。

---

## 前后端分离时的关键配置

| 位置 | 变量 | 作用 |
| --- | --- | --- |
| 前端构建 | `VITE_BASE` | GitHub Pages 子路径，形如 `/仓库名/`。工作流按仓库名自动推导 |
| 前端构建 | `VITE_API_URL` | 后端完整地址。**留空则用同源 `/api`**，分离部署必须填 |
| 后端运行 | `WEB_ORIGIN` | 允许的跨域来源，逗号分隔多个 |
| 后端运行 | `DATABASE_URL` | Neon Postgres 连接串，必须带 `?sslmode=require` |
| 后端运行 | `JWT_SECRET` | 生产必须改，32 位以上随机串 |

> `VITE_API_URL` 是**编译期**烧进 JS 的，改它之后必须重新部署 Pages。

---

## 常见问题

**Pages 能打开但数据空白 / 请求失败**
→ `VITE_API_URL` 没配或没带 `/api`。到仓库 Variables 确认，改完重新跑 Actions。
浏览器 F12 → Network 看请求实际打到哪个域名。

**登录报 CORS 错误**
→ `WEB_ORIGIN` 不是你的 Pages 地址。注意 `https://` 前缀、结尾不带斜杠。

**Neon 连接超时 / 密码错误**
→ 连接串缺 `?sslmode=require`，或复制时漏了字符。Neon 控制台可重新显示完整串。

**Koyeb 首次访问慢**
→ 免费实例休眠后需数秒唤醒，正常现象。

**Console 里提示 prisma 找不到**
→ 用 `pnpm exec prisma`，不要用裸 `prisma`。

**后台页面刷新 404**
→ GitHub Pages 不支持 SPA 回退。[404.html](web/public/404.html) +
[index.html](web/index.html) 已做 hash 还原，多数深链可用；仍有问题建议用方案 B。

**想换成 MySQL**
→ [schema.prisma](server/prisma/schema.prisma) 的 `provider` 改 `"mysql"`，
`DATABASE_URL` 改 `mysql://user:pass@host:3306/db`，重新 `migrate deploy` + `seed`。

---

## 安全检查清单

- [ ] `JWT_SECRET` 已改为 32 位以上随机字符串
- [ ] `ADMIN_PASSWORD` 已改，且不是 `admin123456`
- [ ] `.env` 没有被提交进仓库（`git log --stat -- .env` 应为空）
- [ ] 数据库用的是 Neon Postgres（非本地 SQLite）
- [ ] 已登录后台改一次密码（seed 的初始密码只用于首次进入）
- [ ] 需要备案的话，在后台「站点设置」填 ICP 备案号
