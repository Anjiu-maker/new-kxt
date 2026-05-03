<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Bell, DataLine, Refresh, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getWorkbenchCount, getWorkbenchList, getWorkbenchNotices } from '@/services/workbenchService'
import { useAuthStore } from '@/stores/auth'
import { resolveWorkbenchConfig } from './workbenchConfig'

const props = defineProps({
  pageName: {
    type: String,
    default: 'BlankPage'
  }
})

const authStore = useAuthStore()
const loading = ref(false)
const notices = ref([])
const todos = ref([])
const metricValues = reactive({})
const warningValues = reactive({})

const config = computed(() => resolveWorkbenchConfig(props.pageName || 'BlankPage'))
const userName = computed(() => authStore.userInfo?.userName || authStore.userInfo?.account || '用户')
const roleName = computed(() => authStore.userInfo?.roleName || authStore.userInfo?.roleCode || '当前角色')
const hasDataCards = computed(() => config.value.metrics.length > 0 || config.value.warnings.length > 0)

function readCountPayload(payload, item = {}) {
  const data = payload?.data

  if (item.valuePath === 'records.length') {
    return data?.records?.length ?? 0
  }

  if (typeof data?.total === 'number') {
    return data.total
  }

  if (Array.isArray(data?.records)) {
    return data.records.length
  }

  if (typeof data === 'number') {
    return data
  }

  return 0
}

async function loadMetric(item, target) {
  try {
    const response = await getWorkbenchCount(item.api, item.params)
    if (response.data?.code === 200) {
      target[item.key] = readCountPayload(response.data, item)
    }
  } catch {
    target[item.key] = 0
  }
}

async function loadNotices() {
  try {
    const response = await getWorkbenchNotices()
    if (response.data?.code === 200) {
      notices.value = response.data.data?.records ?? []
    }
  } catch {
    notices.value = []
  }
}

async function loadTodos() {
  if (!config.value.todoApi) {
    todos.value = []
    return
  }

  try {
    const response = await getWorkbenchList(config.value.todoApi, { pageSize: 6 })
    if (response.data?.code === 200) {
      todos.value = response.data.data?.records ?? []
    }
  } catch {
    todos.value = []
  }
}

async function loadWorkbench() {
  loading.value = true

  try {
    await Promise.all([
      ...config.value.metrics.map((item) => loadMetric(item, metricValues)),
      ...config.value.warnings.map((item) => loadMetric(item, warningValues)),
      loadNotices(),
      loadTodos()
    ])
  } finally {
    loading.value = false
  }
}

function formatTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(Number(value) * 1000)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const pad = (item) => String(item).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function previewClick(item) {
  ElMessage.info(`${item.label} 对应列表页会随业务页面迁移接入`)
}

watch(
  () => props.pageName,
  () => {
    loadWorkbench()
  }
)

onMounted(loadWorkbench)
</script>

<template>
  <section class="role-workbench" v-loading="loading">
    <header class="workbench-hero">
      <div>
        <p class="eyebrow">Role Workspace</p>
        <h1>{{ config.title }}</h1>
        <p>{{ config.subtitle }}</p>
      </div>
      <div class="hero-user">
        <span>{{ roleName }}</span>
        <strong>{{ userName }}</strong>
        <el-button :icon="Refresh" type="primary" plain @click="loadWorkbench">刷新</el-button>
      </div>
    </header>

    <el-empty
      v-if="!hasDataCards"
      class="blank-workbench"
      description="当前角色未配置专属首页，已进入系统主框架。"
    />

    <template v-else>
      <section class="metric-grid">
        <button
          v-for="item in config.metrics"
          :key="item.key"
          class="metric-card"
          :class="`tone-${item.tone || 'blue'}`"
          type="button"
          @click="previewClick(item)"
        >
          <span>{{ item.label }}</span>
          <strong>{{ metricValues[item.key] ?? 0 }}</strong>
          <small>件</small>
        </button>
      </section>

      <section class="workbench-grid">
        <article class="workbench-panel warning-panel">
          <header>
            <div>
              <el-icon><DataLine /></el-icon>
              <strong>预警与流转</strong>
            </div>
          </header>
          <div v-if="config.warnings.length > 0" class="warning-list">
            <button v-for="item in config.warnings" :key="item.key" type="button" @click="previewClick(item)">
              <span>{{ item.label }}</span>
              <strong>{{ warningValues[item.key] ?? 0 }} 件</strong>
            </button>
          </div>
          <el-empty v-else description="暂无预警配置" />
        </article>

        <article class="workbench-panel">
          <header>
            <div>
              <el-icon><Tickets /></el-icon>
              <strong>待办预览</strong>
            </div>
          </header>
          <el-table v-if="todos.length > 0" :data="todos"  height="270">
            <el-table-column prop="orderNo" label="事务编号" min-width="150" show-overflow-tooltip />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="stateName" label="状态" width="100" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="暂无待办数据" />
        </article>

        <article class="workbench-panel notice-panel">
          <header>
            <div>
              <el-icon><Bell /></el-icon>
              <strong>通知公告</strong>
            </div>
          </header>
          <ul v-if="notices.length > 0" class="notice-list">
            <li v-for="notice in notices" :key="notice.id">
              <span>{{ notice.title }}</span>
              <time>{{ formatTime(notice.addTime) }}</time>
            </li>
          </ul>
          <el-empty v-else description="暂无公告" />
        </article>
      </section>
    </template>
  </section>
