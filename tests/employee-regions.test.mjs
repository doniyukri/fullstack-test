import assert from "node:assert/strict"
import test from "node:test"
import { resolveEmployeeRegions } from "../server/utils/employee-regions.ts"

const source = {
  async getProvinces() {
    return [
      { id: "31", name: "Jakarta" },
      { id: "32", name: "Jawa Barat" },
    ]
  },

  async getCities(provinceId) {
    const cities = {
      31: [{ id: "31.71", name: "Jakarta Pusat" }],
      32: [{ id: "32.73", name: "Kota Bandung" }],
    }

    return cities[provinceId] ?? []
  },

  async getDistricts(cityId) {
    const districts = {
      31.71: [{ id: "31.71.01", name: "Gambir" }],
      32.73: [{ id: "32.73.01", name: "Test district" }],
    }

    return districts[cityId] ?? []
  },
}

const validSelection = {
  provinceId: "31",
  cityId: "31.71",
  districtId: "31.71.01",
}

test("matching regions return trusted names", async () => {
  const result = await resolveEmployeeRegions(validSelection, source)

  assert.equal(result.success, true)
  assert.equal(result.province.name, "Jakarta")
  assert.equal(result.city.name, "Jakarta Pusat")
  assert.equal(result.district.name, "Gambir")
})

test("unknown province stops before loading cities", async () => {
  const result = await resolveEmployeeRegions(
    { ...validSelection, provinceId: "99" },
    {
      ...source,
      async getCities() {
        throw new Error("Cities should not be requested")
      },
    },
  )

  assert.equal(result.success, false)
  assert.equal(result.field, "provinceId")
})

test("city must belong to the selected province", async () => {
  const result = await resolveEmployeeRegions(
    { ...validSelection, cityId: "32.73" },
    source,
  )

  assert.equal(result.success, false)
  assert.equal(result.field, "cityId")
})

test("district must belong to the selected city", async () => {
  const result = await resolveEmployeeRegions(
    { ...validSelection, districtId: "32.73.01" },
    source,
  )

  assert.equal(result.success, false)
  assert.equal(result.field, "districtId")
})
