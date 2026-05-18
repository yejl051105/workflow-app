<script setup>
import { Handle } from '@vue-flow/core'
import { Document } from '@element-plus/icons-vue'
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
  <div class="custom-node input-node" :class="{ selected: selected }" :style="{ width: (data.nodeWidth || 160) + 'px' }" @click.stop="selectNode">
    <div class="node-header">
      <div class="node-indicator" />
      <el-icon :size="12"><Document /></el-icon>
      <span class="node-label">{{ data.label }}</span>
    </div>
    <div class="node-body">
      <p class="node-preview">{{ data.text ? data.text.slice(0, 50) + (data.text.length > 50 ? '...' : '') : 'No input text' }}</p>
    </div>
    <Handle type="source" position="bottom" class="custom-handle" />
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
  box-shadow: 0 0 0 1px var(--node-input), var(--shadow-sm);
}

.custom-node.selected {
  box-shadow: 0 0 0 2px var(--node-input), var(--shadow-md);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(34, 197, 94, 0.1);
  font-size: 11px;
  font-weight: 600;
  color: var(--node-input);
}

.node-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--node-input);
}

.node-body {
  padding: 6px 10px;
}

.node-preview {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.custom-handle {
  width: 8px !important;
  height: 8px !important;
  background: var(--node-input) !important;
  border: 2px solid var(--bg-primary) !important;
  border-radius: 50%;
  transition: all 0.2s;
}

.custom-handle:hover {
  transform: scale(1.3);
}
</style>
