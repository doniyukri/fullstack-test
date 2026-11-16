import { syncActivity } from '../utils/elasticsearch.ts'

export default defineNitroPlugin((app) => {
  const timer = setInterval(() => {
    void syncActivity().catch(() => {
      // Pending activity stays in MongoDB and is retried later
    })
  }, 5000)
  timer.unref()
  app.hooks.hook('close', () => clearInterval(timer))
})
