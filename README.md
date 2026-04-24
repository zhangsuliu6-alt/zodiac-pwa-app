# 生肖预测 PWA

这是一个可以部署到 Vercel 的 iPhone 网页 App。

## 功能

- 打开自动同步最新 30 期
- 平特一肖：给 1 个生肖
- 波色：给 2 个波色
- 大小：给 1 个
- 单双：给 1 个
- 自动生成近 10 期已结算预测记录
- 使用 Vercel API 代理接口，减少手机 Safari 跨域问题

## 部署

1. 上传整个项目到 GitHub
2. 在 Vercel 新建项目并选择该仓库
3. Framework Preset 选择 Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

## iPhone 添加到主屏幕

用 Safari 打开部署后的网址，点分享按钮，选择“添加到主屏幕”。

## 提醒

开奖类结果随机性强，本工具只做统计参考，不保证命中。
