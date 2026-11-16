<script setup lang="ts">
interface Selection {
  provinceId: string
  cityId: string
  districtId: string
}
const model = defineModel<Selection>({ required: true })
const props = defineProps<{ required?: boolean; disabled?: boolean }>()
const prefix = useId()
const provinceId = computed(() => model.value.provinceId)
const cityId = computed(() => model.value.cityId)
const provinces = await useFetch('/api/config/provinces', { retry: 0 })
const cities = await useFetch('/api/config/cities', {
  query: { provinceId },
  immediate: false,
  watch: false,
  retry: 0,
})
const districts = await useFetch('/api/config/districts', {
  query: { cityId },
  immediate: false,
  watch: false,
  retry: 0,
})
const error = computed(() => provinces.error.value || cities.error.value || districts.error.value)

watch(
  provinceId,
  (value, old) => {
    if (old !== undefined && value !== old)
      model.value = { ...model.value, cityId: '', districtId: '' }
    cities.clear()
    if (value) void cities.refresh()
  },
  { immediate: true },
)

watch(
  cityId,
  (value, old) => {
    if (old !== undefined && value !== old) model.value = { ...model.value, districtId: '' }
    districts.clear()
    if (value) void districts.refresh()
  },
  { immediate: true },
)

async function retry() {
  await provinces.refresh()
  if (provinceId.value) await cities.refresh()
  if (cityId.value) await districts.refresh()
}
</script>

<template>
  <div class="form-field">
    <label :for="`${prefix}-province`">Provinsi</label>
    <select
      :id="`${prefix}-province`"
      v-model="model.provinceId"
      class="text-input"
      :required="props.required"
      :disabled="disabled || provinces.status.value === 'pending'"
    >
      <option value="">{{ required ? 'Pilih provinsi' : 'Semua provinsi' }}</option>
      <option v-for="item in provinces.data.value?.provinces" :key="item.id" :value="item.id">
        {{ item.name }}
      </option>
    </select>
  </div>
  <div class="form-field">
    <label :for="`${prefix}-city`">Kabupaten/kota</label>
    <select
      :id="`${prefix}-city`"
      v-model="model.cityId"
      class="text-input"
      :required="props.required"
      :disabled="disabled || !provinceId || cities.status.value === 'pending'"
    >
      <option value="">{{ required ? 'Pilih kabupaten/kota' : 'Semua kabupaten/kota' }}</option>
      <option v-for="item in cities.data.value?.cities" :key="item.id" :value="item.id">
        {{ item.name }}
      </option>
    </select>
  </div>
  <div class="form-field">
    <label :for="`${prefix}-district`">Kecamatan</label>
    <select
      :id="`${prefix}-district`"
      v-model="model.districtId"
      class="text-input"
      :required="props.required"
      :disabled="disabled || !cityId || districts.status.value === 'pending'"
    >
      <option value="">{{ required ? 'Pilih kecamatan' : 'Semua kecamatan' }}</option>
      <option v-for="item in districts.data.value?.districts" :key="item.id" :value="item.id">
        {{ item.name }}
      </option>
    </select>
  </div>
  <div v-if="error" class="region-error" role="alert">
    Data wilayah belum dapat dimuat
    <button class="secondary-button" type="button" @click="retry">Coba lagi</button>
  </div>
</template>
