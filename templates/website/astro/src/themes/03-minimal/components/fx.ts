// 03 極簡的動畫：慢、輕、一次只動一件事。
// 規則：最後狀態寫在 CSS；進場一律 gsap.from()，still（?shot／減少動態）時 onReady 不會跑。
import { gsap, ScrollTrigger, still, smoothScroll, onReady, canHover } from '../../../lib/motion';

const EASE = 'expo.out';

/* ---------- 中英混排的逐行浮現：中文一字一格、英文一字一格，標點黏著前一個字 ---------- */
const UNIT = /[「『（《〈“]*(?:[㐀-鿿豈-﫿]|[^\s㐀-鿿豈-﫿「『（《〈，。、！？：；」』）》〉”]+)[，。、！？：；」』）》〉”]*|\s+|[\s\S]/g;

function splitUnits(el: HTMLElement) {
  const original = el.innerHTML;
  const walk = (node: Node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (n.textContent!.match(UNIT) || []).forEach((tok) => {
          if (/^\s+$/.test(tok)) { frag.append(tok); return; }
          const o = document.createElement('span'); o.className = 'u';
          const i = document.createElement('span'); i.className = 'ui'; i.textContent = tok;
          o.append(i); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  const units = [...el.querySelectorAll<HTMLElement>('.u')];
  const tops: number[] = [];
  const line = units.map((u) => {
    const t = Math.round(u.offsetTop);
    let k = tops.findIndex((x) => Math.abs(x - t) < 6);
    if (k < 0) { tops.push(t); k = tops.length - 1; }
    return k;
  });
  return { inner: units.map((u) => u.firstElementChild as HTMLElement), line, revert: () => { el.innerHTML = original; } };
}

function revealLines(el: HTMLElement, opts: { delay?: number; scroll?: boolean } = {}) {
  const s = splitUnits(el);
  return gsap.from(s.inner, {
    yPercent: 115, duration: 1.4, ease: EASE,
    delay: (i: number) => (opts.delay || 0) + s.line[i] * 0.11 + (i % 40) * 0.004,
    onComplete: s.revert,
    scrollTrigger: opts.scroll ? { trigger: el, start: 'top 88%', once: true } : undefined,
  });
}

/* ---------- 全站：選單、頁首 ---------- */
function menu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu]');
  const root = document.documentElement;
  const set = (open: boolean) => {
    root.classList.toggle('menu-open', open);
    btn?.setAttribute('aria-expanded', String(open));
    if (btn) btn.querySelector('.hd-menu-t')!.textContent = open ? 'Close' : 'Menu';
    const lenis = smoothScroll();
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && !still) gsap.from('.menu-link', { yPercent: 100, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.05 });
  };
  btn?.addEventListener('click', () => set(!root.classList.contains('menu-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}

function headerOnScroll() {
  const hd = document.querySelector<HTMLElement>('[data-hd]');
  if (!hd) return;
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      hd.classList.toggle('is-scrolled', y > 24);
      hd.classList.toggle('is-hidden', y > 240 && y > last && !document.documentElement.classList.contains('menu-open'));
      last = y;
    },
  });
}

/* ---------- 小圓點游標：碰到連結會放大 ---------- */
function cursor() {
  const dot = document.querySelector<HTMLElement>('.cur');
  if (!dot) return;
  document.documentElement.classList.add('has-cur');
  gsap.set(dot, { xPercent: -50, yPercent: -50 });
  const x = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
  dot.classList.add('is-out');
  addEventListener('pointermove', (e) => { dot.classList.remove('is-out'); x(e.clientX); y(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest('a,button,input,textarea,label,[data-cur]');
    dot.classList.toggle('is-big', !!t && !t.matches('input,textarea'));
    dot.classList.toggle('is-text', !!t && t.matches('input,textarea'));
  });
  document.addEventListener('pointerleave', () => dot.classList.add('is-out'));
  document.addEventListener('pointerenter', () => dot.classList.remove('is-out'));
}

/* ---------- 作品索引：滑過一列，截圖跟著游標浮出來 ---------- */
function peek() {
  document.querySelectorAll<HTMLElement>('[data-peek]').forEach((list) => {
    const box = list.parentElement!.querySelector<HTMLElement>('.peek');
    if (!box) return;
    const items = [...box.querySelectorAll<HTMLElement>('.peek-item')];
    gsap.set(box, { xPercent: 12, yPercent: -50 });
    const xTo = gsap.quickTo(box, 'x', { duration: 0.7, ease: 'power3' });
    const yTo = gsap.quickTo(box, 'y', { duration: 0.7, ease: 'power3' });
    const rTo = gsap.quickTo(box, 'rotation', { duration: 0.9, ease: 'power3' });
    let open = false, lastX = 0, cur = -1;
    list.addEventListener('pointermove', (e) => {
      xTo(e.clientX); yTo(e.clientY);
      rTo(gsap.utils.clamp(-6, 6, (e.clientX - lastX) * 0.4)); lastX = e.clientX;
    });
    list.querySelectorAll<HTMLElement>('[data-peek-i]').forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        const i = Number(row.dataset.peekI);
        if (!open) {
          open = true;
          gsap.set(box, { x: e.clientX, y: e.clientY });
          gsap.fromTo(box, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: EASE, overwrite: 'auto' });
        }
        if (i === cur) return;
        cur = i;
        items.forEach((it, k) => { it.style.zIndex = k === i ? '2' : '1'; });
        const it = items[i];
        if (!it) return;
        gsap.fromTo(it, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: EASE, overwrite: 'auto' });
        const im = it.querySelector('img');
        if (im) gsap.fromTo(im, { scale: 1.25 }, { scale: 1, duration: 1.1, ease: EASE, overwrite: 'auto' });
      });
    });
    list.addEventListener('pointerleave', () => {
      open = false; cur = -1;
      gsap.to(box, { clipPath: 'inset(50% 50% 50% 50%)', duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' });
    });
  });
}

