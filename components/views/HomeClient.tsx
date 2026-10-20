"use client";

// React
import { useState, useEffect, useMemo } from "react";

// Next.js
import Link from "next/link";
import Image from "next/image";

// Librerías de terceros
import { ChevronRight } from "lucide-react";

// Componentes UI
import { Button } from "@/components/ui/button";
import MovieDetailModal from "../movie-detail-modal";

// Tipos
import { BillboardResponse } from "@/types/billboard";
import { ComingSoonMovie, ComingSoonResponse } from "@/types/coming-soon";
import { TheatreGroup } from "@/types/theatre";

// Utilidades locales
import { getCinemaImage } from "@/lib/get-cinema-image";
import LoadingScreen from "../loading-screen";

// Constantes
const movie = {
  title: "Avengers: Doomsday",
  description:
    "Héroes procedentes de distintos universos deben colaborar ante una amenaza que pone en riesgo su existencia.",
  background: "/doomsday/avengers-doomsday-wallpaper.jpg",
  logo: "/doomsday/avengers-doomsday-logo.png",
};

export default function Home() {
  // Datos locales servidos por las rutas de demostración.
  const [billboard, setBillboard] = useState<BillboardResponse[]>([]);
  const [comingSoon, setComingSoon] = useState<ComingSoonMovie[]>([]);
  const [theatres, setTheatres] = useState<TheatreGroup[]>([]);

  // Estados: UI y comportamiento
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCinemaPage, setCurrentCinemaPage] = useState(0);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<ComingSoonMovie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cálculos derivados
  const todayBillboard = billboard.find((entry) => entry.date === today);
  const todayMovies = todayBillboard?.movies ?? [];

  const moviesPerPage = 6;
  const cinemasPerPage = 6;

  const comingSoonFilter = useMemo(() => {
    const seen = new Set<string>();
    return comingSoon.filter((movie) => {
      if (!movie.CorporateFilmId) return true;
      if (seen.has(movie.CorporateFilmId)) return false;
      seen.add(movie.CorporateFilmId);
      return true;
    });
  }, [comingSoon]);

  const totalSlides = Math.ceil(comingSoonFilter.length / moviesPerPage);
  const currentMovies = comingSoonFilter.slice(
    currentSlide * moviesPerPage,
    (currentSlide + 1) * moviesPerPage
  );

  const allCinemas = useMemo(() => {
    return theatres.flatMap((group) => group.cinemas);
  }, [theatres]);

  const totalCinemaPages = Math.ceil(allCinemas.length / cinemasPerPage);
  const paginatedCinemas = useMemo(() => {
    const start = currentCinemaPage * cinemasPerPage;
    return allCinemas.slice(start, start + cinemasPerPage);
  }, [allCinemas, currentCinemaPage]);

  // Efectos
  useEffect(() => {
    setToday(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date()));
  }, []);

  useEffect(() => {
    const fetchBillboard = async () => {
      try {
        const res = await fetch("/api/billboard");
        if (!res.ok) throw new Error("Error al obtener la cartelera");
        const data: BillboardResponse[] = await res.json();
        setBillboard(data);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchBillboard();
  }, []);

  useEffect(() => {
    const fetchComingSoon = async () => {
      try {
        const res = await fetch("/api/coming-soon");
        if (!res.ok) throw new Error("Error al obtener los próximos estrenos");
        const data: ComingSoonResponse = await res.json();
        setComingSoon(data.value);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchComingSoon();
  }, []);

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        const res = await fetch("/api/theatre");
        if (!res.ok) throw new Error("Error al obtener los cines");
        const data: TheatreGroup[] = await res.json();
        setTheatres(data);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchTheatres();
  }, []);

  // Handlers
  const openMovieModal = (movie: ComingSoonMovie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeMovieModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  // Loading
  if (loading) {
    return <LoadingScreen text="Cargando Cinemark..." />
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={movie.background}
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              className="object-cover object-[62%_center] md:object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div
              className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto"
            >
              <Image
                src={movie.logo}
                alt={movie.title}
                width={1193}
                height={670}
                sizes="(max-width: 600px) 80vw, 500px"
                className="mb-4 h-auto max-h-[28vh] w-full max-w-[500px] object-contain object-left"
                priority
              />
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl">{movie.description}</p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-cinemark-red hover:bg-red-700 text-white uppercase">Comprar Entradas</Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 uppercase">
                  Ver Trailer
                </Button>
              </div>
            </div>
          </div>
      </section>

      {/* En Cartelera Section */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase">En Cartelera</h2>
          <Link href="/cartelera" className="text-cinemark-red hover:text-red-400 flex items-center">
            Ver todo <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {todayMovies.map((movie) => (
            <div key={movie.corporate_film_id} className="movie-card group relative rounded-lg overflow-hidden">
              <Image
                src={
                  movie.graphic_url && movie.graphic_url !== ""
                    ? movie.graphic_url
                    : "/placeholder.svg"
                }
                alt={movie.title}
                width={300}
                height={450}
                className="w-full aspect-[2/3] object-cover"
              />
              <div className="movie-overlay absolute inset-0 bg-black/70 opacity-0 transition-opacity flex flex-col justify-end p-4">
                <h3 className="text-lg font-semibold">{movie.title}</h3>
                <p className="text-xs text-gray-300 mb-2">
                  {movie.runtime} min • {movie.rating} • {movie.genre}
                </p>
                <Button size="sm" className="bg-cinemark-red hover:bg-red-700 text-white w-full uppercase">
                  Ver Horarios
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Próximos Estrenos */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto bg-cinemark-dark rounded-lg">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase">Próximos Estrenos</h2>
          <Link
            href="/peliculas?categoria=proximamente"
            className="text-cinemark-red hover:text-red-400 flex items-center"
          >
            Ver todo <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentMovies.map((movie) => (
            <div key={movie.ID} className="flex bg-black/50 rounded-lg overflow-hidden" onClick={() => openMovieModal(movie)}>
              <Image
                src={
                  movie.GraphicUrl || "/placeholder.svg"
                }
                alt={movie.SynopsisAlt}
                width={150}
                height={200}
                className="w-1/3 object-cover"
              />
              <div className="p-4 flex flex-col justify-between w-2/3">
                <div>
                  <h3 className="text-lg font-semibold">{movie.SynopsisAlt}</h3>
                  <p className="text-xs text-gray-300 mb-2">
                    Estreno: {new Date(movie.OpeningDate).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-300 line-clamp-2">{movie.Synopsis}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-cinemark-red text-cinemark-red hover:bg-cinemark-red/10 uppercase"
                  onClick={(e) => {
                    e.stopPropagation()
                    openMovieModal(movie)
                  }}
                >
                  VER DETALLES
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? "bg-cinemark-red" : "bg-white/50"
                }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ver grupo ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Nuestros Cines */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase">Nuestros Cines</h2>
          <Link href="/cines" className="text-cinemark-red hover:text-red-400 flex items-center">
            Ver todo <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCinemas.map((cinema) => {
            const imageUrl = getCinemaImage(cinema.Name);
            return (
              <div
                key={cinema.ID}
                className="cinema-card rounded-lg overflow-hidden border border-cinemark-gray bg-cinemark-dark transition-transform duration-300 hover:scale-[1.02]"
              >
                {imageUrl ? (
                  <div className="w-full h-48 relative">
                    <Image
                      src={imageUrl}
                      alt={`Imagen de ${cinema.Name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-white text-lg font-bold">
                    {cinema.Name}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{cinema.Name}</h3>
                  <p className="text-sm text-gray-300 mb-2">{cinema.Address1 || "Dirección no disponible"}</p>
                  <Button className="w-full bg-cinemark-red hover:bg-red-700 text-white uppercase">
                    Ver Cartelera
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalCinemaPages }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${currentCinemaPage === index ? "bg-cinemark-red" : "bg-white/50"}`}
              onClick={() => setCurrentCinemaPage(index)}
              aria-label={`Ver grupo de cines ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Modal de detalles de película */}
      <MovieDetailModal movie={selectedMovie} isOpen={isModalOpen} onClose={closeMovieModal} />
    </div>
  )
}
