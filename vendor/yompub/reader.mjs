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
var reader_default = '/* Reader styles live only inside its shadow root; no document-wide selectors. */\n:host { display:block; width:100%; height:100%; min-width:0; min-height:0; container-type:inline-size; }\n* { box-sizing:border-box; }\n[hidden] { display:none!important; }\n.shell { all:initial; display:flex; flex-direction:column; width:100%; height:100%; min-height:0; min-width:0; overflow:hidden; direction:ltr; writing-mode:horizontal-tb; text-align:start; font:16px/1.5 system-ui,-apple-system,"Hiragino Sans",sans-serif; font-synthesis:none; color:#273e42; color-scheme:light; --paper:#fffdf7; --ink:#243d40; --line:#d3d9d0; --accent:#2a6c62; --font-size:20px; }\n.shell[data-theme="night"] { --paper:#192a2e; --ink:#e8e7db; --line:#42585a; --accent:#b4d6c2; }\nbutton,input,select { font:inherit; }\nbutton,select { border:1px solid #b7c5bd; border-radius:6px; background:#fffdf7; color:#254b43; padding:.5em .7em; }\nbutton { cursor:pointer; }\nbutton:hover { background:#e8eee5; }\nbutton:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible,select:focus-visible,#viewport:focus-visible { outline:3px solid #be7a2e; outline-offset:-3px; }\n.load-state { flex:none; display:flex; flex-wrap:wrap; align-items:center; gap:12px; font-size:12px; min-height:36px; }\n.load-state p { margin:6px 0; }\n#error { flex:none; margin:4px 0; max-height:80px; overflow:auto; padding:8px; border-inline-start:3px solid #a8472d; background:#fae6dd; color:#7d301e; white-space:pre-wrap; overflow-wrap:anywhere; font-size:13px; }\n#reader { flex:1; min-height:0; min-width:0; display:flex; flex-direction:column; gap:12px; }\n.reader-top { flex:none; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }\n#book-title { font-family:Georgia,"Yu Mincho",serif; font-size:24px; font-weight:500; margin:0; }\n#book-author { font-size:12px; color:#61726a; margin:0; }\n#mode-label { margin:0; font-size:10px; letter-spacing:.1em; color:#5b776c; }\n.controls { display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:12px; }\n.controls label { display:flex; align-items:center; gap:6px; }\n.controls input { width:85px; accent-color:var(--accent); }\n.reading-layout { flex:1; min-height:0; min-width:0; display:flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--paper); }\n#toc { flex:0 0 170px; min-height:0; overflow:auto; padding:20px 12px; border-inline-end:1px solid var(--line); font-size:12px; }\n#toc ol { list-style:none; padding:0; margin:0; }\n#toc li { margin:0 0 12px; }\n#toc a { display:block; color:var(--accent); line-height:1.7; text-underline-offset:3px; }\n#viewport { flex:1; min-width:0; min-height:0; overflow:auto; padding:24px 32px; color:var(--ink); scrollbar-gutter:stable; }\n#viewport:has(.book[data-mode="vertical-rl"]) { direction:rtl; }\n.book {\n  font-family:"Yu Mincho","Hiragino Mincho ProN",Georgia,serif;\n  font-size:var(--font-size);\n  line-height:1.9;\n  overflow-wrap:anywhere;\n}\n.book:lang(ja) {\n  /* Prefer Japanese fonts with vertical metrics before generic CJK fallback. */\n  font-family:"Yu Mincho","Hiragino Mincho ProN","Noto Serif CJK JP","Noto Serif JP","IPAexMincho","IPAMincho","Noto Sans CJK JP","Noto Sans JP","IPAGothic",serif;\n}\n.book[data-mode="horizontal-tb"] {\n  max-width:36em;\n  margin-inline:auto;\n}\n.book:not([data-mode="horizontal-tb"]) {\n  height:100%;\n  min-height:0;\n  max-width:none;\n  margin:0;\n  padding-inline:12px;\n}\n.book h1,.book h2,.book h3,.book h4,.book h5,.book h6 {\n  font-weight:600;\n  line-height:1.7;\n  scroll-margin:12px;\n}\n.book h1 {\n  font-size:1.5em;\n}\n.book h2 {\n  font-size:1.2em;\n}\n.book p {\n  margin-block:1.3em;\n}\n.book p:first-child {\n  margin-block-start:0;\n}\n.book a {\n  color:var(--accent);\n  text-underline-offset:.2em;\n}\n.book img {\n  display:inline-block;\n  max-width:min(100%,480px);\n  max-height:100%;\n  object-fit:contain;\n  vertical-align:middle;\n}\n.book:not([data-mode="horizontal-tb"]) img {\n  max-width:300px;\n  max-height:100%;\n  width:auto;\n  height:auto;\n}\n.cover {\n  margin-block-end:2em;\n  display:flex;\n  align-items:center;\n  justify-content:center;\n}\n.cover img {\n  max-height:100%;\n}\n.book blockquote {\n  border-inline-start:2px solid #9eb3a3;\n  padding-inline-start:1em;\n  margin-inline:0;\n  color:#61756a;\n}\n.book ruby {\n  ruby-position:over;\n}\n.book rt {\n  font-size:.5em;\n}\n.book pre {\n  white-space:pre-wrap;\n}\n.book code {\n  font-size:.85em;\n  font-family:ui-monospace,monospace;\n}\n.book hr {\n  border:0;\n  border-block-start:1px solid var(--line);\n  margin-block:2em;\n}\n.book bdi {\n  unicode-bidi:isolate;\n}\n\n.book[dir="rtl"] { font-family:"Geeza Pro",Tahoma,serif; }\n#source-panel { flex:none; max-height:38%; overflow:auto; font-size:12px; }\nsummary { cursor:pointer; }\n.hint { color:#697a72; }\n.source-actions { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0; }\n#source { padding:12px; background:var(--paper); color:var(--ink); white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.8; unicode-bidi:plaintext; }\n#warnings { white-space:pre-wrap; color:#8b592a; }\n.shell[data-chrome="none"] .load-state,\n.shell[data-chrome="none"] .reader-top,\n.shell[data-chrome="none"] #toc,\n.shell[data-chrome="none"] #source-panel { display:none; }\n.shell[data-chrome="none"] .reading-layout { border:0; border-radius:0; }\n.shell[data-chrome="none"] #viewport { padding:40px; overscroll-behavior-x:contain; }\n.shell[data-chrome="none"] .book { line-height:2; }\n.shell[data-chrome="none"] .book h1:first-child { margin-block-start:0; }\n@container (max-width:540px) {\n  .reading-layout { flex-direction:column; }\n  #toc { flex:0 0 auto; max-height:88px; border-inline-end:0; border-bottom:1px solid var(--line); padding:10px; }\n  #toc ol { display:flex; gap:16px; }\n  #toc li { min-width:110px; margin:0; }\n  #viewport { padding:16px; }\n  .book:not([data-mode="horizontal-tb"]) img { max-width:230px; }\n  .controls { gap:8px; }\n  .shell[data-chrome="none"] #viewport { padding:24px 20px; }\n}\n';

