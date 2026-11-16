<script setup lang="ts">
const model = defineModel<string>({ required: true })
const props = withDefaults(defineProps<{ maxDigits?: number }>(), { maxDigits: 15 })
const invalid = ref('')
const format = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

function update(event: Event) {
  const input = event.target as HTMLInputElement
  const oldText = format(model.value)
  const cursor = input.selectionStart ?? input.value.length
  let before = input.value.slice(0, cursor).replaceAll(',', '').length
  let digits = input.value.replaceAll(',', '')
  if (!/^[0-9,]*$/.test(input.value) || digits.length > props.maxDigits) {
    input.value = oldText
    invalid.value = `Gunakan angka saja, maksimal ${props.maxDigits} digit`
    input.setCustomValidity(invalid.value)
    return
  }
  // Delete a nearby digit when Backspace or Delete removes a comma
  if (digits === model.value && input.value !== oldText && event instanceof InputEvent) {
    const backward = event.inputType === 'deleteContentBackward'
    const forward = event.inputType === 'deleteContentForward'
    if (backward || forward) {
      const index = backward ? before - 1 : before
      if (index >= 0 && index < digits.length) {
        digits = digits.slice(0, index) + digits.slice(index + 1)
        if (backward) before -= 1
      }
    }
  }
  const normalized = digits.replace(/^0+(?=\d)/, '')
  before = Math.max(0, before - (digits.length - normalized.length))
  model.value = normalized
  input.value = format(normalized)
  invalid.value = ''
  input.setCustomValidity('')
  let position = 0
  let passed = 0
  while (position < input.value.length && passed < before) {
    if (input.value[position] !== ',') passed += 1
    position += 1
  }
  input.setSelectionRange(position, position)
}
</script>

<template>
  <input
    class="text-input"
    type="text"
    inputmode="numeric"
    :value="format(model)"
    :title="invalid || undefined"
    @input="update"
  />
</template>
