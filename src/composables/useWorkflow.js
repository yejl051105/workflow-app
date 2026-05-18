import { computed } from 'vue'
import { useWorkflowStore } from '../store/workflow'

export function useWorkflow() {
  const store = useWorkflowStore()

  const hasNodes = computed(() => store.nodes.length > 0)
  const hasEdges = computed(() => store.edges.length > 0)
  const canRun = computed(() => {
    const hasInput = store.nodes.some(n => n.type === 'input' && n.data?.text)
    const hasPrompt = store.nodes.some(n => n.type === 'prompt')
    const hasOutput = store.nodes.some(n => n.type === 'output')
    return hasInput && hasPrompt && hasOutput
  })

  const workflowSummary = computed(() => ({
    nodes: store.nodes.length,
    edges: store.edges.length,
    types: [...new Set(store.nodes.map(n => n.type))],
  }))

  function getConnectedNodes(nodeId) {
    const connected = new Set()
    const queue = [nodeId]

    while (queue.length > 0) {
      const current = queue.shift()
      connected.add(current)
      const outgoing = store.edges.filter(e => e.source === current)
      outgoing.forEach(e => {
        if (!connected.has(e.target)) queue.push(e.target)
      })
    }

    return connected
  }

  function getWorkflowChain() {
    const inputNode = store.nodes.find(n => n.type === 'input')
    if (!inputNode) return []

    const chain = []
    const visited = new Set()
    let current = inputNode.id

    while (current && !visited.has(current)) {
      visited.add(current)
      const node = store.nodes.find(n => n.id === current)
      if (!node) break
      chain.push(node)
      const edge = store.edges.find(e => e.source === current)
      current = edge?.target
    }

    return chain
  }

  return {
    hasNodes,
    hasEdges,
    canRun,
    workflowSummary,
    getConnectedNodes,
    getWorkflowChain,
  }
}
