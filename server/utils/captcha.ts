interface CaptchaResult {
  success: boolean
  hostname?: string
  action?: string
}

const testSecrets = [
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]

export async function verifyCaptcha(token: string): Promise<void> {
  const config = useRuntimeConfig()
  const secret = config.turnstileSecret
  const usesTestSecret = testSecrets.includes(secret)

  if (!secret || (!import.meta.dev && usesTestSecret)) {
    throw createError({
      statusCode: 503,
      statusMessage: "CAPTCHA belum tersedia.",
    })
  }

  let result: CaptchaResult

  try {
    result = await $fetch<CaptchaResult>(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: {
          secret,
          response: token,
        },
        timeout: 8000,
        retry: 0,
      },
    )
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: "CAPTCHA tidak dapat diperiksa. Coba lagi.",
    })
  }

  if (result.success !== true) {
    throw createError({
      statusCode: 400,
      statusMessage: "Verifikasi CAPTCHA gagal. Coba lagi.",
    })
  }

  // Test keys return a fixed hostname and do not include an action.
  if (!usesTestSecret) {
    const expectedHostname = new URL(config.siteOrigin).hostname

    if (result.hostname !== expectedHostname || result.action !== "login") {
      throw createError({
        statusCode: 400,
        statusMessage: "Verifikasi CAPTCHA gagal. Coba lagi.",
      })
    }
  }
}
