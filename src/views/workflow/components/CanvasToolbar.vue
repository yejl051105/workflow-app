<script setup>
import { Plus, Minus, FullScreen, Lock } from '@element-plus/icons-vue'

defineProps({
  zoom: { type: Number, default: 1 },
  locked: { type: Boolean, default: false },
})

defineEmits(['zoom-in', 'zoom-out', 'fit-view', 'toggle-lock'])
</script>

<template>
  <div class="canvas-toolbar">
    <el-tooltip content="Zoom In" placement="top">
      <el-button text bg class="toolbar-btn" @click="$emit('zoom-in')">
        <el-icon><Plus /></el-icon>
      </el-button>
    </el-tooltip>
    <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
    <el-tooltip content="Zoom Out" placement="top">
      <el-button text bg class="toolbar-btn" @click="$emit('zoom-out')">
        <el-icon><Minus /></el-icon>
      </el-button>
    </el-tooltip>
    <el-divider direction="vertical" />
    <el-tooltip content="Fit View" placement="top">
      <el-button text bg class="toolbar-btn" @click="$emit('fit-view')">
        <el-icon><FullScreen /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip content="Lock Canvas" placement="top">
      <el-button text bg class="toolbar-btn" :class="{ active: locked }" @click="$emit('toggle-lock')">
        <el-icon><Lock /></el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<style scoped>
.canvas-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.toolbar-btn {
  color: var(--text-secondary) !important;
  background: transparent !important;
  border: none !important;
  font-size: 16px;
  padding: 4px !important;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  color: var(--text-primary) !important;
  background: var(--bg-elevated) !important;
}

.toolbar-btn.active {
  color: var(--accent-primary) !important;
}

.zoom-level {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  min-width: 36px;
  text-align: center;
  font-family: var(--font-mono);
}
</style>
