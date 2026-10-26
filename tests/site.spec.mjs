import { test, expect } from '@playwright/test';
const siteURL='./';
const books=[['chair','椅子をひとつ'],['rain','雨のとどけ先'],['ticket','最後の切符']];
async function choose(page,id,title) {
  await page.locator(`[data-book="${id}"]`).click();
  await expect(page.locator('#cover-title')).toHaveText(title);await expect(page.locator('#read')).toBeEnabled();
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const Native=Worker;window.liveWorkers=new Set();window.pageErrors=[];
    window.Worker=class extends Native {constructor(...args){super(...args);window.liveWorkers.add(this);}terminate(){window.liveWorkers.delete(this);super.terminate();}};
    window.addEventListener('error',event=>window.pageErrors.push(event.message));
  });
  await page.goto(siteURL);await expect(page.locator('.book-choice')).toHaveCount(3);
});

test('shelf, title page and three real vertical books stay readable',async({page},info)=>{
  await expect(page.locator('#site-name')).toHaveText('余白文庫');
  await page.screenshot({path:`evidence/template-shelf-${info.project.name}.png`,fullPage:true});
  for(const [id,title] of books) {
    await choose(page,id,title);await expect(page.locator('#cover-author')).toHaveText('余白文庫');
    await expect(page.locator('#cover-title')).toHaveCSS('writing-mode','vertical-rl');
    if(id==='chair')await page.screenshot({path:`evidence/template-cover-${info.project.name}.png`,fullPage:true});
    await page.locator('#read').click();const host=page.locator('#reader-mount');
    await expect(host.locator('article')).toHaveCSS('writing-mode','vertical-rl');await expect(host.locator('article h1')).toHaveText(title);
    await expect(host.locator('.reader-top')).toBeHidden();await expect(host.locator('#source-panel')).toBeHidden();await expect(host.locator('#toc')).toBeHidden();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await host.locator('#viewport').evaluate(el=>{const box=el.getBoundingClientRect(),paper=document.querySelector('.paper').getBoundingClientRect();return box.width>200&&box.height>200&&box.right<=paper.right+1&&box.bottom<=paper.bottom+1;})).toBe(true);
    if(id==='chair') {
      const ruby=host.locator('ruby').first();await expect(ruby.locator('rt')).toHaveText('すみ');
      const geometry=await ruby.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el.firstChild);const b=range.getBoundingClientRect(),r=el.querySelector('rt').getBoundingClientRect();return {height:b.height,right:r.x>b.x};});
      expect(geometry.height).toBeGreaterThan(0);expect(geometry.right).toBe(true);
      await page.screenshot({path:`evidence/template-reading-${info.project.name}.png`,fullPage:true});
    }
    await page.locator('#back').click();await expect(page.locator(`[data-book="${id}"]`)).toBeFocused();
    await expect(page.locator('[data-yompub-reader]')).toHaveCount(0);expect(await page.evaluate(()=>window.liveWorkers.size)).toBe(0);
  }
  expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});

test('keyboard, resizing, end of story and return to cover',async({page})=>{
  await choose(page,'chair','椅子をひとつ');await page.locator('#read').click();
  const viewport=page.locator('#reader-mount #viewport');
  await page.keyboard.press('ArrowLeft');await expect.poll(()=>viewport.evaluate(el=>Math.abs(el.scrollLeft))).toBeGreaterThan(50);
  await page.keyboard.press('ArrowRight');await expect.poll(()=>viewport.evaluate(el=>Math.abs(el.scrollLeft))).toBeLessThan(3);
  await page.setViewportSize({width:320,height:700});
  await expect(page.locator('#next')).toBeEnabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  let moves=0;
  while(await page.locator('#next').isEnabled()&&moves++<60) {
    await page.locator('#next').click();
    await page.waitForFunction(()=>{const v=document.querySelector('[data-yompub-reader]').shadowRoot.querySelector('#viewport');return document.querySelector('#next').disabled===(Math.abs(v.scrollLeft)>=v.scrollWidth-v.clientWidth-1);});
  }
  expect(moves).toBeLessThan(60);await expect(page.locator('#position')).toHaveText('おしまい');
  const last=await page.locator('#reader-mount article p').last().evaluate(el=>{const a=el.getBoundingClientRect(),v=el.getRootNode().querySelector('#viewport').getBoundingClientRect();return {text:el.textContent,visible:a.right>v.left&&a.left<v.right};});
  expect(last.text).toContain('了');expect(last.visible).toBe(true);
  await page.locator('#show-cover').click();await expect(page.locator('#cover-title')).toBeFocused();await expect(page.locator('#reader-mount')).toBeHidden();
  await page.locator('#read').click();await expect.poll(()=>viewport.evaluate(el=>Math.abs(el.scrollLeft))).toBeLessThan(3);
  await page.keyboard.press('Escape');await expect(page.locator('[data-book="chair"]')).toBeFocused();
});

