import assert from "node:assert/strict"
import test from "node:test"
import {
  cityIdSchema,
  districtIdSchema,
  provinceIdSchema,
  regionListSchema,
} from "../shared/regions.ts"

test("province ID uses two digits", () => {
  assert.equal(provinceIdSchema.safeParse("31").success, true)

  for (const value of ["", "3", "317", "../31", ["31"]]) {
    assert.equal(provinceIdSchema.safeParse(value).success, false)
  }
})

test("city ID uses province and city codes", () => {
  assert.equal(cityIdSchema.safeParse("31.71").success, true)

  for (const value of ["3171", "31", "31.71.01", "../31.71"]) {
    assert.equal(cityIdSchema.safeParse(value).success, false)
  }
})

test("district ID uses three code groups", () => {
  assert.equal(districtIdSchema.safeParse("31.71.01").success, true)

  for (const value of ["3171010", "31.71", "31.71.001"]) {
    assert.equal(districtIdSchema.safeParse(value).success, false)
  }
})

test("region response keeps only ID and name", () => {
  const result = regionListSchema.parse({
    data: [
      {
        id: "31.71",
        name: "Kota Administrasi Jakarta Pusat",
        population: 1_000_000,
      },
    ],
    meta: {
      level: 2,
    },
  })

  assert.deepEqual(result, {
    data: [
      {
        id: "31.71",
        name: "Kota Administrasi Jakarta Pusat",
      },
    ],
  })
})

test("region response rejects invalid data", () => {
  const invalidResponses = [
    {},
    { data: "wrong format" },
    { data: [{ id: 31, name: "Jakarta" }] },
    { data: [{ id: "31", name: "" }] },
    { data: [{ id: "../31", name: "Jakarta" }] },
  ]

  for (const response of invalidResponses) {
    assert.equal(regionListSchema.safeParse(response).success, false)
  }
})

test("region response rejects an empty list", () => {
  assert.equal(regionListSchema.safeParse({ data: [] }).success, false)
})
