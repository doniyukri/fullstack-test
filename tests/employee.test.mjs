import assert from "node:assert/strict"
import test from "node:test"
import { createEmployeeSchema } from "../shared/employee.ts"
import { employeeGrades } from "../server/config/employee-grades.ts"

const schema = createEmployeeSchema(employeeGrades, "2026-11-16")

const validEmployee = {
  name: "Rina Putri",
  position: "Staff Admin",
  gradeId: "1",
  birthDate: "2000-05-12",
  baseSalary: 4_000_000,
  address: "Jalan Melati 10",
  provinceId: "31",
  cityId: "3171",
  districtId: "3171010",
}

test("employee accepts valid data and trims text", () => {
  const result = schema.parse({
    ...validEmployee,
    name: " Rina Putri ",
    address: " Jalan Melati 10 ",
  })

  assert.equal(result.name, "Rina Putri")
  assert.equal(result.address, "Jalan Melati 10")
})

test("salary follows the selected grade range", () => {
  const cases = [
    ["1", 2_999_999, false],
    ["1", 3_000_000, true],
    ["1", 5_000_000, true],
    ["1", 5_000_001, false],
    ["2", 4_999_999, false],
    ["2", 5_000_000, true],
    ["2", 10_000_000, true],
    ["2", 10_000_001, false],
    ["3", 10_000_000, false],
    ["3", 10_000_001, true],
    ["3", 50_000_000, true],
  ]

  for (const [gradeId, baseSalary, expected] of cases) {
    const result = schema.safeParse({
      ...validEmployee,
      gradeId,
      baseSalary,
    })

    assert.equal(
      result.success,
      expected,
      `Grade ${gradeId}, salary ${baseSalary}`,
    )
  }
})

test("employee rejects an unknown grade", () => {
  const result = schema.safeParse({
    ...validEmployee,
    gradeId: "99",
  })

  assert.equal(result.success, false)
})

test("salary must be a safe whole number", () => {
  for (const baseSalary of [
    "4000000",
    4_000_000.5,
    -1,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const result = schema.safeParse({
      ...validEmployee,
      baseSalary,
    })

    assert.equal(result.success, false)
  }
})

test("birth date must exist and cannot be in the future", () => {
  for (const birthDate of [
    "2025-02-29",
    "2000-13-01",
    "2026-11-17",
    "12/05/2000",
  ]) {
    const result = schema.safeParse({
      ...validEmployee,
      birthDate,
    })

    assert.equal(result.success, false)
  }

  assert.equal(
    schema.safeParse({
      ...validEmployee,
      birthDate: "2000-02-29",
    }).success,
    true,
  )
})

test("employee rejects blank required fields", () => {
  for (const field of [
    "name",
    "position",
    "gradeId",
    "address",
    "provinceId",
    "cityId",
    "districtId",
  ]) {
    const result = schema.safeParse({
      ...validEmployee,
      [field]: "   ",
    })

    assert.equal(result.success, false, field)
  }
})

test("employee rejects an owner supplied by the client", () => {
  const result = schema.safeParse({
    ...validEmployee,
    userId: "another-user",
  })

  assert.equal(result.success, false)
})

test("salary validation uses the supplied configuration", () => {
  const customSchema = createEmployeeSchema(
    [
      {
        id: "1",
        name: "Test grade",
        minSalary: 6_000_000,
        maxSalary: 7_000_000,
      },
    ],
    "2026-11-16",
  )

  assert.equal(customSchema.safeParse(validEmployee).success, false)

  assert.equal(
    customSchema.safeParse({
      ...validEmployee,
      baseSalary: 6_000_000,
    }).success,
    true,
  )
})
