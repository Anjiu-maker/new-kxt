<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCtiStore } from '@/stores/cti'

const ctiStore = useCtiStore()

const visible = defineModel('visible', { type: Boolean, default: false })
const remark = ref('')
const submitting = ref(false)

function open() {
  remark.value = ''
  visible.value = true
}

function submit() {
  if (!remark.value) {
    ElMessage.warning('请输入加入黑名单的原因')
    return
  }
  // Placeholder: Not connected to real API yet
  ElMessage.info('黑名单功能暂未接入 CTI')
  visible.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="加入黑名单" width="420px" :close-on-click-modal="false">
    <el-form label-width="80px" label-suffix=":">
      <el-form-item label="电话号码">
        <el-input :model-value="ctiStore.ctiCurrentTel || '当前无通话'" readonly />
      </el-form-item>
      <el-form-item label="拉黑原因">
        <el-input v-model="remark" placeholder="请输入加入黑名单的原因" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
