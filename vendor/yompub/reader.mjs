// src/render.mjs
function renderBook(book, { document: doc, resolveAsset }) {
  const el = (tag, text) => {
    const e = doc.createElement(tag);
    if (text !== void 0) e.textContent = text;
    return e;
  };
  function inline(nodes, parent) {
    for (const n of nodes) {
      if (n.type === "text") {
        parent.append(doc.createTextNode(n.value));
        continue;
      }
      if (n.type === "softBreak") {
        parent.append(doc.createTextNode("\n"));
        continue;
      }
      let e;
      switch (n.type) {
        case "hardBreak":
          e = el("br");
          break;
        case "code":
          e = el("code", n.value);
          break;
        case "emphasis":
        case "strong":
          e = el(n.type === "emphasis" ? "em" : "strong");
          inline(n.children, e);
          break;
        case "link":
          e = el("a");
          e.setAttribute("href", n.href);
          if (!n.href.startsWith("#")) {
            e.setAttribute("rel", "noopener noreferrer");
            e.setAttribute("target", "_blank");
          }
          if (n.title) e.title = n.title;
          inline(n.children, e);
          break;
        case "image":
          e = el("img");
          e.setAttribute("src", resolveAsset(n.src));
          e.setAttribute("alt", n.alt);
          if (n.title) e.title = n.title;
          e.setAttribute("decoding", "async");
          break;
        case "ruby":
          e = el("ruby");
          e.append(doc.createTextNode(n.base), el("rp", "\uFF08"), el("rt", n.annotation), el("rp", "\uFF09"));
          break;
        case "span":
          e = el("bdi", n.value);
          e.lang = n.lang;
          e.dir = n.direction;
          break;
      }
      parent.append(e);
    }
  }
  function blocks(nodes, parent, tight = false) {
    for (const n of nodes) {
      let e;
      switch (n.type) {
        case "paragraph":
          if (tight) {
            inline(n.children, parent);
            continue;
          }
          e = el("p");
          inline(n.children, e);
          break;
        case "heading":
          e = el(`h${n.level}`);
          e.id = n.id;
          e.tabIndex = -1;
          inline(n.children, e);
          break;
        case "blockquote":
          e = el("blockquote");
          blocks(n.children, e);
          break;
        case "list":
          e = el(n.ordered ? "ol" : "ul");
          if (n.ordered) e.setAttribute("start", String(n.start));
          blocks(n.children, e, n.tight);
          break;
        case "item":
          e = el("li");
          blocks(n.children, e, tight);
          break;
        case "codeBlock":
          e = el("pre");
          e.append(el("code", n.value));
          break;
        case "thematicBreak":
          e = el("hr");
          break;
      }
      parent.append(e);
    }
  }
  const article = el("article");
  article.className = "book";
  article.lang = book.metadata.lang;
  article.dir = book.metadata.direction;
  article.style.writingMode = book.metadata.writingMode;
  article.dataset.mode = book.metadata.writingMode;
  article.setAttribute("aria-label", book.metadata.title);
  if (book.metadata.cover) {
    const cover = el("div");
    cover.className = "cover";
    const img = el("img");
    img.setAttribute("src", resolveAsset(book.metadata.cover.src));
    img.setAttribute("alt", book.metadata.cover.alt);
    cover.append(img);
    article.append(cover);
  }
  blocks(book.blocks, article);
  return article;
}

