<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useCtiStore } from '@/stores/cti'

const ctiStore = useCtiStore()

const visible = computed({
  get: () => ctiStore.showRestDialog,
  set: (val) => { ctiStore.showRestDialog = val }
})

const restTime = ref(null)
const restOptions = computed(() => ctiStore.getRestOptions())

watch(visible, (val) => {
  if (val) {
    restTime.value = null
  }
})

function formatLabel(option) {
  return ctiStore.restLabel(option.type, option.time)
}

function submit() {
  if (restTime.value == null) {
    ElMessage.error('请选择小休类型！')
    return
  }
  const selected = restOptions.value.find((item) => item.time === restTime.value)
  ctiStore.startRestTimer(restTime.value, selected?.type || '')
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="小休选择"
    width="360px"
    :close-on-click-modal="false"
  >
    <span>小休类型：</span>
    <el-select
      v-model="restTime"
      
      clearable
      placeholder="请选择小休类型"
      style="width: 220px"
    >
      <el-option
        v-for="item in restOptions"
        :key="item.type"
        :label="formatLabel(item)"
        :value="item.time"
      />
    </el-select>
    <template #footer>
      <el-button  type="warning" @click="visible = false">取消</el-button>
      <el-button  type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
