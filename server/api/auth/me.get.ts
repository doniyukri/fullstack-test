import { requireUser } from "../../utils/session.ts"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")

  return {
    user: await requireUser(event),
  }
})
