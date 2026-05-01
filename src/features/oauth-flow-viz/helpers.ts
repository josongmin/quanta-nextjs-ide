export type ProviderId = 'google' | 'github' | 'apple' | 'naver';
export type StepKind = 'browser' | 'authz' | 'your-server' | 'provider';
export type StepId =
  | 'redirect'
  | 'consent'
  | 'callback'
  | 'token-exchange'
  | 'user-info'
  | 'session-set'
  | 'done';

export interface OauthStep {
  readonly id: StepId;
  readonly label: string;
  readonly kind: StepKind;
  readonly request: string;
  readonly response: string;
  readonly urlParams: ReadonlyArray<{ key: string; value: string; note?: string }>;
  readonly errors: ReadonlyArray<string>;
}

export interface ProviderConfig {
  readonly id: ProviderId;
  readonly label: string;
  readonly authzUrl: string;
  readonly tokenUrl: string;
  readonly userInfoUrl: string;
  readonly scopes: ReadonlyArray<string>;
  readonly steps: ReadonlyArray<OauthStep>;
  readonly pitfalls: ReadonlyArray<string>;
}

const json = (o: unknown): string => JSON.stringify(o, null, 2);

const COMMON_STEPS = (cfg: {
  authzUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  scopes: string;
  userPayload: Record<string, unknown>;
  tokenPayload: Record<string, unknown>;
}): ReadonlyArray<OauthStep> => [
  {
    id: 'redirect',
    label: 'Authorize redirect',
    kind: 'browser',
    request: `GET ${cfg.authzUrl}?\n  response_type=code&\n  client_id=${cfg.clientId}&\n  redirect_uri=https://app.example.com/auth/callback&\n  scope=${cfg.scopes}&\n  state=xy42&\n  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&\n  code_challenge_method=S256`,
    response: '302 Found · sent to provider',
    urlParams: [
      { key: 'response_type', value: 'code' },
      { key: 'client_id', value: cfg.clientId },
      { key: 'redirect_uri', value: 'https://app.example.com/auth/callback', note: 'must match dashboard exactly' },
      { key: 'scope', value: cfg.scopes },
      { key: 'state', value: 'xy42', note: 'CSRF token' },
      { key: 'code_challenge_method', value: 'S256', note: 'PKCE' },
    ],
    errors: ['invalid_redirect_uri', 'invalid_client'],
  },
  {
    id: 'consent',
    label: 'Consent screen',
    kind: 'provider',
    request: '(provider renders consent UI)',
    response: 'user clicks "Allow"',
    urlParams: [],
    errors: ['access_denied (user clicks deny)', 'consent_required'],
  },
  {
    id: 'callback',
    label: 'Callback w/ code',
    kind: 'browser',
    request: 'GET https://app.example.com/auth/callback?code=AUTH_CODE_4f9k&state=xy42',
    response: '302 Found · server processes',
    urlParams: [
      { key: 'code', value: 'AUTH_CODE_4f9k', note: 'short-lived, single-use' },
      { key: 'state', value: 'xy42', note: 'verify equals stored state' },
    ],
    errors: ['state mismatch (CSRF)', 'code expired'],
  },
  {
    id: 'token-exchange',
    label: 'Exchange code',
    kind: 'your-server',
    request: `POST ${cfg.tokenUrl}\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&\ncode=AUTH_CODE_4f9k&\nclient_id=${cfg.clientId}&\nclient_secret=•••&\nredirect_uri=https://app.example.com/auth/callback&\ncode_verifier=•••`,
    response: json(cfg.tokenPayload),
    urlParams: [
      { key: 'grant_type', value: 'authorization_code' },
      { key: 'code', value: 'AUTH_CODE_4f9k' },
      { key: 'code_verifier', value: '•••', note: 'PKCE pair' },
    ],
    errors: ['invalid_grant', 'invalid_client_secret'],
  },
  {
    id: 'user-info',
    label: 'Fetch user info',
    kind: 'your-server',
    request: `GET ${cfg.userInfoUrl}\nAuthorization: Bearer ${'{{access_token}}'}`,
    response: json(cfg.userPayload),
    urlParams: [],
    errors: ['401 invalid_token', '403 insufficient_scope'],
  },
  {
    id: 'session-set',
    label: 'Set session cookie',
    kind: 'your-server',
    request: 'Set-Cookie: session=eyJ...; HttpOnly; Secure; SameSite=Lax',
    response: '302 Found · redirect to /',
    urlParams: [],
    errors: ['cookie size > 4kb', 'SameSite=None requires Secure'],
  },
  {
    id: 'done',
    label: 'Authenticated',
    kind: 'browser',
    request: 'GET / (with session cookie)',
    response: '200 OK · user landing page',
    urlParams: [],
    errors: [],
  },
];

