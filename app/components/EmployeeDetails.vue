<script setup lang="ts">
const props = defineProps<{ id: string }>()
const emit = defineEmits<{ close: [] }>()
const { data, status, error, refresh } = useFetch(() => `/api/employees/${props.id}`, { retry: 0 })
</script>

<template>
  <AppDialog title="Detail karyawan" @close="emit('close')">
    <p v-if="status === 'pending'" role="status">Memuat data…</p>
    <div v-else-if="error" role="alert">
      <p class="form-error">Data karyawan belum dapat dimuat</p>
      <button class="secondary-button" type="button" @click="refresh()">Coba lagi</button>
    </div>
    <dl v-else-if="data?.employee" class="detail-list">
      <dt>Nama</dt>
      <dd>{{ data.employee.name }}</dd>
      <dt>Jabatan</dt>
      <dd>{{ data.employee.position }}</dd>
      <dt>Golongan</dt>
      <dd>{{ data.employee.gradeName }}</dd>
      <dt>Tanggal lahir</dt>
      <dd>{{ formatBirthDate(data.employee.birthDate) }}</dd>
      <dt>Gaji pokok</dt>
      <dd>{{ formatMoney(data.employee.baseSalary) }}</dd>
      <dt>Alamat</dt>
      <dd>{{ data.employee.address }}</dd>
      <dt>Provinsi</dt>
      <dd>{{ data.employee.provinceName }}</dd>
      <dt>Kabupaten/kota</dt>
      <dd>{{ data.employee.cityName }}</dd>
      <dt>Kecamatan</dt>
      <dd>{{ data.employee.districtName }}</dd>
    </dl>
  </AppDialog>
</template>
