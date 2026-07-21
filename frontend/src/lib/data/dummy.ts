import type { StreamerInfo } from '$lib/types';

// 실제 치지직 API 연동 전, 데모용으로 미리 정의한 더미 응답 데이터.
const dummyStreamerInfo: Record<string, StreamerInfo> = {
	Ayatsuno_yuni: {
		channelname: '치지직 유저',
		follow_date: '2024-11-02',
		memberName: '아야츠노 유니',
		stellar: 'Ayatsuno Yuni',
		last_stream_date: '2026-07-20',
		last_stream_title: '휴가전 여러븐니랑 ><',
		oshimark: '☪️',
		oshimark1: '🤍',
		HEX: '#7987E0',
		stellar_short_name: '유니',
		subscribe_month: 8,
		text_HEX: '#FFFFFF'
	},
	Sakihane_huya: {
		channelname: '치지직 유저',
		follow_date: '2025-03-14',
		memberName: '사키하네 후야',
		stellar: 'Sakihane Huya',
		last_stream_date: '2026-07-20',
		last_stream_title: '명일방주 : 엔드필드, [심연으로] 업데이트 스토리!',
		oshimark: '💜',
		oshimark1: '🐲',
		HEX: '#8166A1',
		stellar_short_name: '후야',
		subscribe_month: 0,
		text_HEX: '#FFFFFF'
	},
	Shirayuki_hina: {
		channelname: '치지직 유저',
		follow_date: '2023-12-25',
		memberName: '시라유키 히나',
		stellar: 'Shirayuki Hina',
		last_stream_date: '2026-07-21',
		last_stream_title: '푸키몬 소원의 별 하는 법 아ㄴ시는 분',
		oshimark: '🎀',
		oshimark1: '❄️',
		HEX: '#F2DCBF',
		stellar_short_name: '히나',
		subscribe_month: 24,
		text_HEX: '#000000'
	},
	Neneko_mashiro: {
		channelname: '치지직 유저',
		follow_date: null,
		memberName: '네네코 마시로',
		stellar: 'Neneko Mashiro',
		last_stream_date: '2026-07-20',
		last_stream_title: '아가',
		oshimark: '🧇',
		oshimark1: '🥛',
		HEX: '#25282A',
		stellar_short_name: '시로',
		subscribe_month: 0,
		text_HEX: '#FFFFFF'
	},
	Akane_lize: {
		channelname: '치지직 유저',
		follow_date: '2024-06-01',
		memberName: '아카네 리제',
		stellar: 'Akane Lize',
		last_stream_date: '2026-07-20',
		last_stream_title: '정신병원 운영중입니다. 미찐멘헤라펠과 함께하는 팰월드',
		oshimark: '🍷',
		oshimark1: '🩸',
		HEX: '#951C2E',
		stellar_short_name: '리제',
		subscribe_month: 15,
		text_HEX: '#FFFFFF'
	},
	Arahashi_tabi: {
		channelname: '치지직 유저',
		follow_date: '2025-01-19',
		memberName: '아라하시 타비',
		stellar: 'Arahashi Tabi',
		last_stream_date: '2026-07-19',
		last_stream_title: '띵조 콘서트 보기 ! 크크 가자잇 ! (❁´◡`❁)',
		oshimark: '🧭',
		oshimark1: '🌊',
		HEX: '#9ADAFF',
		stellar_short_name: '타비',
		subscribe_month: 11,
		text_HEX: '#000000'
	},
	Tenko_shibuki: {
		channelname: '치지직 유저',
		follow_date: '2025-05-22',
		memberName: '텐코 시부키',
		stellar: 'Tenko Shibuki',
		last_stream_date: '2026-07-20',
		last_stream_title: '간호사언니가 빵댕이때렫다',
		oshimark: '⛩️',
		oshimark1: '🕹️',
		HEX: '#C2AFE6',
		stellar_short_name: '부키',
		subscribe_month: 3,
		text_HEX: '#000000'
	},
	Aokumo_rin: {
		channelname: '치지직 유저',
		follow_date: '2024-02-08',
		memberName: '아오쿠모 린',
		stellar: 'Aokumo Rin',
		last_stream_date: '2026-07-20',
		last_stream_title: '촌장님 저 보고싶었죠~',
		oshimark: '☁️',
		oshimark1: '🛼',
		HEX: '#2B66C0',
		stellar_short_name: '린',
		subscribe_month: 19,
		text_HEX: '#FFFFFF'
	},
	Hanako_nana: {
		channelname: '치지직 유저',
		follow_date: '2025-07-01',
		memberName: '하나코 나나',
		stellar: 'Hanako Nana',
		last_stream_date: '2026-07-20',
		last_stream_title: '므냥무냥모냥믜냥',
		oshimark: '🔫',
		oshimark1: '🐰',
		HEX: '#DF7685',
		stellar_short_name: '나나',
		subscribe_month: 1,
		text_HEX: '#000000'
	},
	Yuzuha_riko: {
		channelname: '치지직 유저',
		follow_date: '2024-09-30',
		memberName: '유즈하 리코',
		stellar: 'Yuzuha Riko',
		last_stream_date: '2026-07-20',
		last_stream_title: '오늘은 끝장내자, 세계수든 전설설계도든',
		oshimark: '⚔️',
		oshimark1: '🍀',
		HEX: '#A6D0A6',
		stellar_short_name: '리코',
		subscribe_month: 6,
		text_HEX: '#000000'
	}
};

const FAKE_LATENCY_MS = 550;

export function fetchStreamerInfo(id: string): Promise<StreamerInfo> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const info = dummyStreamerInfo[id];
			if (info) {
				resolve(info);
			} else {
				reject(new Error(`no dummy data for id: ${id}`));
			}
		}, FAKE_LATENCY_MS);
	});
}
