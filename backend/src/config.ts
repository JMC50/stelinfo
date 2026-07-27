const rawChzzkClientId = process.env.chzzk_client_id;
const rawChzzkClientSecret = process.env.chzzk_client_secret;
const rawChzzkRedirectUri = process.env.chzzk_redirect_uri;
const rawJwtSecret = process.env.jwt_secret;

if (!rawChzzkClientId || !rawChzzkClientSecret || !rawChzzkRedirectUri || !rawJwtSecret) {
    console.error("❌ [.env 오류] 필수 환경변수가 설정되지 않았습니다.");
    console.error(`- CHZZK_CLIENT_ID: ${rawChzzkClientId}`);
    console.error(`- CHZZK_CLIENT_SECRET: ${rawChzzkClientSecret}`);
    console.error(`- CHZZK_REDIRECT_URI: ${rawChzzkRedirectUri}`);
    console.error(`- JWT_SECRET: ${rawJwtSecret}`);
    process.exit(1);
}

export const CHZZK_CLIENT_ID = rawChzzkClientId;
export const CHZZK_CLIENT_SECRET = rawChzzkClientSecret;
export const CHZZK_REDIRECT_URI = rawChzzkRedirectUri;
export const JWT_SECRET = rawJwtSecret;
export const FRONTEND_URL = process.env.frontend_url ?? "http://localhost:5173";
export const PORT = process.env.port ?? 3000;
