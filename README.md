# StelInfo (스텔인포)

스텔라이브(StelLive) 팬들을 위한 비공식 서비스예요. 치지직(CHZZK) 계정으로 로그인하면 원하는 스텔라와의 팔로우・구독 기록, 최근 방송, 최신 영상/커버곡을 한눈에 확인할 수 있고, 이 정보를 다른 사람(나눔 주최자 등)에게 위조 방지 인증 카드로 공유할 수 있어요.

> 본 프로젝트는 스텔라이브・치지직・유튜브와 무관한 개인 제작 비공식 서비스입니다.

## 주요 기능

- **치지직 OAuth 로그인** — 치지직 계정으로 로그인해 본인 인증
- **스텔라별 정보 확인** — 선택한 스텔라와의 팔로우 일수 / 구독 개월 수, 최근 방송, 최신 영상・음악 커버(YouTube 연동)
- **공유 인증 카드** — 팔로우・구독 현황을 QR 코드가 포함된 카드 이미지로 내보내기 (`html-to-image`), 서버가 발급한 위조 방지 인증ID 포함
- **인증 확인 페이지** — 나눔 주최자가 인증ID를 붙여넣거나 카메라로 QR을 스캔해서, 원하는 조건(최소 팔로우 일수・구독 개월・특정 스텔라)에 맞는지 한 번에 일괄 확인
- **마이페이지** — 내가 발급한 공유 카드 목록 확인 및 취소(회수)
- **PWA 지원** — 모바일 홈 화면에 앱처럼 추가 가능

## 기술 스택

| | |
|---|---|
| **Frontend** | SvelteKit (Svelte 5, Runes), TypeScript, Vite, `vite-plugin-pwa`, `@sveltejs/adapter-vercel` |
| **Backend** | Node.js, Express 5, TypeScript, `better-sqlite3`, `jsonwebtoken` |
| **공유/QR** | `html-to-image` (카드 이미지 내보내기), `qrcode` (생성), `qr-scanner` (카메라 인식) |
| **외부 API** | CHZZK Open API (OAuth, 팔로우/구독 조회), YouTube Data API v3 |

## 프로젝트 구조

```
stelinfo/
├─ backend/        # Express API 서버
│  └─ src/
│     ├─ routes/    # auth, streamer, share, verify 라우터
│     ├─ db.ts       # SQLite 스키마/초기화
│     ├─ users.ts    # 유저 테이블 접근
│     ├─ shares.ts   # 공유 카드(인증ID) 테이블 접근
│     ├─ chzzkAuth.ts / chzzkProfile.ts / chzzkBroadcast.ts
│     └─ youtube.ts  # 유튜브 최신 영상/음악 커버 조회
└─ frontend/       # SvelteKit 앱
   └─ src/
      ├─ routes/         # /, /select, /stellar/[id], /mypage, /verify
      └─ lib/
         ├─ components/  # InfoDetail, ShareModal, QrScanModal, SideMenu 등
         ├─ state/        # 로그인 상태, API 호출 헬퍼
         └─ data/          # 스텔라 목록/링크
```

## 시작하기

### 사전 준비물

- Node.js 18 이상
- [CHZZK 오픈 API](https://developers.chzzk.naver.com/) 클라이언트 ID/Secret
- [YouTube Data API v3](https://console.cloud.google.com/) 키

### 1. 백엔드

```bash
cd backend
npm install
cp .env.example .env   # 값 채워넣기
npm run dev             # tsc --watch + node --watch 로 자동 재시작
```

`backend/.env`에 필요한 값은 [`.env.example`](backend/.env.example) 참고. `jwt_secret`은 아래처럼 랜덤 값으로 생성하면 돼요.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

로그인 세션(JWT)과 공유 카드 데이터는 `backend/data.sqlite`(SQLite, gitignore 처리됨)에 저장돼요.

### 2. 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env   # 기본값 그대로 로컬 개발에 사용 가능
npm run dev
```

### 3. 접속

`frontend_url`(기본 `http://localhost:5173`)로 접속해서 치지직 로그인부터 진행하면 돼요.

## 환경 변수

### `backend/.env`

| 변수 | 설명 |
|---|---|
| `chzzk_client_id`, `chzzk_client_secret` | CHZZK 오픈 API에서 발급받은 클라이언트 정보 |
| `chzzk_redirect_uri` | OAuth 콜백 주소 (예: `http://localhost:3000/callback`) |
| `frontend_url` | 프론트엔드 주소 (CORS 허용 및 로그인 후 리다이렉트에 사용) |
| `youtube_api_key` | YouTube Data API v3 키 |
| `jwt_secret` | 로그인 세션 서명용 랜덤 문자열 |
| `port` | 백엔드 서버 포트 |
| `subserver_port` | 방송 상태를 폴링하는 별도 [`stellar_status`](https://github.com/JMC50/stellar_status) 서비스 포트 (아래 참고) |

### `frontend/.env`

| 변수 | 설명 |
|---|---|
| `PUBLIC_SERVER_URL` | 백엔드 API 주소 |
| `PUBLIC_LOGIN_URL` | 치지직 로그인 시작 주소 (`{백엔드 주소}/login`) |

## 알아두면 좋은 점

- **방송 상태는 별도 저장소 [`stellar_status`](https://github.com/JMC50/stellar_status)에서 가져와요.** 방송 중 여부/최근 방송 정보(`chzzkBroadcast.ts`)는 각 스텔라의 방송 상태를 주기적으로 폴링하는 이 서브서버를 통해 조회돼요. 이 서비스를 안 띄워도 나머지 기능(팔로우/구독 조회, 공유, 인증 확인 등)은 정상 동작하고, 최근 방송 카드만 비어있게 표시돼요.
- **카메라로 QR 인식**은 브라우저 보안 정책상 HTTPS(또는 localhost)에서만 동작해요.
- 팔로우/구독 정보는 치지직의 공개 프로필 카드 API를 매 조회마다 실시간으로 읽어와 캐싱하는 방식이라, 클라이언트가 값을 조작해서 위조할 수 없어요.

## API 개요

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/login` | CHZZK OAuth 로그인 시작 |
| GET | `/callback` | OAuth 콜백 |
| GET | `/me` | 로그인한 유저 정보 |
| POST | `/logout` | 로그아웃 |
| GET | `/streamer-info/:stellarId` | 스텔라 팔로우/구독/방송 정보 (인증 필요) |
| GET | `/youtube/:stellarId` | 최신 영상/음악 커버 |
| POST | `/streamer-info/:stellarId/share` | 공유 카드 발급/갱신 (인증 필요) |
| GET | `/share/:id` | 인증ID로 공유 카드 조회 |
| GET | `/me/shares` | 내가 발급한 공유 카드 목록 (인증 필요) |
| DELETE | `/me/shares/:id` | 공유 카드 취소 (인증 필요) |
| POST | `/verify/batch` | 인증ID 목록 일괄 조건 확인 (인증 필요) |
