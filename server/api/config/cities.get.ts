import { provinceIdSchema } from "#shared/regions"
import { getCities } from "../../utils/regions.ts"
import { requireUser } from "../../utils/session.ts"

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const query = getQuery(event)
  const parsed = provinceIdSchema.safeParse(query.provinceId)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Pilih provinsi yang valid",
    })
  }

  return {
    cities: await getCities(parsed.data),
  }
})
