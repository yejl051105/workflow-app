export const NODE_TYPES = {
  INPUT: 'input',
  PROMPT: 'prompt',
  OUTPUT: 'output',
}

export const NODE_LABELS = {
  [NODE_TYPES.INPUT]: 'Input',
  [NODE_TYPES.PROMPT]: 'Prompt',
  [NODE_TYPES.OUTPUT]: 'Output',
}

export const NODE_COLORS = {
  [NODE_TYPES.INPUT]: '#22c55e',
  [NODE_TYPES.PROMPT]: '#6366f1',
  [NODE_TYPES.OUTPUT]: '#f59e0b',
}

export const AI_MODELS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'gemini', label: 'Gemini' },
]

export const DEFAULT_TEMPERATURE = 0.7
export const TEMPERATURE_MIN = 0
export const TEMPERATURE_MAX = 2
export const TEMPERATURE_STEP = 0.1

export const STORAGE_KEY = 'ai-workflow'

export const WORKFLOW_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error',
}
