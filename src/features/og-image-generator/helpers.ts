export type OgTemplateId = 'product' | 'article' | 'landing' | 'event';
export type OgLocale = 'KR' | 'EN' | 'JP' | 'ES';
export type OgSizeId = '1200x630' | '1200x600' | '1080x1080' | '800x600';
export type OgBgVariant = 'sheen' | 'gradient' | 'mesh' | 'grid' | 'solid';

export interface OgSize {
  readonly id: OgSizeId;
  readonly w: number;
  readonly h: number;
  readonly label: string;
}

export interface OgTemplate {
  readonly id: OgTemplateId;
  readonly label: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
  readonly accent: string;
  readonly bgVariant: OgBgVariant;
  readonly font: string;
  readonly hasImageArea: boolean;
}

export interface OgLocaleStrings {
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
}

export const OG_SIZES: ReadonlyArray<OgSize> = [
  { id: '1200x630', w: 1200, h: 630, label: '1200×630' },
  { id: '1200x600', w: 1200, h: 600, label: '1200×600' },
  { id: '1080x1080', w: 1080, h: 1080, label: '1080×1080' },
  { id: '800x600', w: 800, h: 600, label: '800×600' },
];

export const OG_LOCALES: ReadonlyArray<OgLocale> = ['KR', 'EN', 'JP', 'ES'];

export const OG_TEMPLATES: ReadonlyArray<OgTemplate> = [
  {
    id: 'product',
    label: 'Product',
    title: 'Acme Pro Headphones',
    subtitle: 'Studio-grade noise cancellation',
    badge: 'New',
    accent: '#2563eb',
    bgVariant: 'sheen',
    font: 'Inter',
    hasImageArea: true,
  },
  {
    id: 'article',
    label: 'Article',
    title: 'How we cut TTFB by 60%',
    subtitle: 'A streaming-first architecture story',
    badge: 'Engineering',
    accent: '#0f766e',
    bgVariant: 'gradient',
    font: 'Inter',
    hasImageArea: false,
  },
  {
    id: 'landing',
    label: 'Landing',
    title: 'Ship Next.js, faster',
    subtitle: 'The studio for content + SEO teams',
    badge: 'Beta',
    accent: '#7c3aed',
    bgVariant: 'mesh',
    font: 'Inter',
    hasImageArea: true,
  },
  {
    id: 'event',
    label: 'Event',
    title: 'Vercel Ship 2026',
    subtitle: 'May 15 · San Francisco',
    badge: 'Live',
    accent: '#dc2626',
    bgVariant: 'grid',
    font: 'Inter',
    hasImageArea: false,
  },
];

export const OG_LOCALE_STRINGS: Record<OgTemplateId, Record<OgLocale, OgLocaleStrings>> = {
  product: {
    KR: { title: '에이크미 프로 헤드폰', subtitle: '스튜디오급 노이즈 캔슬링', badge: '신상' },
    EN: { title: 'Acme Pro Headphones', subtitle: 'Studio-grade noise cancellation', badge: 'New' },
    JP: { title: 'Acmeプロ ヘッドホン', subtitle: 'スタジオ級ノイズキャンセリング', badge: '新着' },
    ES: { title: 'Auriculares Acme Pro', subtitle: 'Cancelación de ruido de estudio', badge: 'Nuevo' },
  },
  article: {
    KR: { title: 'TTFB를 60% 줄인 방법', subtitle: '스트리밍 우선 아키텍처', badge: '엔지니어링' },
    EN: { title: 'How we cut TTFB by 60%', subtitle: 'A streaming-first architecture story', badge: 'Engineering' },
    JP: { title: 'TTFBを60%削減した方法', subtitle: 'ストリーミング優先設計', badge: '技術' },
    ES: { title: 'Cómo reducimos el TTFB 60%', subtitle: 'Arquitectura basada en streaming', badge: 'Ingeniería' },
  },
  landing: {
    KR: { title: 'Next.js, 더 빠르게 배포', subtitle: '콘텐츠/SEO 팀을 위한 스튜디오', badge: '베타' },
    EN: { title: 'Ship Next.js, faster', subtitle: 'The studio for content + SEO teams', badge: 'Beta' },
    JP: { title: 'Next.jsをより速く', subtitle: 'コンテンツ／SEOチームのスタジオ', badge: 'ベータ' },
    ES: { title: 'Lanza Next.js más rápido', subtitle: 'El estudio para equipos de contenido', badge: 'Beta' },
  },
  event: {
    KR: { title: 'Vercel Ship 2026', subtitle: '5월 15일 · 샌프란시스코', badge: '라이브' },
    EN: { title: 'Vercel Ship 2026', subtitle: 'May 15 · San Francisco', badge: 'Live' },
    JP: { title: 'Vercel Ship 2026', subtitle: '5月15日 · サンフランシスコ', badge: 'ライブ' },
    ES: { title: 'Vercel Ship 2026', subtitle: '15 mayo · San Francisco', badge: 'En vivo' },
  },
};

