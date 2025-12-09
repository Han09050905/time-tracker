# 工時管理系統 - Time Tracker

Hannee Design 內部工時管理系統

## 技術棧

- React 18
- Vite
- Firebase (Firestore + Auth)
- Tailwind CSS
- Lucide React Icons

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

## 部署到 Render

1. 將代碼推送到 GitHub
2. 在 Render 創建新的 Static Site
3. 連接 GitHub 倉庫
4. 設置建置命令：`npm run build`
5. 設置發布目錄：`dist`
6. 部署！

## Firebase 配置

Firebase 配置已包含在 `src/App.jsx` 中。如需更改，請修改 `firebaseConfig` 對象。