test('leaving a pending book and repeated selection cannot resurrect it',async({page})=>{
  await page.evaluate(()=>{
    const original=window.fetch.bind(window);window.abortSeen=false;
    window.fetch=(url,options)=>String(url).endsWith('/books/chair/book.md')?original(url).then(response=>new Promise(resolve=>{
      options.signal.addEventListener('abort',()=>window.abortSeen=true);
      // Deliberately uncooperative acquisition: return a result even after abort.
      window.releaseHeldBook=()=>{window.fetch=original;resolve(response);};
    })):original(url,options);
  });
  await page.locator('[data-book="chair"]').click();await page.waitForFunction(()=>typeof window.releaseHeldBook==='function');
  await expect(page.locator('#read')).toBeDisabled();await page.locator('#back').click();
  expect(await page.evaluate(()=>window.abortSeen)).toBe(true);
  await choose(page,'rain','雨のとどけ先');await page.evaluate(()=>window.releaseHeldBook());
  await page.locator('#read').click();await expect(page.locator('#reader-mount article h1')).toHaveText('雨のとどけ先');
  await page.locator('#back').click();
  for(let i=0;i<4;i++) {await choose(page,...books[i%3]);await page.locator('#read').click();await page.locator('#back').click();}
  expect(await page.evaluate(()=>window.liveWorkers.size)).toBe(0);await expect(page.locator('[data-yompub-reader]')).toHaveCount(0);expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});

