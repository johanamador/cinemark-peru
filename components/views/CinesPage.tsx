"use client"

// React
import { useEffect, useMemo, useState } from "react"

// Next
import Image from "next/image"

// Librerías de terceros
import { Search, MapPin, Phone, Navigation } from "lucide-react"

// Componentes UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

// Tipos
import { TheatreGroup } from "@/types/theatre"

// Utilidades locales
import { getCinemaImage } from "@/lib/get-cinema-image";
import LoadingScreen from "../loading-screen"

export default function CinesPage() {
  const [theatres, setTheatres] = useState<TheatreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("todos")

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

  // Filtros de búsqueda   
  const allCinemas = useMemo(() => {
    return theatres.flatMap(group => group.cinemas)
  }, [theatres])

  const districts = useMemo(() => {
    const unique = new Set(
      allCinemas.map(cine => cine.City.trim()).filter(Boolean)
    )
    return Array.from(unique).sort()
  }, [allCinemas])

  const filteredCines = useMemo(() => {
    return allCinemas.filter(cine => {
      const matchesSearch =
        searchQuery === "" ||
        cine.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cine.Address1.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDistrict =
        selectedDistrict === "todos" || cine.City === selectedDistrict

      return matchesSearch && matchesDistrict
    })
  }, [allCinemas, searchQuery, selectedDistrict])

  // Loading
  if (loading) {
    return <LoadingScreen text="Cargando Cines..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 uppercase">Nuestros Cines</h1>

      {/* Filtros */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-cinemark-dark border-cinemark-gray"
          />
        </div>

        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
          <SelectTrigger className="bg-cinemark-dark border-cinemark-gray">
            <SelectValue placeholder="Filtrar por distrito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los distritos</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <p className="text-gray-300">
          {filteredCines.length === allCinemas.length
            ? `Mostrando todos los ${allCinemas.length} cines`
            : `Mostrando ${filteredCines.length} de ${allCinemas.length} cines`}
        </p>
      </div>

      {filteredCines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCines.map((cine) => (
            <Card
              key={cine.ID}
              className="cinema-card bg-cinemark-dark border-cinemark-gray overflow-hidden transition-transform duration-300 hover:scale-105"
            >
              <div className="relative h-48">
                <Image src={getCinemaImage(cine.Name) || "/placeholder.svg"} alt={cine.Name} fill className="object-cover" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{cine.Name}</h3>

                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-cinemark-red shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{cine.Address1}</p>
                </div>

                {cine.PhoneNumber && <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4 text-cinemark-red" />
                  <p className="text-sm text-gray-300">{cine.PhoneNumber}</p>
                </div>}

                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-cinemark-red hover:bg-red-700 text-white uppercase">Ver Cartelera</Button>
                  <Button
                    variant="outline"
                    className="w-full border-cinemark-gray text-gray-300 hover:bg-cinemark-gray/20 uppercase"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Cómo llegar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400 mb-4">No se encontraron cines que coincidan con tu búsqueda.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {searchQuery && (
              <Button variant="link" className="text-cinemark-red" onClick={() => setSearchQuery("")}>
                Limpiar búsqueda
              </Button>
            )}
            {selectedDistrict !== "todos" && (
              <Button variant="link" className="text-cinemark-red" onClick={() => setSelectedDistrict("todos")}>
                Ver todos los distritos
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
