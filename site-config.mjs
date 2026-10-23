/** @typedef {{id:string,title:string,author:string,tone:'linen'|'sage'|'rose',assets:string[]}} ShelfBook */
/** @typedef {{name:string,description:string,books:ShelfBook[]}} Library */
/** @param {unknown} value @returns {Library} */
export function parseLibrary(value) {
  const library = /** @type {Library} */(value);
  if (!library || typeof library.name!=='string' || !library.name.trim() || typeof library.description!=='string' || !Array.isArray(library.books) || !library.books.length) throw new Error('library.json に文庫名・紹介文・本の一覧が必要です。');
  const ids = new Set();
  for (const book of library.books) {
    if (!book || typeof book.id!=='string' || !/^[a-z][a-z0-9-]{0,48}$/.test(book.id) || ids.has(book.id) || typeof book.title!=='string' || !book.title.trim() || typeof book.author!=='string' || !['linen','sage','rose'].includes(book.tone) || !Array.isArray(book.assets)) throw new Error('本の id・title・author・tone・assets を確認してください。id は重複できません。');
    if (book.assets.some(path=>typeof path!=='string' || /[%?#:\\\x00-\x20]/.test(path) || path.split('/').some(part=>!part||part==='.'||part==='..') || path==='book.md')) throw new Error('画像は本のフォルダ内の相対パスで指定してください。');
    ids.add(book.id);
  }
  return library;
}
