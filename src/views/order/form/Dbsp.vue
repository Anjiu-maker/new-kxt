<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'

const props = defineProps({ visible: Boolean, row: Object, page: { type: String, default: '' } })
const emit = defineEmits(['update:visible', 'success'])
const innerVisible = ref(false)
const loading = ref(false)
const orderInfoRef = ref()
const formModel = ref({ remarks: '', mediaSupervision: 0 })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleClick(agreeOrNot) {
  try {
    await ElMessageBox.confirm(agreeOrNot ? '确认同意吗?' : '确认不予督办吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const api = props.page === 'ghdb' ? '/orderInfo/inspectorPostApproval' : '/orderInfo/auditPostApproval'
    const res = await http.post(api, { ...formModel.value, agreeOrNot, orderId: props.row?.orderId, taskId: props.row?.taskId })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="督办审批" width="800px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks:'', mediaSupervision:0 }">
    <Orderinfo ref="orderInfoRef" />
    <el-form label-width="90px"  style="margin-top:12px">
      <el-form-item label="审批意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="审批意见" maxlength="500" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button type="danger" :loading="loading" @click="handleClick(0)">不予督办</el-button>
      <el-button type="primary" :loading="loading" @click="handleClick(1)">同意</el-button>
      <el-button @click="innerVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
