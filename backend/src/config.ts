const rawChzzkClientId = process.env.chzzk_client_id;
const rawChzzkClientSecret = process.env.chzzk_client_secret;
const rawChzzkRedirectUri = process.env.chzzk_redirect_uri;
const rawJwtSecret = process.env.jwt_secret;
const rawBroadcastWebhookSecret = process.env.broadcast_webhook_secret;
const rawVapidPublicKey = process.env.vapid_public_key;
const rawVapidPrivateKey = process.env.vapid_private_key;
const rawVapidSubject = process.env.vapid_subject;

if (
    !rawChzzkClientId ||
    !rawChzzkClientSecret ||
    !rawChzzkRedirectUri ||
    !rawJwtSecret ||
    !rawBroadcastWebhookSecret ||
    !rawVapidPublicKey ||
    !rawVapidPrivateKey ||
    !rawVapidSubject
) {
    console.error("❌ [.env 오류] 필수 환경변수가 설정되지 않았습니다.");
    console.error(`- CHZZK_CLIENT_ID: ${rawChzzkClientId}`);
    console.error(`- CHZZK_CLIENT_SECRET: ${rawChzzkClientSecret}`);
    console.error(`- CHZZK_REDIRECT_URI: ${rawChzzkRedirectUri}`);
    console.error(`- JWT_SECRET: ${rawJwtSecret}`);
    console.error(`- BROADCAST_WEBHOOK_SECRET: ${rawBroadcastWebhookSecret}`);
    console.error(`- VAPID_PUBLIC_KEY: ${rawVapidPublicKey}`);
    console.error(`- VAPID_PRIVATE_KEY: ${rawVapidPrivateKey}`);
    console.error(`- VAPID_SUBJECT: ${rawVapidSubject}`);
    process.exit(1);
}

export const CHZZK_CLIENT_ID = rawChzzkClientId;
export const CHZZK_CLIENT_SECRET = rawChzzkClientSecret;
export const CHZZK_REDIRECT_URI = rawChzzkRedirectUri;
export const JWT_SECRET = rawJwtSecret;
export const BROADCAST_WEBHOOK_SECRET = rawBroadcastWebhookSecret;
export const VAPID_PUBLIC_KEY = rawVapidPublicKey;
export const VAPID_PRIVATE_KEY = rawVapidPrivateKey;
export const VAPID_SUBJECT = rawVapidSubject;
export const FRONTEND_URL = process.env.frontend_url ?? "http://localhost:5173";
export const PORT = process.env.port ?? 3000;
