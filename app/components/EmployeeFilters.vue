<script setup lang="ts">
import { employeeListQuerySchema } from '#shared/employee-list'
const props = defineProps<{ value: Record<string, string> }>()
const emit = defineEmits<{ apply: [value: Record<string, string>]; close: [] }>()
const { data } = await useFetch('/api/config/grades', { retry: 0 })
const draft = reactive({
  gradeId: props.value.gradeId ?? '',
  minAge: props.value.minAge ?? '',
  maxAge: props.value.maxAge ?? '',
})
const region = ref({
  provinceId: props.value.provinceId ?? '',
  cityId: props.value.cityId ?? '',
  districtId: props.value.districtId ?? '',
})
const error = ref('')

function reset() {
  Object.assign(draft, { gradeId: '', minAge: '', maxAge: '' })
  region.value = { provinceId: '', cityId: '', districtId: '' }
  error.value = ''
}

function apply() {
  const query = Object.fromEntries(
    Object.entries({ ...draft, ...region.value }).filter(([, value]) => value !== ''),
  )
  const parsed = employeeListQuerySchema.safeParse(query)
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Periksa filter'
    return
  }
  emit('apply', query)
}
</script>

<template>
  <AppDialog title="Filter karyawan" @close="emit('close')">
    <form class="filter-form" @submit.prevent="apply">
      <div class="form-field">
        <label for="filter-grade">Golongan</label
        ><select id="filter-grade" v-model="draft.gradeId" class="text-input">
          <option value="">Semua golongan</option>
          <option v-for="grade in data?.grades" :key="grade.id" :value="grade.id">
            {{ grade.name }}
          </option>
        </select>
      </div>
      <div class="age-fields">
        <div class="form-field">
          <label for="filter-min-age">Umur minimum</label
          ><input
            id="filter-min-age"
            v-model="draft.minAge"
            class="text-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]{1,3}"
            maxlength="3"
          />
        </div>
        <div class="form-field">
          <label for="filter-max-age">Umur maksimum</label
          ><input
            id="filter-max-age"
            v-model="draft.maxAge"
            class="text-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]{1,3}"
            maxlength="3"
          />
        </div>
      </div>
      <RegionFields v-model="region" />
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="page-actions filter-actions">
        <button class="secondary-button" type="button" @click="reset">Reset</button
        ><button class="primary-button" type="submit">Terapkan</button>
      </div>
    </form>
  </AppDialog>
</template>

<style scoped>
.filter-form {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
.age-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.filter-actions {
  gap: 0.75rem;
}
</style>
