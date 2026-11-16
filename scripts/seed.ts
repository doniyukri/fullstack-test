import { MongoClient } from "mongodb"
import { credentialsSchema } from "../shared/credentials.ts"
import { hashPassword } from "../server/utils/password.ts"
import type { UserRecord } from "../server/types/user.ts"

async function seedUser() {
  const mongoUrl = process.env.NUXT_MONGO_URL
  const databaseName = process.env.NUXT_MONGO_DATABASE

  if (!mongoUrl || !databaseName) {
    console.error("Set NUXT_MONGO_URL and NUXT_MONGO_DATABASE.")
    process.exitCode = 1
    return
  }

  const parsed = credentialsSchema.safeParse({
    username: process.env.SEED_USERNAME,
    password: process.env.SEED_PASSWORD,
  })

  if (!parsed.success) {
    console.error("Check SEED_USERNAME and SEED_PASSWORD:")

    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`)
    }

    process.exitCode = 1
    return
  }

  const credentials = parsed.data
  const client = new MongoClient(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
  })

  try {
    await client.connect()

    const db = client.db(databaseName)
    const users = db.collection<UserRecord>("users")

    await users.createIndex({ username: 1 }, { unique: true })

    for (const collectionName of ["sessions", "limits"]) {
      await db
        .collection(collectionName)
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    }

    await db.collection("employees").createIndex({
      userId: 1,
      createdAt: -1,
      _id: -1,
    })

    const passwordHash = await hashPassword(credentials.password)

    const result = await users.updateOne(
      { username: credentials.username },
      {
        $setOnInsert: {
          username: credentials.username,
          passwordHash,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    if (result.upsertedCount === 1) {
      console.log(`Created user: ${credentials.username}`)
    } else {
      console.log("User already exists. Password was not changed.")
    }
  } finally {
    await client.close()
  }
}

seedUser().catch(() => {
  console.error(
    "Could not seed the user. Check MongoDB and the connection settings.",
  )
  process.exitCode = 1
})
