<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCtiStore } from '@/stores/cti'

const authStore = useAuthStore()
const ctiStore = useCtiStore()

const emit = defineEmits(['show-black-dialog', 'show-call-dialog'])

const userInfo = computed(() => authStore.userInfo ?? {})

const visible = computed(() => {
  return (ctiStore.showTel.value || ctiStore.showZnzs.value || ctiStore.showSxbdk.value) &&
    userInfo.value.deptId !== -1
})

const showTel = computed(() => ctiStore.showTel.value)
const showZnzs = computed(() => ctiStore.showZnzs.value)
const showSxbdk = computed(() => ctiStore.showSxbdk.value)
const showDlsm = computed(() => ctiStore.showDlsm.value)
const stateColor = computed(() => ctiStore.stateColor.value)
const ctiState = computed(() => ctiStore.ctiState.value)
const shixian = computed(() => ctiStore.toolbarBtnState.value.shixian)
const baochi = computed(() => ctiStore.toolbarBtnState.value.baochi)
const qrqcActive = computed(() => ctiStore.qrqcActive.value)

const barPos = ref(localStorage.getItem('tel-bar-pos') || 'right')

function togglePosition() {
  barPos.value = barPos.value === 'right' ? 'left' : 'right'
  localStorage.setItem('tel-bar-pos', barPos.value)
}

function onSxbdk() {
  ctiStore.setQrqcActive(!qrqcActive.value)
}

function onSmsx() {
  ctiStore.toggleShimangShixian()
}

function onThqx() {
  ctiStore.toggleBaochi()
}

function onHeimingdan() {
  emit('show-black-dialog')
}

function onHujiao() {
  emit('show-call-dialog')
}

function onJiankong() {
  // placeholder — not connected yet
}
</script>

<template>
  <div
    v-if="visible"
    class="cti-toolbar"
    :class="barPos === 'right' ? 'cti-toolbar--right' : 'cti-toolbar--left'"
  >
    <div v-if="showTel" class="cti-toolbar__state-flip">
      <div class="cti-toolbar__state-front" :style="{ background: stateColor }">
        <div class="cti-toolbar__state-text">{{ ctiState }}</div>
        <div class="cti-toolbar__state-label">当前状态</div>
      </div>
      <div class="cti-toolbar__state-back" @click="togglePosition">
        <svg v-if="barPos === 'right'" class="cti-toolbar__pos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <svg v-else class="cti-toolbar__pos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>

    <div class="cti-toolbar__list">
      <button
        v-if="showSxbdk"
        class="cti-toolbar__btn"
        @click="onSxbdk"
      >
        <span class="cti-toolbar__btn-icon" :class="qrqcActive ? 'cti-toolbar__btn-icon--qr' : 'cti-toolbar__btn-icon--qc'" />
        <span class="cti-toolbar__btn-text">{{ qrqcActive ? '上班打卡' : '下班打卡' }}</span>
      </button>

      <button
        v-if="showTel && !showDlsm"
        class="cti-toolbar__btn"
        @click="onSmsx"
      >
        <span class="cti-toolbar__btn-icon" :class="shixian ? 'cti-toolbar__btn-icon--sm' : 'cti-toolbar__btn-icon--sx'" />
        <span class="cti-toolbar__btn-text">{{ shixian ? '小休' : '空闲' }}</span>
      </button>

      <button
        v-if="showTel"
        class="cti-toolbar__btn"
        @click="onThqx"
      >
        <span class="cti-toolbar__btn-icon" :class="baochi ? 'cti-toolbar__btn-icon--thbc' : 'cti-toolbar__btn-icon--qxbc'" />
        <span class="cti-toolbar__btn-text">{{ baochi ? '通话保持' : '取消保持' }}</span>
      </button>

      <button
        v-if="showTel"
        class="cti-toolbar__btn"
        @click="onHeimingdan"
      >
        <span class="cti-toolbar__btn-icon cti-toolbar__btn-icon--hmd" />
        <span class="cti-toolbar__btn-text">黑名单</span>
      </button>

      <button
        v-if="showTel"
        class="cti-toolbar__btn"
        @click="onHujiao"
      >
        <span class="cti-toolbar__btn-icon cti-toolbar__btn-icon--hj" />
        <span class="cti-toolbar__btn-text">呼叫</span>
      </button>

      <button
        v-if="showTel"
        class="cti-toolbar__btn"
        @click="onJiankong"
      >
        <span class="cti-toolbar__btn-icon cti-toolbar__btn-icon--jk" />
        <span class="cti-toolbar__btn-text">监控</span>
      </button>

      <button
        v-if="showZnzs"
        class="cti-toolbar__btn"
        @click="onJiankong"
      >
        <span class="cti-toolbar__btn-icon cti-toolbar__btn-icon--jk" />
        <span class="cti-toolbar__btn-text">智能助手</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cti-toolbar {
  position: fixed;
  top: 205px;
  width: 80px;
  z-index: 100;
  background: #fff;
  border: 1px solid #e6ecf0;
  border-radius: 4px;
  box-shadow: 1px 1px 3px #dbe3ed;

  &--right {
    right: 50px;
  }

  &--left {
    left: 50px;
  }
}

.cti-toolbar__state-flip {
  width: 100%;
  height: 65px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform .8s;

  &:hover {
    transform: rotateY(180deg);
  }
}

.cti-toolbar__state-front,
.cti-toolbar__state-back {
  width: 100%;
  height: 65px;
  position: absolute;
  top: 0;
  left: 0;
  backface-visibility: hidden;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
}

.cti-toolbar__state-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cti-toolbar__state-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 30px;
}

.cti-toolbar__state-label {
  font-size: 14px;
  color: #fff;
}

.cti-toolbar__state-back {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(91, 131, 220, 1);
  transform: rotateY(180deg);
}

.cti-toolbar__pos-icon {
  width: 40px;
  height: 40px;
  color: #fff;
}

.cti-toolbar__list {
  min-height: 86px;
  padding: 10px 0;
  background: #fff;
}

.cti-toolbar__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 9px 0 4px;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: #d8e4fe;
  }
}

.cti-toolbar__btn-icon {
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  &--qr {
    background: #8bc34a;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--qc {
    background: #9e9e9e;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--sm {
    background: #ff9800;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm0-10h2v8h-2z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--sx {
    background: #00bcd4;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--thbc {
    background: #1F80B8;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 19h4V5H6v14zm8-14v14h4V5h-4z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--qxbc {
    background: #f44336;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--hmd {
    background: #e04040;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--hj {
    background: #18a058;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/%3E%3C/svg%3E") no-repeat center / contain;
  }

  &--jk {
    background: #2080f0;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E") no-repeat center / contain;
  }
}

.cti-toolbar__btn-text {
  font-size: 14px;
  color: #333;
  text-align: center;
  padding-top: 3px;
}
</style>
