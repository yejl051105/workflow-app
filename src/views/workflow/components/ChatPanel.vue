<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Plus, Promotion } from '@element-plus/icons-vue'
import { useWorkflowStore } from '../../../store/workflow'
import { renderMarkdown } from '../../../utils/markdown'

defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const store = useWorkflowStore()
const messagesRef = ref(null)
const inputText = ref('')
const loading = ref(false)
const messages = ref([])
const panelWidth = ref(380)

function startResize(e) {
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  const startX = e.clientX
  const startW = panelWidth.value

  function onMove(ev) {
    const diff = startX - ev.clientX
    panelWidth.value = Math.max(280, Math.min(600, startW + diff))
  }

  function onUp() {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const suggestions = [
  'Create a text summarization workflow',
  'Build a workflow that translates English to Chinese',
  'Create a code review workflow',
]

const WORKFLOW_SYSTEM_PROMPT = `You are a workflow generator for an AI Workflow visual platform.
Given the user's request, generate a workflow JSON with nodes and edges.

Available node types:
- "input": User input text. data: { "text": "..." }
- "prompt": AI prompt node. data: { "prompt": "...", "model": "deepseek", "temperature": 0.7 }
- "output": AI output display. data: { "output": "" }

IMPORTANT RULES:
- Always include exactly one input, one prompt, and one output node
- The prompt field in the prompt node should contain the actual system instruction
- The text field in the input node should describe what the user will provide
- Nodes must be connected in order: input → prompt → output
- Positions should be laid out vertically with 150px spacing
- Use unique string IDs like "input-1", "prompt-1", "output-1"

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "nodes": [...],
  "edges": [...]
}`

function scrollToBottom() {
  nextTick(() => {
    const el = messagesRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function sendMessage(text) {
  const content = text || inputText.value
  if (!content.trim() || loading.value) return

  inputText.value = ''
  messages.value.push({ role: 'user', content })
  scrollToBottom()

  loading.value = true

  try {
    const api = store.getApiConfig('deepseek')
    if (!api.key) {
      throw new Error('Please set VITE_DEEPSEEK_KEY in .env to use the AI assistant')
    }

    const chatMessages = [
      { role: 'system', content: WORKFLOW_SYSTEM_PROMPT },
      ...messages.value
        .filter(m => m.role === 'user' || m.aiContent)
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.aiContent || m.content,
        })),
    ]

    const response = await fetch(api.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api.key}`,
      },
      body: JSON.stringify({ model: api.model, messages: chatMessages, temperature: 0.2 }),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || ''

    let workflow = null
    let displayText = reply

    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        workflow = JSON.parse(jsonMatch[0])
        if (workflow.nodes && workflow.nodes.length > 0) {
          displayText = `I've generated a workflow for you.`
        }
      }
    } catch { }

    const msgEntry = {
      role: 'assistant',
      content: displayText,
      aiContent: reply,
      rendered: renderMarkdown(displayText),
      workflow: workflow?.nodes?.length > 0 ? workflow : null,
    }

    messages.value.push(msgEntry)
    scrollToBottom()
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: `Error: ${err.message}`,
      rendered: renderMarkdown(`**Error:** ${err.message}`),
    })
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

function applyWorkflow(workflow) {
  store.applyWorkflowJson(workflow)
  emit('close')
  ElMessage.success('Workflow applied to flow!')
}
</script>

<template>
  <div class="chat-wrapper" :style="{ width: visible ? panelWidth + 'px' : 0 }">
    <div class="chat-panel">
      <div class="resize-handle" @mousedown="startResize" />
      <div class="chat-header">
        <h3>AI Assistant</h3>
        <el-button text class="close-btn" @click="$emit('close')">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>

      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome">
          <div class="welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p class="welcome-title">AI Workflow Assistant</p>
          <p class="welcome-desc">Describe the workflow you want, and I'll build it for you.</p>
          <div class="suggestions">
            <button v-for="s in suggestions" :key="s" class="suggestion-chip" @click="sendMessage(s)">
              {{ s }}
            </button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i" class="message" :class="msg.role">
          <div class="msg-content" v-if="msg.role === 'user'">{{ msg.content }}</div>
          <div class="msg-content ai" v-else v-html="msg.rendered" />
          <div v-if="msg.workflow" class="workflow-actions">
            <el-button type="primary" size="small" :icon="Plus" @click="applyWorkflow(msg.workflow)">
              Apply to Canvas
            </el-button>
          </div>
        </div>

        <div v-if="loading" class="message assistant">
          <div class="typing">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input v-model="inputText" type="textarea" :rows="2" :disabled="loading"
          placeholder="Describe your workflow..." @keydown.enter.prevent="!$event.isComposing && sendMessage()" />
        <el-button type="primary" :icon="Promotion" :loading="loading" :disabled="!inputText.trim()"
          @click="sendMessage()" class="send-btn" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.25s ease;
}

.chat-panel {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
}

.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
  z-index: 10;
  transition: background 0.15s;
}

.resize-handle:hover,
.resize-handle:active {
  background: var(--accent-primary);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.chat-header h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn {
  color: var(--text-secondary) !important;
  font-size: 18px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px 10px;
  text-align: center;
}

.welcome-icon {
  color: var(--accent-primary);
  margin-bottom: 8px;
}

.welcome-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.welcome-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  width: 100%;
}

.suggestion-chip {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.suggestion-chip:hover {
  border-color: var(--accent-primary);
  color: var(--accent-hover);
  background: rgba(99, 102, 241, 0.08);
}

.message {
  max-width: 90%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.msg-content {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .msg-content {
  background: var(--accent-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-content.ai {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.msg-content.ai :deep(p) {
  margin: 4px 0;
}

.msg-content.ai :deep(code) {
  font-family: var(--font-mono);
  font-size: 12px;
}

.msg-content.ai :deep(:not(pre) > code) {
  background: rgba(99, 102, 241, 0.12);
  padding: 1px 4px;
  border-radius: 3px;
}

.msg-content.ai :deep(pre) {
  margin: 6px 0;
  padding: 8px 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
}

.workflow-actions {
  margin-top: 8px;
}

.typing {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  border-bottom-left-radius: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s infinite both;
}

.dot:nth-child(2) {
  animation-delay: 0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-6px);
  }
}

.chat-input {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input :deep(.el-textarea__inner) {
  background: var(--bg-primary) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
  resize: none;
  font-size: 13px;
}

.send-btn {
  flex-shrink: 0;
  height: 36px !important;
  width: 36px !important;
  padding: 0 !important;
  font-size: 16px;
}
</style>
