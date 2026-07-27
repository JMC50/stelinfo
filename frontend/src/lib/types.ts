export interface ChzzkUser {
	channelId: string;
	channelName: string;
	xId: string | null;
}

export interface StellarLinks {
	chzzk: string;
	x: string;
	youtube: string;
	cafe: string;
	instagram?: string;
}

export interface StellarProfile {
	id: string;
	image: string;
	korName: string;
	engName: string;
	shortName: string;
	color: string;
	links: StellarLinks;
}

export interface YoutubeVideoSummary {
	id: string;
	title: string;
	url: string;
	thumbnail: string | null;
	publishedAt: string;
}

export interface StellarYoutubeSummary {
	latestVideo: YoutubeVideoSummary | null;
	latestMusicVideo: YoutubeVideoSummary | null;
}

export interface ShareRecord {
	id: string;
	stellarId: string;
	memberName: string;
	claimedHandle: string;
	followDate: string | null;
	subscribeMonth: number;
	createdAt: string;
	updatedAt: string;
}

export type VerifyResult =
	| { id: string; found: false }
	| {
			id: string;
			found: true;
			stellarId: string;
			memberName: string;
			claimedHandle: string;
			channelName: string;
			followDays: number;
			subscribeMonth: number;
			stellarMismatch: boolean;
			meetsCondition: boolean;
	  };

export interface StreamerInfo {
	follow_date: string | null;
	memberName: string;
	stellar: string;
	last_stream_date: string;
	last_stream_title: string;
	last_stream_url: string;
	is_live: boolean;
	oshimark: string;
	oshimark1: string;
	HEX: string;
	stellar_short_name: string;
	subscribe_month: number;
	text_HEX: string;
}
