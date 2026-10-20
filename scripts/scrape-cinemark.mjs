import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import os from "node:os"

const origin = "https://www.cinemark-peru.com"
const root = process.cwd()
const cache = path.join(os.tmpdir(), "cinemark-public-snapshot")
const inspect = process.argv.includes("--inspect")
const refresh = process.argv.includes("--refresh")

function trailerEmbed(value) {
  if (!value) return ""
  try {
    const url = new URL(value)
    if (!["www.youtube.com", "youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(url.hostname)) return ""
    const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1)
    return /^[a-zA-Z0-9_-]{11}$/.test(id || "") ? `https://www.youtube-nocookie.com/embed/${id}` : ""
  } catch { return "" }
}

// Read the public server-rendered data; never execute downloaded JavaScript.
function publicNodes(html) {
  const stream = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)]
    .map(match => JSON.parse(match[1])).join("")
  const nodes = new Map()
  for (const line of stream.split("\n")) {
    // A Flight text record can end immediately before the next JSON record.
    const match = /([0-9a-f]+):([\[{].*)$/.exec(line)
    if (!match) continue
    try { nodes.set(match[1], JSON.parse(match[2])) } catch { /* Non-JSON Flight records. */ }
  }
  function resolve(value, visited = new Set()) {
    if (typeof value === "string" && /^\$[0-9a-f]+$/.test(value) && nodes.has(value.slice(1))) {
      if (visited.has(value)) return null
      return resolve(nodes.get(value.slice(1)), new Set([...visited, value]))
    }
    if (Array.isArray(value)) return value.map(item => resolve(item, visited))
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, visited)]))
    }
    return value === "$undefined" ? undefined : value
  }
  return [...nodes.values()].map(value => resolve(value))
}

function find(values, predicate) {
  for (const value of values) {
    if (!value || typeof value !== "object") continue
    if (predicate(value)) return value
    const found = find(Object.values(value), predicate)
    if (found) return found
  }
}

async function publicPage(route) {
  const file = path.join(cache, `${route.replaceAll(/[^a-z0-9-]/gi, "_") || "home"}.html`)
  if (!refresh) {
    try { return await readFile(file, "utf8") } catch { /* Fetch an uncached public page once. */ }
  }
  const response = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`)
  const html = await response.text()
  await writeFile(file, html)
  return html
}

async function download(url, target) {
  const filename = path.join(root, "public", target)
  try { if ((await readFile(filename)).length) return } catch { /* New asset. */ }
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`Cannot download image ${url}: HTTP ${response.status}`)
  }
  await mkdir(path.dirname(filename), { recursive: true })
  await writeFile(filename, Buffer.from(await response.arrayBuffer()))
}

await mkdir(cache, { recursive: true })
const home = find(publicNodes(await publicPage("/")), value => value.banners && value.movies?.data)
if (!home) throw new Error("Public movie data was not found. Existing fixtures were preserved.")
const unique = [...new Map(home.movies.data.map(movie => [movie.corporateId, movie])).values()]
const selected = [
  ...unique.filter(movie => movie.status === "SHOWING_NOW" && movie.title !== "CINEMARK").slice(0, 12),
  ...unique.filter(movie => movie.status === "PRESALE" && !/world tour|hybe|seventeen|enhypen|ozzy|live|rammstein|tomorrow|after c/i.test(movie.title)).slice(0, 6),
  ...unique.filter(movie => movie.status === "COMING_SOON").slice(0, 8),
]

const summaries = JSON.parse(await readFile(path.join(root, "scripts", "movie-summaries.json"), "utf8").catch(() => "{}"))
const movies = []
for (const movie of selected) {
  const detail = find(publicNodes(await publicPage(movie.link)), value => value.movieDetails)?.movieDetails
  if (!detail) throw new Error(`Movie details missing: ${movie.link}`)
  if (inspect) {
    console.log(JSON.stringify({ slug: movie.slug, synopsis: detail.caption?.slice(0, 420), genres: detail.genres }))
    continue
  }
  if (!summaries[movie.slug]) throw new Error(`Write a concise original summary for ${movie.slug} before saving.`)
  const poster = `/movies/${movie.slug}${path.extname(new URL(movie.src).pathname)}`
  await download(movie.src, poster)
  const duration = /(?:(\d+)h)?\s*(\d+)m/.exec(movie.duration)
  const [day, month, year] = movie.openingDate.split("/")
  movies.push({
    id: movie.corporateId,
    title: movie.title,
    status: movie.status,
    poster,
    runtime: String(Number(duration?.[1] || 0) * 60 + Number(duration?.[2] || 0)),
    rating: movie.rating,
    openingDate: `${year}-${month}-${day}T12:00:00-05:00`,
    genres: detail.genres || [],
    synopsis: summaries[movie.slug],
    trailerUrl: trailerEmbed(detail.trailerUrl),
    formats: movie.formats.map(format => format.shortName),
    languages: [...new Set(movie.languages.map(language => language.shortName === "ESP" ? "DOB" : language.shortName))],
    source: new URL(movie.link, origin).href,
    posterSource: movie.src,
  })
  console.log(`Saved ${movie.title}`)
}
if (inspect) process.exit(0)

const cinemaPage = publicNodes(await publicPage("/cines"))
const cinemas = new Map()
function collect(values) {
  for (const value of values) {
    if (!value || typeof value !== "object") continue
    if (value.id && value.name && value.address && value.googleMapsUrl) cinemas.set(String(value.id), value)
    collect(Object.values(value))
  }
}
collect(cinemaPage)
if (!cinemas.size) throw new Error("No public cinemas found. Existing fixtures were preserved.")
const cityFor = name => {
  for (const city of ["Arequipa", "Huancayo", "Piura", "Trujillo", "Huanuco", "Asia", "Bellavista"]) {
    if (name.toLowerCase().includes(city.toLowerCase())) return city === "Bellavista" ? "Callao" : city === "Huanuco" ? "Huánuco" : city
  }
  return "Lima"
}
const theatres = [...cinemas.values()].map(cinema => ({
  ID: String(cinema.id), Name: cinema.name, PhoneNumber: "", City: cityFor(cinema.name),
  Address1: cinema.address, Address2: "", LoyaltyCode: "",
  Latitude: /!3d(-?[\d.]+)/.exec(cinema.googleMapsUrl)?.[1] || "",
  Longitude: /!2d(-?[\d.]+)/.exec(cinema.googleMapsUrl)?.[1] || "",
  Description: cinema.features, Slug: cinema.slug,
}))
const snapshot = {
  capturedOn: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date()),
  source: origin,
  notes: "Public movie and cinema facts. Original short summaries. Demonstration schedules are generated locally, not scraped or official.",
  movies,
  theatres,
}
await mkdir(path.join(root, "public", "data"), { recursive: true })
await writeFile(path.join(root, "public", "data", "cinemark-snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n")
console.log(`Snapshot saved: ${movies.length} movies, ${theatres.length} cinemas.`)
