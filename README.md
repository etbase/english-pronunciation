# ERIC TING English Pronunciation

美式英文發音練習網站：輸入句子、聽標準美式發音、跟讀錄音、取得發音分析與中文改善建議。

> 目前版本為前端 MVP 原型，發音分析為模擬分數，尚未串接真正的 AI 語音分析與雲端帳號系統。詳見下方「開發路線圖」。

## 目前 MVP 功能

- 輸入英文句子（限 200 字，即時字數統計）
- 播放美式標準發音（Azure Neural TTS `en-US-AvaNeural`，經由 Azure Functions 後端；失敗時退回瀏覽器內建語音），可切換慢速播放
- 麥克風錄音、播放、下載錄音檔（檔名自動帶入句子關鍵字＋時間戳）
- 錄音時顯示即時音量條，確認麥克風正常收音
- 可重複練習與重錄
- 顯示發音分數與模擬改善建議（六項指標：準確度／重音／節奏／連音／省音／流暢度）
- 依分數切換角色表情圖
- 保留最近 10 筆練習紀錄（暫存於瀏覽器 `localStorage`），含分析分數，可一鍵「重新練習」帶回練習頁，或刪除單筆紀錄
- 資料夾收藏：練習頁與歷史紀錄都能把句子收藏到資料夾（可新增／重新命名／刪除資料夾），並在「我的帳戶」頁面依資料夾檢視收藏的句子
- 模擬登入（Google 登入模擬）與「我的帳戶」頁面：顯示名字（可編輯）、已連接帳號、資料夾收藏、登出

## 技術棚

**目前：**

- 靜態前端：HTML5 / CSS3 / Vanilla JavaScript（無框架、無建置工具），可部署 GitHub Pages
- Azure Functions（Node.js）：`POST /api/tts` 代理呼叫 Azure Speech Text-to-Speech，金鑰只存在後端環境變數
- 瀏覽器原生 API：`SpeechSynthesis`（TTS 後備）、`MediaRecorder`（錄音）
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
├── profile.html          # 我的帳戶頁：顯示登入資訊、編輯名字、資料夾收藏、登出
├── history.html         # 歷史紀錄頁
├── help.html            # 使用說明 / FAQ
├── css/
│   └── style.css        # 全站樣式
├── js/
│   ├── app.js            # 練習頁核心邏輯（錄音、模擬評分、寫入歷史、累計練習統計）
│   ├── config.js         # 前端公開設定（只有 TTS API 網址，沒有任何金鑰）
│   ├── tts.js            # 全站標準發音播放（呼叫 /api/tts、session cache、playbackRate、speechSynthesis 後備）
│   ├── login.js          # 登入邏輯（目前為模擬登入）
│   ├── profile.js        # 我的帳戶頁邏輯（顯示使用者資料、編輯名字、資料夾清單、登出）
│   ├── account-nav.js    # 依登入狀態切換帳戶圖示（側邊欄＋手機底部選單）要導向登入頁或個人頁面
│   ├── history.js        # 歷史紀錄讀取與渲染
│   ├── folders.js        # 資料夾收藏共用邏輯（資料存取＋收藏小面板 UI），練習頁／歷史紀錄頁／我的帳戶頁共用
│   └── audio-player.js   # 自繪錄音播放條（取代原生 <audio controls>，避免瀏覽器內建深灰色時間軸），練習頁／歷史紀錄頁共用
├── api/                  # Azure Functions 後端（TTS 代理，金鑰不進前端）
│   ├── host.json
│   ├── local.settings.json.example  # 本機環境變數範本（請複製成 local.settings.json 後自行填 Key）
│   └── src/functions/tts.js         # POST /api/tts
├── assets/
│   ├── characters/       # 角色情緒圖（預設／開心／生氣）
│   └── icons/            # 介面圖示 (SVG)
├── firebase/
│   ├── firestore.rules   # Firestore 安全規則範本（Phase 1 導入時使用，目前尚未連接 Firebase）
│   └── storage.rules     # Storage 安全規則範本（存錄音檔時使用）
├── .githooks/            # 本機 git 安全防護（commit／push 前自動掃描機密內容，見 SECURITY.md）
├── SECURITY.md           # 安全性說明：什麼能進 git、金鑼管理原則、上線前檢查清單
├── .env.example          # 未來各階段所需環境變數範例
└── .gitignore
```

## 安全性

專案有設定本機的 git hooks（`.githooks/`），`commit`／`push` 前會自動掃描是否有機密金鑼或不該進版本控制的檔案（如 `.env`、Service Account JSON），偵測到會直接擋下來。新 clone 一份 repo 到別的電腦時，記得先執行一次：

```bash
git config core.hooksPath .githooks
```

完整說明（什麼能進 git、Firebase 安全規則、語音 API 金鑼管理原則、上線前檢查清單）見 [SECURITY.md](./SECURITY.md)。

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

## 標準發音（Azure TTS）

前端（GitHub Pages）不會持有 Azure Key。流程是：

```
GitHub Pages 前端  →  POST /api/tts  →  Azure Function  →  Azure Speech TTS
```

前端只傳送 `{ "text": "...", "voice": "en-US-AvaNeural" }`，回傳 MP3。同一句在同一個分頁 session 內會重用已下載的音訊；慢速播放只用 `playbackRate`（1.0 / 0.5），不會再向 Azure 收費。

### 本機後端

1. 安裝 [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
2. 複製設定檔（這個檔**不要 commit**）：

```bash
cp api/local.settings.json.example api/local.settings.json
```

3. 由你本人把 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_REGION` 填進 `api/local.settings.json`（不要貼到聊天室、不要寫進前端）
4. 啟動：

