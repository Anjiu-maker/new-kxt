<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'

const props = defineProps({ visible: Boolean, row: Object })
const emit = defineEmits(['update:visible', 'success'])
const innerVisible = ref(false); const loading = ref(false); const orderInfoRef = ref()
const formModel = ref({ remarks: '' })

watch(() => props.visible, val => { innerVisible.value = val; if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100) })
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post('/orderInfo/mediaSupervision', { ...formModel.value, orderId: props.row?.orderId })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') } else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="媒体监督" width="800px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks:'' }">
    <Orderinfo ref="orderInfoRef" />
    <el-form label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="处理意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="处理意见" maxlength="500" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
