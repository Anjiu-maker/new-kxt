<script setup>
import { ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'

const activePanel = ref('overview')

const stats = [
  { label: '今日任务', value: '24', tone: 'green' },
  { label: '待处理', value: '8', tone: 'amber' },
  { label: '完成率', value: '92%', tone: 'blue' }
]

const tasks = [
  { title: '项目初始化', status: '已完成', type: 'success' },
  { title: 'Element Plus 接入', status: '已完成', type: 'success' },
  { title: '业务模块开发', status: '待开始', type: 'warning' }
]
</script>

<template>
  <main class="app-shell">
    <section class="workspace">
      <div class="workspace__intro">
        <p class="eyebrow">Vue 3 · Element Plus · Sass</p>
        <h1>新项目工作台</h1>
        <p class="summary">
          一个已经接入基础工程能力的前端起点，可以继续扩展路由、状态管理和业务页面。
        </p>

        <div class="actions">
          <el-button type="primary" :icon="Plus">新增任务</el-button>
          <el-button :icon="Refresh">刷新</el-button>
        </div>
      </div>

      <div class="overview-grid">
        <article v-for="item in stats" :key="item.label" class="metric-card" :class="`metric-card--${item.tone}`">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>

      <section class="panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Project Flow</p>
            <h2>启动清单</h2>
          </div>
          <el-segmented v-model="activePanel" :options="['overview', 'tasks', 'settings']" />
        </div>

        <el-table :data="tasks" class="task-table">
          <el-table-column prop="title" label="事项" />
          <el-table-column label="状态" width="140">
            <template #default="{ row }">
              <el-tag :type="row.type" effect="dark">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </section>
  </main>
</template>
