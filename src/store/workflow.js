import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadWorkflow, saveWorkflow, clearWorkflow } from '../utils/storage'
import { WORKFLOW_STATUS } from '../utils/constants'

let nodeCounter = 0
const DEFAULT_MODEL = 'deepseek'
const DEFAULT_TEMPERATURE = 0.7
const NODE_WIDTHS = {
  input: 160,
  prompt: 180,
  output: 160,
}

function getDefaultNodeData(type, zoom = 0.5) {
  const zoomFactor = Math.max(zoom, 0.1)
  const nodeWidth = Math.round((NODE_WIDTHS[type] || 160) / zoomFactor)

  const defaults = {
    input: { label: 'Input', text: '' },
    prompt: { label: 'Prompt', prompt: '', model: DEFAULT_MODEL, temperature: DEFAULT_TEMPERATURE },
    output: { label: 'Output', output: '' },
  }

  return { ...defaults[type], nodeWidth }
}

function getNodeLabel(type) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Node'
}

export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref([])
  const edges = ref([])
  const selectedNode = ref(null)
  const isRunning = ref(false)
  const workflowStatus = ref(WORKFLOW_STATUS.IDLE)
  const error = ref(null)
  const currentWorkflowId = ref(crypto.randomUUID())

  function generateId(type) {
    nodeCounter++
    return `${type}-${Date.now()}-${nodeCounter}`
  }

  function addNode(type, position, zoom = 1) {
    const id = generateId(type)
    const node = {
      id,
      type,
      workflowId: currentWorkflowId.value,
      position: { x: position.x, y: position.y },
      data: getDefaultNodeData(type, zoom),
    }

    nodes.value.push(node)
    setSelectedNode(id)
    persist()
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
    edges.value.push({ ...edge, workflowId: currentWorkflowId.value })
    persist()
  }

  function removeEdge(id) {
    edges.value = edges.value.filter(e => e.id !== id)
    persist()
  }

  function setSelectedNode(id) {
    selectedNode.value = id?.id || id
  }

  function persist() {
    saveWorkflow(nodes.value, edges.value)
  }

  function load() {
    const data = loadWorkflow()
    if (data) {
      const wfId = crypto.randomUUID()
      nodes.value = (data.nodes || []).map(n => {
        const defaults = getDefaultNodeData(n.type)
        return {
          ...n,
          workflowId: n.workflowId || wfId,
          data: { ...defaults, ...n.data, nodeWidth: n.data?.nodeWidth || defaults.nodeWidth },
        }
      })
      edges.value = (data.edges || []).map(e => ({
        ...e,
        workflowId: e.workflowId || wfId,
      }))
    }
  }

  function reset() {
    nodes.value = []
    edges.value = []
    selectedNode.value = null
    workflowStatus.value = WORKFLOW_STATUS.IDLE
    error.value = null
    isRunning.value = false
    currentWorkflowId.value = crypto.randomUUID()
    clearWorkflow()
  }

  function getWorkflowChain(workflowId) {
    const workflowNodes = nodes.value.filter(n => n.workflowId === workflowId)
    const workflowEdges = edges.value.filter(e => e.workflowId === workflowId)

    const start = workflowNodes.find(n => n.type === 'input')
    if (!start) return []

    const chain = []
    let current = start
    const visited = new Set()

    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      chain.push(current)
      const edge = workflowEdges.find(e => e.source === current.id)
      current = edge ? workflowNodes.find(n => n.id === edge.target) : null
    }

    return chain
  }

  function getApiConfig(model) {
    const configs = {
      deepseek: {
        url: import.meta.env.VITE_DEEPSEEK_URL || 'https://api.deepseek.com/chat/completions',
        key: import.meta.env.VITE_DEEPSEEK_KEY || '',
        model: 'deepseek-v4-flash',
      },
    }
    return configs[model] || configs.deepseek
  }

  async function runWorkflow(fromNodeId = selectedNode.value) {
    const nodeId = fromNodeId?.id || fromNodeId
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) {
      error.value = 'Select a node to run'
      return
    }
    const chain = getWorkflowChain(node.workflowId)

    const inputIndex = chain.findIndex(n => n.type === 'input')
    const promptIndex = chain.findIndex((n, index) => index > inputIndex && n.type === 'prompt')
    const outputIndex = chain.findIndex((n, index) => index > promptIndex && n.type === 'output')
    const inputNode = chain[inputIndex]
    const promptNode = chain[promptIndex]
    const outputNode = chain[outputIndex]

    if (!inputNode) {
      error.value = 'Select a node in a chain that has an Input node connected'
      return
    }
    if (!promptNode) {
      error.value = 'Connect Input to a Prompt node before running'
      return
    }
    if (!outputNode) {
      error.value = 'Connect Prompt to an Output node before running'
      return
    }

    workflowStatus.value = WORKFLOW_STATUS.RUNNING
    isRunning.value = true
    error.value = null

    outputNode.data.output = ''

    try {
      const text = inputNode.data?.text || ''
      const prompt = promptNode.data?.prompt || ''
      const model = promptNode.data?.model || DEFAULT_MODEL
      const temperature = promptNode.data?.temperature ?? DEFAULT_TEMPERATURE

      if (!text.trim()) throw new Error('Input node text is empty')
      if (!prompt.trim()) throw new Error('Prompt node is empty')

      const api = getApiConfig(model)
      if (!api.key) throw new Error(`API key not configured for ${model}. Set VITE_${model.toUpperCase()}_KEY in .env`)

      const body = {
        model: api.model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text },
        ],
        temperature,
        stream: true,
      }

      const response = await fetch(api.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.key}` },
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

        const rawText = decoder.decode(value, { stream: true })
        buffer += rawText
        const textArray = buffer.split('\n\n')
        buffer = textArray.pop()

        for (const m of textArray) {
          const dataStr = m.replace('data:', '').trim()
          if (dataStr === '[DONE]') break

          try {
            const data = JSON.parse(dataStr)
            const content = data.choices?.[0]?.delta?.content || ''
            if (content) {
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

  function applyWorkflowJson(workflow, zoom = 0.5) {
    const nodeMap = {}
    const wfId = crypto.randomUUID()

    for (const n of (workflow.nodes || [])) {
      const id = generateId(n.type)
      const data = {
        ...getDefaultNodeData(n.type, zoom),
        ...n.data,
        label: n.data?.label || getNodeLabel(n.type),
      }

      nodes.value.push({
        id,
        type: n.type,
        workflowId: wfId,
        position: { x: n.position?.x || 0, y: n.position?.y || 0 },
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
          workflowId: wfId,
        })
      }
    }

    persist()
  }

  function setWorkflowId(id) {
    currentWorkflowId.value = id
  }

  return {
    nodes, edges, selectedNode,
    isRunning, workflowStatus, error, currentWorkflowId,
    addNode, removeNode, updateNode, updateNodePosition,
    addEdge, removeEdge, setSelectedNode,
    persist, load, reset, getWorkflowChain,
    runWorkflow, applyWorkflowJson, getApiConfig, setWorkflowId,
  }
})
