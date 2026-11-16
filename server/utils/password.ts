import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const scryptOptions = {
  N: 32768,
  r: 8,
  p: 3,
  maxmem: 64 * 1024 * 1024,
}

const dummyHash = "scrypt-v1:" + "0".repeat(32) + ":" + "0".repeat(128)

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, key) => {
      if (error) {
        reject(error)
        return
      }

      resolve(key)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const key = await deriveKey(password, salt)

  return `scrypt-v1:${salt}:${key.toString("hex")}`
}

export async function verifyPassword(
  password: string,
  storedHash?: string,
): Promise<boolean> {
  const parts = (storedHash || dummyHash).split(":")

  if (parts.length !== 3) {
    return false
  }

  const [version, salt, expectedHex] = parts

  if (
    version !== "scrypt-v1" ||
    !salt ||
    !expectedHex ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(expectedHex)
  ) {
    return false
  }

  const actual = await deriveKey(password, salt)
  const expected = Buffer.from(expectedHex, "hex")

  return timingSafeEqual(actual, expected) && Boolean(storedHash)
}
