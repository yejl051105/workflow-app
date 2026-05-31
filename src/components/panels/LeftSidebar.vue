<script setup>
import { Document, ChatLineSquare, Monitor } from '@element-plus/icons-vue'

const nodeTypes = [
  { type: 'input', label: 'Input', icon: Document, description: 'User input text' },
  { type: 'prompt', label: 'Prompt', icon: ChatLineSquare, description: 'AI prompt config' },
  { type: 'output', label: 'Output', icon: Monitor, description: 'AI output display' }
]

function onDragStart(event, node) {
  event.dataTransfer.setData('application/vnd.workflow-node', node.type)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="left-sidebar">
    <div class="sidebar-header">
      <h3>Node Library</h3>
    </div>
    <div class="node-list">
      <div
        v-for="node in nodeTypes"
        :key="node.type"
        class="node-item"
        :class="node.type"
        draggable="true"
        @dragstart="onDragStart($event, node)"
      >
        <div class="node-icon">
          <el-icon :size="18">
            <component :is="node.icon" />
          </el-icon>
        </div>
        <div class="node-info">
          <span class="node-name">{{ node.label }}</span>
          <span class="node-desc">{{ node.description }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.left-sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h3 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.node-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.node-item:active {
  cursor: grabbing;
}

.node-item:hover {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.node-item.input .node-icon { color: var(--node-input); }
.node-item.prompt .node-icon { color: var(--node-prompt); }
.node-item.output .node-icon { color: var(--node-output); }

.node-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.node-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
