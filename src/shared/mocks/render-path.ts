import type { CriticalCssBundle, RenderPathEntry } from '@shared/types';

const e = (
  id: string,
  resource: string,
  kind: RenderPathEntry['kind'],
  startMs: number,
  durMs: number,
  size: number,
  renderBlocking = false,
): RenderPathEntry => ({ id, resource, kind, startMs, durMs, size, renderBlocking });

const HOME_PATH: RenderPathEntry[] = [
  e('h-1', '/', 'html', 0, 240, 14_200),
  e('h-2', '/_next/static/css/app.css', 'css', 240, 60, 36_400, true),
  e('h-3', 'fonts/Inter.woff2', 'font', 240, 80, 22_000, true),
  e('h-4', '/_next/static/chunks/main.js', 'js', 300, 220, 92_000, true),
  e('h-5', '/_next/static/chunks/page-home.js', 'js', 320, 140, 18_400),
  e('h-6', '/img/hero.jpg', 'image', 360, 320, 720_000),
  e('h-7', '/api/segments', 'xhr', 540, 120, 1_400),
  e('h-8', '/img/logo.svg', 'image', 240, 40, 1_800),
];

const PRODUCTS_PATH: RenderPathEntry[] = [
  e('p-1', '/products', 'html', 0, 320, 18_400),
  e('p-2', '/_next/static/css/app.css', 'css', 320, 60, 36_400, true),
  e('p-3', '/_next/static/css/products.css', 'css', 320, 50, 12_200, true),
  e('p-4', 'fonts/Inter.woff2', 'font', 320, 80, 22_000, true),
  e('p-5', '/_next/static/chunks/main.js', 'js', 380, 220, 92_000, true),
  e('p-6', '/_next/static/chunks/products.js', 'js', 400, 180, 64_000),
  e('p-7', '/img/p-1.jpg', 'image', 460, 360, 380_000),
  e('p-8', '/img/p-2.jpg', 'image', 480, 340, 320_000),
  e('p-9', '/img/p-3.jpg', 'image', 500, 360, 360_000),
  e('p-10', '/api/products', 'xhr', 320, 120, 12_000),
];

const DASHBOARD_PATH: RenderPathEntry[] = [
  e('d-1', '/dashboard', 'html', 0, 540, 24_400),
  e('d-2', '/_next/static/css/app.css', 'css', 540, 60, 36_400, true),
  e('d-3', '/_next/static/css/dashboard.css', 'css', 540, 80, 22_400, true),
  e('d-4', 'fonts/Inter.woff2', 'font', 540, 80, 22_000, true),
  e('d-5', '/_next/static/chunks/main.js', 'js', 600, 240, 92_000, true),
  e('d-6', '/_next/static/chunks/recharts.js', 'js', 700, 540, 96_000),
  e('d-7', '/_next/static/chunks/dashboard.js', 'js', 700, 280, 84_000),
  e('d-8', '/api/me', 'xhr', 540, 220, 4_200),
  e('d-9', '/api/stats?range=7d', 'xhr', 760, 320, 14_000),
  e('d-10', '/api/notifications', 'xhr', 760, 240, 6_400),
  e('d-11', '/img/avatar.png', 'image', 540, 80, 18_000),
];

const CHECKOUT_PATH: RenderPathEntry[] = [
  e('co-1', '/checkout', 'html', 0, 460, 22_000),
  e('co-2', '/_next/static/css/app.css', 'css', 460, 60, 36_400, true),
  e('co-3', '/_next/static/css/checkout.css', 'css', 460, 60, 16_400, true),
  e('co-4', 'fonts/Inter.woff2', 'font', 460, 80, 22_000, true),
  e('co-5', '/_next/static/chunks/main.js', 'js', 520, 240, 92_000, true),
  e('co-6', '/_next/static/chunks/checkout.js', 'js', 540, 240, 78_000),
  e('co-7', 'https://js.stripe.com/v3/', 'js', 600, 360, 132_000),
  e('co-8', '/api/cart', 'xhr', 460, 200, 3_200),
];

const ADMIN_PRODUCTS_PATH: RenderPathEntry[] = [
  e('ap-1', '/admin/products', 'html', 0, 540, 24_000),
  e('ap-2', '/_next/static/css/app.css', 'css', 540, 60, 36_400, true),
  e('ap-3', '/_next/static/css/admin.css', 'css', 540, 60, 18_400, true),
  e('ap-4', 'fonts/Inter.woff2', 'font', 540, 80, 22_000, true),
  e('ap-5', '/_next/static/chunks/main.js', 'js', 600, 240, 92_000, true),
  e('ap-6', '/_next/static/chunks/monaco.js', 'js', 700, 1_200, 320_000),
  e('ap-7', '/api/products?admin=1', 'xhr', 540, 280, 18_000),
];

