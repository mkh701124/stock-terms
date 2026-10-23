(() => {
  'use strict';
  const { categories, terms, popular } = window.GLOSSARY;
  const byId = new Map(terms.map(t => [t.id, t]));
  const catById = new Map(categories.map(c => [c.id, c]));
  const root = document.getElementById('app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\-_.()（）／/、·]/g, '');
  const termHref = t => '#/term/' + t.id;
  // fuzzy-ish: exact > prefix > substring > all-chars-in-order; checks name, aliases, plain text
  function score(t, q) {
    const fields = [t.name, ...t.aliases];
    let best = 0;
    for (const f of fields) {
      const n = norm(f);
      if (!n) continue;
      if (n === q) best = Math.max(best, 100);
      else if (n.startsWith(q)) best = Math.max(best, 80);
      else if (n.includes(q)) best = Math.max(best, 60);
      else { let i = 0; for (const ch of n) if (ch === q[i]) i++; if (i === q.length && q.length >= 2) best = Math.max(best, 30); }
    }
    if (!best && q.length >= 2 && norm(t.plain).includes(q)) best = 15;
    return best;
  }
  function search(raw) {
    const q = norm(raw);
    if (!q) return [];
    return terms.map(t => [t, score(t, q)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }
  const chip = t => `<a class="chip" href="${termHref(t)}">${esc(t.name)}</a>`;
  const card = t => `<a class="card" href="${termHref(t)}"><span class="card-cat">${esc(catById.get(t.category)?.name)}</span><strong>${esc(t.name)}</strong><small>${esc(t.aliases.join(' · '))}</small><p>${esc(t.plain)}</p></a>`;
  const searchBox = q => `<form class="search" role="search" data-search><label for="q" class="sr">搜尋股市名詞</label><input id="q" name="q" type="search" placeholder="搜尋本益比、EPS、除息、外資…" value="${esc(q)}" autocomplete="off" maxlength="100"><button type="submit">搜尋</button></form><div id="live" class="live" aria-live="polite"></div>`;
  const catCards = () => `<div class="cats">${categories.map(c => { const n = terms.filter(t => t.category === c.id).length; return `<a class="cat" href="#/category/${c.id}"><span class="cat-icon" aria-hidden="true">${esc(c.icon)}</span><strong>${esc(c.name)}</strong><small><span class="num">${n}</span> 個名詞</small></a>`; }).join('')}</div>`;
  const resultsHtml = (q, list) => list.length ? `<p class="summary" role="status">「${esc(q)}」找到 <span class="num">${list.length}</span> 個名詞</p><div class="cards">${list.map(card).join('')}</div>` : `<section class="empty" role="status"><h2>這個名詞還沒找到</h2><p>試試中文名稱或英文縮寫，例如「本益比」或「PE」。</p><a class="chip" href="#/categories">依問題找答案</a></section>`;

  function home() {
    root.innerHTML = `<section class="hero"><span class="kicker">30 秒 · 看懂一個名詞</span><h1>股票看不懂？<br><span class="teal">直接查。</span></h1><p class="lead">股票、ETF、財經新聞看不懂？搜尋一個名詞，30 秒看懂。</p>${searchBox('')}<p class="hint">支援中文名詞、英文縮寫</p></section><section aria-labelledby="pop"><div class="sec-head"><h2 id="pop">大家最常搞不懂</h2><p>從這 <span class="num">12</span> 個名詞開始</p></div><div class="chips">${popular.map(id => chip(byId.get(id))).join('')}</div></section><section aria-labelledby="cat-title"><div class="sec-head"><h2 id="cat-title">依問題找答案</h2><p>不用知道名詞，也能開始查</p></div>${catCards()}</section>`;
    const input = root.querySelector('#q'), live = root.querySelector('#live');
    input.addEventListener('input', () => { const q = input.value.trim(); live.innerHTML = q ? resultsHtml(q, search(q).slice(0, 6)) : ''; });
    document.title = '股票新手翻譯器';
  }
  function results(q) {
    const list = q ? search(q) : terms;
    root.innerHTML = `${crumbs([{ name:'搜尋結果' }])}<h1 class="page-h">${q ? '找一個名詞，<span class="teal">看懂它。</span>' : '全部名詞'}</h1>${searchBox(q)}${q ? resultsHtml(q, list) : `<div class="cards">${list.map(card).join('')}</div>`}`;
    const input = root.querySelector('#q');
    input.addEventListener('input', () => { const v = input.value.trim(); const box = root.querySelector('.live'); box.innerHTML = v && v !== q ? resultsHtml(v, search(v).slice(0, 6)) : ''; });
    document.title = `${q ? q + '｜' : ''}搜尋｜股票新手翻譯器`;
  }
  const crumbs = items => `<nav class="crumbs" aria-label="麵包屑"><a href="#/">首頁</a>${items.map(i => ` / ${i.href ? `<a href="${i.href}">${esc(i.name)}</a>` : `<span aria-current="page">${esc(i.name)}</span>`}`).join('')}</nav>`;
  function categoriesPage() {
    root.innerHTML = `${crumbs([{ name:'依問題找答案' }])}<h1 class="page-h">你現在想知道<span class="teal">什麼？</span></h1>${catCards()}`;
    document.title = '依問題找答案｜股票新手翻譯器';
  }
  function category(id) {
    const c = catById.get(id); if (!c) return notFound();
    const list = terms.filter(t => t.category === id);
    root.innerHTML = `${crumbs([{ name:'依問題找答案', href:'#/categories' }, { name:c.name }])}<h1 class="page-h">${esc(c.name)}</h1><p class="lead">先從這 <span class="num">${list.length}</span> 個名詞看懂。</p><div class="cards">${list.map(card).join('')}</div>`;
    document.title = `${c.name}｜股票新手翻譯器`;
  }
  function term(id) {
    const t = byId.get(id); if (!t) return notFound();
    const c = catById.get(t.category);
    const blocks = [['02','超簡單例子',t.example,'ex'],['03','怎麼計算',t.formula,'formula'],['04','高／低代表什麼？',t.meaning,''],['05','常見誤解',t.myth,'warn'],['06','實際看到時怎麼判斷？',t.judgement,'']];
    root.innerHTML = `${crumbs([{ name:c.name, href:'#/category/' + c.id }, { name:t.name }])}<article class="term"><header class="term-hero"><span class="kicker">${esc(c.name)} · 30 秒重點</span><h1>${esc(t.name)}<span class="en">${esc(t.aliases.join(' · '))}</span></h1><p class="step">01 · 一句話解釋</p><p class="plain">${esc(t.plain)}</p></header>${blocks.map(([n, h, body, cls]) => `<section class="block ${cls}"><h2><span class="num">${n}</span>${h}</h2><p>${esc(body)}</p></section>`).join('')}<section class="block"><h2><span class="num">07</span>相關名詞</h2><div class="chips">${t.related.map(r => byId.get(r)).filter(Boolean).map(chip).join('')}</div></section></article><a class="back" href="#/category/${c.id}">← 繼續瀏覽「${esc(c.name)}」</a>`;
    document.title = `${t.name}是什麼？｜股票新手翻譯器`;
  }
  function notFound() { root.innerHTML = `<section class="empty"><h1 class="page-h">這個頁面還沒找到</h1><p>回首頁搜尋名詞，或依問題找答案。</p><a class="chip" href="#/">回首頁</a></section>`; }
  function render() {
    const [path, qs = ''] = (location.hash.slice(1) || '/').split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    if (!parts.length) home();
    else if (parts[0] === 'search') results((new URLSearchParams(qs).get('q') || '').slice(0, 100).trim());
    else if (parts[0] === 'categories') categoriesPage();
    else if (parts[0] === 'category') category(parts[1]);
    else if (parts[0] === 'term') term(parts[1]);
    else notFound();
    document.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === 'categories' ? ['categories','category'].includes(parts[0]) : !parts.length || ['search','term'].includes(parts[0]); a.toggleAttribute('aria-current', on); if (on) a.setAttribute('aria-current','page'); });
    if (parts.length) { window.scrollTo(0, 0); root.focus({ preventScroll:true }); }
  }
  document.addEventListener('submit', e => { if (!e.target.matches('[data-search]')) return; e.preventDefault(); const q = e.target.q.value.trim(); location.hash = '#/search?' + new URLSearchParams({ q }); });
  window.addEventListener('hashchange', render);
  render();
})();
