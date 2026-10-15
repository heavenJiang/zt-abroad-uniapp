# zt-abroad-uniapp

留学智能体平台 C 端（学生、家长）：uni-app（Vue 3 + Vite），H5 与微信小程序双端。后端为 `../zt-abroad-parent`（只调用 `/app/**`），管理后台为 `../zt-abroad-vue`。

## 开发

```bash
npm ci
npm run dev:h5          # H5，http://localhost:5173，/app 代理到 http://localhost:8090（.env.development 可改）
npm run dev:mp-weixin   # 小程序，用微信开发者工具导入 dist/dev/mp-weixin
npm test                # 单元测试（请求客户端、渠道码）
```

本机没有 Node 20 时可用 Docker：

```bash
docker run --rm -v "$PWD":/src -v abr-npm-cache:/root/.npm -w /src node:20 bash -c 'npm ci && npm test && npm run build:h5 && npm run build:mp-weixin'
```

## 构建与部署

- `npm run build:h5` → `dist/build/h5/`：部署到 C 端域名（如 `m.<域名>`）。Nginx 只代理 `/app/**` 到后端，其余路径 `try_files $uri $uri/ /index.html`（H5 路由为 history 模式）。
- `npm run build:mp-weixin` → `dist/build/mp-weixin/`：上线前在 `src/manifest.json` 填 `mp-weixin.appid`，在 `.env.production` 填 `VITE_MP_API_BASE`（小程序后台配置的 request 合法域名）。

## 页面

| 页面 | 说明 |
| --- | --- |
| `pages/index` | 落地页：一句话价值、学段选择（首屏学段路由）、测完会得到什么（示例报告模糊处理）、三步流程、开始 / 继续上次测评、免责与隐私政策入口；文案在 `src/config/landing.js` |
| `pages/consent` | 隐私同意：摘要 + 可展开全文，同意后创建测评（带渠道码、内容编号、同意的协议版本） |
| `pages/policy` | 隐私政策全文 |
| `pages/assessment` | 测评承接页（显示进度；答题页在 M4-05） |

规范见 `doc/前端开发规范.md`。