export const mockRenderPaths: Record<string, RenderPathEntry[]> = {
  route_home: HOME_PATH,
  route_products: PRODUCTS_PATH,
  route_products_id: PRODUCTS_PATH,
  route_cart: CHECKOUT_PATH,
  route_checkout: CHECKOUT_PATH,
  route_account: HOME_PATH,
  route_login: HOME_PATH,
  route_register: HOME_PATH,
  route_dashboard: DASHBOARD_PATH,
  route_admin_users: ADMIN_PRODUCTS_PATH,
  route_admin_users_delete: ADMIN_PRODUCTS_PATH,
  route_admin_products: ADMIN_PRODUCTS_PATH,
  route_blog: HOME_PATH,
  route_blog_slug: HOME_PATH,
  route_modal_product: PRODUCTS_PATH,
  route_api_products: HOME_PATH,
  route_api_webhook_stripe: HOME_PATH,
};

const HOME_CRITICAL_ABOVE = `:root { --bg: #fff; --ink: #0a0a0a; }
html, body { margin: 0; font-family: Inter, system-ui, sans-serif; color: var(--ink); }
.app-shell { min-height: 100vh; display: grid; grid-template-rows: 56px 1fr; }
.nav { position: sticky; top: 0; background: var(--bg); border-bottom: 1px solid #eee; }
.hero { aspect-ratio: 16 / 9; background: linear-gradient(180deg, #f7f7f7, #eaeaea); }
.hero h1 { font-size: clamp(28px, 4vw, 48px); margin: 24px 0 8px; }
.cta { display: inline-flex; gap: 8px; padding: 10px 14px; border-radius: 6px; background: #0a0a0a; color: #fff; }`;

const HOME_CRITICAL_DEFER = `/* Footer, blog cards, marketing carousel, animations */
.footer { background: #0a0a0a; color: #fff; padding: 48px 16px; }
.blog-card { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.fade-in { opacity: 0; animation: fade .25s ease forwards; }
@keyframes fade { to { opacity: 1; } }
.testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.product-grid img { transition: transform .25s ease; }
.product-grid img:hover { transform: scale(1.02); }`;

const PRODUCTS_CRITICAL_ABOVE = `.list-shell { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
.filters { position: sticky; top: 80px; }
.product-card { display: grid; grid-template-rows: auto 1fr auto; gap: 8px; }
.product-card img { aspect-ratio: 1 / 1; object-fit: cover; }
.price { font-variant-numeric: tabular-nums; font-weight: 600; }
.skeleton { background: linear-gradient(90deg, #eee, #f4f4f4, #eee); animation: shine 1.4s linear infinite; }`;

const PRODUCTS_CRITICAL_DEFER = `/* Reviews, related items, image gallery */
.reviews { padding: 24px 0; }
.related { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.gallery-thumbs { display: flex; gap: 8px; overflow-x: auto; }
@keyframes shine { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }`;

const DASHBOARD_CRITICAL_ABOVE = `.dash-shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
.sidebar { background: #fafafa; border-right: 1px solid #eee; padding: 16px; }
.dash-main { padding: 24px; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card { padding: 16px; border: 1px solid #eee; border-radius: 8px; min-height: 96px; }
.dash-main h1 { font-size: 24px; margin: 0 0 16px; }`;

const DASHBOARD_CRITICAL_DEFER = `/* Charts, recharts overrides, advanced widgets */
.recharts-tooltip-wrapper { font-size: 12px; }
.chart-panel { min-height: 320px; padding: 16px; border: 1px solid #eee; }
.legend { display: flex; flex-wrap: wrap; gap: 8px; }
@keyframes pulse { 50% { opacity: .5; } }
.live-dot { animation: pulse 1.6s ease-in-out infinite; }`;

const CHECKOUT_CRITICAL_ABOVE = `.checkout-shell { max-width: 720px; margin: 0 auto; padding: 32px 16px; }
.summary { border: 1px solid #eee; padding: 16px; border-radius: 8px; }
.input-group { display: grid; gap: 4px; margin-bottom: 12px; }
.input-group input { height: 36px; padding: 0 10px; border: 1px solid #ddd; border-radius: 6px; }
.btn-pay { width: 100%; height: 44px; background: #0a0a0a; color: #fff; border-radius: 8px; }`;

const CHECKOUT_CRITICAL_DEFER = `/* Stripe Elements styles, post-purchase carousel */
.StripeElement { padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
.StripeElement--invalid { border-color: #ef4444; }
.thanks-carousel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }`;

