<script setup>
import { computed } from 'vue'
import { Handle } from '@vue-flow/core'
import { Monitor } from '@element-plus/icons-vue'
import { useWorkflowStore } from '../../store/workflow'
import { renderMarkdown } from '../../utils/markdown'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean,
})

const store = useWorkflowStore()

const rendered = computed(() => renderMarkdown(props.data?.output))

function selectNode() {
  store.setSelectedNode(props.id)
}
</script>

<template>
  <div class="custom-node output-node" :class="{ selected: selected, running: store.workflowStatus === 'running' }" :style="{ width: (data.nodeWidth || 160) + 'px' }" @click.stop="selectNode">
    <div class="node-header">
      <div class="node-indicator" :class="{ pulse: store.workflowStatus === 'running' }" />
      <el-icon :size="12"><Monitor /></el-icon>
      <span class="node-label">{{ data.label }}</span>
    </div>
    <div class="node-body">
      <div v-if="data.output" class="rendered-content" v-html="rendered" />
      <div v-else class="empty-hint">
        <span v-if="store.workflowStatus === 'running'" class="streaming-dots">Receiving<dot>.</dot><dot>.</dot><dot>.</dot></span>
        <span v-else>Waiting for output...</span>
      </div>
    </div>
    <Handle type="target" position="top" class="custom-handle" />
  </div>
</template>

<style scoped>
.custom-node {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
}

.custom-node:hover {
  box-shadow: 0 0 0 1px var(--node-output), var(--shadow-sm);
}

.custom-node.selected {
  box-shadow: 0 0 0 2px var(--node-output), var(--shadow-md);
}

.custom-node.running {
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(245, 158, 11, 0.1);
  font-size: 11px;
  font-weight: 600;
  color: var(--node-output);
}

.node-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--node-output);
}

.node-indicator.pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.node-body {
  padding: 8px 10px;
  max-height: 180px;
  overflow-y: auto;
}

.rendered-content {
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-primary);
}

.rendered-content :deep(p) {
  margin: 4px 0;
}

.rendered-content :deep(pre) {
  margin: 6px 0;
  padding: 6px 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 10px;
}

.rendered-content :deep(code) {
  font-family: var(--font-mono);
}

.rendered-content :deep(:not(pre) > code) {
  background: rgba(99, 102, 241, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
}

.empty-hint {
  font-size: 11px;
  color: var(--text-muted);
  padding: 10px 0;
  text-align: center;
}

.streaming-dots dot {
  animation: blink 1.4s infinite both;
}

.streaming-dots dot:nth-child(2) { animation-delay: 0.2s; }
.streaming-dots dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

.custom-handle {
  width: 8px !important;
  height: 8px !important;
  background: var(--node-output) !important;
  border: 2px solid var(--bg-primary) !important;
  border-radius: 50%;
  transition: all 0.2s;
}

.custom-handle:hover {
  transform: scale(1.3);
}
</style>
