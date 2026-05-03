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
const handleTypeRadio = ref(0) // 0=短信催办 1=电话催办 2=申请督办

const dxcbModel = ref({ remarks: '' })
const dhcbModel = ref({ remarks: '', callIds: '' })
const sqdbModel = ref({ remarks: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

function getApi() {
  if (handleTypeRadio.value === 0) return { url: '/orderRemindersRecords/remindersMessage', method: 'post' }
  if (handleTypeRadio.value === 1) return { url: '/orderRemindersRecords/callReminders', method: 'get' }
  return { url: '/orderInfo/applyForSupervision', method: 'post' }
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const { url, method } = getApi()
    let params = { orderId: props.row?.orderId, taskId: props.row?.taskId }
    if (handleTypeRadio.value === 0) Object.assign(params, dxcbModel.value)
    if (handleTypeRadio.value === 1) Object.assign(params, dhcbModel.value)
    if (handleTypeRadio.value === 2) Object.assign(params, sqdbModel.value)
    const res = method === 'get' ? await http.get(url, { params }) : await http.post(url, params)
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="电话催办" width="800px" :close-on-click-modal="false" append-to-body>
    <Orderinfo ref="orderInfoRef" />
    <div style="margin-top:12px"><span style="font-weight:600">催办方式：</span>
      <el-radio-group v-model="handleTypeRadio"><el-radio :label="0">短信催办</el-radio><el-radio :label="1">电话催办</el-radio><el-radio :label="2">申请督办</el-radio></el-radio-group>
    </div>
    <el-form label-width="90px"  style="margin-top:12px">
      <el-form-item v-show="handleTypeRadio !== 2" label="催办意见"><el-input v-model="(handleTypeRadio === 0 ? dxcbModel : dhcbModel).remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="催办意见" /></el-form-item>
      <el-form-item v-show="handleTypeRadio === 2" label="申请原因"><el-input v-model="sqdbModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="申请原因" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