// src/reader.css
var reader_default = `/* Reader styles live only inside its shadow root; no document-wide selectors. */
:host { display:block; width:100%; height:100%; min-width:0; min-height:0; container-type:inline-size; }
* { box-sizing:border-box; }
[hidden] { display:none!important; }
.shell { all:initial; display:flex; flex-direction:column; width:100%; height:100%; min-height:0; min-width:0; overflow:hidden; direction:ltr; writing-mode:horizontal-tb; text-align:start; font:16px/1.5 system-ui,-apple-system,"Hiragino Sans",sans-serif; font-synthesis:none; color:var(--ink); color-scheme:light; background:var(--paper); --paper:var(--yompub-paper-background,#fff); --ink:var(--yompub-paper-foreground,#000); --line:#ccc; --muted:#555; --hover:#f2f2f2; --accent:var(--yompub-paper-accent,#0000ee); --font-size:20px; --line-height:1.9; }
.shell[data-theme="night"] { color-scheme:dark; --paper:var(--yompub-night-background,#000); --ink:var(--yompub-night-foreground,#fff); --line:#666; --muted:#ccc; --hover:#1a1a1a; --accent:var(--yompub-night-accent,#6699ff); }
button,input,select { font:inherit; }
button,select { border:1px solid var(--line); border-radius:6px; background:var(--paper); color:var(--ink); padding:.5em .7em; }
button { cursor:pointer; }
button:hover { background:var(--hover); }
button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible,select:focus-visible,#viewport:focus-visible { outline:3px solid var(--accent); outline-offset:-3px; }
.load-state { flex:none; display:flex; flex-wrap:wrap; align-items:center; gap:12px; font-size:12px; min-height:36px; }
.load-state p { margin:6px 0; }
#error { flex:none; margin:4px 0; max-height:80px; overflow:auto; padding:8px; border-inline-start:3px solid var(--ink); background:var(--paper); color:var(--ink); white-space:pre-wrap; overflow-wrap:anywhere; font-size:13px; }
#reader { flex:1; min-height:0; min-width:0; display:flex; flex-direction:column; gap:12px; }
.reader-top { flex:none; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
#book-title { font-family:Georgia,"Yu Mincho",serif; font-size:24px; font-weight:500; margin:0; }
#book-author { font-size:12px; color:var(--muted); margin:0; }
#mode-label { margin:0; font-size:10px; letter-spacing:.1em; color:var(--muted); }
.controls { display:grid; grid-template-columns:auto auto auto auto; align-items:center; gap:8px 10px; font-size:12px; }
.controls label { white-space:nowrap; }
.slider-control { display:flex; align-items:center; gap:6px; }
.controls input { width:85px; height:20px; margin:0; appearance:none; background:transparent; accent-color:var(--accent); cursor:pointer; }
/* Keep the native range semantics, with visible tracks and blue thumbs even
   in WebKit, where accent-color does not recolor the native range control. */
.controls input::-webkit-slider-runnable-track { height:4px; border-radius:2px; background:var(--line); }
.controls input::-webkit-slider-thumb { appearance:none; width:16px; height:16px; margin-top:-6px; border:0; border-radius:50%; background:var(--accent); }
.controls input::-moz-range-track { height:4px; border-radius:2px; background:var(--line); }
.controls input::-moz-range-thumb { width:16px; height:16px; border:0; border-radius:50%; background:var(--accent); }
.controls output { min-width:3.5em; font-variant-numeric:tabular-nums; }
#close-book { grid-column:3 / 5; }
.reading-layout { flex:1; min-height:0; min-width:0; display:flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--paper); }
#toc { flex:0 0 170px; min-height:0; overflow:auto; padding:20px 12px; border-inline-end:1px solid var(--line); font-size:12px; }
#toc ol { list-style:none; padding:0; margin:0; }
#toc li { margin:0 0 12px; }
#toc a { display:block; color:var(--accent); line-height:1.7; text-underline-offset:3px; }
#viewport { flex:1; min-width:0; min-height:0; overflow:auto; overflow-anchor:none; padding:24px 32px; color:var(--ink); scrollbar-gutter:stable; }
#viewport:has(.book[data-mode="vertical-rl"]) { direction:rtl; }
/* A reserved vertical scrollbar gutter shifts Chromium's horizontal scroll
   origin by its width; vertical books use the horizontal scrollbar instead. */
#viewport:has(.book:not([data-mode="horizontal-tb"])) { scrollbar-gutter:auto; }
.book {
  font-family:"Yu Mincho","Hiragino Mincho ProN",Georgia,serif;
  font-size:var(--font-size);
  line-height:var(--line-height);
  overflow-wrap:anywhere;
}
.book:lang(ja) {
  /* Prefer Japanese fonts with vertical metrics before generic CJK fallback. */
  font-family:"Yu Mincho","Hiragino Mincho ProN","Noto Serif CJK JP","Noto Serif JP","IPAexMincho","IPAMincho","Noto Sans CJK JP","Noto Sans JP","IPAGothic",serif;
}
.shell[data-font-family="gothic"] .book { font-family:"Yu Gothic","Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans CJK JP","Noto Sans JP","IPAexGothic","IPAGothic",sans-serif; }
.book[data-mode="horizontal-tb"] {
  max-width:36em;
  margin-inline:auto;
}
.book:not([data-mode="horizontal-tb"]) {
  height:100%;
  min-height:0;
  max-width:none;
  margin:0;
  padding-inline:12px;
}
.book h1,.book h2,.book h3,.book h4,.book h5,.book h6 {
  font-weight:600;
  line-height:1.7;
  scroll-margin:12px;
}
.book h1 {
  font-size:1.5em;
}
.book h2 {
  font-size:1.2em;
}
.book p {
  margin-block:1.3em;
}
.book p:first-child {
  margin-block-start:0;
}
.book a {
  color:var(--accent);
  text-underline-offset:.2em;
}
.book img {
  display:inline-block;
  max-width:min(100%,480px);
  max-height:100%;
  object-fit:contain;
  vertical-align:middle;
}
.book:not([data-mode="horizontal-tb"]) img {
  max-width:300px;
  max-height:100%;
  width:auto;
  height:auto;
}
.cover {
  margin-block-end:2em;
  display:flex;
  align-items:center;
  justify-content:center;
}
.cover img {
  max-height:100%;
}
.book blockquote {
  border-inline-start:2px solid var(--line);
  padding-inline-start:1em;
  margin-inline:0;
  color:inherit;
}
.book ruby {
  ruby-position:over;
}
.book rt {
  font-size:.5em;
}
.book pre {
  white-space:pre-wrap;
}
.book code {
  font-size:.85em;
  font-family:ui-monospace,monospace;
}
.book hr {
  border:0;
  border-block-start:1px solid var(--line);
  margin-block:2em;
}
.book bdi {
  unicode-bidi:isolate;
}

.book[dir="rtl"] { font-family:"Geeza Pro",Tahoma,serif; }
#source-panel { flex:none; max-height:38%; overflow:auto; font-size:12px; }
summary { cursor:pointer; }
.hint { color:var(--muted); }
.source-actions { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0; }
#source { padding:12px; background:var(--paper); color:var(--ink); white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.8; unicode-bidi:plaintext; }
#warnings { white-space:pre-wrap; color:var(--ink); }
.shell[data-chrome="none"] .load-state,
.shell[data-chrome="none"] .reader-top,
.shell[data-chrome="none"] #toc,
.shell[data-chrome="none"] #source-panel { display:none; }
.shell[data-chrome="none"] .reading-layout { border:0; border-radius:0; }
.shell[data-chrome="none"] #viewport { padding:40px; overscroll-behavior-x:contain; }
.shell[data-chrome="none"] .book h1:first-child { margin-block-start:0; }
@container (max-width:540px) {
  .reading-layout { flex-direction:column; }
  #toc { flex:0 0 auto; max-height:88px; border-inline-end:0; border-bottom:1px solid var(--line); padding:10px; }
  #toc ol { display:flex; gap:16px; }
  #toc li { min-width:110px; margin:0; }
  #viewport { padding:16px; }
  .book:not([data-mode="horizontal-tb"]) img { max-width:230px; }
  .controls { gap:6px 8px; }
  .controls input { width:46px; }
  .shell[data-chrome="none"] #viewport { padding:24px 20px; }
}
`;

