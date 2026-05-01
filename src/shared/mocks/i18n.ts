import type { I18nKey, Locale, Namespace } from '@shared/types';

/**
 * i18n-coverage mock data. Owns the literal arrays so the
 * `i18n-coverage` feature and any other consumer can pull seed data
 * from `shared/mocks` without an upward import.
 */

export const mockI18nLocales: ReadonlyArray<Locale> = ['en', 'ko', 'ja', 'es', 'de'];

export const mockI18nNamespaces: ReadonlyArray<Namespace> = [
  'common',
  'product',
  'checkout',
  'account',
  'errors',
];

const k = (
  id: string,
  ns: Namespace,
  key: string,
  usedIn: string[],
  values: Partial<Record<Locale, string>>,
): I18nKey => ({ id, ns, key, usedIn, values });

export const mockI18nKeys: ReadonlyArray<I18nKey> = [
  // common
  k('i_c_signIn', 'common', 'signIn', ['app/(auth)/login/page.tsx', 'components/AppShell.tsx'], {
    en: 'Sign in',
    ko: '로그인',
    ja: 'サインイン',
    es: 'Iniciar sesión',
    de: 'Anmelden',
  }),
  k('i_c_signOut', 'common', 'signOut', ['components/AccountMenu.tsx'], {
    en: 'Sign out',
    ko: '로그아웃',
    ja: 'サインアウト',
    es: 'Cerrar sesión',
    // de missing
  }),
  k('i_c_save', 'common', 'save', ['app/account/page.tsx', 'app/admin/products/edit-form.tsx'], {
    en: 'Save',
    ko: '저장',
    ja: '保存',
    es: 'Guardar',
    de: 'Speichern',
  }),
  k('i_c_cancel', 'common', 'cancel', ['components/Modal.tsx'], {
    en: 'Cancel',
    ko: '취소',
    ja: 'キャンセル',
    es: 'Cancelar',
    de: 'Abbrechen',
  }),
  k('i_c_search', 'common', 'search', ['components/SearchInput.tsx'], {
    en: 'Search',
    ko: '검색',
    ja: '検索',
    es: 'Buscar',
    de: 'Suchen',
  }),
  k('i_c_loading', 'common', 'loading', ['components/Loader.tsx'], {
    en: 'Loading…',
    ko: '불러오는 중…',
    ja: '読み込み中…',
    es: 'Cargando…',
    de: 'Wird geladen…',
  }),
  k('i_c_unusedLegacy', 'common', 'unusedLegacy', [], {
    en: 'Legacy text (unused)',
    ko: '레거시 텍스트',
  }),

  // product
  k('i_p_addToCart', 'product', 'addToCart', ['components/AddToCartForm.client.tsx'], {
    en: 'Add to cart',
    ko: '장바구니에 추가',
    ja: 'カートに追加',
    es: 'Añadir al carrito',
    de: 'In den Warenkorb',
  }),
  k('i_p_outOfStock', 'product', 'outOfStock', ['app/(shop)/products/[id]/page.tsx'], {
    en: 'Out of stock',
    ko: '품절',
    ja: '在庫切れ',
    es: 'Agotado',
    de: 'Ausverkauft',
  }),
  k('i_p_price', 'product', 'price', ['components/PriceTag.tsx'], {
    en: 'Price',
    ko: '가격',
    ja: '価格',
    es: 'Precio',
    de: 'Preis',
  }),
  k('i_p_reviews', 'product', 'reviews', ['app/(shop)/products/[id]/page.tsx'], {
    en: 'Reviews',
    ko: '리뷰',
    ja: 'レビュー',
    es: 'Reseñas',
    // de missing
  }),
  k('i_p_relatedItems', 'product', 'relatedItems', ['app/(shop)/products/[id]/page.tsx'], {
    en: 'Related items',
    ko: '관련 상품',
    ja: '関連商品',
    es: 'Artículos relacionados',
    de: 'Verwandte Artikel',
  }),

  // checkout
  k('i_x_placeOrder', 'checkout', 'placeOrder', ['components/CheckoutForm.client.tsx'], {
    en: 'Place order',
    ko: '주문하기',
    ja: '注文する',
    es: 'Realizar pedido',
    de: 'Bestellen',
  }),
  k('i_x_shippingAddress', 'checkout', 'shippingAddress', ['components/CheckoutForm.client.tsx'], {
    en: 'Shipping address',
    ko: '배송지',
    ja: '配送先住所',
    es: 'Dirección de envío',
    de: 'Lieferadresse',
  }),
  k('i_x_paymentMethod', 'checkout', 'paymentMethod', ['components/CheckoutForm.client.tsx'], {
    en: 'Payment method',
    ko: '결제 수단',
    ja: '支払い方法',
    es: 'Método de pago',
    de: 'Zahlungsmethode',
  }),
  k('i_x_orderSummary', 'checkout', 'orderSummary', ['app/(shop)/checkout/page.tsx'], {
    en: 'Order summary',
    ko: '주문 요약',
    ja: '注文概要',
    es: 'Resumen del pedido',
    // de missing
  }),
  k('i_x_total', 'checkout', 'total', ['app/(shop)/checkout/page.tsx'], {
    en: 'Total',
    ko: '합계',
    ja: '合計',
    es: 'Total',
    de: 'Gesamt',
  }),

  // account
  k('i_a_profile', 'account', 'profile', ['app/account/page.tsx'], {
    en: 'Profile',
    ko: '프로필',
    ja: 'プロフィール',
    es: 'Perfil',
    de: 'Profil',
  }),
  k('i_a_orders', 'account', 'orders', ['app/account/orders/page.tsx'], {
    en: 'Orders',
    ko: '주문',
    ja: '注文',
    es: 'Pedidos',
    de: 'Bestellungen',
  }),
  k('i_a_addresses', 'account', 'addresses', ['app/account/addresses/page.tsx'], {
    en: 'Addresses',
    ko: '주소',
    ja: '住所',
    es: 'Direcciones',
    de: 'Adressen',
  }),
  k('i_a_arabicNote', 'account', 'arabicNote', ['app/account/page.tsx'], {
    en: 'العربية: ملاحظة الحساب',
    ko: '계정 안내 (아랍어 포함)',
  }),
  k('i_a_legacyTab', 'account', 'legacyTab', [], {
    en: 'Legacy tab',
  }),

  // errors
  k('i_e_required', 'errors', 'required', ['lib/schemas/*.ts'], {
    en: 'This field is required',
    ko: '이 필드는 필수입니다',
    ja: 'この項目は必須です',
    es: 'Este campo es obligatorio',
    de: 'Dieses Feld ist erforderlich',
  }),
  k('i_e_emailFormat', 'errors', 'emailFormat', ['lib/schemas/auth.ts'], {
    en: 'Invalid email',
    ko: '잘못된 이메일',
    ja: '無効なメールアドレス',
    es: 'Correo inválido',
    de: 'Ungültige E-Mail',
  }),
  k('i_e_invalidCard', 'errors', 'invalidCard', ['components/CheckoutForm.client.tsx'], {
    en: 'Invalid card details',
    // others missing
  }),
  k('i_e_serverDown', 'errors', 'serverDown', ['app/error.tsx'], {
    en: 'Server is unreachable',
    ko: '서버에 연결할 수 없습니다',
    ja: 'サーバーに接続できません',
    es: 'El servidor no responde',
    de: 'Server nicht erreichbar',
  }),
  k('i_e_notFound', 'errors', 'notFound', ['app/not-found.tsx'], {
    en: 'Page not found',
    ko: '페이지를 찾을 수 없습니다',
    ja: 'ページが見つかりません',
    es: 'Página no encontrada',
    de: 'Seite nicht gefunden',
  }),
];
