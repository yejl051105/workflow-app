import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { loadWorkflow, saveWorkflow, clearWorkflow } from '../utils/storage'
import { WORKFLOW_STATUS } from '../utils/constants'

let nodeCounter = 0

export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref([])
  const edges = ref([])
  const selectedNode = ref(null)
  const isRunning = ref(false)
  const workflowStatus = ref(WORKFLOW_STATUS.IDLE)
  const error = ref(null)
  const selectedNodeData = computed(() => {
    if (!selectedNode.value) return null
    return nodes.value.find(n => n.id === selectedNode.value) || null
  })

  function generateId(type) {
    nodeCounter++
    return `${type}-${Date.now()}-${nodeCounter}`
  }

  function addNode(type, position, zoom = 1) {
    const id = generateId(type)
    const node = { id, type, position: { x: position.x, y: position.y } }
    const zoomFactor = Math.max(zoom, 0.1)

    switch (type) {
      case 'input':
        node.data = { label: 'Input', text: '', nodeWidth: Math.round(160 / zoomFactor) }
        break
      case 'prompt':
        node.data = { label: 'Prompt', prompt: '', model: 'deepseek', temperature: 0.7, nodeWidth: Math.round(180 / zoomFactor) }
        break
      case 'output':
        node.data = { label: 'Output', output: '', nodeWidth: Math.round(160 / zoomFactor) }
        break
    }

    nodes.value.push(node)
    setSelectedNode(id)
    return id
  }

  function removeNode(id) {
    nodes.value = nodes.value.filter(n => n.id !== id)
    edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
    if (selectedNode.value === id) selectedNode.value = null
    persist()
  }

  function updateNode(id, data) {
    const node = nodes.value.find(n => n.id === id)
    if (node) {
      Object.assign(node.data, data)
      persist()
    }
  }

  function updateNodePosition(id, position) {
    const node = nodes.value.find(n => n.id === id)
    if (node) {
      node.position = { ...position }
      persist()
    }
  }

  function addEdge(edge) {
    const exists = edges.value.some(e => e.source === edge.source && e.target === edge.target)
    if (exists) return
    edges.value.push(edge)
    persist()
  }

  function removeEdge(id) {
    edges.value = edges.value.filter(e => e.id !== id)
    persist()
  }

  function setSelectedNode(id) {
    selectedNode.value = id
  }

  function persist() {
    saveWorkflow(nodes.value, edges.value)
  }

  function load() {
    const data = loadWorkflow()
    if (data) {
      nodes.value = (data.nodes || []).map(n => {
        if (!n.data.nodeWidth) {
          n.data.nodeWidth = n.type === 'prompt' ? 180 : 160
        }
        return n
      })
      edges.value = data.edges || []
    }
  }

  function reset() {
    nodes.value = []
    edges.value = []
    selectedNode.value = null
    workflowStatus.value = WORKFLOW_STATUS.IDLE
    error.value = null
    isRunning.value = false
    clearWorkflow()
  }

  function getWorkflowChain() {
    const sorted = []
    let current = nodes.value.find(n => n.type === 'input')

    while (current) {
      sorted.push(current)
      const edge = edges.value.find(e => e.source === current.id)
      if (!edge) break
      current = nodes.value.find(n => n.id === edge.target)
    }

    return sorted
  }

  function validateWorkflow() {
    const inputNode = nodes.value.find(n => n.type === 'input')
    if (!inputNode) return { valid: false, message: 'Missing Input node' }

    const promptNode = nodes.value.find(n => n.type === 'prompt')
    if (!promptNode) return { valid: false, message: 'Missing Prompt node' }

    const outputNode = nodes.value.find(n => n.type === 'output')
    if (!outputNode) return { valid: false, message: 'Missing Output node' }

    const inputEdge = edges.value.find(e => e.source === inputNode.id)
    const promptEdge = edges.value.find(e => e.source === promptNode.id)

    if (!inputEdge || inputEdge.target !== promptNode.id) {
      return { valid: false, message: 'Input must connect to Prompt' }
    }

    if (!promptEdge || promptEdge.target !== outputNode.id) {
      return { valid: false, message: 'Prompt must connect to Output' }
    }

    return { valid: true, message: '' }
  }

  function getApiConfig(model) {
    const configs = {
      deepseek: {
        url: import.meta.env.VITE_DEEPSEEK_URL || 'https://api.deepseek.com/chat/completions',
        key: import.meta.env.VITE_DEEPSEEK_KEY || '',
        model: 'deepseek-chat',
        provider: 'openai',
      },
      gemini: {
        url: import.meta.env.VITE_GEMINI_URL || '',
        key: import.meta.env.VITE_GEMINI_KEY || '',
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      },
    }
    return configs[model] || configs.deepseek
  }

  async function runWorkflow() {
    const validation = validateWorkflow()
    if (!validation.valid) {
      error.value = validation.message
      return
    }

    workflowStatus.value = WORKFLOW_STATUS.RUNNING
    isRunning.value = true
    error.value = null

    const outputNode = nodes.value.find(n => n.type === 'output')
    if (outputNode) outputNode.data.output = ''

    try {
      const inputNode = nodes.value.find(n => n.type === 'input')
      const promptNode = nodes.value.find(n => n.type === 'prompt')
      const text = inputNode?.data?.text || ''
      const prompt = promptNode?.data?.prompt || ''
      const model = promptNode?.data?.model || 'deepseek'
      const temperature = promptNode?.data?.temperature || 0.7

      if (!text.trim()) throw new Error('Input node text is empty. Type something in Input > Input Text')
      if (!prompt.trim()) throw new Error('Prompt node is empty. Click the Prompt node and fill in System Prompt')

      const api = getApiConfig(model)
      if (!api.key) throw new Error(`API key not configured for ${model}. Set VITE_${model.toUpperCase()}_KEY in .env`)

      let url, body, parseChunk

      if (api.provider === 'gemini') {
        url = api.url || `https://generativelanguage.googleapis.com/v1beta/models/${api.model}:streamGenerateContent?alt=sse&key=${api.key}`
        body = {
          contents: [
            { role: 'user', parts: [{ text: `System instruction: ${prompt}\n\nUser: ${text}` }] },
          ],
          generationConfig: { temperature },
        }
        parseChunk = (data) => {
          const candidates = data.candidates
          if (!candidates?.[0]) return ''
          const parts = candidates[0].content?.parts
          return parts?.map(p => p.text).join('') || ''
        }
      } else {
        url = api.url
        body = {
          model: api.model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text },
          ],
          temperature,
          stream: true,
        }
        parseChunk = (data) => {
          return data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || ''
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: api.provider === 'gemini'
          ? { 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json', Authorization: `Bearer ${api.key}` },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || `API error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const content = parseChunk(parsed)
            if (content && outputNode) {
              outputNode.data.output += content
            }
          } catch { }
        }
      }

      workflowStatus.value = WORKFLOW_STATUS.COMPLETED
    } catch (err) {
      error.value = err.message
      workflowStatus.value = WORKFLOW_STATUS.ERROR
    } finally {
      isRunning.value = false
      persist()
    }
  }

  function applyWorkflowJson(workflow, zoom = 1) {
    const nodeMap = {}
    const zoomFactor = Math.max(zoom, 0.1)

    for (const n of (workflow.nodes || [])) {
      const id = generateId(n.type)
      const data = { ...n.data, label: n.data.label || n.type.charAt(0).toUpperCase() + n.type.slice(1) }
      if (!data.nodeWidth) {
        data.nodeWidth = Math.round((n.type === 'prompt' ? 180 : 160) / zoomFactor)
      }
      nodes.value.push({
        id,
        type: n.type,
        position: { x: n.position.x, y: n.position.y },
        data,
      })
      nodeMap[n.id] = id
    }

    for (const e of (workflow.edges || [])) {
      const source = nodeMap[e.source]
      const target = nodeMap[e.target]
      if (source && target) {
        edges.value.push({
          id: `e-${source}-${target}`,
          source,
          target,
        })
      }
    }

    persist()
  }

  watch([nodes, edges], () => {
    persist()
  }, { deep: true })

  return {
    nodes, edges, selectedNode, selectedNodeData,
    isRunning, workflowStatus, error,
    addNode, removeNode, updateNode, updateNodePosition,
    addEdge, removeEdge, setSelectedNode,
    persist, load, reset, getWorkflowChain, validateWorkflow,
    runWorkflow, applyWorkflowJson, getApiConfig,
  }
})