// src/reader-ui.mjs
var markup = `
<div class="shell" lang="ja">
  <div class="load-state"><p id="status" role="status" aria-live="polite">\u672C\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002</p><button id="cancel" type="button" hidden>\u8AAD\u307F\u8FBC\u307F\u3092\u4E2D\u65AD</button></div>
  <p id="error" role="alert" hidden></p>
  <section id="reader" hidden aria-label="\u672C\u306E\u30D3\u30E5\u30FC\u30A2">
    <div class="reader-top"><div><p id="mode-label"></p><h2 id="book-title"></h2><p id="book-author"></p></div><div class="controls"><label>\u6587\u5B57\u30B5\u30A4\u30BA <input id="font-size" type="range" min="16" max="32" value="20"><output id="font-value">20</output></label><label>\u914D\u8272 <select id="theme"><option value="paper">\u7D19</option><option value="night">\u591C</option></select></label><button id="close-book" type="button">\u672C\u3092\u9589\u3058\u308B</button></div></div>
    <div class="reading-layout"><nav id="toc" aria-label="\u76EE\u6B21"></nav><div id="viewport" tabindex="0" role="region" aria-label="\u672C\u6587\u3002\u7E26\u66F8\u304D\u3067\u306F\u5DE6\u53F3\u306B\u30B9\u30AF\u30ED\u30FC\u30EB\u3067\u304D\u307E\u3059\u3002"></div></div>
    <details id="source-panel"><summary>\u539F\u7A3F\u3068\u89E3\u6790\u7D50\u679C\u3092\u78BA\u8A8D</summary><p class="hint">\u7DE8\u96C6\u306F\u30C6\u30AD\u30B9\u30C8\u30A8\u30C7\u30A3\u30BF\u3067\u884C\u3044\u3001\u4FDD\u5B58\u3057\u305F\u539F\u7A3F\u3092\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p><div class="source-actions"><button id="download-source" type="button">\u539F\u7A3F\u3092\u4FDD\u5B58</button><button id="download-ast" type="button">\u610F\u5473\u30E2\u30C7\u30EB\uFF08JSON\uFF09\u3092\u4FDD\u5B58</button></div><pre id="source" tabindex="0" dir="auto"></pre><pre id="warnings"></pre></details>
  </section>
</div>`;

// src/reader.mjs
function createReader(container, options = {}) {
  const doc = container.ownerDocument;
  if (!doc.defaultView) throw new Error("Reader requires a browser document.");
  const win = doc.defaultView;
  function validateOptions(value) {
    if (value.fontSize !== void 0 && (!Number.isFinite(value.fontSize) || value.fontSize < 16 || value.fontSize > 32)) throw new RangeError("fontSize must be between 16 and 32.");
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
  const theme = (
    /** @type {HTMLSelectElement} */
    get("theme")
  );
  const events = new AbortController();
  let active = null;
  let current = null;
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
    if (value.fontSize !== void 0) {
      shell.style.setProperty("--font-size", `${value.fontSize}px`);
      font.value = String(value.fontSize);
      get("font-value").textContent = font.value;
    }
    if (value.theme !== void 0) {
      shell.dataset.theme = value.theme;
      theme.value = value.theme;
    }
    if (value.chrome !== void 0) shell.dataset.chrome = value.chrome;
  }
  setOptions({ fontSize: 20, theme: "paper", chrome: "full", ...options });
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
  const resize = new win.ResizeObserver(notifyPosition);
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
    clearDownloads();
    events.abort();
    resize.disconnect();
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
