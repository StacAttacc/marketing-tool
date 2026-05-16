import { useMutation } from '@tanstack/vue-query'

type ChatImage = {
  data: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

type ChatInput = {
  text?: string
  budgetId?: string
  images?: ChatImage[]
}

export function useChat() {
  const orpc = useOrpc()

  return useMutation({
    mutationFn: (input: ChatInput) => orpc.llm.chat.call(input),
  })
}
