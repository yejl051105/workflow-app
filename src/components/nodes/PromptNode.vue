<script setup>
import { Handle } from '@vue-flow/core'
import { ChatLineSquare } from '@element-plus/icons-vue'
import { useWorkflowStore } from '../../store/workflow'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean,
})

const store = useWorkflowStore()

function selectNode() {
  store.setSelectedNode(props.id)
}
</script>

<template>
  <div class="custom-node prompt-node" :class="{ selected: selected }" :style="{ width: (data.nodeWidth || 180) + 'px' }" @click.stop="selectNode">
    <div class="node-header">
      <div class="node-indicator" />
      <el-icon :size="12"><ChatLineSquare /></el-icon>
      <span class="node-label">{{ data.label }}</span>
      <span class="node-badge">AI</span>
    </div>
    <div class="node-body">
      <div class="model-tag">{{ data.model }}</div>
      <p class="node-preview">{{ data.prompt ? data.prompt.slice(0, 50) + (data.prompt.length > 50 ? '...' : '') : 'No prompt configured' }}</p>
    </div>
    <Handle type="target" position="top" class="custom-handle target" />
    <Handle type="source" position="bottom" class="custom-handle source" />
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
  box-shadow: 0 0 0 1px var(--node-prompt), var(--shadow-sm);
}

.custom-node.selected {
  box-shadow: 0 0 0 2px var(--node-prompt), var(--shadow-md);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(99, 102, 241, 0.1);
  font-size: 11px;
  font-weight: 600;
  color: var(--node-prompt);
}

.node-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--node-prompt);
}

.node-badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.2);
  color: var(--node-prompt);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-body {
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-hover);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-preview {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.custom-handle {
  width: 8px !important;
  height: 8px !important;
  border: 2px solid var(--bg-primary) !important;
  border-radius: 50%;
  transition: all 0.2s;
}

.custom-handle.source {
  background: var(--node-prompt) !important;
}

.custom-handle.target {
  background: var(--node-input) !important;
}

.custom-handle:hover {
  transform: scale(1.3);
}
</style>
