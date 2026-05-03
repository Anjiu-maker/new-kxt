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
const formModel = ref({ remarks: '', isPublic: 0, handleTypeRadio: 0 })

const handleTypes = [
  { label: '归档', value: 0 },
  { label: '待跟进', value: 1 },
  { label: '重办', value: 2 },
  { label: '重新回访', value: 3 }
]

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

function getApiByType(type) {
  const apis = {
    0: '/orderInfo/zx_archived',
    1: '/orderInfo/zx_archived',
    2: '/orderInfo/applyHandle',
    3: '/orderInfo/revisit'
  }
  return apis[type] || apis[0]
}

function buildParams(type) {
  const base = { orderId: props.row.orderId, taskId: props.row.taskId, remarks: formModel.value.remarks }
  if (type === 0) return { ...base, isPublic: formModel.value.isPublic }
  if (type === 1) return { ...base, isFollowUp: 1, followUpContent: formModel.value.remarks, followUpTime: new Date().toISOString().slice(0, 19).replace('T', ' ') }
  if (type === 2) return { ...base, flowHandleType: '申请重办', pageType: 1 }
  return base
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const typeLabel = handleTypes.find(h => h.value === formModel.value.handleTypeRadio)?.label || '操作'
  try {
    await ElMessageBox.confirm(`您确认${typeLabel}吗?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const api = getApiByType(formModel.value.handleTypeRadio)
    const params = buildParams(formModel.value.handleTypeRadio)
    const res = await http.post(api, params)
    if (res.data?.code === 200) {
      ElMessage.success(res.data.message || '操作成功')
      innerVisible.value = false
      emit('success')
    } else { ElMessage.error(res.data.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="待归档处理" width="850px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks: '', isPublic: 0, handleTypeRadio: 0 }; orderData={}">
    <div v-if="orderData.orderNo" class="order-brief">
      <el-descriptions :column="2" border >
        <el-descriptions-item label="工单编号">{{ orderData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="工单类型">{{ orderData.orderTypeName }}</el-descriptions-item>
        <el-descriptions-item label="诉求人">{{ orderData.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderData.callTel }}</el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ orderData.title }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <div style="margin-top:12px">
      <span style="font-weight:600">受理方式：</span>
      <el-radio-group v-model="formModel.handleTypeRadio">
        <el-radio v-for="h in handleTypes" :key="h.value" :label="h.value">{{ h.label }}</el-radio>
      </el-radio-group>
    </div>
    <el-form ref="formRef" :model="formModel" label-width="100px" style="margin-top:12px" :rules="{ remarks: [{ required: true, message: '请输入处理意见', trigger: 'blur' }, { max: 1000, message: '不超过1000个字符', trigger: 'change' }] }">
      <el-form-item v-if="formModel.handleTypeRadio === 0" label="是否公开">
        <el-radio v-model="formModel.isPublic" :label="0">否</el-radio>
        <el-radio v-model="formModel.isPublic" :label="1">是</el-radio>
      </el-form-item>
      <el-form-item label="处理意见" prop="remarks">
        <el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows: 4, maxRows: 10 }" placeholder="请填写处理意见" maxlength="1000" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="innerVisible = false">关闭</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>
