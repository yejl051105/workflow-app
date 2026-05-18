const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1'
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || ''

export async function streamChat(messages, model = 'gpt-4o', temperature = 0.7) {
  const response = await fetch(`${AI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `AI API error: ${response.status}`)
  }

  return response.body.getReader()
}

export async function chat(messages, model = 'gpt-4o', temperature = 0.7) {
  const response = await fetch(`${AI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `AI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