export const BG_SWATCHES: ReadonlyArray<{ id: OgBgVariant; label: string; preview: string }> = [
  { id: 'sheen', label: 'Sheen', preview: 'linear-gradient(135deg,#f8fafc,#e2e8f0)' },
  { id: 'gradient', label: 'Gradient', preview: 'linear-gradient(135deg,#dbeafe,#fce7f3)' },
  { id: 'mesh', label: 'Mesh', preview: 'radial-gradient(circle at 30% 30%,#fef3c7,transparent),radial-gradient(circle at 70% 70%,#dbeafe,#f8fafc)' },
  { id: 'grid', label: 'Grid', preview: 'linear-gradient(#e5e7eb 1px,transparent 1px),linear-gradient(90deg,#e5e7eb 1px,#fafafa 1px)' },
  { id: 'solid', label: 'Solid', preview: '#0f172a' },
];

export interface OgState {
  templateId: OgTemplateId;
  locale: OgLocale;
  size: OgSizeId;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  bgVariant: OgBgVariant;
}

export function buildOgRoute(state: OgState, sizeW: number, sizeH: number): string {
  const safeTitle = state.title.replace(/`/g, '\\`');
  const safeSubtitle = state.subtitle.replace(/`/g, '\\`');
  const safeBadge = state.badge.replace(/`/g, '\\`');
  return `// app/${state.templateId}/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '${safeTitle}';
export const size = { width: ${sizeW}, height: ${sizeH} };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '${bgCss(state.bgVariant)}',
          padding: 64,
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            background: '${state.accent}',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          ${safeBadge}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '${state.bgVariant === 'solid' ? '#fff' : '#0f172a'}',
              lineHeight: 1.1,
            }}
          >
            ${safeTitle}
          </div>
          <div
            style={{
              fontSize: 32,
              marginTop: 16,
              color: '${state.bgVariant === 'solid' ? '#cbd5e1' : '#475569'}',
            }}
          >
            ${safeSubtitle}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
`;
}

function bgCss(v: OgBgVariant): string {
  switch (v) {
    case 'sheen':
      return 'linear-gradient(135deg,#f8fafc,#e2e8f0)';
    case 'gradient':
      return 'linear-gradient(135deg,#dbeafe,#fce7f3)';
    case 'mesh':
      return 'radial-gradient(circle at 30% 30%,#fef3c7,transparent), #f8fafc';
    case 'grid':
      return '#fafafa';
    case 'solid':
      return '#0f172a';
  }
}

export function bgFill(v: OgBgVariant): { stops: ReadonlyArray<{ offset: number; color: string }>; type: 'linear' | 'solid' | 'radial' } {
  switch (v) {
    case 'sheen':
      return { type: 'linear', stops: [{ offset: 0, color: '#f8fafc' }, { offset: 1, color: '#e2e8f0' }] };
    case 'gradient':
      return { type: 'linear', stops: [{ offset: 0, color: '#dbeafe' }, { offset: 1, color: '#fce7f3' }] };
    case 'mesh':
      return { type: 'radial', stops: [{ offset: 0, color: '#fef3c7' }, { offset: 1, color: '#f8fafc' }] };
    case 'grid':
      return { type: 'solid', stops: [{ offset: 0, color: '#fafafa' }, { offset: 1, color: '#fafafa' }] };
    case 'solid':
      return { type: 'solid', stops: [{ offset: 0, color: '#0f172a' }, { offset: 1, color: '#0f172a' }] };
  }
}

export function inkColors(v: OgBgVariant): { title: string; subtitle: string } {
  if (v === 'solid') return { title: '#ffffff', subtitle: '#cbd5e1' };
  return { title: '#0f172a', subtitle: '#475569' };
}

export function findSize(id: OgSizeId): OgSize {
  const s = OG_SIZES.find((x) => x.id === id);
  return s ?? OG_SIZES[0]!;
}

export function findTemplate(id: OgTemplateId): OgTemplate {
  const t = OG_TEMPLATES.find((x) => x.id === id);
  return t ?? OG_TEMPLATES[0]!;
}
