<script setup>
import { markRaw, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import Topbar from '../components/layout/Topbar.vue'
import LeftSidebar from '../components/panels/LeftSidebar.vue'
import RightPanel from '../components/panels/RightPanel.vue'
import InputNode from '../components/nodes/InputNode.vue'
import PromptNode from '../components/nodes/PromptNode.vue'
import OutputNode from '../components/nodes/OutputNode.vue'
import CanvasToolbar from './workflow/components/CanvasToolbar.vue'
import ChatPanel from './workflow/components/ChatPanel.vue'
import { useWorkflowStore } from '../store/workflow'

const store = useWorkflowStore()
const currentZoom = ref(1)
const canvasLocked = ref(false)
const showChat = ref(false)

const selectedNodes = computed({
  get: () => store.selectedNode ? [store.selectedNode] : [],
  set: (val) => { store.setSelectedNode(val[0] || null) },
})

const selectedEdges = ref([])

const {
  screenToFlowCoordinate,
  fitView: fitViewFn,
  zoomIn,
  zoomOut,
} = useVueFlow()

const nodeTypes = {
  input: markRaw(InputNode),
  prompt: markRaw(PromptNode),
  output: markRaw(OutputNode),
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: '#6366f1' },
}

function onConnect(connection) {
  store.addEdge({
    id: `e-${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
  })
}

function onNodeClick({ node }) {
  store.setSelectedNode(node.id)
}

function onPaneClick() {
  store.setSelectedNode(null)
}

function onNodeDragStop({ node }) {
  store.updateNodePosition(node.id, node.position)
}

function onDragOver(event) {
  if (event.dataTransfer.types.includes('application/vnd.workflow-node')) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event) {
  const type = event.dataTransfer.getData('application/vnd.workflow-node')
  if (!type) return

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  store.addNode(type, position, currentZoom.value)
}

function onNodesChange(changes) {
  const deletions = changes.filter(c => c.type === 'remove')
  for (const change of deletions) {
    store.removeNode(change.id)
  }
}

function onEdgesChange(changes) {
  const deletions = changes.filter(c => c.type === 'remove')
  for (const change of deletions) {
    store.removeEdge(change.id)
  }
}

function onViewportChange({ zoom }) {
  currentZoom.value = zoom
}

function onKeyDown(event) {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) return

  const edgeId = selectedEdges.value[0]
  if (edgeId) {
    event.preventDefault()
    store.removeEdge(edgeId)
    selectedEdges.value = []
    return
  }

  const nodeId = store.selectedNode
  if (nodeId) {
    event.preventDefault()
    store.removeNode(nodeId)
  }
}

watch(() => store.selectedNode, (id) => {
  if (!id && !showChat.value) showChat.value = true
})

onMounted(() => {
  store.load()
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="workflow-view">
    <Topbar :show-chat="showChat" @toggle-chat="showChat = !showChat" />
    <div class="workflow-body">
      <LeftSidebar />
      <main class="canvas-area" @dragover.prevent="onDragOver" @drop.prevent="onDrop">
        <VueFlow
          v-model:nodes="store.nodes"
          v-model:edges="store.edges"
          v-model:selected-nodes="selectedNodes"
          v-model:selected-edges="selectedEdges"
          :node-types="nodeTypes"
          :default-edge-options="defaultEdgeOptions"
          :fit-view-on-init="true"
          :min-zoom="0.2"
          :max-zoom="3"
          :snap-to-grid="true"
          :snap-grid="[20, 20]"
          @connect="onConnect"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
          @node-drag-stop="onNodeDragStop"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          @viewport-change="onViewportChange"
          class="vue-flow-instance"
        >
        
          <template #node-input="props">
            <InputNode v-bind="props" />
          </template>
          <template #node-prompt="props">
            <PromptNode v-bind="props" />
          </template>
          <template #node-output="props">
            <OutputNode v-bind="props" />
          </template>
        </VueFlow>

        <CanvasToolbar
          :zoom="currentZoom"
          :locked="canvasLocked"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @fit-view="fitViewFn"
          @toggle-lock="canvasLocked = !canvasLocked"
        />
      </main>
      <div class="right-wrapper" :style="{ width: store.selectedNode ? '300px' : '0' }">
        <RightPanel />
      </div>
      <ChatPanel :visible="showChat" @close="showChat = false" />
    </div>
  </div>
</template>

<style scoped>
.workflow-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  outline: none;
}

.workflow-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  min-width: 0;
  position: relative;
  background: var(--bg-primary);
}

.right-wrapper {
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.25s ease;
}

.vue-flow-instance {
  width: 100%;
  height: 100%;
}
</style>

<style>
.vue-flow__controls {
  display: flex;
  gap: 4px;
  background: var(--bg-surface) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  padding: 4px;
  box-shadow: var(--shadow-md);
}

.vue-flow__controls-button {
  background: transparent !important;
  border: none !important;
  color: var(--text-secondary) !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: var(--radius-sm) !important;
  cursor: pointer;
  transition: all 0.2s;
}

.vue-flow__controls-button:hover {
  background: var(--bg-elevated) !important;
  color: var(--text-primary) !important;
}

.vue-flow__controls-button svg {
  fill: currentColor !important;
}

.vue-flow__edge-path {
  stroke: #6366f1 !important;
  stroke-width: 2 !important;
}

.vue-flow__connection-path {
  stroke: #6366f1 !important;
  stroke-width: 2 !important;
}

.vue-flow__minimap {
  background: var(--bg-surface) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
}

.vue-flow__node {
  cursor: pointer !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.vue-flow__node input,
.vue-flow__node select,
.vue-flow__node textarea {
  outline: none;
}
</style>
