"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Info, Phone } from "lucide-react"
import { TheatreGroup, Theatre } from "@/types/theatre"
import { BillboardResponse, BillboardMovie, MovieVersion, Session } from "@/types/billboard"
import LoadingScreen from "../loading-screen"

export default function CarteleraPage() {
  const [theatres, setTheatres] = useState<TheatreGroup[]>([])
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("740")
  const [billboardData, setBillboardData] = useState<BillboardResponse[]>([])
  const [billboardMovies, setBillboardMovies] = useState<BillboardMovie[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState("todos")
  const [selectedLanguage, setSelectedLanguage] = useState("todos")

  const dates = ["hoy", "manana", "miercoles", "jueves", "viernes", "sabado", "domingo"]

  // Fetch cines
  useEffect(() => {
    const fetchTheatres = async () => {
      const res = await fetch("/api/theatre")
      const data = await res.json()
      setTheatres(data)
    }
    fetchTheatres()
  }, [])

  // Fetch billboard por cine
  useEffect(() => {
    const fetchBillboard = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/billboard?cinema_id=${selectedCinemaId}`)
        const data: BillboardResponse[] = await res.json()

        // Almacenar los datos completos
        setBillboardData(data)

        // Extraer las fechas disponibles
        const dates = data.map((item) => item.date)
        setAvailableDates(dates)

        // Seleccionar por defecto el primer día y las películas de ese día
        setSelectedDate(dates[0])
        const moviesOfSelectedDate = data.find((item) => item.date === dates[0])?.movies || []
        setBillboardMovies(moviesOfSelectedDate)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBillboard()
  }, [selectedCinemaId])

  useEffect(() => {
    const selectedData = billboardData.find((item) => item.date === selectedDate)
    setBillboardMovies(selectedData?.movies || [])
  }, [selectedDate, billboardData])

  const selectedCinema: Theatre | undefined = useMemo(() => {
    for (const group of theatres) {
      const match = group.cinemas.find(c => c.ID === selectedCinemaId)
      if (match) return match
    }
    return undefined
  }, [theatres, selectedCinemaId])

  const filteredMovies = useMemo(() => {
    if (!Array.isArray(billboardMovies)) return []

    return billboardMovies.filter((movie) => {
      if (!Array.isArray(movie.movie_versions)) return false

      const allSessions = movie.movie_versions.flatMap((mv) =>
        Array.isArray(mv.sessions) ? mv.sessions : []
      )

      if (!allSessions.length) return false

      const hasValidFormat =
        selectedFormat === "todos" ||
        movie.movie_versions.some((v) => v.title?.includes(selectedFormat))

      const hasValidLanguage =
        selectedLanguage === "todos" ||
        movie.movie_versions.some((v) => v.title?.includes(selectedLanguage))

      return hasValidFormat && hasValidLanguage
    })
  }, [billboardMovies, selectedFormat, selectedLanguage])

  const getHorarios = (versions: MovieVersion[]): string[] => {
    return versions.flatMap((v) =>
      v.sessions.map((s: Session) => s.hour)
    )
  }

  const getFormats = (title: string) => {
    const formats = ["2D", "3D", "XD", "DBOX"];
    return formats.filter((format) => title.includes(format));
  };

  const getLanguages = (title: string) => {
    const languages = ["DOB", "SUB"];
    return languages.filter((language) => title.includes(language));
  };

  const formatTime = (time: string) => {
    const [hour, minutes] = time.split(":");
    let hours = Number(hour);
    const period = hours >= 12 ? "PM" : "AM"; // Determinamos si es AM o PM

    if (hours > 12) {
      hours -= 12; // Convertimos a formato de 12 horas
    }
    if (hours === 0) {
      hours = 12; // 12 AM en lugar de 0
    }

    return `${hours}:${minutes} ${period}`;
  };

  const groupSessionsByFormatAndLanguage = (movieVersions: MovieVersion[]) => {
    const sessionsGrouped: { [key: string]: Session[] } = {}

    movieVersions.forEach((version) => {
      const formats = getFormats(version.title)  // Extrae los formatos
      const languages = getLanguages(version.title)  // Extrae los idiomas

      formats.forEach((format) => {
        languages.forEach((language) => {
          const key = `${format} ${language === "DOB" ? "Doblada" : "Subtitulada"}`

          // Inicializa el grupo si no existe
          if (!sessionsGrouped[key]) {
            sessionsGrouped[key] = []
          }

          // Agrega las sesiones a ese grupo
          version.sessions.forEach((session) => {
            sessionsGrouped[key].push(session)
          })
        })
      })
    })

    return sessionsGrouped
  }

  // Pantalla de carga
  if (loading) {
    return <LoadingScreen text="Cargando Películas..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 uppercase">Cartelera</h1>

      {/* Cine selector */}
      <div className="mb-8">
        <Select value={selectedCinemaId} onValueChange={setSelectedCinemaId}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Selecciona un cine" />
          </SelectTrigger>
          <SelectContent>
            {theatres.flatMap(group =>
              group.cinemas.map((cine) => (
                <SelectItem key={cine.ID} value={cine.ID}>{cine.Name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedCinema && (
        <Card className="mb-8 bg-cinemark-dark border-cinemark-gray">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">{selectedCinema.Name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-cinemark-red shrink-0 mt-0.5" />
                <p className="text-gray-300">{selectedCinema.Address1}</p>
              </div>
              {selectedCinema.PhoneNumber && <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-cinemark-red shrink-0 mt-0.5" />
                <p className="text-gray-300">Tel: {selectedCinema.PhoneNumber}</p>
              </div>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-cinemark-red" />
          <h2 className="text-lg font-semibold uppercase">Selecciona una fecha</h2>
        </div>
        <Tabs value={selectedDate} onValueChange={setSelectedDate} className="w-full">
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-7 h-auto">
            {availableDates.map((date) => (
              <TabsTrigger key={date} value={date} className="py-2 uppercase">
                {new Date(`${date}T12:00:00-05:00`).toLocaleDateString("es-PE", {
                  timeZone: "America/Lima",
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Filtros */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 uppercase">Formato</label>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los formatos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="2D">2D</SelectItem>
              <SelectItem value="3D">3D</SelectItem>
              <SelectItem value="XD">XD</SelectItem>
              <SelectItem value="DBOX">DBOX</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 uppercase">Idioma</label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los idiomas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="DOB">Doblada</SelectItem>
              <SelectItem value="SUB">Subtitulada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-8">
        {filteredMovies.map((movie) => (
          <div key={movie.film_HO_code} className="bg-cinemark-dark border border-cinemark-gray rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
              <div className="relative aspect-[2/3] md:h-full">
                <Image src={movie.graphic_url || "/placeholder.svg"} alt={movie.title} fill className="object-cover" />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{movie.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-sm text-gray-300">{movie.runtime} min</span>
                      <Badge variant="outline" className="text-white border-white">{movie.rating}</Badge>
                      {/* Mostrar los formatos de la movie_versions */}
                      {movie.movie_versions?.map((version) => {
                        const formats = getFormats(version.title); // Extrae los formatos
                        return formats;
                      })
                        .flat() // Aplanamos el array
                        .filter((format, index, self) => self.indexOf(format) === index) // Filtramos duplicados
                        .map((format) => (
                          <Badge key={format} className="bg-cinemark-gold text-black hover:bg-cinemark-gold/80">
                            {format}
                          </Badge>
                        ))}

                      {/* Mostrar los idiomas de la movie_versions */}
                      {movie.movie_versions?.map((version) => {
                        const languages = getLanguages(version.title); // Extrae los idiomas
                        return languages;
                      })
                        .flat() // Aplanamos el array
                        .filter((language, index, self) => self.indexOf(language) === index) // Filtramos duplicados
                        .map((language) => (
                          <Badge key={language} variant="outline" className="border-cinemark-red text-cinemark-red">
                            {language === "DOB" ? "Doblada" : "Subtitulada"}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Horarios disponibles:</h4>
                  <div className="space-y-4">
                    {Object.entries(groupSessionsByFormatAndLanguage(movie.movie_versions)).map(
                      ([key, sessions]) => (
                        <div key={key} className="flex flex-row gap-2 items-center">
                          {/* Mostrar título con el formato y idioma */}
                          <h5 className="w-[90px] text-sm font-semibold text-center">{key}</h5>
                          <div className="flex flex-wrap gap-2">
                            {/* Mostrar los botones con los horarios */}
                            {sessions.map((session) => (
                              <Button
                                key={session.id}
                                variant="outline"
                                className="border-cinemark-gray hover:border-cinemark-red hover:bg-cinemark-red/10"
                              >
                                {formatTime(session.hour)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No se encontraron películas con los filtros seleccionados.</p>
            <Button
              variant="link"
              className="text-cinemark-red mt-2"
              onClick={() => {
                setSelectedFormat("todos")
                setSelectedLanguage("todos")
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
