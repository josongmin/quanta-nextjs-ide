export type LocaleId = 'KR' | 'EN' | 'JP' | 'ES';

export interface LocaleInfo {
  readonly id: LocaleId;
  readonly label: string;
  readonly flag: string;
}

export const LOCALES: ReadonlyArray<LocaleInfo> = [
  { id: 'KR', label: 'Korean', flag: 'kr' },
  { id: 'EN', label: 'English', flag: 'en' },
  { id: 'JP', label: 'Japanese', flag: 'jp' },
  { id: 'ES', label: 'Spanish', flag: 'es' },
];

export interface BlockText {
  readonly id: string;
  readonly text: string;
  readonly missing?: boolean;
}

export interface LocaleRouteData {
  readonly locale: LocaleId;
  readonly blocks: ReadonlyArray<BlockText>;
  readonly missingKeys: ReadonlyArray<string>;
  readonly hreflang: string;
  readonly rtl: boolean;
  readonly lastUpdatedRel: string;
}

export interface RouteDef {
  readonly id: string;
  readonly path: string;
  readonly perLocale: Readonly<Record<LocaleId, LocaleRouteData>>;
}

const ROUTES_RAW: ReadonlyArray<RouteDef> = [
  {
    id: 'product-detail',
    path: '/products/[id]',
    perLocale: {
      KR: {
        locale: 'KR',
        hreflang: 'ko-KR',
        rtl: false,
        lastUpdatedRel: '2 days ago',
        missingKeys: [],
        blocks: [
          { id: 'title', text: '프리미엄 가죽 백팩' },
          { id: 'price', text: '189,000원' },
          { id: 'cta.add', text: '장바구니에 담기' },
          { id: 'desc', text: '내구성 있는 풀그레인 가죽으로 제작된 정교한 백팩.' },
        ],
      },
      EN: {
        locale: 'EN',
        hreflang: 'en-US',
        rtl: false,
        lastUpdatedRel: '5 hours ago',
        missingKeys: [],
        blocks: [
          { id: 'title', text: 'Premium Leather Backpack' },
          { id: 'price', text: '$149.00' },
          { id: 'cta.add', text: 'Add to cart' },
          { id: 'desc', text: 'Hand-crafted backpack made from durable full-grain leather, designed for everyday use.' },
        ],
      },
      JP: {
        locale: 'JP',
        hreflang: 'ja-JP',
        rtl: false,
        lastUpdatedRel: '1 week ago',
        missingKeys: ['cta.confirm'],
        blocks: [
          { id: 'title', text: 'プレミアムレザーバックパック' },
          { id: 'price', text: '¥21,800' },
          { id: 'cta.add', text: 'カートに追加する' },
          { id: 'desc', text: '耐久性のあるフルグレインレザーで作られた、毎日の使用のためにデザインされた手作りのバックパック。' },
        ],
      },
      ES: {
        locale: 'ES',
        hreflang: 'es-ES',
        rtl: false,
        lastUpdatedRel: '3 days ago',
        missingKeys: ['desc.specs'],
        blocks: [
          { id: 'title', text: 'Mochila de cuero premium' },
          { id: 'price', text: '139,00 €' },
          { id: 'cta.add', text: 'Añadir al carrito' },
          { id: 'desc', text: 'Mochila artesanal hecha con cuero plena flor duradero, diseñada para uso diario y viajes.' },
        ],
      },
    },
  },
  {
    id: 'checkout',
    path: '/checkout',
    perLocale: {
      KR: {
        locale: 'KR',
        hreflang: 'ko-KR',
        rtl: false,
        lastUpdatedRel: '1 day ago',
        missingKeys: [],
        blocks: [
          { id: 'h1', text: '결제하기' },
          { id: 'shipping', text: '배송지 입력' },
          { id: 'payment', text: '결제 수단 선택' },
          { id: 'cta.confirm', text: '주문 확정' },
        ],
      },
      EN: {
        locale: 'EN',
        hreflang: 'en-US',
        rtl: false,
        lastUpdatedRel: '4 hours ago',
        missingKeys: [],
        blocks: [
          { id: 'h1', text: 'Checkout' },
          { id: 'shipping', text: 'Shipping address' },
          { id: 'payment', text: 'Select payment method' },
          { id: 'cta.confirm', text: 'Confirm order' },
        ],
      },
      JP: {
        locale: 'JP',
        hreflang: 'ja-JP',
        rtl: false,
        lastUpdatedRel: '2 weeks ago',
        missingKeys: ['cta.confirm', 'shipping.note'],
        blocks: [
          { id: 'h1', text: 'チェックアウト' },
          { id: 'shipping', text: 'お届け先住所' },
          { id: 'payment', text: 'お支払い方法を選択してください' },
          { id: 'cta.confirm', text: '', missing: true },
        ],
      },
      ES: {
        locale: 'ES',
        hreflang: 'es-ES',
        rtl: false,
        lastUpdatedRel: '6 days ago',
        missingKeys: [],
        blocks: [
          { id: 'h1', text: 'Pagar' },
          { id: 'shipping', text: 'Dirección de envío' },
          { id: 'payment', text: 'Seleccionar método de pago' },
          { id: 'cta.confirm', text: 'Confirmar pedido' },
        ],
      },
    },
  },
  {
    id: 'about',
    path: '/about',
    perLocale: {
      KR: {
        locale: 'KR',
        hreflang: 'ko-KR',
        rtl: false,
        lastUpdatedRel: '1 month ago',
        missingKeys: [],
        blocks: [
          { id: 'h1', text: '회사 소개' },
          { id: 'mission', text: '우리의 미션' },
          { id: 'team', text: '팀' },
          { id: 'press', text: '미디어 자료' },
        ],
      },
      EN: {
        locale: 'EN',
        hreflang: 'en-US',
        rtl: false,
        lastUpdatedRel: '2 weeks ago',
        missingKeys: [],
        blocks: [
          { id: 'h1', text: 'About us' },
          { id: 'mission', text: 'Our mission' },
          { id: 'team', text: 'Team' },
          { id: 'press', text: 'Press' },
        ],
      },
      JP: {
        locale: 'JP',
        hreflang: 'ja-JP',
        rtl: false,
        lastUpdatedRel: '3 months ago',
        missingKeys: ['press'],
        blocks: [
          { id: 'h1', text: '私たちについて' },
          { id: 'mission', text: '私たちのミッション' },
          { id: 'team', text: 'チーム' },
          { id: 'press', text: '', missing: true },
        ],
      },
      ES: {
        locale: 'ES',
        hreflang: 'es-ES',
        rtl: false,
        lastUpdatedRel: '5 weeks ago',
        missingKeys: [],
        blocks: [
          { id: 'h1', text: 'Acerca de nosotros' },
          { id: 'mission', text: 'Nuestra misión' },
          { id: 'team', text: 'Equipo' },
          { id: 'press', text: 'Prensa' },
        ],
      },
    },
  },
  {
    id: 'blog-post',
    path: '/blog/[slug]',
    perLocale: {
      KR: {
        locale: 'KR',
        hreflang: 'ko-KR',
        rtl: false,
        lastUpdatedRel: '6 days ago',
        missingKeys: [],
        blocks: [
          { id: 'title', text: 'Next.js로 빠른 사이트 만들기' },
          { id: 'lede', text: '서버 컴포넌트와 스트리밍을 활용한 사이트 성능 향상.' },
          { id: 'cta.read', text: '계속 읽기' },
          { id: 'tags', text: '태그: 성능, 서버 컴포넌트' },
        ],
      },
      EN: {
        locale: 'EN',
        hreflang: 'en-US',
        rtl: false,
        lastUpdatedRel: '1 day ago',
        missingKeys: [],
        blocks: [
          { id: 'title', text: 'Building fast sites with Next.js' },
          { id: 'lede', text: 'Improve site performance with server components and streaming.' },
          { id: 'cta.read', text: 'Continue reading' },
          { id: 'tags', text: 'Tags: performance, server components' },
        ],
      },
      JP: {
        locale: 'JP',
        hreflang: 'ja-JP',
        rtl: false,
        lastUpdatedRel: '2 weeks ago',
        missingKeys: [],
        blocks: [
          { id: 'title', text: 'Next.jsで高速なサイトを構築する' },
          { id: 'lede', text: 'サーバーコンポーネントとストリーミングを使用してサイトのパフォーマンスを向上させます。' },
          { id: 'cta.read', text: '続きを読む' },
          { id: 'tags', text: 'タグ：パフォーマンス、サーバーコンポーネント' },
        ],
      },
      ES: {
        locale: 'ES',
        hreflang: 'es-ES',
        rtl: false,
        lastUpdatedRel: '4 days ago',
        missingKeys: ['tags.meta'],
        blocks: [
          { id: 'title', text: 'Creando sitios rápidos con Next.js' },
          { id: 'lede', text: 'Mejora el rendimiento de tu sitio con componentes de servidor y streaming.' },
          { id: 'cta.read', text: 'Continuar leyendo' },
          { id: 'tags', text: 'Etiquetas: rendimiento, componentes de servidor' },
        ],
      },
    },
  },
];

