export default defineNuxtRouteMiddleware(async (to) => {
  // The index page already redirects to /login
  if (to.path === '/') {
    return
  }

  const requestFetch = useRequestFetch()
  let signedIn = false
  let sessionExpired = false

  try {
    await requestFetch('/api/auth/me', {
      retry: 0,

      onResponseError({ response }) {
        sessionExpired = response.status === 401
      },
    })

    signedIn = true
  } catch {
    if (!sessionExpired) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Tidak dapat memeriksa sesi. Coba lagi.',
      })
    }
  }

  if (!signedIn && to.path !== '/login') {
    return navigateTo('/login', { replace: true })
  }

  if (signedIn && to.path === '/login') {
    return navigateTo('/home', { replace: true })
  }
})
