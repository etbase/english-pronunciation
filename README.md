# ERIC TING English Pronunciation

美式英文發音練習網站：輸入句子、聽標準美式發音、跟讀錄音、取得發音分析與中文改善建議。

> 目前版本為前端 MVP 原型，發音分析為模擬分數，尚未串接真正的 AI 語音分析與雲端帳號系統。詳見下方「開發路線圖」。

## 目前 MVP 功能

- 輸入英文句子（限 200 字，即時字數統計）
- 播放美式標準發音（瀏覽器內建 Web Speech API）
- 麥克風錄音、播放、下載錄音檔
- 可重複練習與重錄
- 顯示發音分數與模擬改善建議（六項指標：準確度／重音／節奏／連音／省音／流暢度）
- 依分數切換角色表情圖
- 保留最近 5 筆練習紀錄（暫存於瀏覽器 `localStorage`）
- 模擬登入（Google 登入模擬）與「我的帳戶」頁面：顯示名字（可編輯）、已連接帳號、練習統計、登出

## 技術棚

**目前：**

- 純靜態網站：HTML5 / CSS3 / Vanilla JavaScript（無框架、無建置工具）
- 瀏覽器原生 API：`SpeechSynthesis`（TTS）、`MediaRecorder`（錄音）
- 狀態儲存：`localStorage`（僅存在使用者本機瀏覽器，無雲端同步）

**規劃中（詳見開發路線圖）：**

- Firebase Authentication（登入，可擴充 Google / Email / Apple 等多種登入方式）
- Firestore（使用者資料、練習紀錄）、Firebase Storage（錄音檔）
- Cloud Functions（後端，代理呼叫 AI 語音分析服務、保護金鑰）
- AI 語音分析服務（發音、重音、節奏、語調、連音、省音、流暢度）

## 專案結構

```
english-pronunciation/
├── index.html          # 練習頁：輸入句子、聽發音、錄音、分析結果
├── login.html           # 登入頁
├── profile.html          # 我的帳戶頁：顯示登入資訊、編輯名字、練習統計、登出
├── history.html         # 歷史紀錄頁
├── help.html            # 使用說明 / FAQ
├── css/
│   └── style.css        # 全站樣式
├── js/
│   ├── app.js            # 練習頁核心邏輯（TTS、錄音、模擬評分、寫入歷史、累計練習統計）
│   ├── login.js          # 登入邏輯（目前為模擬登入）
│   ├── profile.js        # 我的帳戶頁邏輯（顯示使用者資料、編輯名字、登出）
│   ├── account-nav.js    # 依登入狀態切換左上角帳戶圖示要導向登入頁或個人頁面
│   ├── mobile-nav.js     # 小螢幕的漢堡選單開關（側邊欄滑出/收合）
│   └── history.js        # 歷史紀錄讀取與渲染
├── assets/
│   ├── characters/       # 角色情緒圖（預設／開心／生氣）
│   └── icons/            # 介面圖示 (SVG)
├── .env.example          # 未來各階段所需環境變數範例
└── .gitignore
```

## 本機預覽

這是純靜態網站，可以直接用瀏覽器開啟 `index.html`。但**錄音功能（`MediaRecorder`／`getUserMedia`）在部分瀏覽器下，於 `file://` 路徑可能無法正常授權麥克風權限**，建議用簡單的本地伺服器啟動，例如：

```bash
# 方式一：使用 Python 內建的伺服器
python3 -m http.server 8080

# 方式二：使用 Node 的 http-server（需先安裝：npm install -g http-server）
http-server -p 8080
```

啟動後開啟 `http://localhost:8080` 即可。

> 部署到正式網域時，網站必須是 **HTTPS**，否則瀏覽器會直接封鎖麥克風權限。

## 開發路線圖

**第一階段：帳號與資料儲存**
- Firebase Authentication 登入（設計為可插拔多供應商，非寫死僅支援 Google）
- 使用者資料、練習紀錄改存雲端（Firestore + Storage），取代目前的 `localStorage`

**第二階段：真正的 AI 語音分析**
- 串接 AI 語音分析服務，取代目前的模擬分數
- 分析項目：Pronunciation（發音）、Stress（重音）、Rhythm（節奏）、Intonation（語調）、Connected Speech（連音）、Elision（省音）、Fluency（流暢度）
- 提供具體、可執行的中文改善建議

**第三階段：會員系統**
- 歷史成績列表、進步曲線
- 會員專屬功能與付費方案

## 版本紀錄

### v2
- `stop.svg`、`analysis.svg` 圖示改為白色，適合放在按鈕內
- 新增角色圖片支援：`character-koala-default.png`（預設）／`character-koala-happy.png`（≥60 分）／`character-koala-angry.png`（<60 分），放置於 `assets/characters/`
- 「錄音暫存」功能改為「下載音檔」
- 歷史紀錄自動保存最近 5 筆
- 新增六個分析項目圖示：`metric-accuracy.svg`（發音準確度）、`metric-stress.svg`（重音）、`metric-rhythm.svg`（節奏）、`metric-connected-speech.svg`（連音）、`metric-elision.svg`（省音）、`metric-fluency.svg`（流暢度）