```bash
cd api
npm install
npm start
```

Functions 本機預設是 `http://localhost:7071/api/tts`。前端用 `python3 -m http.server 8080` 開網站即可。

### 正式環境（Azure Portal 手動設定）

在 Function App → **Settings** → **Environment variables** / **Application settings** 新增：

| 名稱 | 填什麼 |
| --- | --- |
| `AZURE_SPEECH_KEY` | Speech 資源的 Key 1（只貼在這裡） |
| `AZURE_SPEECH_REGION` | 例如 `eastus` |
| `ALLOWED_ORIGINS` | 你的 GitHub Pages 來源，例如 `https://USERNAME.github.io`（可逗號分隔多個；不要設 `*`） |

Azure Portal 的 Function App → CORS 也請填同一個 GitHub Pages 來源，不要勾選「允許所有」。

前端把 `js/config.js` 裡的正式網址改成：

```text
https://YOUR-FUNCTION-APP.azurewebsites.net/api/tts
```

這是公開 API 網址，不是金鑰。

**絕對不要 commit：** `api/local.settings.json`、根目錄 `.env`、任何含真實 Key 的檔案。


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

### v5
- 標準發音改走 Azure Functions `POST /api/tts` 代理 Azure Neural TTS（預設 `en-US-AvaNeural`），練習頁／歷史紀錄／資料夾共用同一套播放邏輯
- Azure Speech Key 只存在 Function 後端環境變數，前端與 git 都不放金鑰
- 同一句文字在分頁 session 內重用已取得的 MP3；慢速播放改用 `playbackRate`，不重複向 Azure 產生語音
- Azure 失敗或尚未設定時，自動退回瀏覽器 `speechSynthesis`

### v4
- 歷史紀錄保留筆數由 5 筆增加為 10 筆
- 新增「資料夾」收藏功能：練習頁句子輸入區、歷史紀錄卡片都能點資料夾圖示收藏，可選現有資料夾或新增資料夾；「我的帳戶」頁面的「練習統計」改為「資料夾」，依資料夾列出收藏的句子，可重新命名／刪除資料夾、對每句收藏「重新練習」或「移除」；收藏後圖示會變成品牌綠色，跟未收藏時的灰色圖示做出區別
- 「我的帳戶」頁面的資料夾清單改成跟使用說明 QA 一樣可以收合的卡片，不會一次全部展開
- 歷史紀錄卡片重新排版：錄音播放條改成跟練習頁差不多寬度（不再是撐滿整張卡片的超長版本），移到「聽標準發音」跟「重新練習」之間；「刪除」改成垂圾桶圖示按鈕，跟「資料夾」收藏圖示一起對齊在卡片右側（資料夾在上、刪除在下、分數在最上面）
- 修正錄音播放條在系統深色模式下顯示過深的問題（強制淺色 `color-scheme`）
- 慢速播放（烏龜圖示）按下後的背景改回柔和灰色，不再是搶眼的綠色；圖示放大
- 刪除資料夾時，裡面收藏的句子會一併刪除（不再自動移回預設資料夾）
- 「請先輸入句子…」提示文字改回網站的深藍色文字，不再用綠色
- 「我的帳戶」頁面資料夾內的收藏句子，改成跟歷史紀錄一樣的卡片排版（顯示收藏時間、「聽標準發音」「重新練習」「移除」三個按鈕）
- 錄音播放條改成自繪的淺灰底、品牌青綠色進度條（`js/audio-player.js`），取代瀏覽器原生的 `<audio controls>`：因為 Chrome／Safari 內建播放條的時間軸底色即使在淺色模式下也是深灰色，且瀏覽器沒有開放足夠的樣式覆蓋能力，所以改用 `<input type="range">` 自己畫，顏色可以完全跟網站配色一致
- 資料夾展開／收合的箭頭改成自訂的箭頭圖形，比瀏覽器預設的小三角箭頭更大更明顯
- 我的帳戶頁面資料夾裡的每句收藏，現在會用句子文字去歷史紀錄裡找回「這句話最新一次的錄音」並顯示播放條與分數（歷史紀錄本來就只保留每句話最後一次的錄音，資料夾不用另外存一份）；如果這句話還沒錄過音，會顯示提示文字

### v3
- 歷史紀錄新增「重新練習」（帶回練習頁並預填句子）與「刪除」單筆紀錄
- 歷史紀錄新增顯示分析分數（分析完成後自動補上，未分析則顯示「尚未分析」）
- 下載音檔檔名改為「句子關鍵字＋時間戳」，不再每次都同名
- 標準發音新增「慢速播放」開關：改為可點擊的圖示按鈕（turtle.svg），點一下在 1.0／0.5 倍速切換，不用勾選框也不用 emoji
- 錄音時新增即時音量條視覺回饋
- 修正中等視窗寬度（約 1100～1380px）下，發音分析結果文字與按鈕文字被擠成一字一行、角色圖片被隱藏的問題

### v2
- `stop.svg`、`analysis.svg` 圖示改為白色，適合放在按鈕內
- 新增角色圖片支援：`character-koala-default.png`（預設）／`character-koala-happy.png`（≥60 分）／`character-koala-angry.png`（<60 分），放置於 `assets/characters/`
- 「錄音暫存」功能改為「下載音檔」
- 歷史紀錄自動保存最近 5 筆
- 新增六個分析項目圖示：`metric-accuracy.svg`（發音準確度）、`metric-stress.svg`（重音）、`metric-rhythm.svg`（節奏）、`metric-connected-speech.svg`（連音）、`metric-elision.svg`（省音）、`metric-fluency.svg`（流暢度）
