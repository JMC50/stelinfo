const rawChzzkClientId = process.env.chzzk_client_id;
const rawChzzkClientSecret = process.env.chzzk_client_secret;
const rawChzzkRedirectUri = process.env.chzzk_redirect_uri;

if (!rawChzzkClientId || !rawChzzkClientSecret || !rawChzzkRedirectUri) {
    console.error("❌ [.env 오류] 치지직 API 관련 환경변수가 설정되지 않았습니다.");
    console.error(`- CHZZK_CLIENT_ID: ${rawChzzkClientId}`);
    console.error(`- CHZZK_CLIENT_SECRET: ${rawChzzkClientSecret}`);
    console.error(`- CHZZK_REDIRECT_URI: ${rawChzzkRedirectUri}`);
    process.exit(1);
}

export const CHZZK_CLIENT_ID = rawChzzkClientId;
export const CHZZK_CLIENT_SECRET = rawChzzkClientSecret;
export const CHZZK_REDIRECT_URI = rawChzzkRedirectUri;
export const FRONTEND_URL = process.env.frontend_url ?? "http://localhost:5173";
export const PORT = process.env.port ?? 3000;
