import type { EmployeeInput } from "../../shared/employee.ts"
import type { Region } from "../../shared/regions.ts"

interface RegionSource {
  getProvinces: () => Promise<Region[]>
  getCities: (provinceId: string) => Promise<Region[]>
  getDistricts: (cityId: string) => Promise<Region[]>
}

type RegionSelection = Pick<
  EmployeeInput,
  "provinceId" | "cityId" | "districtId"
>

export async function resolveEmployeeRegions(
  selection: RegionSelection,
  source: RegionSource,
) {
  const provinces = await source.getProvinces()
  const province = provinces.find((item) => item.id === selection.provinceId)

  if (!province) {
    return {
      success: false as const,
      field: "provinceId",
      message: "Provinsi tidak tersedia",
    }
  }

  const cities = await source.getCities(province.id)
  const city = cities.find((item) => item.id === selection.cityId)

  if (!city) {
    return {
      success: false as const,
      field: "cityId",
      message: "Kabupaten atau kota tidak sesuai dengan provinsi",
    }
  }

  const districts = await source.getDistricts(city.id)
  const district = districts.find((item) => item.id === selection.districtId)

  if (!district) {
    return {
      success: false as const,
      field: "districtId",
      message: "Kecamatan tidak sesuai dengan kabupaten atau kota",
    }
  }

  return {
    success: true as const,
    province,
    city,
    district,
  }
}
