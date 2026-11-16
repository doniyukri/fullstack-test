import { createHash } from 'node:crypto'
import { ObjectId } from 'mongodb'
import type { Collection, WithId } from 'mongodb'
import { employeeGrades } from '../server/config/employee-grades.ts'
import type { EmployeeRecord } from '../server/types/employee.ts'

const names = [
  'Rina Putri',
  'Andi Saputra',
  'Siti Rahma',
  'Budi Santoso',
  'Dewi Lestari',
  'Rizky Pratama',
  'Maya Sari',
  'Fajar Hidayat',
  'Nadia Putri',
  'Dimas Setiawan',
  'Laras Wulandari',
  'Indra Wijaya',
  'Farah Aulia',
  'Dewi Anggraini',
  'Anisa Putri',
  'Agus Firmansyah',
  'Novi Handayani',
  'Yoga Prasetyo',
  'Putri Amelia',
  'Hendra Gunawan',
  'Intan Permata',
  'Arif Maulana',
  'Nina Kartika',
  'Bayu Nugroho',
  'Ratna Dewi',
]

const positions = ['Staff Admin', 'Supervisor', 'Manager']

export function buildDemoEmployees(
  userId: string,
  now = new Date(),
  count = 15,
): WithId<EmployeeRecord>[] {
  return names.slice(0, count).map((name, index) => {
    const grade = employeeGrades[index % employeeGrades.length]!

    const baseSalary =
      grade.maxSalary === null
        ? Math.ceil(grade.minSalary / 1_000_000) * 1_000_000
        : Math.floor((grade.minSalary + grade.maxSalary) / 2)

    // Use the same ID when seeding the same demo record again
    const id = createHash('sha256')
      .update(`demo-employee-v1:${userId}:${index}`)
      .digest('hex')
      .slice(0, 24)

    return {
      _id: new ObjectId(id),
      userId,
      name: `${name} (Demo)`,
      position: positions[index % positions.length]!,
      gradeId: grade.id,
      gradeName: grade.name,
      birthDate: `${1978 + index}-05-12`,
      baseSalary,
      address: `Jalan Contoh ${index + 1}`,
      provinceId: '31',
      provinceName: 'Daerah Khusus Ibukota Jakarta',
      cityId: '31.71',
      cityName: 'Kota Administrasi Jakarta Pusat',
      districtId: '31.71.01',
      districtName: 'Gambir',
      createdAt: new Date(now.getTime() - index * 60_000),
    }
  })
}

export async function seedDemoEmployees(
  collection: Collection<EmployeeRecord>,
  userId: string,
  now = new Date(),
  count = 15,
) {
  const employees = buildDemoEmployees(userId, now, count)

  return collection.bulkWrite(
    employees.map((employee) => ({
      updateOne: {
        filter: {
          _id: employee._id,
          userId,
        },
        update: {
          $setOnInsert: employee,
        },
        upsert: true,
      },
    })),
  )
}