export const ROUTES = ROUTES_RAW;

export function routeById(id: string): RouteDef {
  const r = ROUTES.find((x) => x.id === id);
  if (!r) throw new Error(`unknown route ${id}`);
  return r;
}

export function localeData(routeId: string, loc: LocaleId): LocaleRouteData {
  return routeById(routeId).perLocale[loc];
}

export function localeInfo(loc: LocaleId): LocaleInfo {
  const f = LOCALES.find((l) => l.id === loc);
  if (!f) throw new Error(`unknown locale ${loc}`);
  return f;
}

export function totalChars(d: LocaleRouteData): number {
  return d.blocks.reduce((acc, b) => acc + b.text.length, 0);
}

export function totalTokens(d: LocaleRouteData): number {
  // mock tokenization
  return d.blocks.reduce(
    (acc, b) => acc + b.text.split(/\s+|[　]+/).filter(Boolean).length,
    0,
  );
}

export function missingPercent(d: LocaleRouteData, blockCount: number): number {
  const missingBlocks = d.blocks.filter((b) => b.missing).length;
  return Math.round(((missingBlocks + d.missingKeys.length) / Math.max(1, blockCount)) * 100);
}

export type DiffStatus = 'match' | 'shorter' | 'longer' | 'missing';

export function compareBlock(
  primary: BlockText | undefined,
  comp: BlockText | undefined,
): { status: DiffStatus; ratio: number } {
  if (comp === undefined || comp.missing || comp.text.trim().length === 0) {
    return { status: 'missing', ratio: 0 };
  }
  if (primary === undefined) return { status: 'match', ratio: 1 };
  const a = primary.text.length;
  const b = comp.text.length;
  if (a === 0) return { status: 'match', ratio: 1 };
  const ratio = b / a;
  if (ratio < 0.7) return { status: 'shorter', ratio };
  if (ratio > 1.3) return { status: 'longer', ratio };
  return { status: 'match', ratio };
}

