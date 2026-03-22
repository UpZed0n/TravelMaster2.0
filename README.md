# TravelMaster2.0 · Tour Talk（云途清单）

本地优先的智能旅游助手：Next.js 14 + Capacitor + Dexie + Transformers.js（RAG）+ 高德地图 + OpenAI 兼容对话。

## 目录说明

| 目录 | 说明 |
|------|------|
| `web/` | Next.js 应用与 Capacitor 工程 |
| `PRDs/` | 产品与技术文档 |
| `design_docs/` | UI 草图 |

## 本地运行

```bash
cd web
cp .env.example .env.local   # 填写高德等（勿提交 .env.local）
npm install
npm run dev
```

浏览器访问 <http://localhost:3000>。

## 密钥安全

- **不要**将 `.env.local` 或任何含 API Key 的文件提交到 Git。
- 通义千问等 Key 由用户在 App 内填写，仅存本机；高德 `NEXT_PUBLIC_*` 若写入构建，访客可在前端看到，请在[高德控制台](https://console.amap.com/)配置域名白名单。

## GitHub Pages 在线访问（部署）

**顺序很重要**：先改 Pages 源，再跑工作流；否则 `deploy` 任务会失败。

1. 打开仓库 [**Settings → Pages**](https://github.com/UpZed0n/TravelMaster2.0/settings/pages)。
2. 在 **Build and deployment** 中，**Source** 选 **GitHub Actions**（不要选 *Deploy from a branch*）。
3. 触发构建二选一：
   - 推送任意提交到 `main`；或
   - 打开 [**Actions**](https://github.com/UpZed0n/TravelMaster2.0/actions) → 工作流 **Deploy GitHub Pages** → **Run workflow**。
4. 等待 **build** 与 **deploy** 两个 Job 全部成功；访问地址一般为：

   **https://upzed0n.github.io/TravelMaster2.0/**

（以 Settings → Pages 顶部显示的 **Visit site** 为准。）

## Vercel 部署（推荐，根路径访问）

仓库根目录已包含 [`vercel.json`](vercel.json)：在 `web/` 内安装依赖、执行 `next build`，并发布静态导出目录 `web/out`。

1. 打开 [Vercel](https://vercel.com) → **Add New…** → **Project** → 导入 [UpZed0n/TravelMaster2.0](https://github.com/UpZed0n/TravelMaster2.0)。
2. **不要**改 Build/Output 覆盖项（沿用 `vercel.json` 即可）；如需在控制台填环境变量，可添加 `NEXT_PUBLIC_AMAP_KEY`、`NEXT_PUBLIC_AMAP_SECURITY_CODE` 等（勿提交进 Git）。
3. **不要**在 Vercel 里设置 `NEXT_PUBLIC_BASE_PATH`：该变量仅用于 GitHub Pages 子路径；Vercel 默认部署在域名根路径，不设才能正常加载 `_next` 静态资源。
4. 部署完成后，在[高德控制台](https://console.amap.com/)为 Key 配置 **`*.vercel.app`**（及你的自定义域名）的安全域名白名单。

也可用 [Vercel CLI](https://vercel.com/docs/cli)：`vercel`（首次登录按提示操作），项目链接信息在本地 `.vercel/`，已写入 `.gitignore`。

## 移动端

```bash
cd web
npm run build:mobile
npm run cap:open:android
```

需本机安装 Android Studio / Xcode。
用户手动在设置中填写千问AI的key以及高德地图API key和安全密钥