// src/reader-ui.mjs
var markup = `
<div class="shell" lang="ja">
  <div class="load-state"><p id="status" role="status" aria-live="polite">\u672C\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002</p><button id="cancel" type="button" hidden>\u8AAD\u307F\u8FBC\u307F\u3092\u4E2D\u65AD</button></div>
  <p id="error" role="alert" hidden></p>
  <section id="reader" hidden aria-label="\u672C\u306E\u30D3\u30E5\u30FC\u30A2">
    <div class="reader-top"><div><p id="mode-label"></p><h2 id="book-title"></h2><p id="book-author"></p></div><div class="controls" role="group" aria-label="\u8868\u793A\u8A2D\u5B9A">
      <label for="font-size">\u6587\u5B57\u30B5\u30A4\u30BA</label><span class="slider-control"><input id="font-size" type="range" min="16" max="32" step="1" value="20"><output id="font-value" for="font-size">20px</output></span>
      <label for="line-height">\u884C\u9593</label><span class="slider-control"><input id="line-height" type="range" min="1.6" max="2.4" step="0.1" value="1.9"><output id="line-value" for="line-height">1.9\u500D</output></span>
      <label for="font-family">\u66F8\u4F53</label><select id="font-family"><option value="mincho">\u660E\u671D</option><option value="gothic">\u30B4\u30B7\u30C3\u30AF</option></select>
      <label for="theme">\u914D\u8272</label><select id="theme"><option value="paper">\u663C</option><option value="night">\u591C</option></select>
      <button id="close-book" type="button">\u672C\u3092\u9589\u3058\u308B</button>
    </div></div>
    <div class="reading-layout"><nav id="toc" aria-label="\u76EE\u6B21"></nav><div id="viewport" tabindex="0" role="region" aria-label="\u672C\u6587\u3002\u7E26\u66F8\u304D\u3067\u306F\u5DE6\u53F3\u306B\u30B9\u30AF\u30ED\u30FC\u30EB\u3067\u304D\u307E\u3059\u3002"></div></div>
    <details id="source-panel"><summary>\u539F\u7A3F\u3068\u89E3\u6790\u7D50\u679C\u3092\u78BA\u8A8D</summary><p class="hint">\u7DE8\u96C6\u306F\u30C6\u30AD\u30B9\u30C8\u30A8\u30C7\u30A3\u30BF\u3067\u884C\u3044\u3001\u4FDD\u5B58\u3057\u305F\u539F\u7A3F\u3092\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p><div class="source-actions"><button id="download-source" type="button">\u539F\u7A3F\u3092\u4FDD\u5B58</button><button id="download-ast" type="button">\u610F\u5473\u30E2\u30C7\u30EB\uFF08JSON\uFF09\u3092\u4FDD\u5B58</button></div><pre id="source" tabindex="0" dir="auto"></pre><pre id="warnings"></pre></details>
  </section>
</div>`;

