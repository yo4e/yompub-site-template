import { createReader } from './vendor/yompub/reader.mjs';
import { parseLibrary } from './site-config.mjs';
/** @param {string} id @returns {HTMLElement} */
const get = id => { const node=document.getElementById(id); if(!node)throw new Error(id);return node; };
const shelf=get('shelf'),bookView=get('book-view'),cover=get('cover'),mount=get('reader-mount');
const read=/** @type {HTMLButtonElement} */(get('read'));
const next=/** @type {HTMLButtonElement} */(get('next')),previous=/** @type {HTMLButtonElement} */(get('previous'));
/** @type {ReturnType<typeof createReader>|null} */ let reader=null;
/** @type {import('./site-config.mjs').ShelfBook|null} */ let selected=null;
/** @type {HTMLButtonElement|null} */ let opener=null;
let generation=0,siteName='小さな書棚';
const settings=/** @type {HTMLDetailsElement} */(get('reading-settings'));
const fontSize=/** @type {HTMLInputElement} */(get('font-size'));
const lineHeight=/** @type {HTMLInputElement} */(get('line-height'));
const fontFamily=/** @type {HTMLSelectElement} */(get('font-family'));
const theme=/** @type {HTMLSelectElement} */(get('theme'));
function readingOptions() {
  return {fontSize:Number(fontSize.value),lineHeight:Number(lineHeight.value),
    fontFamily:fontFamily.value==='gothic'?'gothic':'mincho',theme:theme.value==='night'?'night':'paper'};
}
function applySettings() {
  reader?.setOptions(readingOptions());
  get('font-value').textContent=`${fontSize.value}px`;get('line-value').textContent=`${lineHeight.value}倍`;
  fontSize.setAttribute('aria-valuetext',`${fontSize.value}ピクセル`);lineHeight.setAttribute('aria-valuetext',`${lineHeight.value}倍`);
  document.body.dataset.readingTheme=theme.value;
  updatePosition();
}
for(const control of [fontSize,lineHeight])control.addEventListener('input',applySettings);
for(const control of [fontFamily,theme])control.addEventListener('change',applySettings);
function updatePosition() {
  const position=reader?.getPosition();
  next.disabled=!position||position.atEnd;previous.disabled=!position||position.atStart;
  get('position').textContent=!position||position.atStart?'右から左へ':position.atEnd?'おしまい':`${Math.round(position.progress*100)}%`;
}
function showCover() {
  settings.open=false;settings.hidden=true;cover.hidden=false;mount.hidden=true;get('reading-nav').hidden=true;get('reading-hint').hidden=true;get('show-cover').hidden=true;
  get('cover-title').focus({preventScroll:true});
}
function backToShelf() {
  ++generation;reader?.destroy();reader=null;selected=null;
  settings.open=false;delete document.body.dataset.readingTheme;bookView.hidden=true;shelf.hidden=false;document.title=siteName;opener?.focus({preventScroll:true});
}
/** @param {import('./site-config.mjs').ShelfBook} book */
async function openBook(book) {
  const revision=++generation;reader?.destroy();
  selected=book;shelf.hidden=true;bookView.hidden=false;read.disabled=true;get('retry').hidden=true;
  get('cover-title').textContent=book.title;get('cover-author').textContent=book.author;get('book-name').textContent=book.title;
  document.title=`${book.title} — ${siteName}`;get('load-message').textContent='本を用意しています。';showCover();
  const current=createReader(mount,{chrome:'none',...readingOptions()});reader=current;applySettings();
  current.element.addEventListener('yompub-position',updatePosition);
  const result=await current.open(async signal=>{
    const base=new URL(`books/${book.id}/`,import.meta.url);
    return Promise.all(['book.md',...book.assets].map(async path=>{
      const response=await fetch(new URL(path,base),{signal});
      if(!response.ok)throw new Error('本のファイルを読み込めませんでした。');
      return {path,file:await response.blob()};
    }));
  });
  if(revision!==generation)return;
  if(result.status==='opened') {
    const metadata=current.getSnapshot()?.book.metadata;
    if(metadata) {get('cover-title').textContent=metadata.title;get('cover-author').textContent=metadata.author??'';get('book-name').textContent=metadata.title;document.title=`${metadata.title} — ${siteName}`;}
    read.disabled=false;get('load-message').textContent='';
  } else if(result.status==='error') {
    get('load-message').textContent='本をひらけませんでした。もう一度試すか、書棚へお戻りください。';get('retry').hidden=false;
  }
}
get('back').addEventListener('click',backToShelf);
get('show-cover').addEventListener('click',showCover);
get('retry').addEventListener('click',()=>{if(selected)void openBook(selected);});
read.addEventListener('click',()=>{
  settings.hidden=false;cover.hidden=true;mount.hidden=false;get('reading-nav').hidden=false;get('reading-hint').hidden=false;get('show-cover').hidden=false;
  reader?.navigate('h-1');updatePosition();
});
next.addEventListener('click',()=>reader?.advance(1));previous.addEventListener('click',()=>reader?.advance(-1));
bookView.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  if(event.key==='Escape') {
    event.preventDefault();
    if(settings.open){settings.open=false;settings.querySelector('summary')?.focus();}
    else backToShelf();
  }
  else if(event.target instanceof Element&&event.target.closest('input,select,textarea,[contenteditable]'))return;
  else if(!mount.hidden&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();reader?.advance(event.key==='ArrowLeft'?1:-1);}
});
window.addEventListener('pagehide',event=>{if(event.persisted)backToShelf();else reader?.destroy();});
try {
  const response=await fetch(new URL('library.json',import.meta.url));
  if(!response.ok)throw new Error('library.json を読み込めませんでした。');
  const library=parseLibrary(await response.json());siteName=library.name;document.title=siteName;
  get('site-name').textContent=library.name;get('description').textContent=library.description;
  for(const book of library.books) {
    const button=document.createElement('button');button.type='button';button.className='book-choice';button.dataset.tone=book.tone;button.dataset.book=book.id;button.setAttribute('aria-label',`${book.title} — ${book.author} をひらく`);
    const title=document.createElement('strong'),author=document.createElement('span');title.textContent=book.title;author.textContent=book.author;author.className='byline';button.append(title,author);
    button.addEventListener('click',()=>{opener=button;void openBook(book);});get('books').append(button);
  }
} catch(error) {get('shelf-error').hidden=false;get('shelf-error').textContent=error instanceof Error?error.message:'書棚を読み込めませんでした。';}