</template>

<style scoped lang="scss">
.role-workbench {
  min-height: calc(100dvh - 300px);
}

.workbench-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  margin-bottom: 18px;
  padding: 24px;
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(244, 249, 255, 0.98), rgba(255, 255, 255, 0.96)),
    var(--kxt-panel);
  box-shadow: 0 24px 60px -44px rgba(49, 103, 221, 0.6);

  h1 {
    margin: 4px 0 8px;
    color: #1c4886;
    font-size: 26px;
  }

  p {
    margin: 0;
    color: var(--kxt-muted);
  }
}

.hero-user {
  display: grid;
  gap: 8px;
  min-width: 180px;
  justify-items: end;

  span {
    color: var(--kxt-muted);
    font-size: 13px;
  }

  strong {
    color: var(--kxt-ink-strong);
    font-size: 18px;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.metric-card {
  display: grid;
  gap: 8px;
  min-height: 116px;
  padding: 18px;
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background: var(--kxt-panel);
  cursor: pointer;
  text-align: left;
  box-shadow: 0 16px 38px -32px rgba(49, 103, 221, 0.48);

  span {
    color: var(--kxt-muted);
    font-size: 13px;
  }

  strong {
    color: var(--metric-color, var(--kxt-brand));
    font-size: 32px;
    line-height: 1;
  }

  small {
    color: #94a3b8;
  }

  &:hover {
    border-color: var(--metric-color, var(--kxt-brand));
    transform: translateY(-1px);
  }
}

.tone-blue {
  --metric-color: #3167dd;
}

.tone-green {
  --metric-color: #16a34a;
}

.tone-orange {
  --metric-color: #ea580c;
}

.tone-red {
  --metric-color: #d03050;
}

.tone-yellow {
  --metric-color: #ca8a04;
}

.tone-slate {
  --metric-color: #475569;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(360px, 1.4fr) minmax(260px, 1fr);
  gap: 18px;
}

.workbench-panel {
  min-height: 340px;
  padding: 18px;
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background: var(--kxt-panel);
  box-shadow: 0 20px 56px -44px rgba(49, 103, 221, 0.46);

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;

    div {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--kxt-ink-strong);
    }
  }
}

.warning-list {
  display: grid;
  gap: 10px;

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 46px;
    padding: 0 12px;
    border: 1px solid #e8edf5;
    border-radius: 6px;
    background: #f7fbff;
    color: var(--kxt-ink);
    cursor: pointer;

    strong {
      color: var(--kxt-brand);
    }
  }
}

.notice-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: 5px;
    padding: 10px 0;
    border-bottom: 1px solid #edf2f7;
  }

  span {
    overflow: hidden;
    color: var(--kxt-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  time {
    color: #94a3b8;
    font-size: 12px;
  }
}

.blank-workbench {
  min-height: 320px;
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background: var(--kxt-panel);
}

@media (max-width: 1180px) {
  .workbench-grid,
  .workbench-hero {
    grid-template-columns: 1fr;
  }

  .hero-user {
    justify-items: start;
  }
}
</style>