export const PROVIDERS: ReadonlyArray<ProviderConfig> = [
  {
    id: 'google',
    label: 'Google',
    authzUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'email', 'profile'],
    pitfalls: [
      'redirect_uri must match exactly (incl. trailing slash)',
      'Use offline access for refresh_token',
      'Verify aud and iss in id_token',
    ],
    steps: COMMON_STEPS({
      authzUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
      clientId: 'gcp-1234.apps.googleusercontent.com',
      scopes: 'openid+email+profile',
      tokenPayload: {
        access_token: 'ya29...',
        expires_in: 3599,
        scope: 'openid email profile',
        token_type: 'Bearer',
        id_token: 'eyJhbGc...',
      },
      userPayload: {
        sub: '113458921234',
        email: 'a@example.com',
        email_verified: true,
        name: 'Ada Lovelace',
        picture: 'https://lh3.googleusercontent.com/...',
        locale: 'en',
      },
    }),
  },
  {
    id: 'github',
    label: 'GitHub',
    authzUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    pitfalls: [
      'Default token format is form-encoded; pass Accept: application/json',
      'Email may be empty — fetch /user/emails',
      'PKCE not supported on classic OAuth apps',
    ],
    steps: COMMON_STEPS({
      authzUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      clientId: 'Iv1.a1b2c3d4',
      scopes: 'read:user+user:email',
      tokenPayload: {
        access_token: 'gho_xyz...',
        scope: 'read:user,user:email',
        token_type: 'bearer',
      },
      userPayload: {
        id: 1024,
        login: 'octocat',
        name: 'The Octocat',
        avatar_url: 'https://avatars.githubusercontent.com/u/1024',
        email: null,
      },
    }),
  },
  {
    id: 'apple',
    label: 'Apple',
    authzUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: '(decode id_token)',
    scopes: ['name', 'email'],
    pitfalls: [
      'response_mode=form_post is required',
      'client_secret is a JWT signed with team key (rotates)',
      'name returned ONLY on first auth — persist it',
    ],
    steps: COMMON_STEPS({
      authzUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      userInfoUrl: '(id_token jwt)',
      clientId: 'com.example.signin',
      scopes: 'name+email',
      tokenPayload: {
        access_token: 'a.b.c',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'r.s.t',
        id_token: 'eyJraWQ...',
      },
      userPayload: {
        sub: '001234.abcd',
        email: 'user@privaterelay.appleid.com',
        email_verified: 'true',
        is_private_email: 'true',
      },
    }),
  },
  {
    id: 'naver',
    label: 'Naver',
    authzUrl: 'https://nid.naver.com/oauth2.0/authorize',
    tokenUrl: 'https://nid.naver.com/oauth2.0/token',
    userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
    scopes: ['profile'],
    pitfalls: [
      'state required; reject mismatched',
      'IP allowlist on token endpoint in production',
      'Mobile app must use SDK, not WebView',
    ],
    steps: COMMON_STEPS({
      authzUrl: 'https://nid.naver.com/oauth2.0/authorize',
      tokenUrl: 'https://nid.naver.com/oauth2.0/token',
      userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
      clientId: 'naver_client_id_xyz',
      scopes: 'profile',
      tokenPayload: {
        access_token: 'AAAA...',
        refresh_token: 'BBBB...',
        token_type: 'bearer',
        expires_in: 3600,
      },
      userPayload: {
        resultcode: '00',
        message: 'success',
        response: { id: '32742776', nickname: '홍길동', email: 'a@naver.com' },
      },
    }),
  },
];

export function stepKindTone(k: StepKind): 'static' | 'info' | 'accent' | 'warn' {
  switch (k) {
    case 'browser':
      return 'info';
    case 'authz':
      return 'warn';
    case 'your-server':
      return 'accent';
    case 'provider':
      return 'static';
  }
}
