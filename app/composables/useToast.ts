export function useToast() {
  const toast = useState<{
    message: string
    tone: 'success' | 'error' | 'warning' | 'info'
  } | null>('toast', () => null)
  return {
    toast,
    showToast(message: string, tone: 'success' | 'error' | 'warning' | 'info' = 'success') {
      toast.value = { message, tone }
    },
  }
}
