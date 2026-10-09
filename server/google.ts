/**
 * Connexion avec Google (OAuth 2.0, flux « code d'autorisation » côté serveur).
 * Le secret client reste dans .env ; seul un e-mail vérifié par Google est accepté.
 */
const env = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  authUrl: process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
  userinfoUrl: process.env.GOOGLE_USERINFO_URL || 'https://openidconnect.googleapis.com/v1/userinfo',
});

export const isGoogleConfigured = (): boolean => {
  const e = env();
  return !!e.clientId && !!e.clientSecret;
};

export const buildAuthUrl = (redirectUri: string, state: string): string => {
  const e = env();
  const params = new URLSearchParams({
    client_id: e.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${e.authUrl}?${params.toString()}`;
};

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName: string;
  familyName: string;
  picture?: string;
}

export const fetchGoogleProfile = async (code: string, redirectUri: string): Promise<GoogleProfile> => {
  const e = env();
  const tokenRes = await fetch(e.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: e.clientId,
      client_secret: e.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const token: any = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !token?.access_token) {
    console.error('[Google] Échange du code refusé :', tokenRes.status, token?.error, token?.error_description);
    throw new Error('Échange du code Google refusé.');
  }
  const infoRes = await fetch(e.userinfoUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
  const info: any = await infoRes.json().catch(() => null);
  if (!infoRes.ok || !info?.sub || !info?.email) throw new Error('Profil Google illisible.');
  return {
    sub: String(info.sub),
    email: String(info.email).toLowerCase(),
    emailVerified: info.email_verified === true || info.email_verified === 'true',
    givenName: String(info.given_name || ''),
    familyName: String(info.family_name || ''),
    picture: typeof info.picture === 'string' ? info.picture : undefined,
  };
};
