export interface BillboardResponse {
	date: string;
	movies: BillboardMovie[];
}

export interface BillboardMovie {
	status?: string;
	title: string;
	trailer_url: string;
	graphic_url: string;
	runtime: string;
	rating: string;
	film_HO_code: string;
	corporate_film_id: string;
	synopsis: string;
	synopsis_alt: string;
	opening_date: string;
	genre: string;
	genre2?: string | null;
	genre3?: string | null;
	cast: CastMember[];
	movie_versions: MovieVersion[];
}

export interface CastMember {
	ID: string;
	FirstName: string;
	LastName: string;
	PersonType: "Actor" | "Director" | string;
}

export interface MovieVersion {
	film_HOPK: string;
	title: string;
	film_HO_code: string;
	id: string;
	sessions: Session[];
}

export interface Session {
	id: string;
	showtime: string;
	day: string;
	hour: string;
	seats_available: number;
}
