"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Calendar, Clock, Star, Play } from "lucide-react"
import { ComingSoonMovie } from "@/types/coming-soon"

interface MovieDetailModalProps {
	movie: ComingSoonMovie | null
	isOpen: boolean
	onClose: () => void
}

export default function MovieDetailModal({ movie, isOpen, onClose }: MovieDetailModalProps) {
	if (!movie) return null

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-cinemark-dark border-cinemark-gray">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-white">{movie.SynopsisAlt}</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
					{/* Poster */}
					<div className="relative">
						<Image
							src={movie.GraphicUrl || "/placeholder.svg"}
							alt={movie.Title}
							width={300}
							height={450}
							className="w-full aspect-[2/3] object-cover rounded-lg"
						/>
						<div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">PRÓXIMAMENTE</div>
					</div>

					{/* Información de la película */}
					<div className="space-y-6">
						{/* Información básica */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-cinemark-red" />
								<span className="text-sm text-gray-300">{movie.RunTime} min</span>
							</div>
							<div className="flex items-center gap-2">
								<Star className="h-4 w-4 text-cinemark-gold" />
								<span className="text-sm text-gray-300">{movie.Rating}</span>
							</div>
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-cinemark-red" />
								<span className="text-sm text-gray-300">
									{new Date(movie.OpeningDate).toLocaleDateString("es-PE", {
										day: "2-digit",
										month: "long",
										year: "numeric",
									})}
								</span>

							</div>
						</div>

<div>	</div>
						
						{/* Sinopsis */}
						<div>
							<h3 className="text-lg font-semibold text-white mb-2 uppercase">Sinopsis</h3>
							<p className="text-gray-300 leading-relaxed">{movie.Synopsis}</p>
						</div>

						{/* Trailer */}
						{movie.TrailerUrl && <div>
							<h3 className="text-lg font-semibold text-white mb-3 uppercase">Trailer</h3>
							<div className="relative aspect-video bg-black rounded-lg overflow-hidden">
								<iframe
									src={movie.TrailerUrl}
									title={`${movie.Title} - Trailer`}
									className="w-full h-full"
									allowFullScreen
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								/>
							</div>
						</div>}

						{/* Botones de acción */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4">
							<Button className="bg-cinemark-red hover:bg-red-700 text-white flex-1 uppercase">
								<Calendar className="h-4 w-4 mr-2" />
								Recordar Estreno
							</Button>
							<Button
								variant="outline"
								className="border-cinemark-gold text-cinemark-gold hover:bg-cinemark-gold/10 flex-1 uppercase"
							>
								<Play className="h-4 w-4 mr-2" />
								Ver Trailer Completo
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
