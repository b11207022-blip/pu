import { getCollection } from 'astro:content';
import config from '../../site.config.mjs';
import theme from '@theme/theme.mjs';

export { config, theme };
export const themeId = __THEME_ID__;

/** 站內連結都要經過 u()，GitHub Pages 的子路徑才不會壞掉 */
export function u(path = '/') {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}

export async function getProfile() {
  const [p] = await getCollection('profile');
  if (!p) throw new Error('缺少 src/content/profile.md');
  return p;
}

export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}

export async function getExperience() {
  return (await getCollection('experience')).sort((a, b) => b.data.start.localeCompare(a.data.start));
}

export async function getPosts() {
  return (await getCollection('posts')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function fmtDate(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 用名字產生縮寫（沒有大頭照時用） */
export function initials(name: string, nameEn?: string) {
  if (nameEn) return nameEn.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return name.slice(-2);
}

export async function navItems() {
  const posts = await getPosts();
  const items = [
    { href: '/', label: '首頁', en: 'Home' },
    { href: '/about/', label: '關於', en: 'About' },
    { href: '/projects/', label: '作品', en: 'Work' },
    { href: '/experience/', label: '經歷', en: 'Experience' },
    { href: '/blog/', label: '文章', en: 'Writing' },
    { href: '/contact/', label: '聯絡', en: 'Contact' },
  ];
  return posts.length ? items : items.filter((i) => i.href !== '/blog/');
}
