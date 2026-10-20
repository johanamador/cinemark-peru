"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { BillboardResponse, BillboardMovie } from "@/types/billboard"
import { ComingSoonMovie } from "@/types/coming-soon"
import LoadingScreen from "../loading-screen"

// Función auxiliar reutilizable
function filterMovies(movies: (BillboardMovie | ComingSoonMovie)[], query: string): (BillboardMovie | ComingSoonMovie)[] {
  if (!query) return movies
  return movies.filter((movie) => {
    const title = "title" in movie ? movie.title : movie.Title
    const genre = "genre" in movie
      ? [movie.genre, movie.genre2, movie.genre3].filter(Boolean).join(" ")
      : [movie.GenreId, movie.GenreId2, movie.GenreId3].filter(Boolean).join(" ")
    return (
      title.toLowerCase().includes(query.toLowerCase()) ||
      genre.toLowerCase().includes(query.toLowerCase())
    )
  })
}

export default function PeliculasPage() {
  // Estado
  const [billboard, setBillboard] = useState<BillboardMovie[]>([])
  const [comingSoon, setComingSoon] = useState<ComingSoonMovie[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fecha base
  const hoy = useMemo(() => new Date(), [])

  // Fetch datos desde API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Billboard
        const resBillboard = await fetch("/api/billboard")
        if (!resBillboard.ok) throw new Error("Error al obtener la cartelera")
        const data: BillboardResponse[] = await resBillboard.json()
        const allMovies = data.flatMap((b) => b.movies)

        // Deduplicar por film_HO_code
        const uniqueMap = new Map<string, BillboardMovie>()
        for (const movie of allMovies) {
          if (!uniqueMap.has(movie.film_HO_code)) {
            uniqueMap.set(movie.film_HO_code, movie)
          }
        }
        setBillboard(Array.from(uniqueMap.values()))

        // Coming soon
        const resSoon = await fetch("/api/coming-soon")
        if (!resSoon.ok) throw new Error("Error al obtener los próximos estrenos")
        const coming = await resSoon.json()
        setComingSoon(coming.value)
      } catch (err: any) {
        setError(err.message || "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar duplicados de coming soon
  const comingSoonFilter = useMemo(() => {
    const seen = new Set<string>()
    return comingSoon.filter((movie) => {
      if (!movie.CorporateFilmId) return true
      if (seen.has(movie.CorporateFilmId)) return false
      seen.add(movie.CorporateFilmId)
      return true
    })
  }, [comingSoon])

  const billboardIds = useMemo(() => new Set(billboard.map((m) => m.corporate_film_id)), [billboard])

  // Clasificación de películas
  const billboardPreventa = useMemo(() => (
    billboard.filter((m) => m.status === "PRESALE" || (!m.status && new Date(m.opening_date) > hoy))
  ), [billboard, hoy])

  const billboardCartelera = useMemo(() => {
    const estrenoReciente = (fecha: string) => {
      const diff = (hoy.getTime() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 7 && diff >= 0
    }
    return billboard
      .filter((m) => m.status === "SHOWING_NOW" || (!m.status && new Date(m.opening_date) <= hoy))
      .sort((a, b) => {
        const aRecent = estrenoReciente(a.opening_date)
        const bRecent = estrenoReciente(b.opening_date)
        return Number(bRecent) - Number(aRecent)
      })
  }, [billboard, hoy])

  const preventa = useMemo(() => {
    return comingSoonFilter.filter((movie) => {
      const estreno = new Date(movie.OpeningDate)
      const diasParaEstreno = (estreno.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      return (movie.Status === "PRESALE" || (!movie.Status && diasParaEstreno >= 0 && diasParaEstreno <= 7)) && !billboardIds.has(movie.CorporateFilmId)
    })
  }, [comingSoonFilter, billboardIds, hoy])

  const proximamente = useMemo(() => {
    return comingSoonFilter.filter(
      (movie) =>
        !billboardIds.has(movie.CorporateFilmId) &&
        !preventa.some((p) => p.CorporateFilmId === movie.CorporateFilmId)
    )
  }, [comingSoonFilter, billboardIds, preventa])

  // Filtrar según búsqueda
  const filteredCartelera = filterMovies(billboardCartelera, searchQuery)
  const filteredPreventa = filterMovies([...billboardPreventa, ...preventa], searchQuery)
  const filteredProximamente = filterMovies(proximamente, searchQuery)

  // Pantalla de carga
  if (loading) {
    return <LoadingScreen text="Cargando Películas..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 uppercase">Películas</h1>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar películas por título o género..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-cinemark-dark border-cinemark-gray"
        />
      </div>

      <Tabs defaultValue="cartelera" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-8">
          <TabsTrigger value="cartelera" className="uppercase">En Cartelera</TabsTrigger>
          <TabsTrigger value="preventa" className="uppercase">Preventa</TabsTrigger>
          <TabsTrigger value="proximamente" className="uppercase">Próximamente</TabsTrigger>
        </TabsList>

        <TabsContent value="cartelera">
          <PeliculasGrid peliculas={filteredCartelera} tipo="cartelera" />
        </TabsContent>
        <TabsContent value="preventa">
          <PeliculasGrid peliculas={filteredPreventa} tipo="preventa" />
        </TabsContent>
        <TabsContent value="proximamente">
          <PeliculasGrid peliculas={filteredProximamente} tipo="proximamente" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PeliculasGrid({ peliculas, tipo }: { peliculas: (BillboardMovie | ComingSoonMovie)[]; tipo: string }) {
  if (!peliculas.length) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-400">No se encontraron películas que coincidan con tu búsqueda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {peliculas.map((movie) => {
        const isBillboard = "title" in movie
        const id = isBillboard ? movie.film_HO_code : movie.CorporateFilmId
        const titulo = isBillboard ? movie.title : movie.Title
        const imagen = (isBillboard ? movie.graphic_url : movie.GraphicUrl) || "/placeholder.svg"
        const clasificacion = isBillboard ? movie.rating : movie.Rating
        const duracion = isBillboard ? movie.runtime : movie.RunTime
        const fechaEstreno = isBillboard ? movie.opening_date : movie.OpeningDate
        const genero = isBillboard ? movie.genre : movie.GenreId
        const hoy = new Date();
        const estrenoReciente = isBillboard && (() => {
          const estreno = new Date(movie.opening_date)
          const diff = (hoy.getTime() - estreno.getTime()) / (1000 * 60 * 60 * 24)
          return diff <= 7 && diff >= 0
        })()
        return (
          <div key={id} className="movie-card group relative rounded-lg overflow-hidden">
            {tipo === "preventa" && (
              <div className="absolute top-0 right-0 z-10 bg-cinemark-red text-white text-xs font-bold px-2 py-1">
                PREVENTA
              </div>
            )}
            {tipo === "cartelera" && estrenoReciente && (
              <div className="absolute top-0 right-0 z-10 bg-cinemark-gold text-black text-xs font-bold px-2 py-1">
                ESTRENO
              </div>
            )}
            <Image
              src={imagen}
              alt={titulo}
              width={300}
              height={450}
              className="w-full aspect-[2/3] object-cover"
            />
            <div className="movie-overlay absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <h3 className="text-lg font-semibold line-clamp-2">{titulo}</h3>
              <div className="flex flex-wrap gap-1 my-1">
                {isBillboard &&
                  [movie.genre, movie.genre2, movie.genre3]
                    .filter((g): g is string => g !== null && g !== undefined)
                    .map((genero, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs border-cinemark-gold text-cinemark-gold"
                      >
                        {genero}
                      </Badge>
                    ))}
              </div>
              <p className="text-xs text-gray-300 mb-2">
                {tipo === "preventa" || tipo === "proximamente"
                  ? `Estreno: ${new Date(fechaEstreno).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })} • ${clasificacion}`
                  : `${duracion} min • ${clasificacion}`}
              </p>
              <Button
                size="sm"
                className={
                  tipo === "proximamente"
                    ? "border-cinemark-red text-cinemark-white hover:bg-cinemark-red/10 w-full uppercase"
                    : "bg-cinemark-red hover:bg-red-700 text-white w-full uppercase"
                }
              >
                {tipo === "proximamente" ? "Recordar Estreno" : tipo === "preventa" ? "Comprar Preventa" : "Ver Horarios"}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
