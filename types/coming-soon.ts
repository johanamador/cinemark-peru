export interface ComingSoonResponse {
	value: ComingSoonMovie[];
}

export interface ComingSoonMovie {
	GraphicUrl?: string;
	Status?: string;
	ID: string;
	ScheduledFilmId: string;
	Title: string;
	Synopsis: string;
	SynopsisAlt: string;
	RunTime: string;
	OpeningDate: string;
	TrailerUrl: string;
	GenreId: string;
	GenreId2: string;
	GenreId3: string | null;
	CorporateFilmId: string;
	Rating: string;
}
