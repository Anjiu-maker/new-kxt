<script setup>
import { computed } from 'vue'
import { CircleCheck, Warning, Select } from '@element-plus/icons-vue'
import { legacyModules, refactorPrinciples, refactorRisks } from '@/config/refactorMap'
import { legacyCompatibilityTasks } from '@/services/legacyCompatibility'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const statusCounts = computed(() => {
  return legacyModules.reduce(
    (counts, item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1
      return counts
    },
    {}
  )
})

function riskType(risk) {
  return risk === '高' ? 'danger' : risk === '中' ? 'warning' : 'success'
}
</script>

<template>
  <main class="migration-dashboard">
    <section class="principle-strip">
      <article
        v-for="principle in refactorPrinciples"
        :key="principle.title"
        class="principle-card"
        :class="`principle-card--${principle.tone}`"
      >
        <span></span>
        <h2>{{ principle.title }}</h2>
        <p>{{ principle.description }}</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel panel--wide">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Migration Map</p>
            <h2>旧项目模块迁移清单</h2>
          </div>
          <div class="summary-pills">
            <el-tag type="success">已起步 {{ statusCounts['已起步'] ?? 0 }}</el-tag>
            <el-tag type="warning">待迁移 {{ statusCounts['待迁移'] ?? 0 }}</el-tag>
            <el-tag>进行中 {{ statusCounts['进行中'] ?? 0 }}</el-tag>
          </div>
        </div>

        <el-table :data="legacyModules" class="module-table" highlight-current-row>
          <el-table-column prop="name" label="模块" width="150" />
          <el-table-column prop="legacyPath" label="旧项目位置" min-width="220" />
          <el-table-column prop="targetPath" label="目标位置" min-width="210" />
          <el-table-column label="风险" width="90">
            <template #default="{ row }">
              <el-tag :type="riskType(row.risk)" effect="plain">{{ row.risk }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" @click="appStore.setActiveModule(row.key)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </article>

      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Current Focus</p>
            <h2>{{ appStore.activeModule.name }}</h2>
          </div>
        </div>
        <p class="module-note">{{ appStore.activeModule.notes }}</p>
        <dl class="module-detail">
          <div>
            <dt>旧位置</dt>
            <dd>{{ appStore.activeModule.legacyPath }}</dd>
          </div>
          <div>
            <dt>新位置</dt>
            <dd>{{ appStore.activeModule.targetPath }}</dd>
          </div>
        </dl>
      </article>

      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Safety Net</p>
            <h2>第一批安全网</h2>
          </div>
        </div>
        <ul class="check-list">
          <li v-for="task in legacyCompatibilityTasks" :key="task.name">
            <el-icon :class="{ pending: !task.done }">
              <CircleCheck v-if="task.done" />
              <Warning v-else />
            </el-icon>
            <span>{{ task.label }}</span>
          </li>
        </ul>
      </article>

      <article class="panel panel--wide">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Risk Ledger</p>
            <h2>当前风险记录</h2>
          </div>
          <el-icon class="panel__icon"><Select /></el-icon>
        </div>
        <ol class="risk-list">
          <li v-for="risk in refactorRisks" :key="risk">{{ risk }}</li>
        </ol>
      </article>
    </section>
  </main>
</template>
