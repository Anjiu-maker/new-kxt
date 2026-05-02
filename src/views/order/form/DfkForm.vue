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
const handleTypeRadio = ref(0) // 0=上报 1=延期 2=处理记录

const fkModel = ref({
  isReal: '是', isContactPerson: 1, isReplyPerson: 1,
  contactTime: '', replyTime: '', contactCause: '', replyCause: '',
  basicInfo: '', resultHandling: '', feedbackerDept: '', feedbackerName: '', feedbackerTel: ''
})
const yqModel = ref({ yqTime: '', reasonsDelay: '' })
const clgcModel = ref({ processRecord: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

function getApi() {
  if (handleTypeRadio.value === 0) return '/orderInfo/addOrderPart'
  if (handleTypeRadio.value === 1) return '/orderInfo/applyDelay'
  return '/orderInfo/addRecord'
}

function getParams() {
  const base = { orderId: props.row?.orderId, taskId: props.row?.taskId }
  if (handleTypeRadio.value === 0) return { ...base, ...fkModel.value }
  if (handleTypeRadio.value === 1) return { ...base, ...yqModel.value, flowHandleType: '申请延期' }
  return { ...base, ...clgcModel.value }
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post(getApi(), getParams())
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="待反馈处理" width="900px" :close-on-click-modal="false" append-to-body>
    <Orderinfo ref="orderInfoRef" />
    <div style="margin-top:12px"><span style="font-weight:600">受理方式：</span>
      <el-radio-group v-model="handleTypeRadio"><el-radio :label="0">上报事务</el-radio><el-radio :label="1">延期</el-radio><el-radio :label="2">处理记录</el-radio></el-radio-group>
    </div>

    <el-form v-show="handleTypeRadio === 0" label-width="110px" size="small" style="margin-top:12px">
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item label="是否属实"><el-select v-model="fkModel.isReal"><el-option label="是" value="是" /><el-option label="否" value="否" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="联系群众"><el-select v-model="fkModel.isContactPerson"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="回复群众"><el-select v-model="fkModel.isReplyPerson"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select></el-form-item></el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="联系时间"><el-date-picker v-model="fkModel.contactTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="回复时间"><el-date-picker v-model="fkModel.replyTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
      </el-row>
      <el-form-item label="基本情况"><el-input v-model="fkModel.basicInfo" type="textarea" :autosize="{ minRows:2 }" /></el-form-item>
      <el-form-item label="处理结果"><el-input v-model="fkModel.resultHandling" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item label="反馈部门"><el-input v-model="fkModel.feedbackerDept" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="处理人员"><el-input v-model="fkModel.feedbackerName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="联系方式"><el-input v-model="fkModel.feedbackerTel" /></el-form-item></el-col>
      </el-row>
    </el-form>

    <el-form v-show="handleTypeRadio === 1" label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="延期至"><el-date-picker v-model="yqModel.yqTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
      <el-form-item label="延期原因"><el-input v-model="yqModel.reasonsDelay" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
    </el-form>

    <el-form v-show="handleTypeRadio === 2" label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="处理记录"><el-input v-model="clgcModel.processRecord" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
    </el-form>

    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
