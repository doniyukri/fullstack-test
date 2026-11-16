import { cityIdSchema } from '#shared/regions'
import { getDistricts } from '../../utils/regions.ts'
import { requireUser } from '../../utils/session.ts'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const query = getQuery(event)
  const parsed = cityIdSchema.safeParse(query.cityId)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pilih kabupaten atau kota yang valid',
    })
  }

  return {
    districts: await getDistricts(parsed.data),
  }
})
