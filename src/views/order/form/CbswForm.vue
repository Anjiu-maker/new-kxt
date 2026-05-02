<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'

const props = defineProps({ visible: Boolean, row: Object })
const emit = defineEmits(['update:visible', 'success'])
const innerVisible = ref(false)
const loading = ref(false)
const orderInfoRef = ref()

const formModel = ref({
  isReal: '是', isContactPerson: 1, isReplyPerson: 1,
  contactTime: '', replyTime: '', contactCause: '', replyCause: '',
  basicInfo: '', resultHandling: '',
  feedbackerDept: '', feedbackerName: '', feedbackerTel: '',
  deptSatisfactionss: 2
})

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post('/orderInfo/addOrderPart', { ...formModel.value, orderId: props.row?.orderId, taskId: props.row?.taskId })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="重办事务" width="900px" :close-on-click-modal="false" append-to-body @closed="formModel = { isReal:'是', isContactPerson:1, isReplyPerson:1, contactTime:'', replyTime:'', contactCause:'', replyCause:'', basicInfo:'', resultHandling:'', feedbackerDept:'', feedbackerName:'', feedbackerTel:'', deptSatisfactionss:2 }">
    <Orderinfo ref="orderInfoRef" />
    <el-form label-width="110px" size="small" style="margin-top:12px">
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item label="是否属实"><el-select v-model="formModel.isReal"><el-option label="是" value="是" /><el-option label="否" value="否" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="联系群众"><el-select v-model="formModel.isContactPerson"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="回复群众"><el-select v-model="formModel.isReplyPerson"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select></el-form-item></el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="联系时间"><el-date-picker v-model="formModel.contactTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="回复时间"><el-date-picker v-model="formModel.replyTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
      </el-row>
      <el-form-item label="基本情况"><el-input v-model="formModel.basicInfo" type="textarea" :autosize="{ minRows:2 }" /></el-form-item>
      <el-form-item label="处理结果"><el-input v-model="formModel.resultHandling" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item label="反馈部门"><el-input v-model="formModel.feedbackerDept" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="处理人员"><el-input v-model="formModel.feedbackerName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="联系方式"><el-input v-model="formModel.feedbackerTel" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