const ADMIN_CRITICAL_ABOVE = `.admin-shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
.admin-side { background: #fafafa; border-right: 1px solid #eee; padding: 12px; }
.admin-main { padding: 16px 24px; }
.toolbar { display: flex; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid #eee; }`;

const ADMIN_CRITICAL_DEFER = `/* Monaco editor styles defer-loaded with the editor itself */
.monaco-editor { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.monaco-editor .scroll-decoration { box-shadow: 0 0 6px rgba(0,0,0,0.1); }
.diff-bar { display: flex; gap: 8px; padding: 8px 0; }`;

export const mockCriticalBundles: Record<string, CriticalCssBundle> = {
  route_home: {
    routeId: 'route_home',
    aboveFoldRules: HOME_CRITICAL_ABOVE,
    deferredRules: HOME_CRITICAL_DEFER,
    reduceKb: 24,
  },
  route_products: {
    routeId: 'route_products',
    aboveFoldRules: PRODUCTS_CRITICAL_ABOVE,
    deferredRules: PRODUCTS_CRITICAL_DEFER,
    reduceKb: 22,
  },
  route_products_id: {
    routeId: 'route_products_id',
    aboveFoldRules: PRODUCTS_CRITICAL_ABOVE,
    deferredRules: PRODUCTS_CRITICAL_DEFER,
    reduceKb: 26,
  },
  route_cart: {
    routeId: 'route_cart',
    aboveFoldRules: CHECKOUT_CRITICAL_ABOVE,
    deferredRules: CHECKOUT_CRITICAL_DEFER,
    reduceKb: 18,
  },
  route_checkout: {
    routeId: 'route_checkout',
    aboveFoldRules: CHECKOUT_CRITICAL_ABOVE,
    deferredRules: CHECKOUT_CRITICAL_DEFER,
    reduceKb: 20,
  },
  route_account: {
    routeId: 'route_account',
    aboveFoldRules: HOME_CRITICAL_ABOVE,
    deferredRules: HOME_CRITICAL_DEFER,
    reduceKb: 18,
  },
  route_login: {
    routeId: 'route_login',
    aboveFoldRules: HOME_CRITICAL_ABOVE,
    deferredRules: HOME_CRITICAL_DEFER,
    reduceKb: 12,
  },
  route_register: {
    routeId: 'route_register',
    aboveFoldRules: HOME_CRITICAL_ABOVE,
    deferredRules: HOME_CRITICAL_DEFER,
    reduceKb: 12,
  },
  route_dashboard: {
    routeId: 'route_dashboard',
    aboveFoldRules: DASHBOARD_CRITICAL_ABOVE,
    deferredRules: DASHBOARD_CRITICAL_DEFER,
    reduceKb: 32,
  },
  route_admin_users: {
    routeId: 'route_admin_users',
    aboveFoldRules: ADMIN_CRITICAL_ABOVE,
    deferredRules: ADMIN_CRITICAL_DEFER,
    reduceKb: 24,
  },
  route_admin_users_delete: {
    routeId: 'route_admin_users_delete',
    aboveFoldRules: ADMIN_CRITICAL_ABOVE,
    deferredRules: ADMIN_CRITICAL_DEFER,
    reduceKb: 22,
  },
  route_admin_products: {
    routeId: 'route_admin_products',
    aboveFoldRules: ADMIN_CRITICAL_ABOVE,
    deferredRules: ADMIN_CRITICAL_DEFER,
    reduceKb: 28,
  },
  route_blog: {
    routeId: 'route_blog',
    aboveFoldRules: HOME_CRITICAL_ABOVE,
    deferredRules: HOME_CRITICAL_DEFER,
    reduceKb: 14,
  },
  route_blog_slug: {
    routeId: 'route_blog_slug',
    aboveFoldRules: HOME_CRITICAL_ABOVE,
    deferredRules: HOME_CRITICAL_DEFER,
    reduceKb: 16,
  },
  route_modal_product: {
    routeId: 'route_modal_product',
    aboveFoldRules: PRODUCTS_CRITICAL_ABOVE,
    deferredRules: PRODUCTS_CRITICAL_DEFER,
    reduceKb: 18,
  },
  route_api_products: {
    routeId: 'route_api_products',
    aboveFoldRules: '/* API endpoints have no above-the-fold CSS */',
    deferredRules: '',
    reduceKb: 0,
  },
  route_api_webhook_stripe: {
    routeId: 'route_api_webhook_stripe',
    aboveFoldRules: '/* API endpoints have no above-the-fold CSS */',
    deferredRules: '',
    reduceKb: 0,
  },
};
