export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith("/api/")) {
    return
  }

  setHeader(event, "Cache-Control", "no-store")

  const method = getMethod(event)

  if (method === "GET" || method === "HEAD") {
    return
  }

  const config = useRuntimeConfig()
  const origin = getHeader(event, "origin")

  if (origin !== config.siteOrigin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permintaan tidak diizinkan.",
    })
  }
})
