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

const formModel = ref({ remarks: '', isAgree: '同意', resultHandling: '', checked: false, handleEndTime: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleSubmit(agree = true) {
  try {
    await ElMessageBox.confirm(agree ? '确认同意吗?' : '确认不同意吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const params = { ...formModel.value, isAgree: agree ? '同意' : '不同意', orderId: props.row?.orderId, taskId: props.row?.taskId }
    const api = agree ? '/orderInfo/sbOrderApproval' : '/orderInfo/sbOrderApproval'
    const res = await http.post(api, params)
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="审核处理" width="900px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks:'', isAgree:'同意', resultHandling:'', checked:false, handleEndTime:'' }">
    <Orderinfo ref="orderInfoRef" />

    <el-form label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="处理意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="请输入处理意见" maxlength="500" /></el-form-item>
      <el-form-item v-if="formModel.checked">
        <div style="display:flex;align-items:center;gap:8px"><el-checkbox v-model="formModel.checked" />修改</div>
        <el-input v-model="formModel.resultHandling" type="textarea" :autosize="{ minRows:3 }" :disabled="!formModel.checked" placeholder="修改处理结果" maxlength="5000" style="margin-top:6px" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="danger" :loading="loading" @click="handleSubmit(false)">不同意</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit(true)">同意</el-button>
      <el-button @click="innerVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
