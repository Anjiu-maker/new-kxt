import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { legacyModules } from '@/config/refactorMap'

export const useAppStore = defineStore('app', () => {
  const activeModuleKey = ref('foundation')
  const completedChecks = ref(['buildable-app', 'clean-worktree'])

  const activeModule = computed(() => {
    return legacyModules.find((item) => item.key === activeModuleKey.value) ?? legacyModules[0]
  })

  function setActiveModule(key) {
    activeModuleKey.value = key
  }

  function markCheckDone(check) {
    if (!completedChecks.value.includes(check)) {
      completedChecks.value.push(check)
    }
  }

  return {
    activeModuleKey,
    activeModule,
    completedChecks,
    setActiveModule,
    markCheckDone
  }
})
