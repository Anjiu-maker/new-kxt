<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const visible = defineModel('visible', { type: Boolean, default: false })
const phoneNumber = ref('')

function open() {
  phoneNumber.value = ''
  visible.value = true
}

function submit() {
  if (!phoneNumber.value) {
    ElMessage.warning('请输入要呼叫的号码')
    return
  }
  // Placeholder: Not connected to real API yet
  ElMessage.info('呼叫功能暂未接入 CTI')
  visible.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="呼叫号码" width="380px" :close-on-click-modal="false">
    <el-form label-width="80px" label-suffix=":">
      <el-form-item label="电话号码">
        <el-input v-model="phoneNumber" placeholder="请输入要呼叫的号码" @keyup.enter="submit" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">呼叫</el-button>
    </template>
  </el-dialog>
</template>