test('failed acquisition can retry and a malformed manuscript stays closed',async({page})=>{
  await page.route('**/books/ticket/book.md',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.locator('[data-book="ticket"]').click();await expect(page.locator('#retry')).toBeVisible();await expect(page.locator('#read')).toBeDisabled();
  await page.unroute('**/books/ticket/book.md');await page.locator('#retry').click();await expect(page.locator('#read')).toBeEnabled();
  await page.locator('#read').click();await expect(page.locator('#reader-mount article h1')).toHaveText('最後の切符');await page.locator('#back').click();
  await page.route('**/books/chair/book.md',route=>route.fulfill({body:'---\nyompub: 0.1-draft.1\ntitle: bad\nlang: ja\n---\n# A\n\n<script>bad</script>'}));
  await page.locator('[data-book="chair"]').click();await expect(page.locator('#retry')).toBeVisible();await expect(page.locator('#read')).toBeDisabled();await expect(page.locator('#reader-mount article')).toHaveCount(0);
  await page.locator('#back').click();expect(await page.evaluate(()=>window.liveWorkers.size)).toBe(0);expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});

test('replacing library settings and adding or removing books needs no host code changes',async({page})=>{
  let onlyCustom=false;
  await page.route('**/library.json',async route=>{
    const response=await route.fetch(),library=await response.json();
    library.name='窓辺の本棚';library.description='差し替えた紹介文';
    const custom={id:'custom',title:'新しい頁',author:'作者名',tone:'sage',assets:[]};
    library.books=onlyCustom?[custom]:[...library.books,custom];
    await route.fulfill({response,json:library});
  });
  await page.route('**/books/custom/book.md',route=>route.fulfill({body:'---\nyompub: 0.1-draft.1\ntitle: 新しい頁\nauthor: 作者名\nlang: ja\nwriting-mode: vertical-rl\n---\n# 新しい頁\n\n差し替えた本文。｜頁《ページ》をひらく。'}));
  await page.reload();await expect(page.locator('#site-name')).toHaveText('窓辺の本棚');await expect(page.locator('.book-choice')).toHaveCount(4);
  await choose(page,'custom','新しい頁');await expect(page.locator('#cover-author')).toHaveText('作者名');await page.locator('#read').click();
  await expect(page.locator('#reader-mount article')).toContainText('差し替えた本文。');await expect(page.locator('#reader-mount rt')).toHaveText('ページ');
  onlyCustom=true;await page.reload();await expect(page.locator('.book-choice')).toHaveCount(1);await choose(page,'custom','新しい頁');
  expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});

test('live typography preserves the reading text and native controls at narrow widths',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await choose(page,'chair','椅子をひとつ');await page.locator('#read').click();
  await page.setViewportSize({width:320,height:700});
  const host=page.locator('#reader-mount'),view=host.locator('#viewport');
  await page.evaluate(()=>{
    const root=document.querySelector('[data-yompub-reader]').shadowRoot,v=root.querySelector('#viewport');
    const target=root.querySelectorAll('article p')[4].firstChild;
    const range=document.createRange();range.setStart(target,2);range.setEnd(target,3);window.readingRange=range;
    const boundary=v.getBoundingClientRect().left+v.clientLeft+v.clientWidth-parseFloat(getComputedStyle(v).paddingRight);
    v.scrollLeft+=range.getBoundingClientRect().right-boundary;
  });
  await page.locator('#reading-settings summary').click();
  for(const [size,line,family] of [['32','2.4','gothic'],['16','1.6','mincho'],['24','2.2','gothic']]) {
    await page.locator('#reading-settings').getByLabel('文字サイズ',{exact:true}).fill(size);await page.locator('#reading-settings').getByLabel('行間',{exact:true}).fill(line);await page.locator('#reading-settings').getByLabel('書体',{exact:true}).selectOption(family);
    await expect(host.locator('article')).toHaveCSS('font-size',`${size}px`);
    expect(await host.locator('article').evaluate(el=>parseFloat(getComputedStyle(el).lineHeight))).toBeCloseTo(Number(size)*Number(line),3);
    await expect(host.locator('article')).toHaveCSS('font-family',new RegExp(family==='gothic'?'Yu Gothic':'Yu Mincho'));
    const distance=await view.evaluate(v=>Math.abs(window.readingRange.getBoundingClientRect().right-(v.getBoundingClientRect().left+v.clientLeft+v.clientWidth-parseFloat(getComputedStyle(v).paddingRight))));
    expect(distance).toBeLessThan(154);await expect(host.locator('ruby').first()).toBeAttached();
  }
  const slider=page.locator('#reading-settings').getByLabel('文字サイズ',{exact:true});await slider.fill('32');await slider.focus();
  const before=await view.evaluate(v=>v.scrollLeft);await slider.press('ArrowRight');
  await expect(slider).toBeFocused();await expect(slider).toHaveValue('32');
  expect(await view.evaluate(v=>v.scrollLeft)).toBeCloseTo(before,1);
  await slider.press('ArrowLeft');await expect(slider).toHaveValue('31');await expect(page.locator('#reading-settings #font-value')).toHaveText('31px');
  const fits=await page.locator('.settings-panel').evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth+1;});expect(fits).toBe(true);
  await page.keyboard.press('Escape');await expect(page.locator('.settings-panel')).toBeHidden();await expect(page.locator('#book-view')).toBeVisible();
  await page.locator('#next').click();expect(await view.evaluate(v=>Math.abs(v.scrollLeft))).toBeGreaterThan(Math.abs(before));
  expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});

