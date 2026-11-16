import { MongoClient } from "mongodb"

let clientPromise: Promise<MongoClient> | undefined

export async function getDatabase() {
  const config = useRuntimeConfig()

  if (!config.mongoUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: "Database belum dikonfigurasi.",
    })
  }

  if (!clientPromise) {
    const client = new MongoClient(config.mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    })

    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined
      throw error
    })
  }

  const client = await clientPromise
  return client.db(config.mongoDatabase)
}
