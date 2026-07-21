export interface StellarProfile {
	id: string;
	image: string;
	korName: string;
	engName: string;
	shortName: string;
	color: string;
}

export interface StreamerInfo {
	channelname: string;
	follow_date: string | null;
	memberName: string;
	stellar: string;
	last_stream_date: string;
	last_stream_title: string;
	oshimark: string;
	oshimark1: string;
	HEX: string;
	stellar_short_name: string;
	subscribe_month: number;
	text_HEX: string;
}
