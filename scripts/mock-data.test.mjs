import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import vm from "node:vm"
import test from "node:test"
import ts from "typescript"

const snapshot = JSON.parse(readFileSync("public/data/cinemark-snapshot.json", "utf8"))
const source = readFileSync("lib/mock-cinema.ts", "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const context = {
  exports: {},
  require(name) {
    assert.equal(name, "@/public/data/cinemark-snapshot.json", "Only the local fixture may be loaded")
    return snapshot
  },
  fetch() { throw new Error("Fixtures must work without network access") },
}
vm.runInNewContext(compiled, context)
const { getBillboard, getComingSoon, getTheatres, limaDate } = context.exports

test("all movies have local posters, source attribution and distinct IDs", () => {
  assert.equal(new Set(snapshot.movies.map(movie => movie.id)).size, snapshot.movies.length)
  for (const movie of snapshot.movies) {
    assert.ok(movie.poster.startsWith("/movies/"))
    assert.ok(existsSync(path.join("public", movie.poster)))
    assert.ok(movie.source.startsWith("https://www.cinemark-peru.com/pelicula/"))
    assert.ok(Number(movie.runtime) > 0)
    assert.ok(movie.synopsis && !movie.synopsis.includes("$undefined"))
    if (movie.trailerUrl) assert.match(movie.trailerUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}$/)
  }
})

test("Lima dates handle midnight, year changes and future visits", () => {
  assert.equal(limaDate(new Date("2027-01-01T04:59:59Z")), "2026-12-31")
  assert.equal(limaDate(new Date("2027-01-01T05:00:00Z")), "2027-01-01")
  const days = getBillboard("740", new Date("2030-12-30T04:00:00Z"))
  assert.equal(days.length, 7)
  assert.equal(days[0].date, "2030-12-29")
  assert.equal(days[6].date, "2031-01-04")
  assert.ok(days.every(day => day.movies.length > 0))
})

test("each cinema has valid local schedules limited to its available formats", () => {
  for (const cinema of getTheatres().flatMap(group => group.cinemas)) {
    const days = getBillboard(cinema.ID, new Date("2026-10-19T20:00:00Z"))
    assert.equal(days.length, 7)
    for (const day of days) {
      const ids = new Set()
      for (const movie of day.movies) {
        assert.ok(movie.movie_versions.length > 0)
        for (const version of movie.movie_versions) {
          const format = version.title.split(" ").at(-2)
          assert.ok(cinema.Description.split(" | ").includes(format))
          for (const session of version.sessions) {
            assert.equal(session.day, day.date)
            assert.match(session.showtime, /-05:00$/)
            assert.equal(limaDate(new Date(session.showtime)), day.date)
            assert.ok(session.id.startsWith(cinema.ID + "-"))
            assert.ok(!ids.has(session.id))
            ids.add(session.id)
          }
          const hours = version.sessions.map(session => session.hour).join(",")
          assert.equal(hours, [...version.sessions].sort((a,b)=>a.hour.localeCompare(b.hour)).map(session=>session.hour).join(","))
        }
      }
    }
  }
  assert.equal(getBillboard("unknown"), null)
})

test("presales and upcoming movies remain distinct from the current snapshot", () => {
  const current = new Set(getBillboard("740")[0].movies.map(movie => movie.corporate_film_id))
  const upcoming = getComingSoon().value
  assert.ok(upcoming.some(movie => movie.Status === "PRESALE"))
  assert.ok(upcoming.some(movie => movie.Status === "COMING_SOON"))
  assert.ok(upcoming.every(movie => !current.has(movie.CorporateFilmId)))
  assert.ok(upcoming.every(movie => movie.GraphicUrl && movie.Title))
})

test("API handlers have no dependency on the removed upstream API", () => {
  for (const route of ["billboard", "coming-soon", "theatre"]) {
    const handler = readFileSync(`app/api/${route}/route.ts`, "utf8")
    assert.ok(!handler.includes("fetch("))
    assert.ok(!handler.includes("api.cinemark-peru.com"))
  }
})
