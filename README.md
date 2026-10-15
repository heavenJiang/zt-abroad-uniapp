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
| `pages/quick/index` | 30 秒快测输入页：本科学校（搜索）、均分、目标国家 / 地区（未开放的标“即将开放”）、专业方向，勾选同意隐私政策；上次填写的答案本机带入 |
| `pages/quick/result` | 快测结果：各国家 / 地区冲 / 稳 / 保与代表校、补足后可申及差距、最关键的差距、混申提示；顶部固定提示“仅按院校层次和均分估算，未计入科研、实习、标化”；加入选校单、引导完整测评（已填信息自动带入） |
| `pages/tool/recognition` | 本校认可度：选本科学校，看各已开放国家 / 地区项目是否接收、均分要求（不显示院校层次） |
| `pages/tool/ielts` | 雅思够不够：雅思总分与最低小分、目标国家 / 地区、专业（选填）→ 达标 / 读语言班可达标 / 未达标及差距 |
| `pages/tool/open` | 现在还能申：按截止日从近到远列出仍开放项目（不采集个人信息，无需同意隐私政策） |
| `pages/plan/index` | 我的选校单（查看与移除；逐项达标、失衡提示在 M4-10） |

规范见 `doc/前端开发规范.md`。