/* ---------- 進場與捲動 ---------- */
function intro() {
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  tl.from('.hd > *', { y: -16, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.1);
  document.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    const top = el.getBoundingClientRect().top < innerHeight;
    revealLines(el, { delay: top ? 0.25 : 0, scroll: !top });
  });
  gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
    const top = el.getBoundingClientRect().top < innerHeight * 0.95;
    gsap.from(el, {
      y: 24, opacity: 0, duration: 1.6, ease: EASE, delay: top ? 0.7 : 0,
      scrollTrigger: top ? undefined : { trigger: el, start: 'top 90%', once: true },
    });
  });
  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((wrap) => {
    gsap.from(wrap.children, {
      y: 28, opacity: 0, duration: 1.4, ease: EASE, stagger: 0.09,
      scrollTrigger: { trigger: wrap, start: 'top 88%', once: true },
    });
  });
  gsap.utils.toArray<HTMLElement>('[data-rule]').forEach((el) => {
    gsap.from(el, { scaleX: 0, transformOrigin: '0 50%', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
  });
  gsap.utils.toArray<HTMLElement>('[data-img]').forEach((el) => {
    const im = el.querySelector('img');
    gsap.from(el, { clipPath: 'inset(8% 6% 8% 6%)', duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    if (im) {
      gsap.from(im, { scale: 1.18, duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      gsap.fromTo(im, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const m = el.textContent!.match(/^(\D*)(\d+)(.*)$/);
    if (!m || Number(m[2]) < 2) return;
    const obj = { v: 0 }; const end = Number(m[2]);
    gsap.to(obj, {
      v: end, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = m[1] + Math.round(obj.v) + m[3]; },
    });
  });
}

export function init() {
  // 截圖時圖片要一次載完
  if (location.search.includes('shot')) document.querySelectorAll<HTMLImageElement>('img[loading=lazy]').forEach((i) => (i.loading = 'eager'));
  menu();
  if (canHover) peek();
  if (still) return;
  smoothScroll({ lerp: 0.085 });
  headerOnScroll();
  if (canHover) cursor();
  onReady(intro);
}