export function diffBg(s: DiffStatus): string {
  switch (s) {
    case 'match':
      return 'bg-sem-static-soft border-sem-static/30';
    case 'shorter':
    case 'longer':
      return 'bg-sev-warn-soft border-sev-warn/30';
    case 'missing':
      return 'bg-sev-err-soft border-sev-err/30';
  }
}

export interface RenderingImplication {
  readonly id: string;
  readonly blockId: string;
  readonly locale: LocaleId;
  readonly severity: 'err' | 'warn' | 'info';
  readonly message: string;
}

export function renderingImplications(routeId: string): ReadonlyArray<RenderingImplication> {
  const r = routeById(routeId);
  const out: RenderingImplication[] = [];
  const primary = r.perLocale.KR;
  for (const loc of LOCALES) {
    if (loc.id === 'KR') continue;
    const data = r.perLocale[loc.id];
    for (const block of data.blocks) {
      const p = primary.blocks.find((b) => b.id === block.id);
      const cmp = compareBlock(p, block);
      if (cmp.status === 'missing') {
        out.push({
          id: `${routeId}-${loc.id}-${block.id}-missing`,
          blockId: block.id,
          locale: loc.id,
          severity: 'err',
          message: `Missing translation for "${block.id}" — falls back to KR.`,
        });
      } else if (cmp.status === 'longer') {
        out.push({
          id: `${routeId}-${loc.id}-${block.id}-overflow`,
          blockId: block.id,
          locale: loc.id,
          severity: 'warn',
          message: `"${block.id}" is ${Math.round(cmp.ratio * 100)}% of KR length — overflow risk on tight CTAs.`,
        });
      } else if (cmp.status === 'shorter') {
        out.push({
          id: `${routeId}-${loc.id}-${block.id}-shorter`,
          blockId: block.id,
          locale: loc.id,
          severity: 'info',
          message: `"${block.id}" is ${Math.round(cmp.ratio * 100)}% of KR length — extra whitespace likely.`,
        });
      }
      if (loc.id === 'JP' && /[＀-￯]/.test(block.text)) {
        out.push({
          id: `${routeId}-${loc.id}-${block.id}-fullwidth`,
          blockId: block.id,
          locale: loc.id,
          severity: 'warn',
          message: `"${block.id}" contains fullwidth chars — may break monospaced layout.`,
        });
      }
    }
  }
  return out;
}

export function severityChipTone(s: 'err' | 'warn' | 'info'): 'err' | 'warn' | 'info' {
  return s;
}
