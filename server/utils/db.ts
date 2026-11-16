import { MongoClient } from 'mongodb'

let clientPromise: Promise<MongoClient> | undefined

export async function getMongoClient() {
  const config = useRuntimeConfig()

  if (!config.mongoUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database belum dikonfigurasi.',
    })
  }

  // Reuse the connection while it is still loading
  if (!clientPromise) {
    const client = new MongoClient(config.mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    })

    clientPromise = client.connect().catch((error) => {
      // Allow the next request to connect again
      clientPromise = undefined
      throw error
    })
  }

  return clientPromise
}

export async function getDatabase() {
  const client = await getMongoClient()
  return client.db(useRuntimeConfig().mongoDatabase)
}
