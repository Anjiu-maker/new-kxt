<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { getOrderDetail } from '@/services/workbenchService'

const props = defineProps({ visible: Boolean, row: Object })
const emit = defineEmits(['update:visible', 'success'])
const innerVisible = ref(false)
const loading = ref(false)
const orderData = ref({})
const formRef = ref()
const formModel = ref({ remarks: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) loadOrder()
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function loadOrder() {
  try {
    const res = await getOrderDetail(props.row.orderNo)
    if (res.data?.code === 200) orderData.value = res.data.data ?? {}
  } catch { orderData.value = {} }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await ElMessageBox.confirm('您确认再次督办吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post('/orderInfo/ercidb', { orderId: props.row.orderId, taskId: props.row.taskId, remarks: formModel.value.remarks })
    if (res.data?.code === 200) {
      ElMessage.success(res.data.message || '操作成功')
      innerVisible.value = false
      emit('success')
    } else { ElMessage.error(res.data.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="再次督办" width="800px" :close-on-click-modal="false" append-to-body @closed="formModel.remarks=''; orderData={}">
    <div v-if="orderData.orderNo" class="order-brief">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="工单编号">{{ orderData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="工单类型">{{ orderData.orderTypeName }}</el-descriptions-item>
        <el-descriptions-item label="诉求人">{{ orderData.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderData.callTel }}</el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ orderData.title }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <el-form ref="formRef" :model="formModel" label-width="100px" style="margin-top:16px" :rules="{ remarks: [{ required: true, message: '请填写督办意见', trigger: 'blur' }] }">
      <el-form-item label="督办意见" prop="remarks">
        <el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows: 4, maxRows: 10 }" placeholder="请填写再次督办意见" maxlength="1000" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="innerVisible = false">关闭</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">再次督办</el-button>
    </template>
  </el-dialog>
</template>
