# 安全性說明

這份文件整理專案的安全防護機制，跟之後接 Firebase 登入／語音分析 API 時該注意的事情。
目的是讓「不小心把機密洩漏出去」這件事，盡量在還沒發生之前就被擋下來。

## 1. 什麼可以進 git，什麼不行

| 類型 | 可以進 git？ | 說明 |
| --- | --- | --- |
| Firebase 用戶端設定值（`apiKey`、`authDomain`、`projectId` 等） | ✅ 可以 | 這些本來就設計成公開的，Firebase 的安全性是靠 Security Rules 把關，不是靠隱藏這些值 |
| `.env.example` | ✅ 可以 | 只是範例格式，裡面不該填真實的值 |
| `.env` / `.env.local` | ❌ 絕對不行 | 已被 `.gitignore` 排除，也被 git hook 擋著 |
| Firebase Service Account JSON（`serviceAccountKey.json` 之類） | ❌ 絕對不行 | 這是後端管理員權限的金鑼，洩漏等於整個專案被拿走控制權 |
| 語音分析 API 金鑼（Azure Speech、Google Cloud 等） | ❌ 絕對不行 | 用量計費的金鑼，洩漏會被盜用，帳單算在你頭上 |
| `.pem` / `.p12` / `.key` 憑證檔 | ❌ 絕對不行 | 私鑼檔案 |

## 2. 本機的自動防護：Git Hooks

專案裡有 `.githooks/` 資料夾，裡面放了兩層防護：

- **`pre-commit`**：每次 `git commit` 前，掃描這次要 commit 的內容，如果檔名符合上面「絕對不行」的名單，或內容裡疑似出現常見的金鑰格式（Google API Key、AWS Key、Stripe 金鑼、PEM 私鑼等），會直接擋下這次 commit
- **`pre-push`**：每次 `git push` 前，再把即將推送的所有 commit 內容掃過一次，就算某次 commit 不小心用 `--no-verify` 跳過了第一層，這裡還有第二層可以擋

**目前本機這個 repo 已經設定好了**（跑過 `git config core.hooksPath .githooks`），所以你現在不管是 `git commit` 還是 `git push`，都會自動經過這兩層檢查，不會因為手滑就把機密推上 GitHub。

如果之後在別的電腦重新 clone 這個 repo，記得跑一次：

```bash
git config core.hooksPath .githooks
```

（這行只需要在每台新電腦上跑一次，因為這個設定是存在本機的 git 設定裡，不會跟著 repo 自動生效。）

**如果 hook 誤判擋到正常的內容**：可以用 `git commit --no-verify` 或 `git push --no-verify` 強制跳過，但請先仔細確認真的沒有洩漏機密，不要為了方便習慣性跳過檢查。

## 3. Firebase 安全規則（Phase 1 開始時使用）

`firebase/firestore.rules` 跟 `firebase/storage.rules` 是先寫好的規則範本，核心原則是：

> **每個使用者只能讀寫「自己名下」的資料，其他人的資料一律不能碰，沒有明確允許的路徑，預設全部拒絕。**

這是為了避免開發時常見的錯誤：先用「測試模式」（完全開放讀寫）方便開發，正式上線忘記關掉，導致任何人都能讀取、竄改甚至刪除所有使用者的資料。正式導入 Firebase 時，記得把這兩份規則部署上去，不要一直停留在測試模式。

## 4. Phase 2：語音分析 API 金鑼管理原則

這個專案是純靜態網站（GitHub Pages），前端的 HTML/CSS/JS **對所有使用者都是公開可見的**，這是網頁技術本身的特性，跟用哪個平台部署無關。所以：

- Firebase 用戶端設定值可以放在前端，沒問題
- 但 Azure Speech / Google Cloud 這類「用量計費」的付費金鑼，**絕對不能**直接寫在前端程式碼裡，否則任何人都能從公開的網站原始碼把金鑼複製走，拿去盜用
- 正確做法：透過 Firebase Cloud Functions（或其他後端）當中介 —— 前端呼叫自己的 Function，Function 再用「藏在伺服器端、外部看不到」的金鑼去呼叫 Azure/Google，付費金鑼永遠不會出現在前端程式碼或 git repo 裡

## 5. 正式上線前的檢查清單

- [ ] Firestore／Storage 規則已經從測試模式換成正式的存取控制規則
- [ ] Google 登入的「已授權網域」已經加上正式網域
- [ ] 語音分析 API 金鑼只存在後端環境變數，前端程式碼跟 git repo 裡都找不到
- [ ] Firebase 專案已設定用量／帳單預算警示（Budget Alerts）
- [ ] 確認 `.env`、Service Account JSON 等機密檔案從來沒有被 commit 過（可以用 `git log --all --full-history -- .env` 之類的指令檢查）
