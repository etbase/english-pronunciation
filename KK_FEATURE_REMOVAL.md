# TEMP KK PHONETIC FEATURE — 移除說明

這是暫時功能。刪除後，網站應恢復成加入 KK 音標之前的導覽與頁面。不要重構其他功能。

## 1. 刪除這些檔案

- `kk.html`
- `css/kk.css`
- `js/kk.js`
- `js/kk-data.js`
- `assets/icons/kk-phonetic.svg`
- `assets/kk/`（含 `audio/` 與若有的 `kk-phonemes.zip`）
- `KK_FEATURE_REMOVAL.md`（本檔）

## 2. 還原既有頁面的 navigation

在以下 6 個 HTML 搜尋註解 `TEMP KK PHONETIC FEATURE`：

- `index.html`
- `course.html`
- `history.html`
- `help.html`
- `login.html`
- `profile.html`

要做兩件事：

1. **Desktop 左側 `nav.nav`**：刪除「KK 音標」那一列（`href="kk.html"` 的連結，以及包住它的 `TEMP KK PHONETIC FEATURE` 註解）。
2. **Mobile 底部 `.bottom-nav`**：刪除「KK 音標」那一列，並把最後一項改回原本的「使用說明」：

```html
  <a href="help.html">
    <span class="bottom-nav-icon"><img src="assets/icons/help.svg" alt=""></span>
    <span>使用說明</span>
  </a>
```

`help.html` 的這一列原本有 `class="active"`。

Desktop 左下角「使用說明」本來就一直留著，刪 KK 時不要動它。

## 3. 確認不受影響的範圍

不要改、也不需要還原：

- 自由練習、課程學習、歷史紀錄、個人頁
- 發音分析、錄音、Firebase、既有 Azure `/api/tts` 與 `/api/assess`

KK 沒有把邏輯寫進 `js/app.js`、`js/tts.js` 或 Azure Function。
