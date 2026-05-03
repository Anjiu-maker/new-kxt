<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'

const props = defineProps({ visible: Boolean, row: Object })
const emit = defineEmits(['update:visible', 'success'])
const innerVisible = ref(false); const loading = ref(false); const orderInfoRef = ref()
const handleTypeRadio = ref(0)
const ghdbModel = ref({ serverCenterOpinion: '督查室直接督办', handleingProblem: '', remarks: '' })
const dxdbModel = ref({ remarks: '' })

watch(() => props.visible, val => { innerVisible.value = val; if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100) })
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const api = handleTypeRadio.value === 0 ? '/orderInfo/zjSupervision' : '/orderInfo/smsSupervision'
    const model = handleTypeRadio.value === 0 ? ghdbModel.value : dxdbModel.value
    const res = await http.post(api, { ...model, orderId: props.row?.orderId, taskId: props.row?.taskId })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') } else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="督办审批" width="800px" :close-on-click-modal="false" append-to-body>
    <Orderinfo ref="orderInfoRef" />
    <div style="margin-top:12px"><span style="font-weight:600">督办方式：</span>
      <el-radio-group v-model="handleTypeRadio"><el-radio :label="0">挂号督办</el-radio><el-radio :label="1">短信督办</el-radio></el-radio-group>
    </div>
    <el-form label-width="100px"  style="margin-top:12px">
      <template v-if="handleTypeRadio === 0">
        <el-form-item label="服务中心意见"><el-input v-model="ghdbModel.serverCenterOpinion" /></el-form-item>
        <el-form-item label="存在问题"><el-input v-model="ghdbModel.handleingProblem" type="textarea" :autosize="{ minRows:2 }" /></el-form-item>
        <el-form-item label="督办意见"><el-input v-model="ghdbModel.remarks" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
      </template>
      <el-form-item v-else label="督办意见"><el-input v-model="dxdbModel.remarks" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
