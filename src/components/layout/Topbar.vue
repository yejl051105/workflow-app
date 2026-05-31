<script setup>
import { ElMessage } from 'element-plus'
import { VideoPlay, Check, Delete, WarningFilled, ChatLineSquare } from '@element-plus/icons-vue'
import { useWorkflowStore } from '../../store/workflow'

defineProps({ showChat: Boolean })
defineEmits(['toggle-chat'])

const store = useWorkflowStore()

async function handleRun() {
  await store.runWorkflow(store.selectedNode)
}

function handleSave() {
  store.persist()
  ElMessage.success('Workflow saved')
}

function handleClear() {
  store.reset()
  ElMessage.info('Workflow cleared')
}

</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span class="logo-text">AI Workflow</span>
      </div>
    </div>

    <div class="topbar-center">
      <div v-if="store.error" class="status-error">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ store.error }}</span>
      </div>

      <el-button
        type="primary"
        :icon="VideoPlay"
        :loading="store.isRunning"
        :disabled="store.nodes.length === 0"
        @click="handleRun"
        class="run-btn"
      >
        {{ store.isRunning ? 'Running...' : 'Run Workflow' }}
      </el-button>
    </div>

    <div class="topbar-right">
      <el-tooltip content="AI Assistant" placement="bottom">
        <el-button text bg class="icon-btn" :class="{ active: showChat }" @click="$emit('toggle-chat')">
          <el-icon><ChatLineSquare /></el-icon>
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical" />
      <el-tooltip content="Save" placement="bottom">
        <el-button text bg class="icon-btn" @click="handleSave">
          <el-icon><Check /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="Clear" placement="bottom">
        <el-button text bg class="icon-btn" @click="handleClear">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>

    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
  gap: 16px;
}

.topbar-left, .topbar-center, .topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-center {
  flex: 1;
  justify-content: center;
}

.topbar-right {
  gap: 4px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.run-btn {
  background: var(--accent-primary) !important;
  border-color: var(--accent-primary) !important;
  font-weight: 600;
  padding: 8px 24px !important;
  transition: all 0.2s;
}

.run-btn:hover {
  background: var(--accent-hover) !important;
  box-shadow: 0 0 20px var(--accent-glow);
}

.status-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  margin-right: 8px;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-btn {
  color: var(--text-secondary) !important;
  background: transparent !important;
  border: none !important;
  font-size: 18px;
  padding: 6px !important;
  transition: all 0.2s;
}

.icon-btn:hover {
  color: var(--text-primary) !important;
  background: var(--bg-elevated) !important;
}

.icon-btn.active {
  color: var(--accent-primary) !important;
  background: rgba(99, 102, 241, 0.1) !important;
}
</style>
