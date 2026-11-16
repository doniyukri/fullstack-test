<script setup lang="ts">
import { createEmployeeSchema } from '#shared/employee'
const ready = ref(false)
onMounted(() => {
  ready.value = true
})

const emit = defineEmits<{ saved: [] }>()
const { showToast } = useToast()
const config = await useFetch('/api/config/grades', { retry: 0 })
const initial = () => ({ name: '', position: '', gradeId: '', birthDate: '', address: '' })
const form = reactive(initial())
const region = ref({ provinceId: '', cityId: '', districtId: '' })
const salary = ref('')
const saving = ref(false)
const error = ref('')
const fields = ref<Record<string, string>>({})
const grade = computed(() => config.data.value?.grades.find((item) => item.id === form.gradeId))
const salaryHelp = computed(() => {
  if (!grade.value) return 'Pilih golongan untuk melihat rentang gaji'
  return grade.value.maxSalary === null
    ? `Mulai ${formatMoney(grade.value.minSalary)}`
    : `${formatMoney(grade.value.minSalary)} – ${formatMoney(grade.value.maxSalary)}`
})

async function save() {
  if (saving.value || !config.data.value) return
  fields.value = {}
  error.value = ''
  const schema = createEmployeeSchema(config.data.value.grades, config.data.value.today)
  const parsed = schema.safeParse({
    ...form,
    ...region.value,
    baseSalary: salary.value ? Number(salary.value) : NaN,
  })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) fields.value[String(issue.path[0])] = issue.message
    error.value = 'Periksa data yang ditandai'
    return
  }
  saving.value = true
  try {
    await $fetch('/api/employees', {
      method: 'POST',
      body: parsed.data,
      retry: 0,
      onResponseError({ response }) {
        error.value = response._data?.statusMessage || 'Data belum dapat disimpan'
        for (const issue of response._data?.data?.issues ?? [])
          fields.value[String(issue.path[0])] = issue.message
      },
    })
    Object.assign(form, initial())
    salary.value = ''
    region.value = { provinceId: '', cityId: '', districtId: '' }
    showToast('Data karyawan tersimpan', 'success')
    emit('saved')
  } catch {
    if (!error.value) error.value = 'Tidak dapat terhubung. Coba lagi'
    showToast(error.value, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="employee-form" @submit.prevent="save">
    <p v-if="config.error.value" class="form-error" role="alert">
      Konfigurasi belum tersedia
      <button class="secondary-button" type="button" @click="config.refresh()">Coba lagi</button>
    </p>
    <fieldset class="form-fields" :disabled="saving || !config.data.value || !ready">
      <div class="form-field">
        <label for="employee-name">Nama</label>
        <div>
          <input
            id="employee-name"
            v-model="form.name"
            class="text-input"
            autocomplete="name"
            maxlength="100"
            required
            :aria-invalid="!!fields.name"
          /><small v-if="fields.name" class="form-error">{{ fields.name }}</small>
        </div>
      </div>
      <div class="form-field">
        <label for="employee-position">Jabatan</label>
        <div>
          <input
            id="employee-position"
            v-model="form.position"
            class="text-input"
            maxlength="100"
            required
            :aria-invalid="!!fields.position"
          /><small v-if="fields.position" class="form-error">{{ fields.position }}</small>
        </div>
      </div>
      <div class="form-field">
        <label for="employee-grade">Golongan</label>
        <div>
          <select id="employee-grade" v-model="form.gradeId" class="text-input" required>
            <option value="">Pilih golongan</option>
            <option v-for="item in config.data.value?.grades" :key="item.id" :value="item.id">
              {{ item.name }}
            </option></select
          ><small v-if="fields.gradeId" class="form-error">{{ fields.gradeId }}</small>
        </div>
      </div>
      <div class="form-field">
        <label for="employee-birth">Tanggal lahir</label>
        <div>
          <input
            id="employee-birth"
            v-model="form.birthDate"
            class="text-input"
            type="date"
            :max="config.data.value?.today"
            required
          /><small v-if="fields.birthDate" class="form-error">{{ fields.birthDate }}</small>
        </div>
      </div>
      <div class="form-field">
        <label for="employee-salary">Gaji pokok</label>
        <div>
          <NumberInput
            id="employee-salary"
            v-model="salary"
            required
            aria-describedby="salary-help"
          />
          <p id="salary-help" class="field-help">{{ salaryHelp }}</p>
          <small v-if="fields.baseSalary" class="form-error">{{ fields.baseSalary }}</small>
        </div>
      </div>
      <div class="form-field">
        <label for="employee-address">Alamat</label>
        <div>
          <textarea
            id="employee-address"
            v-model="form.address"
            class="text-input"
            rows="3"
            maxlength="500"
            autocomplete="street-address"
            required
          /><small v-if="fields.address" class="form-error">{{ fields.address }}</small>
        </div>
      </div>
      <RegionFields v-model="region" required :disabled="saving || !ready" />
      <p
        v-for="field in ['provinceId', 'cityId', 'districtId']"
        v-show="fields[field]"
        :key="field"
        class="form-error"
      >
        {{ fields[field] }}
      </p>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="page-actions">
        <button class="primary-button" type="submit">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </fieldset>
  </form>
</template>
