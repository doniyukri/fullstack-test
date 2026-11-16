import { regionListSchema } from "#shared/regions"

const sourceUrl =
  "https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/gh-pages/v2"

const fetchRegionList = defineCachedFunction(
  async (path: string) => {
    try {
      const response = await $fetch<unknown>(`${sourceUrl}/${path}`, {
        responseType: "json",
        timeout: 8000,
        retry: 0,
      })

      const parsed = regionListSchema.parse(response)

      return parsed.data
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: "Data wilayah belum tersedia. Coba lagi",
      })
    }
  },
  {
    name: "region-list-v2",
    maxAge: 24 * 60 * 60,
    swr: false,
  },
)

export async function getProvinces() {
  return fetchRegionList("provinces.json")
}

export async function getCities(provinceId: string) {
  const provinces = await getProvinces()

  const provinceExists = provinces.some(
    (province) => province.id === provinceId,
  )

  if (!provinceExists) {
    throw createError({
      statusCode: 400,
      statusMessage: "Provinsi tidak tersedia",
    })
  }

  return fetchRegionList(`regencies/${provinceId}.json`)
}

export async function getDistricts(cityId: string) {
  const provinceId = cityId.slice(0, 2)
  const cities = await getCities(provinceId)

  const cityExists = cities.some((city) => city.id === cityId)

  if (!cityExists) {
    throw createError({
      statusCode: 400,
      statusMessage: "Kabupaten atau kota tidak tersedia",
    })
  }

  return fetchRegionList(`districts/${cityId}.json`)
}