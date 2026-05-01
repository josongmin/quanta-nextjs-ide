export type EmailLocale = 'en' | 'ko' | 'ja';
export type EmailClient = 'gmail' | 'outlook' | 'apple-mail';

export interface EmailBlock {
  kind: 'heading' | 'paragraph' | 'button' | 'divider' | 'image' | 'list';
  text?: string;
  url?: string;
  src?: string;
  items?: ReadonlyArray<string>;
}

export interface EmailLocaleVariant {
  subject: string;
  preview: string;
  blocks: ReadonlyArray<EmailBlock>;
}

export interface EmailABVariant {
  id: string;
  subject: string;
  predictedOpenRate: number;
}

export interface ClientQuirk {
  client: EmailClient;
  width: number;
  note: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'auth';
  subjectFallback: string;
  locales: Record<EmailLocale, EmailLocaleVariant>;
  abVariants: ReadonlyArray<EmailABVariant>;
  clients: ReadonlyArray<ClientQuirk>;
  trackingLinks: ReadonlyArray<string>;
}

export const EMAIL_TEMPLATES: ReadonlyArray<EmailTemplate> = [
  {
    id: 'welcome',
    name: 'Welcome',
    category: 'transactional',
    subjectFallback: 'Welcome to Quanta',
    locales: {
      en: {
        subject: 'Welcome aboard, {{name}}',
        preview: 'Get started with your new workspace in 3 quick steps.',
        blocks: [
          { kind: 'heading', text: 'Welcome to Quanta' },
          { kind: 'paragraph', text: 'Hi {{name}}, your workspace is ready. Pick up where you left off.' },
          { kind: 'button', text: 'Open dashboard', url: 'https://example.com/app' },
          { kind: 'divider' },
          { kind: 'list', items: ['Invite teammates', 'Connect a repo', 'Deploy your first preview'] },
        ],
      },
      ko: {
        subject: '{{name}}님, 환영합니다',
        preview: '3단계로 워크스페이스 시작하기.',
        blocks: [
          { kind: 'heading', text: 'Quanta에 오신 것을 환영합니다' },
          { kind: 'paragraph', text: '{{name}}님, 워크스페이스가 준비되었습니다.' },
          { kind: 'button', text: '대시보드 열기', url: 'https://example.com/app' },
          { kind: 'list', items: ['팀원 초대', '저장소 연결', '첫 프리뷰 배포'] },
        ],
      },
      ja: {
        subject: '{{name}}さん、ようこそ',
        preview: '3つのステップでワークスペースを始めましょう。',
        blocks: [
          { kind: 'heading', text: 'Quantaへようこそ' },
          { kind: 'paragraph', text: '{{name}}さん、ワークスペースの準備ができました。' },
          { kind: 'button', text: 'ダッシュボードを開く', url: 'https://example.com/app' },
          { kind: 'list', items: ['チームを招待', 'リポジトリを接続', '最初のプレビューをデプロイ'] },
        ],
      },
    },
    abVariants: [
      { id: 'a', subject: 'Welcome aboard, {{name}}', predictedOpenRate: 42.1 },
      { id: 'b', subject: 'Your workspace is ready', predictedOpenRate: 38.7 },
      { id: 'c', subject: '{{name}}, let\'s get started', predictedOpenRate: 45.6 },
    ],
    clients: [
      { client: 'gmail', width: 600, note: 'Auto-resizes; clipping after 102KB' },
      { client: 'outlook', width: 580, note: 'No flexbox; uses VML for buttons' },
      { client: 'apple-mail', width: 600, note: 'Best CSS support; dark mode auto' },
    ],
    trackingLinks: ['utm_source=email', 'utm_campaign=welcome'],
  },
  {
    id: 'order-confirmation',
    name: 'Order confirmation',
    category: 'transactional',
    subjectFallback: 'Order #{{id}} confirmed',
    locales: {
      en: {
        subject: 'Order #{{id}} confirmed',
        preview: 'Thanks for your purchase. Estimated delivery in 3 business days.',
        blocks: [
          { kind: 'heading', text: 'Thanks for your order' },
          { kind: 'paragraph', text: 'Your order #1284 is confirmed.' },
          { kind: 'list', items: ['1× Pro Annual — $96.00', 'Tax — $7.68', 'Total — $103.68'] },
          { kind: 'button', text: 'View receipt', url: 'https://example.com/receipt/1284' },
        ],
      },
      ko: {
        subject: '주문 #{{id}} 확정',
        preview: '구매해주셔서 감사합니다. 영업일 기준 3일 내 배송됩니다.',
        blocks: [
          { kind: 'heading', text: '주문이 확정되었습니다' },
          { kind: 'paragraph', text: '주문 #1284 확정.' },
          { kind: 'list', items: ['1× Pro Annual — ₩128,000', '부가세 — ₩12,800', '합계 — ₩140,800'] },
          { kind: 'button', text: '영수증 보기', url: 'https://example.com/receipt/1284' },
        ],
      },
      ja: {
        subject: '注文 #{{id}} 確定',
        preview: 'ご購入ありがとうございます。3営業日以内に発送します。',
        blocks: [
          { kind: 'heading', text: 'ご注文を承りました' },
          { kind: 'paragraph', text: '注文 #1284 が確定しました。' },
          { kind: 'list', items: ['1× Pro Annual — ¥14,400', '税 — ¥1,440', '合計 — ¥15,840'] },
          { kind: 'button', text: '領収書を見る', url: 'https://example.com/receipt/1284' },
        ],
      },
    },
    abVariants: [
      { id: 'a', subject: 'Order #1284 confirmed', predictedOpenRate: 71.3 },
      { id: 'b', subject: 'Your order is on the way', predictedOpenRate: 68.5 },
      { id: 'c', subject: 'Thanks for your purchase', predictedOpenRate: 64.2 },
    ],
    clients: [
      { client: 'gmail', width: 600, note: 'Promotions tab risk' },
      { client: 'outlook', width: 580, note: 'Tables required for layout' },
      { client: 'apple-mail', width: 600, note: 'Renders inline currency well' },
    ],
    trackingLinks: ['utm_source=email', 'utm_campaign=order'],
  },
  {
    id: 'password-reset',
    name: 'Password reset',
    category: 'auth',
    subjectFallback: 'Reset your password',
    locales: {
      en: {
        subject: 'Reset your password',
        preview: 'This link expires in 30 minutes.',
        blocks: [
          { kind: 'heading', text: 'Reset your password' },
          { kind: 'paragraph', text: 'Click the button below to set a new password.' },
          { kind: 'button', text: 'Reset password', url: 'https://example.com/reset?t=mock' },
          { kind: 'paragraph', text: 'If you didn\'t request this, you can ignore this email.' },
        ],
      },
      ko: {
        subject: '비밀번호 재설정',
        preview: '이 링크는 30분 후에 만료됩니다.',
        blocks: [
          { kind: 'heading', text: '비밀번호 재설정' },
          { kind: 'paragraph', text: '아래 버튼을 클릭하여 새 비밀번호를 설정하세요.' },
          { kind: 'button', text: '비밀번호 재설정', url: 'https://example.com/reset?t=mock' },
        ],
      },
      ja: {
        subject: 'パスワードを再設定',
        preview: 'このリンクは30分後に失効します。',
        blocks: [
          { kind: 'heading', text: 'パスワードの再設定' },
          { kind: 'paragraph', text: '下のボタンをクリックして新しいパスワードを設定してください。' },
          { kind: 'button', text: 'パスワードを再設定', url: 'https://example.com/reset?t=mock' },
        ],
      },
    },
    abVariants: [
      { id: 'a', subject: 'Reset your password', predictedOpenRate: 82.1 },
      { id: 'b', subject: 'Password reset request', predictedOpenRate: 78.4 },
      { id: 'c', subject: 'Action required: reset password', predictedOpenRate: 84.9 },
    ],
    clients: [
      { client: 'gmail', width: 600, note: 'Security tab inbox' },
      { client: 'outlook', width: 580, note: 'Buttons via VML' },
      { client: 'apple-mail', width: 600, note: 'Universal links supported' },
    ],
    trackingLinks: [],
  },
  {
    id: 'invoice',
    name: 'Invoice',
    category: 'transactional',
    subjectFallback: 'Invoice #{{id}} from Quanta',
    locales: {
      en: {
        subject: 'Invoice #{{id}} — $103.68 due',
        preview: 'PDF invoice attached. Auto-charge in 7 days.',
        blocks: [
          { kind: 'heading', text: 'Invoice #INV-2391' },
          { kind: 'paragraph', text: 'Total due: $103.68' },
          { kind: 'list', items: ['Pro Annual — $96.00', 'Tax — $7.68', 'Total — $103.68'] },
          { kind: 'button', text: 'View invoice', url: 'https://example.com/invoice/2391' },
        ],
      },
      ko: {
        subject: '청구서 #{{id}} — ₩140,800 결제 예정',
        preview: '7일 이내 자동 결제됩니다.',
        blocks: [
          { kind: 'heading', text: '청구서 #INV-2391' },
          { kind: 'paragraph', text: '결제 금액: ₩140,800' },
          { kind: 'button', text: '청구서 보기', url: 'https://example.com/invoice/2391' },
        ],
      },
      ja: {
        subject: '請求書 #{{id}} — ¥15,840',
        preview: '7日後に自動的に決済されます。',
        blocks: [
          { kind: 'heading', text: '請求書 #INV-2391' },
          { kind: 'paragraph', text: '請求額: ¥15,840' },
          { kind: 'button', text: '請求書を見る', url: 'https://example.com/invoice/2391' },
        ],
      },
    },
    abVariants: [
      { id: 'a', subject: 'Invoice #INV-2391 — $103.68 due', predictedOpenRate: 64.1 },
      { id: 'b', subject: 'Your monthly invoice is ready', predictedOpenRate: 58.2 },
      { id: 'c', subject: 'Payment due in 7 days', predictedOpenRate: 71.0 },
    ],
    clients: [
      { client: 'gmail', width: 600, note: 'Renders attached PDF preview' },
      { client: 'outlook', width: 580, note: 'No web fonts' },
      { client: 'apple-mail', width: 600, note: 'Markup data supported' },
    ],
    trackingLinks: ['utm_source=email'],
  },
  {
    id: 'weekly-digest',
    name: 'Weekly digest',
    category: 'marketing',
    subjectFallback: 'Your weekly digest',
    locales: {
      en: {
        subject: 'This week on Quanta',
        preview: '12 deploys, 4 incidents resolved, 1 new collaborator.',
        blocks: [
          { kind: 'heading', text: 'This week in your workspace' },
          { kind: 'list', items: ['12 deploys shipped', '4 incidents resolved', '1 new collaborator'] },
          { kind: 'divider' },
          { kind: 'paragraph', text: 'Top performing route: /pricing — 4.1k visits' },
          { kind: 'button', text: 'View report', url: 'https://example.com/digest' },
        ],
      },
      ko: {
        subject: '이번 주 Quanta 다이제스트',
        preview: '배포 12건, 인시던트 4건 해결, 새 협업자 1명.',
        blocks: [
          { kind: 'heading', text: '이번 주 워크스페이스' },
          { kind: 'list', items: ['배포 12건', '인시던트 4건 해결', '새 협업자 1명'] },
          { kind: 'button', text: '보고서 보기', url: 'https://example.com/digest' },
        ],
      },
      ja: {
        subject: '今週のQuantaダイジェスト',
        preview: 'デプロイ12件、インシデント4件解決、新規コラボレーター1名。',
        blocks: [
          { kind: 'heading', text: '今週のワークスペース' },
          { kind: 'list', items: ['デプロイ12件', 'インシデント4件解決', '新規コラボレーター1名'] },
          { kind: 'button', text: 'レポートを見る', url: 'https://example.com/digest' },
        ],
      },
    },
    abVariants: [
      { id: 'a', subject: 'This week on Quanta', predictedOpenRate: 28.4 },
      { id: 'b', subject: '12 deploys, 4 incidents — your week', predictedOpenRate: 33.1 },
      { id: 'c', subject: 'Your weekly digest is ready', predictedOpenRate: 24.7 },
    ],
    clients: [
      { client: 'gmail', width: 600, note: 'Often filed in Updates tab' },
      { client: 'outlook', width: 580, note: 'No background images' },
      { client: 'apple-mail', width: 600, note: 'List bullets render natively' },
    ],
    trackingLinks: ['utm_source=email', 'utm_campaign=digest', 'utm_medium=weekly'],
  },
  {
    id: 'magic-link',
    name: 'Magic link',
    category: 'auth',
    subjectFallback: 'Your sign-in link',
    locales: {
      en: {
        subject: 'Your sign-in link',
        preview: 'Click to sign in. Expires in 10 minutes.',
        blocks: [
          { kind: 'heading', text: 'Sign in to Quanta' },
          { kind: 'paragraph', text: 'Click the button below to sign in. This link expires in 10 minutes.' },
          { kind: 'button', text: 'Sign in', url: 'https://example.com/magic?t=mock' },
        ],
      },
      ko: {
        subject: '로그인 링크',
        preview: '클릭하여 로그인. 10분 후 만료.',
        blocks: [
          { kind: 'heading', text: 'Quanta 로그인' },
          { kind: 'paragraph', text: '아래 버튼을 클릭하여 로그인하세요. 10분 후 만료됩니다.' },
          { kind: 'button', text: '로그인', url: 'https://example.com/magic?t=mock' },
        ],
      },
      ja: {
        subject: 'サインインリンク',
        preview: 'クリックしてサインイン。10分後に失効。',
        blocks: [
          { kind: 'heading', text: 'Quantaにサインイン' },
          { kind: 'paragraph', text: '下のボタンをクリックしてサインイン。10分後に失効します。' },
          { kind: 'button', text: 'サインイン', url: 'https://example.com/magic?t=mock' },
        ],
      },
    },
    abVariants: [
      { id: 'a', subject: 'Your sign-in link', predictedOpenRate: 88.5 },
      { id: 'b', subject: 'Click to sign in', predictedOpenRate: 85.2 },
      { id: 'c', subject: 'Quanta sign-in (expires in 10m)', predictedOpenRate: 91.3 },
    ],
    clients: [
      { client: 'gmail', width: 600, note: 'Promo tab unlikely' },
      { client: 'outlook', width: 580, note: 'Render text alt for button' },
      { client: 'apple-mail', width: 600, note: 'Universal link wraps URL' },
    ],
    trackingLinks: [],
  },
];

export function applyVars(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}

export function clientLabel(c: EmailClient): string {
  return c === 'gmail' ? 'Gmail' : c === 'outlook' ? 'Outlook' : 'Apple Mail';
}

export function localeLabel(l: EmailLocale): string {
  return l === 'en' ? 'EN' : l === 'ko' ? 'KO' : 'JA';
}
