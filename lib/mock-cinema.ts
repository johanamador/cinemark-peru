import snapshot from "@/public/data/cinemark-snapshot.json"
import type { BillboardMovie, BillboardResponse, MovieVersion } from "@/types/billboard"
import type { ComingSoonResponse } from "@/types/coming-soon"
import type { TheatreGroup } from "@/types/theatre"

export function limaDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(now)
}

export function getTheatres(): TheatreGroup[] {
  const groups = new Map<string, TheatreGroup>()
  for (const theatre of snapshot.theatres) {
    if (!groups.has(theatre.City)) groups.set(theatre.City, { city: theatre.City, cinemas: [] })
    groups.get(theatre.City)!.cinemas.push(theatre)
  }
  return [...groups.values()]
}

// Schedules, seats and cinema assignments are fictional. Refresh the seven-day
// window per request so the portfolio snapshot keeps working in the future.
export function getBillboard(cinemaId = "740", now = new Date()): BillboardResponse[] | null {
  const cinema = snapshot.theatres.find(theatre => theatre.ID === cinemaId)
  if (!cinema) return null
  const start = new Date(`${limaDate(now)}T12:00:00-05:00`)
  const movies = snapshot.movies.filter(movie => movie.status === "SHOWING_NOW")
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const day = new Date(start)
    day.setUTCDate(day.getUTCDate() + dayIndex)
    const date = limaDate(day)
    return {
      date,
      movies: movies.map((movie, movieIndex): BillboardMovie => {
        const formats = movie.formats.filter(format =>
          ["2D", "3D", "XD", "DBOX"].includes(format) && cinema.Description.split(" | ").includes(format)
        )
        const versions: MovieVersion[] = formats.flatMap(format => movie.languages.map(language => {
          const id = `${cinemaId}-${movie.id}-${format}-${language}`
          return {
            id, film_HOPK: id, film_HO_code: movie.id, title: `${movie.title} ${format} ${language}`,
            sessions: [0, 1].map(slot => {
              const hour = `${String(13 + ((movieIndex + slot * 4 + Number(cinemaId) % 3) % 9)).padStart(2, "0")}:30:00`
              return {
                id: `${id}-${date}-${slot}`, showtime: `${date}T${hour}-05:00`,
                day: date, hour, seats_available: 40 + ((movieIndex * 7 + slot * 11 + dayIndex) % 80),
              }
            }).sort((a, b) => a.hour.localeCompare(b.hour)),
          }
        }))
        return {
          title: movie.title, trailer_url: movie.trailerUrl, graphic_url: movie.poster,
          runtime: movie.runtime, rating: movie.rating, film_HO_code: movie.id,
          corporate_film_id: movie.id, synopsis: movie.synopsis, synopsis_alt: movie.title,
          opening_date: movie.openingDate, genre: movie.genres[0] || "",
          genre2: movie.genres[1] || null, genre3: movie.genres[2] || null,
          cast: [], movie_versions: versions, status: movie.status,
        }
      }).filter(movie => movie.movie_versions.length > 0),
    }
  })
}

export function getComingSoon(): ComingSoonResponse {
  return {
    value: snapshot.movies.filter(movie => movie.status !== "SHOWING_NOW").map(movie => ({
      ID: movie.id, ScheduledFilmId: movie.id, Title: movie.title,
      Synopsis: movie.synopsis, SynopsisAlt: movie.title, RunTime: movie.runtime,
      OpeningDate: movie.openingDate, TrailerUrl: movie.trailerUrl,
      GenreId: movie.genres[0] || "", GenreId2: movie.genres[1] || "",
      GenreId3: movie.genres[2] || null, CorporateFilmId: movie.id, Rating: movie.rating,
      GraphicUrl: movie.poster, Status: movie.status,
    })),
  }
}
