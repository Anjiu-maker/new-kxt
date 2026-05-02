<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCtiStore } from '@/stores/cti'

const authStore = useAuthStore()
const ctiStore = useCtiStore()

const emit = defineEmits(['quick-dial'])

const userInfo = computed(() => authStore.userInfo ?? {})
const showTel = computed(() => ctiStore.showTel.value && userInfo.value.deptId !== -1)
const showSxbdk = computed(() => ctiStore.showSxbdk.value && userInfo.value.deptId !== -1)
const showDlsm = computed(() => ctiStore.showDlsm.value)
const telNum = computed(() => localStorage.getItem('telNum') || '')

function formatTel(value) {
  if (!value) return ''
  const str = String(value)
  if (str.length <= 8) return str
  return `${str.slice(0, 4)} ${str.slice(4)}`
}

function onQuickDial(tel) {
  emit('quick-dial', tel)
}
</script>

<template>
  <div v-if="showTel" class="cti-topbar">
    <div class="cti-topbar__tel">
      <div class="cti-topbar__info">
        <span class="cti-topbar__label">&nbsp;</span>

        <template v-if="ctiStore.ctiCurrentTel">
          <span class="cti-topbar__label">归属地:</span>
          <span class="cti-topbar__value cti-topbar__value--attr">{{ ctiStore.ctiCurrentTelGsd || '未知' }}</span>

          <span class="cti-topbar__label">来电号码:</span>
          <span class="cti-topbar__value cti-topbar__value--tel">{{ formatTel(ctiStore.ctiCurrentTel) }}</span>
        </template>

        <template v-if="ctiStore.ctiCurrentWaitNumList.length > 0">
          <template v-for="(item, index) in ctiStore.ctiCurrentWaitNumList" :key="index">
            <span v-if="item.count > 0" class="cti-topbar__label">{{ item.num }}等待人数:</span>
            <span v-if="item.count > 0" class="cti-topbar__value cti-topbar__value--queue">{{ item.count }}</span>
          </template>
        </template>

        <template v-if="ctiStore.ctiTopBarStateText">
          <span class="cti-topbar__label">{{ ctiStore.ctiTopBarStateText }}:</span>
          <span class="cti-topbar__value cti-topbar__value--timer">{{ ctiStore.ctiTopBarStateValue }}</span>
        </template>
      </div>

      <div class="cti-topbar__quick">
        <button class="cti-topbar__quick-btn cti-topbar__quick-btn--110" title="110" @click="onQuickDial(110)" />
        <button class="cti-topbar__quick-btn cti-topbar__quick-btn--119" title="119" @click="onQuickDial(119)" />
        <button class="cti-topbar__quick-btn cti-topbar__quick-btn--120" title="120" @click="onQuickDial(120)" />
        <button class="cti-topbar__quick-btn cti-topbar__quick-btn--122" title="122" @click="onQuickDial(122)" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cti-topbar {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 0 24px;
  background: #f0f4ff;
  border-bottom: 1px solid var(--kxt-line);
  font-size: 13px;
}

.cti-topbar__tel {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.cti-topbar__info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.cti-topbar__label {
  color: #666;
  font-size: 12px;
  flex-shrink: 0;
}

.cti-topbar__value {
  color: var(--kxt-ink-strong);
  font-weight: 600;
  flex-shrink: 0;

  &--attr {
    color: #1F80B8;
  }

  &--tel {
    color: #f44336;
  }

  &--queue {
    color: #ff9800;
    margin-left: -2px;
  }

  &--timer {
    color: #1F80B8;
    font-variant-numeric: tabular-nums;
  }
}

.cti-topbar__quick {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.cti-topbar__quick-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: opacity .2s;

  &:hover {
    opacity: .8;
  }

  &--110 {
    background: #d03050;
  }

  &--119 {
    background: #f0a020;
  }

  &--120 {
    background: #18a058;
  }

  &--122 {
    background: #2080f0;
  }
}
</style>
