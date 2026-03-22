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

## GitHub Pages 在线访问

1. 将本仓库推送到 GitHub 后，打开 **Settings → Pages**。
2. **Build and deployment** 的 Source 选择 **GitHub Actions**（不要选 Branch）。
3. 推送或手动运行 Workflow **Deploy GitHub Pages**；完成后站点一般为：

   **https://upzed0n.github.io/TravelMaster2.0/**

（若用户名大小写不同，以 GitHub 显示的 Pages 地址为准。）

## 移动端

```bash
cd web
npm run build:mobile
npm run cap:open:android
```

需本机安装 Android Studio / Xcode。
