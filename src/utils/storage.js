const STORAGE_KEY = 'ai-workflow'

export function saveWorkflow(nodes, edges) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
}

export function loadWorkflow() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearWorkflow() {
  localStorage.removeItem(STORAGE_KEY)
}