test('plain day/night and optional embedded colors apply without changing the shelf',async({page},info)=>{
  const shelfColor=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
  await page.route('**/books/chair/book.md',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n\n[はじめへ](#h-1)\n'});});
  await choose(page,'chair','椅子をひとつ');await page.locator('#read').click();await page.locator('#reading-settings summary').click();
  const view=page.locator('#reader-mount #viewport'),link=page.locator('#reader-mount article a');
  const geometry=()=>view.evaluate(v=>({left:v.scrollLeft,width:v.clientWidth,height:v.clientHeight,extent:v.scrollWidth}));
  const before=await geometry();
  for(const [theme,bg,ink,blue] of [['paper','rgb(255, 255, 255)','rgb(0, 0, 0)','rgb(0, 0, 238)'],['night','rgb(0, 0, 0)','rgb(255, 255, 255)','rgb(102, 153, 255)']]) {
    await page.locator('#reading-settings').getByLabel('配色',{exact:true}).selectOption(theme);
    for(const locator of ['body','.paper','.settings-panel'])await expect(page.locator(locator)).toHaveCSS('background-color',bg);
    await expect(view).toHaveCSS('color',ink);await expect(link).toHaveCSS('color',blue);await expect(page.locator('#reading-settings #font-size')).toHaveCSS('accent-color',blue);
    expect(await geometry()).toEqual(before);
    await page.screenshot({path:`evidence/settings-${theme}-${info.project.name}.png`,fullPage:true});
  }
  await page.evaluate(()=>{for(const [key,value] of Object.entries({'paper-background':'#fffbea','paper-foreground':'#222222','paper-accent':'#0050aa','night-background':'#101010','night-foreground':'#eeeeee','night-accent':'#88b4ff'}))document.documentElement.style.setProperty(`--yompub-${key}`,value);});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(16, 16, 16)');await expect(view).toHaveCSS('color','rgb(238, 238, 238)');await expect(link).toHaveCSS('color','rgb(136, 180, 255)');
  await page.locator('#reading-settings').getByLabel('配色',{exact:true}).selectOption('paper');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 251, 234)');await expect(view).toHaveCSS('color','rgb(34, 34, 34)');await expect(link).toHaveCSS('color','rgb(0, 80, 170)');
  await page.locator('#back').click();await expect(page.locator('body')).toHaveCSS('background-color',shelfColor);
  expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});

test('settings follow book changes and cover without adding persistent storage',async({page})=>{
  await choose(page,'chair','椅子をひとつ');await expect(page.locator('#reading-settings')).toBeHidden();await page.locator('#read').click();await page.locator('#reading-settings summary').click();
  await page.locator('#reading-settings').getByLabel('文字サイズ',{exact:true}).fill('28');await page.locator('#reading-settings').getByLabel('行間',{exact:true}).fill('2.3');await page.locator('#reading-settings').getByLabel('書体',{exact:true}).selectOption('gothic');await page.locator('#reading-settings').getByLabel('配色',{exact:true}).selectOption('night');
  await page.locator('#show-cover').click();await expect(page.locator('#reading-settings')).toBeHidden();await page.locator('#read').click();await expect(page.locator('.settings-panel')).toBeHidden();
  await page.locator('#back').click();await choose(page,'rain','雨のとどけ先');await page.locator('#read').click();
  const article=page.locator('#reader-mount article');await expect(article).toHaveCSS('font-size','28px');await expect(article).toHaveCSS('font-family',/Yu Gothic/);await expect(page.locator('body')).toHaveAttribute('data-reading-theme','night');
  expect(await article.evaluate(el=>parseFloat(getComputedStyle(el).lineHeight))).toBeCloseTo(64.4,3);
  await page.locator('#reading-settings summary').click();await page.keyboard.press('Escape');await expect(page.locator('#reading-settings summary')).toBeFocused();await expect(page.locator('#book-view')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('[data-book="rain"]')).toBeFocused();
  await page.reload();await choose(page,'chair','椅子をひとつ');await page.locator('#read').click();await expect(article).toHaveCSS('font-size','20px');await expect(article).toHaveCSS('font-family',/Yu Mincho/);await expect(page.locator('body')).toHaveAttribute('data-reading-theme','paper');
  expect(await page.evaluate(()=>window.pageErrors)).toEqual([]);
});