// src/reader-position.mjs
function captureReadingAnchor(viewport, mode) {
  const doc = viewport.ownerDocument, win = doc.defaultView;
  if (!win || !viewport.firstElementChild) return null;
  const vertical = mode !== "horizontal-tb", reverse = mode === "vertical-rl";
  const extent = () => Math.max(0, vertical ? viewport.scrollWidth - viewport.clientWidth : viewport.scrollHeight - viewport.clientHeight);
  const offset = vertical ? Math.abs(viewport.scrollLeft) : viewport.scrollTop;
  const progress = extent() ? offset / extent() : 0;
  const atStart = offset <= 1, atEnd = !atStart && offset >= extent() - 1;
  const css = win.getComputedStyle(viewport);
  const box = viewport.getBoundingClientRect();
  const bounds = {
    left: box.left + viewport.clientLeft + parseFloat(css.paddingLeft),
    right: box.left + viewport.clientLeft + viewport.clientWidth - parseFloat(css.paddingRight),
    top: box.top + viewport.clientTop + parseFloat(css.paddingTop),
    bottom: box.top + viewport.clientTop + viewport.clientHeight - parseFloat(css.paddingBottom)
  };
  const edge = (rect) => vertical ? reverse ? -rect.right : rect.left : rect.top;
  const boundary = vertical ? reverse ? -bounds.right : bounds.left : bounds.top;
  let anchor = null;
  let distance = 0;
  if (!atStart && !atEnd) {
    const nodes = doc.createTreeWalker(viewport.firstElementChild, win.NodeFilter.SHOW_TEXT);
    while (nodes.nextNode()) {
      const node = (
        /** @type {Text} */
        nodes.currentNode
      );
      if (!node.data.trim() || node.parentElement?.closest("rt,rp")) continue;
      const range = doc.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (rect.right <= bounds.left || rect.left >= bounds.right || rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;
      let low = 0, high = node.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        range.setStart(node, mid);
        range.setEnd(node, mid + 1);
        if (edge(range.getBoundingClientRect()) < boundary - 1) low = mid + 1;
        else high = mid;
      }
      if (low === node.length) continue;
      range.setStart(node, low);
      range.setEnd(node, low + 1);
      const char = range.getBoundingClientRect();
      if (!char.width || !char.height || char.right <= bounds.left || char.left >= bounds.right || char.bottom <= bounds.top || char.top >= bounds.bottom) continue;
      anchor = range;
      distance = edge(char) - boundary;
      break;
    }
  }
  return () => {
    const newExtent = extent();
    let next = atStart ? 0 : atEnd ? newExtent : progress * newExtent;
    if (anchor?.startContainer.isConnected) {
      const frame = viewport.getBoundingClientRect();
      const style = win.getComputedStyle(viewport);
      const leading = vertical ? reverse ? -(frame.left + viewport.clientLeft + viewport.clientWidth - parseFloat(style.paddingRight)) : frame.left + viewport.clientLeft + parseFloat(style.paddingLeft) : frame.top + viewport.clientTop + parseFloat(style.paddingTop);
      const current = vertical ? Math.abs(viewport.scrollLeft) : viewport.scrollTop;
      next = current + edge(anchor.getBoundingClientRect()) - leading - distance;
    }
    if (vertical) viewport.scrollTo({ left: (reverse ? -1 : 1) * next, behavior: "instant" });
    else viewport.scrollTo({ top: next, behavior: "instant" });
  };
}

