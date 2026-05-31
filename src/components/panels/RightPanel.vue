<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Setting, Monitor, Delete } from '@element-plus/icons-vue'
import { useWorkflowStore } from '../../store/workflow'
import { renderMarkdown } from '../../utils/markdown'

const store = useWorkflowStore()

const localData = ref({ text: '', prompt: '', model: 'deepseek', temperature: 0.7 })
const nodeTitle = ref('')

const selectedNode = computed(() => {
  if (!store.selectedNode) return null
  return store.nodes.find(n => n.id === store.selectedNode) || null
})

const renderedOutput = computed(() => {
  if (!selectedNode.value?.data?.output) return ''
  return renderMarkdown(selectedNode.value.data.output)
})

watch(() => store.selectedNode, (id) => {
  if (!id) {
    localData.value = { text: '', prompt: '', model: 'deepseek', temperature: 0.7 }
    return
  }
  const node = store.nodes.find(n => n.id === id)
  if (node) {
    localData.value = { ...node.data }
    const labels = { input: 'Input Node', prompt: 'Prompt Node', output: 'Output Node' }
    nodeTitle.value = labels[node.type] || 'Node'
  }
}, { immediate: true })

function updateNodeData() {
  if (!store.selectedNode) return
  store.updateNode(store.selectedNode, { ...localData.value })
}

async function handleDelete() {
  if (!store.selectedNode) return
  try {
    await ElMessageBox.confirm(
      'Delete this node and all its connections?',
      'Confirm Delete',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    )
    store.removeNode(store.selectedNode)
  } catch { }
}
</script>

<template>
  <aside class="right-panel">
    <div class="panel-header">
      <h3>Configuration</h3>
    </div>
    <div class="panel-body">
      <template v-if="selectedNode">
        <div class="config-section">
          <div class="section-top">
            <div class="section-label">{{ nodeTitle }}</div>
            <el-button
              type="danger"
              text
              :icon="Delete"
              size="small"
              @click="handleDelete"
            >
              Delete
            </el-button>
          </div>

          <div class="node-id">ID: {{ selectedNode.id }}</div>

          <template v-if="selectedNode.type === 'input'">
            <div class="config-field">
              <label>Input Text</label>
              <el-input
                v-model="localData.text"
                type="textarea"
                :rows="8"
                placeholder="Enter your input text..."
                @input="updateNodeData"
              />
            </div>
          </template>

          <template v-else-if="selectedNode.type === 'prompt'">
            <div class="config-field">
              <label>Model</label>
              <el-select v-model="localData.model" @change="updateNodeData">
                <el-option label="DeepSeek" value="deepseek" />
              </el-select>
            </div>
            <div class="config-field">
              <label>Temperature: {{ localData.temperature }}</label>
              <el-slider
                v-model="localData.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                @input="updateNodeData"
              />
            </div>
            <div class="config-field">
              <label>System Prompt</label>
              <el-input
                v-model="localData.prompt"
                type="textarea"
                :rows="10"
                placeholder="Enter your system prompt..."
                @input="updateNodeData"
              />
            </div>
          </template>

          <template v-else-if="selectedNode.type === 'output'">
            <div class="config-field">
              <label>Output</label>
              <div class="output-content">
                <template v-if="selectedNode.data.output">
                  <div class="output-text" v-html="renderedOutput" />
                </template>
                <div v-else class="output-placeholder">
                  <el-icon :size="28" color="#6b6b8d"><Monitor /></el-icon>
                  <p>Waiting for AI output...</p>
                </div>
              </div>
            </div>
            <div v-if="store.workflowStatus === 'running'" class="status-badge running">
              Running...
            </div>
            <div v-else-if="store.workflowStatus === 'completed'" class="status-badge completed">
              Completed
            </div>
            <div v-else-if="store.error" class="status-badge error">
              {{ store.error }}
            </div>
          </template>
        </div>
      </template>

      <template v-else>
        <div class="empty-state">
          <el-icon :size="40" color="#6b6b8d"><Setting /></el-icon>
          <p>Select a node to configure</p>
          <span class="hint">Click on any node in the canvas</span>
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.right-panel {
  width: 300px;
  min-width: 300px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.panel-body {
  padding: 16px;
  flex: 1;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.node-id {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 4px 8px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  word-break: break-all;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.output-content {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px;
  min-height: 80px;
  max-height: 400px;
  overflow-y: auto;
}

.output-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  word-break: break-word;
}

.output-text :deep(p) {
  margin: 6px 0;
}

.output-text :deep(h1),
.output-text :deep(h2),
.output-text :deep(h3),
.output-text :deep(h4) {
  margin: 12px 0 6px;
  color: var(--text-primary);
  font-weight: 700;
}

.output-text :deep(h1) { font-size: 18px; }
.output-text :deep(h2) { font-size: 16px; }
.output-text :deep(h3) { font-size: 14px; }

.output-text :deep(ul),
.output-text :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.output-text :deep(li) {
  margin: 3px 0;
}

.output-text :deep(blockquote) {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid var(--accent-primary);
  background: rgba(99, 102, 241, 0.08);
  border-radius: 0 4px 4px 0;
  color: var(--text-secondary);
}

.output-text :deep(pre) {
  margin: 8px 0;
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
  background: #1a1a2e;
  border: 1px solid var(--border-color);
  font-size: 12px;
  line-height: 1.5;
}

.output-text :deep(code) {
  font-family: var(--font-mono);
}

.output-text :deep(:not(pre) > code) {
  background: rgba(99, 102, 241, 0.12);
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
  color: var(--accent-hover);
}

.output-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}

.output-text :deep(th),
.output-text :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  text-align: left;
  font-size: 12px;
}

.output-text :deep(th) {
  background: var(--bg-surface);
  font-weight: 600;
  color: var(--text-primary);
}

.output-text :deep(td) {
  color: var(--text-secondary);
}

.output-text :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 12px 0;
}

.output-text :deep(a) {
  color: var(--accent-hover);
  text-decoration: none;
}

.output-text :deep(a:hover) {
  text-decoration: underline;
}

.output-text :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 8px 0;
}

.output-text :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}

.output-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}

.status-badge {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.status-badge.running {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: var(--node-input);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.7;
}
</style>
