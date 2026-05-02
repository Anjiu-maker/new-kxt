<script setup>
import { ref } from 'vue'
import { DataLine, DocumentChecked, Finished, Grid, Refresh } from '@element-plus/icons-vue'

const navItems = [
  { label: '重构工作台', icon: Grid },
  { label: '迁移清单', icon: DocumentChecked },
  { label: '安全网', icon: Finished },
  { label: '复盘记录', icon: DataLine }
]

const activeNav = ref('重构工作台')
</script>

<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <div class="brand">
        <span class="brand__mark">K</span>
        <div>
          <strong>new_kxt</strong>
          <small>AI 重构工作台</small>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="重构导航">
        <button
          v-for="item in navItems"
          :key="item.label"
          class="sidebar-nav__item"
          :class="{ 'is-active': activeNav === item.label }"
          type="button"
          @click="activeNav = item.label"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>

    <section class="app-main">
      <header class="topbar">
        <div>
          <p>小步快跑，先稳后优</p>
          <h1>新项目迁移骨架</h1>
        </div>
        <el-button :icon="Refresh">刷新状态</el-button>
      </header>

      <RouterView />
    </section>
  </div>
</template>