// src/reader.mjs
function createReader(container, options = {}) {
  const doc = container.ownerDocument;
  if (!doc.defaultView) throw new Error("Reader requires a browser document.");
  const win = doc.defaultView;
  function validateOptions(value) {
    if (value.fontSize !== void 0 && (!Number.isFinite(value.fontSize) || value.fontSize < 16 || value.fontSize > 32)) throw new RangeError("fontSize must be between 16 and 32.");
    if (value.lineHeight !== void 0 && (!Number.isFinite(value.lineHeight) || value.lineHeight < 1.6 || value.lineHeight > 2.4)) throw new RangeError("lineHeight must be between 1.6 and 2.4.");
    if (value.fontFamily !== void 0 && !["mincho", "gothic"].includes(value.fontFamily)) throw new RangeError("fontFamily must be mincho or gothic.");
    if (value.theme !== void 0 && !["paper", "night"].includes(value.theme)) throw new RangeError("theme must be paper or night.");
    if (value.chrome !== void 0 && !["full", "none"].includes(value.chrome)) throw new RangeError("chrome must be full or none.");
  }
  validateOptions(options);
  const element = doc.createElement("div");
  element.dataset.yompubReader = "";
  element.tabIndex = -1;
  const root = element.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = reader_default;
  const template = doc.createElement("template");
  template.innerHTML = markup;
  root.append(style, template.content.cloneNode(true));
  container.append(element);
  const get = (id) => {
    const node = root.getElementById(id);
    if (!node) throw new Error(id);
    return node;
  };
  const shell = (
    /** @type {HTMLElement} */
    root.querySelector(".shell")
  );
  const reader = get("reader"), viewport = get("viewport"), status = get("status"), errorBox = get("error");
  const font = (
    /** @type {HTMLInputElement} */
    get("font-size")
  );
  const lineHeight = (
    /** @type {HTMLInputElement} */
    get("line-height")
  );
  const fontFamily = (
    /** @type {HTMLSelectElement} */
    get("font-family")
  );
  const theme = (
    /** @type {HTMLSelectElement} */
    get("theme")
  );
  const events = new AbortController();
  let active = null;
  let current = null;
  let readingAnchor = null;
  let destroyed = false;
  let operation = 0;
  const downloads = /* @__PURE__ */ new Map();
  function revoke(urls) {
    for (const url of urls) win.URL.revokeObjectURL(url);
  }
  function clearDownloads() {
    for (const [timer, url] of downloads) {
      win.clearTimeout(timer);
      win.URL.revokeObjectURL(url);
    }
    downloads.clear();
  }
  function notify(state) {
    element.dispatchEvent(new win.CustomEvent("yompub-state", { bubbles: true, detail: { state, hasBook: current !== null, title: current?.book.metadata.title ?? null } }));
  }
  function setBusy(busy) {
    get("cancel").hidden = !busy;
    if (busy) reader.setAttribute("aria-busy", "true");
    else reader.removeAttribute("aria-busy");
  }
  function stop(reason) {
    if (!active) return;
    const job = active;
    active = null;
    job.worker?.terminate();
    job.worker = null;
    revoke(job.urls);
    job.urls = [];
    job.resolve({ status: reason });
    job.controller.abort();
  }
  const isActive = (job) => !destroyed && active === job;
  function fail(job, code, message) {
    if (!isActive(job)) return;
    const revision = operation;
    active = null;
    job.worker?.terminate();
    job.worker = null;
    revoke(job.urls);
    job.urls = [];
    job.resolve({ status: "error", code, message });
    job.controller.abort();
    if (destroyed || revision !== operation) return;
    setBusy(false);
    errorBox.textContent = `${code}: ${message}`;
    errorBox.hidden = false;
    status.textContent = current ? "\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u524D\u306E\u672C\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002" : "\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u539F\u7A3F\u307E\u305F\u306F\u30D5\u30A9\u30EB\u30C0\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
    notify("error");
  }
  function setOptions(value) {
    if (destroyed) throw new Error("Reader is destroyed.");
    validateOptions(value);
    const reflows = value.fontSize !== void 0 || value.lineHeight !== void 0 || value.fontFamily !== void 0 || value.chrome !== void 0;
    if (current && reflows && (!readingAnchor || readingAnchor.book !== current || readingAnchor.left !== viewport.scrollLeft || readingAnchor.top !== viewport.scrollTop || readingAnchor.width !== viewport.clientWidth || readingAnchor.height !== viewport.clientHeight)) {
      readingAnchor = { book: current, left: viewport.scrollLeft, top: viewport.scrollTop, width: viewport.clientWidth, height: viewport.clientHeight, restore: captureReadingAnchor(viewport, current.book.metadata.writingMode) };
    }
    if (value.fontSize !== void 0) {
      shell.style.setProperty("--font-size", `${value.fontSize}px`);
      font.value = String(value.fontSize);
      get("font-value").textContent = `${value.fontSize}px`;
      font.setAttribute("aria-valuetext", `${value.fontSize}\u30D4\u30AF\u30BB\u30EB`);
    }
    if (value.lineHeight !== void 0) {
      shell.style.setProperty("--line-height", String(value.lineHeight));
      lineHeight.value = String(value.lineHeight);
      get("line-value").textContent = `${value.lineHeight}\u500D`;
      lineHeight.setAttribute("aria-valuetext", `${value.lineHeight}\u500D`);
    }
    if (value.fontFamily !== void 0) {
      shell.dataset.fontFamily = value.fontFamily;
      fontFamily.value = value.fontFamily;
    }
    if (value.theme !== void 0) {
      shell.dataset.theme = value.theme;
      element.dataset.yompubTheme = value.theme;
      theme.value = value.theme;
    }
    if (value.chrome !== void 0) shell.dataset.chrome = value.chrome;
    if (current && reflows && readingAnchor) {
      readingAnchor.restore?.();
      Object.assign(readingAnchor, { left: viewport.scrollLeft, top: viewport.scrollTop, width: viewport.clientWidth, height: viewport.clientHeight });
    }
    if (current) notifyPosition();
  }
  setOptions({ fontSize: 20, lineHeight: options.chrome === "none" ? 2 : 1.9, fontFamily: "mincho", theme: "paper", chrome: "full", ...options });
  function getPosition() {
    if (destroyed || !current) return null;
    const vertical = current.book.metadata.writingMode !== "horizontal-tb";
    const extent = Math.max(0, vertical ? viewport.scrollWidth - viewport.clientWidth : viewport.scrollHeight - viewport.clientHeight);
    const offset = vertical ? Math.abs(viewport.scrollLeft) : viewport.scrollTop;
    return { progress: extent ? Math.min(1, Math.max(0, offset / extent)) : 1, atStart: offset <= 1, atEnd: offset >= extent - 1 };
  }
  function notifyPosition() {
    if (!destroyed) element.dispatchEvent(new win.CustomEvent("yompub-position", { bubbles: true, detail: getPosition() }));
  }
  function advance(direction) {
    if (direction !== -1 && direction !== 1) throw new RangeError("direction must be -1 or 1.");
    if (destroyed || !current) return false;
    const mode = current.book.metadata.writingMode;
    const behavior = win.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    if (mode === "horizontal-tb") viewport.scrollBy({ top: direction * viewport.clientHeight * 0.85, behavior });
    else viewport.scrollBy({ left: direction * viewport.clientWidth * 0.85 * (mode === "vertical-rl" ? -1 : 1), behavior });
    return true;
  }
  viewport.addEventListener("scroll", notifyPosition, { signal: events.signal });
  let positionFrame = 0;
  const resize = new win.ResizeObserver(() => {
    if (!positionFrame) positionFrame = win.requestAnimationFrame(() => {
      positionFrame = 0;
      notifyPosition();
    });
  });
  resize.observe(viewport);
  function navigate(id) {
    if (destroyed || !/^h-[1-9][0-9]*$/.test(id)) return false;
    const heading = root.getElementById(id);
    if (!heading || !viewport.contains(heading)) return false;
    const a = heading.getBoundingClientRect(), b = viewport.getBoundingClientRect();
    const css = win.getComputedStyle(viewport), mode = current?.book.metadata.writingMode;
    if (mode === "vertical-rl") viewport.scrollLeft += a.right - b.right + parseFloat(css.paddingRight);
    else if (mode === "vertical-lr") viewport.scrollLeft += a.left - b.left - parseFloat(css.paddingLeft);
    else viewport.scrollTop += a.top - b.top - parseFloat(css.paddingTop);
    heading.focus({ preventScroll: true });
    return true;
  }
  async function begin(job, publication) {
    try {
      if (!isActive(job)) return;
      const files = typeof publication === "function" ? await publication(job.controller.signal) : publication;
      if (!isActive(job)) return;
      const worker = new win.Worker(new URL("./parser-worker.mjs", import.meta.url), { type: "module" });
      job.worker = worker;
      worker.onerror = (event) => fail(job, "WORKER", event.message || "Reader worker could not start.");
      worker.onmessage = async (event) => {
        if (!isActive(job)) return;
        const result = event.data;
        if ("stage" in result) {
          status.textContent = result.stage === "parse" ? "\u539F\u7A3F\u3092\u89E3\u6790\u3057\u3066\u3044\u307E\u3059\u2026" : "\u753B\u50CF\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059\u2026";
          notify(result.stage);
          return;
        }
        if (!result.ok) {
          fail(job, result.code, `${result.line ? `${result.line}\u884C\u76EE: ` : ""}${result.message}`);
          return;
        }
        try {
          const assets = new Map(result.assets.map((a) => [a.path, win.URL.createObjectURL(new Blob([a.bytes], { type: a.mime }))]));
          job.urls = [...assets.values()];
          const article = renderBook(result.book, { document: doc, resolveAsset: (path) => {
            const url = assets.get(path);
            if (!url) throw new Error(`Missing asset ${path}`);
            return url;
          } });
          await Promise.all([...article.querySelectorAll("img")].map((img) => img.decode()));
          if (!isActive(job)) return;
          if (current) revoke(current.urls);
          readingAnchor = null;
          current = { book: result.book, source: result.source, warnings: result.warnings, urls: job.urls };
          job.urls = [];
          const metadata = result.book.metadata, title = get("book-title");
          title.textContent = metadata.title;
          title.lang = metadata.lang;
          title.dir = metadata.direction;
          get("book-author").textContent = metadata.author ?? "";
          get("mode-label").textContent = `${metadata.lang} \xB7 ${metadata.direction} \xB7 ${metadata.writingMode}`;
          viewport.replaceChildren(article);
          const list = doc.createElement("ol");
          for (const entry of result.book.toc) {
            const li = doc.createElement("li"), a = doc.createElement("a");
            a.href = `#${entry.id}`;
            a.textContent = entry.label;
            a.lang = metadata.lang;
            a.dir = metadata.direction;
            a.style.paddingInlineStart = `${(entry.level - 1) * 10}px`;
            li.append(a);
            list.append(li);
          }
          get("toc").replaceChildren(list);
          get("source").textContent = result.source;
          get("warnings").textContent = result.warnings.map((w) => `${w.code}: ${w.message}`).join("\n");
          reader.hidden = false;
          viewport.scrollTop = 0;
          viewport.scrollLeft = 0;
          active = null;
          worker.terminate();
          job.worker = null;
          setBusy(false);
          status.textContent = `${metadata.title} \u3092\u958B\u304D\u307E\u3057\u305F\u3002${result.book.toc.length}\u9805\u76EE\u306E\u76EE\u6B21\u3002`;
          job.resolve({ status: "opened" });
          notify("open");
        } catch (error) {
          fail(job, "IMAGE", error instanceof Error ? error.message : String(error));
        }
      };
      worker.postMessage({ kind: "files", files });
    } catch (error) {
      fail(job, "LOAD", error instanceof Error ? error.message : String(error));
    }
  }
  function open(publication) {
    if (destroyed) return Promise.resolve({ status: "destroyed" });
    const revision = ++operation;
    stop("cancelled");
    if (destroyed) return Promise.resolve({ status: "destroyed" });
    if (revision !== operation) return Promise.resolve({ status: "cancelled" });
    errorBox.hidden = true;
    status.textContent = "\u672C\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059\u2026";
    setBusy(true);
    return new Promise((resolve) => {
      const job = { controller: new AbortController(), worker: null, urls: [], resolve };
      active = job;
      notify("loading");
      void begin(job, publication);
    });
  }
  function cancel() {
    if (destroyed || !active) return;
    const revision = ++operation;
    stop("cancelled");
    if (destroyed || revision !== operation) return;
    setBusy(false);
    status.textContent = "\u8AAD\u307F\u8FBC\u307F\u3092\u4E2D\u65AD\u3057\u307E\u3057\u305F\u3002";
    notify("cancelled");
  }
  function close() {
    if (destroyed) return;
    const revision = ++operation;
    stop("cancelled");
    if (destroyed || revision !== operation) return;
    if (current) revoke(current.urls);
    current = null;
    readingAnchor = null;
    clearDownloads();
    viewport.replaceChildren();
    get("toc").replaceChildren();
    get("source").textContent = "";
    get("warnings").textContent = "";
    reader.hidden = true;
    errorBox.hidden = true;
    setBusy(false);
    status.textContent = "\u672C\u3092\u9589\u3058\u307E\u3057\u305F\u3002\u6B21\u306E\u672C\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002";
    element.focus({ preventScroll: true });
    notify("closed");
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    ++operation;
    stop("destroyed");
    if (current) revoke(current.urls);
    current = null;
    readingAnchor = null;
    clearDownloads();
    events.abort();
    resize.disconnect();
    win.cancelAnimationFrame(positionFrame);
    positionFrame = 0;
    viewport.replaceChildren();
    reader.replaceChildren();
    root.replaceChildren();
    notify("destroyed");
    element.remove();
  }
  function download(text, name, type) {
    const url = win.URL.createObjectURL(new Blob([text], { type })), a = doc.createElement("a");
    a.href = url;
    a.download = name;
    root.append(a);
    a.click();
    a.remove();
    const timer = win.setTimeout(() => {
      win.URL.revokeObjectURL(url);
      downloads.delete(timer);
    }, 1e3);
    downloads.set(timer, url);
  }
  get("cancel").addEventListener("click", cancel, { signal: events.signal });
  get("close-book").addEventListener("click", close, { signal: events.signal });
  font.addEventListener("input", () => setOptions({ fontSize: Number(font.value) }), { signal: events.signal });
  lineHeight.addEventListener("input", () => setOptions({ lineHeight: Number(lineHeight.value) }), { signal: events.signal });
  fontFamily.addEventListener("change", () => setOptions({ fontFamily: (
    /** @type {'mincho'|'gothic'} */
    fontFamily.value
  ) }), { signal: events.signal });
  theme.addEventListener("change", () => setOptions({ theme: (
    /** @type {'paper'|'night'} */
    theme.value
  ) }), { signal: events.signal });
  get("download-source").addEventListener("click", () => {
    if (current) download(current.source, "book.md", "text/markdown;charset=utf-8");
  }, { signal: events.signal });
  get("download-ast").addEventListener("click", () => {
    if (current) download(JSON.stringify(current.book, null, 2), "book.ast.json", "application/json");
  }, { signal: events.signal });
  root.addEventListener("click", (event) => {
    const target = event.target instanceof win.Element ? event.target.closest("a") : null;
    const href = target?.getAttribute("href");
    if (href && /^#h-[1-9][0-9]*$/.test(href)) {
      event.preventDefault();
      navigate(href.slice(1));
    }
  }, { signal: events.signal });
  return {
    element,
    open,
    cancel,
    close,
    destroy,
    setOptions,
    navigate,
    advance,
    getPosition,
    getSnapshot: () => current ? { source: current.source, book: structuredClone(current.book), warnings: structuredClone(current.warnings) } : null
  };
}
export {
  createReader
};
