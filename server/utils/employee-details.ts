import { ObjectId } from "mongodb"
import type { Collection } from "mongodb"
import type { EmployeeRecord } from "../types/employee.ts"

export async function getEmployeeDetails(
  collection: Collection<EmployeeRecord>,
  userId: string,
  id: string,
) {
  const employee = await collection.findOne({
    _id: new ObjectId(id),
    userId,
  })

  if (!employee) {
    return null
  }

  return {
    id: employee._id.toHexString(),
    name: employee.name,
    position: employee.position,
    gradeId: employee.gradeId,
    gradeName: employee.gradeName,
    birthDate: employee.birthDate,
    baseSalary: employee.baseSalary,
    address: employee.address,
    provinceId: employee.provinceId,
    provinceName: employee.provinceName,
    cityId: employee.cityId,
    cityName: employee.cityName,
    districtId: employee.districtId,
    districtName: employee.districtName,
    createdAt: employee.createdAt,
  }
}
