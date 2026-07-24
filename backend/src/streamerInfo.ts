export interface DummyStreamerInfo {
    follow_date: string | null;
    memberName: string;
    stellar: string;
    oshimark: string;
    oshimark1: string;
    HEX: string;
    stellar_short_name: string;
    subscribe_month: number;
    text_HEX: string;
}

// Placeholder data until real follow/subscribe status is available from
// Chzzk (pending API access — see conversation history). Keyed by the same
// stellar id used in the frontend's stellars.ts.
//
// last_stream_date/last_stream_title/last_stream_url/is_live are NOT here
// anymore — those come from chzzkBroadcast.ts (real data) and get merged in
// on the /streamer-info route.
const dummyStreamerInfo: Record<string, DummyStreamerInfo> = {
    Gangzi: {
        follow_date: null,
        memberName: "강지",
        stellar: "Gangzi",
        oshimark: "",
        oshimark1: "",
        HEX: "#8182B8",
        stellar_short_name: "강지",
        subscribe_month: 0,
        text_HEX: "#FFFFFF"
    },
    Ayatsuno_yuni: {
        follow_date: null,
        memberName: "아야츠노 유니",
        stellar: "Ayatsuno Yuni",
        oshimark: "☪️",
        oshimark1: "🤍",
        HEX: "#7987E0",
        stellar_short_name: "유니",
        subscribe_month: 0,
        text_HEX: "#FFFFFF"
    },
    Sakihane_huya: {
        follow_date: null,
        memberName: "사키하네 후야",
        stellar: "Sakihane Huya",
        oshimark: "💜",
        oshimark1: "🐲",
        HEX: "#8166A1",
        stellar_short_name: "후야",
        subscribe_month: 0,
        text_HEX: "#FFFFFF"
    },
    Shirayuki_hina: {
        follow_date: null,
        memberName: "시라유키 히나",
        stellar: "Shirayuki Hina",
        oshimark: "🎀",
        oshimark1: "❄️",
        HEX: "#F2DCBF",
        stellar_short_name: "히나",
        subscribe_month: 0,
        text_HEX: "#000000"
    },
    Neneko_mashiro: {
        follow_date: null,
        memberName: "네네코 마시로",
        stellar: "Neneko Mashiro",
        oshimark: "🧇",
        oshimark1: "🥛",
        HEX: "#25282A",
        stellar_short_name: "시로",
        subscribe_month: 0,
        text_HEX: "#FFFFFF"
    },
    Akane_lize: {
        follow_date: null,
        memberName: "아카네 리제",
        stellar: "Akane Lize",
        oshimark: "🍷",
        oshimark1: "🩸",
        HEX: "#951C2E",
        stellar_short_name: "리제",
        subscribe_month: 0,
        text_HEX: "#FFFFFF"
    },
    Arahashi_tabi: {
        follow_date: null,
        memberName: "아라하시 타비",
        stellar: "Arahashi Tabi",
        oshimark: "🧭",
        oshimark1: "🌊",
        HEX: "#9ADAFF",
        stellar_short_name: "타비",
        subscribe_month: 0,
        text_HEX: "#000000"
    },
    Tenko_shibuki: {
        follow_date: null,
        memberName: "텐코 시부키",
        stellar: "Tenko Shibuki",
        oshimark: "⛩️",
        oshimark1: "🕹️",
        HEX: "#C2AFE6",
        stellar_short_name: "부키",
        subscribe_month: 0,
        text_HEX: "#000000"
    },
    Aokumo_rin: {
        follow_date: null,
        memberName: "아오쿠모 린",
        stellar: "Aokumo Rin",
        oshimark: "☁️",
        oshimark1: "🛼",
        HEX: "#2B66C0",
        stellar_short_name: "린",
        subscribe_month: 0,
        text_HEX: "#FFFFFF"
    },
    Hanako_nana: {
        follow_date: null,
        memberName: "하나코 나나",
        stellar: "Hanako Nana",
        oshimark: "🔫",
        oshimark1: "🐰",
        HEX: "#DF7685",
        stellar_short_name: "나나",
        subscribe_month: 0,
        text_HEX: "#000000"
    },
    Yuzuha_riko: {
        follow_date: null,
        memberName: "유즈하 리코",
        stellar: "Yuzuha Riko",
        oshimark: "⚔️",
        oshimark1: "🍀",
        HEX: "#A6D0A6",
        stellar_short_name: "리코",
        subscribe_month: 0,
        text_HEX: "#000000"
    }
};

export function getStreamerInfo(stellarId: string): DummyStreamerInfo | null {
    return dummyStreamerInfo[stellarId] ?? null;
}
