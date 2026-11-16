import { getProvinces } from "../../utils/regions.ts"
import { requireUser } from "../../utils/session.ts"

export default defineEventHandler(async (event) => {
  await requireUser(event)

  return {
    provinces: await getProvinces(),
  }
})
