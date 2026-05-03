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
const handleTypeRadio = ref(0) // 0=回访 1=预约回访

const formModel = ref({
  remarks: '', isCallbackSuccess: 1, isInformTheCaller: 1,
  satisfactionss: 3, zxAppraise: 2, callbackFailReason: '',
  callbackInfo: '', secrecyInfo: '', yyhfTime: '', yyhfContent: '',
  releaseContent: ''
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
    let api, params
    if (handleTypeRadio.value === 0) {
      api = '/orderInfo/zx_callback'
      params = { ...formModel.value, orderId: props.row?.orderId, taskId: props.row?.taskId }
    } else {
      api = '/orderInfo/save_yyhf'
      params = { orderId: props.row?.orderId, taskId: props.row?.taskId, yyhfTime: formModel.value.yyhfTime, yyhfContent: formModel.value.yyhfContent }
    }
    const res = await http.post(api, params)
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="回访处理" width="900px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks:'', isCallbackSuccess:1, isInformTheCaller:1, satisfactionss:3, zxAppraise:2, callbackFailReason:'', callbackInfo:'', secrecyInfo:'', yyhfTime:'', yyhfContent:'', releaseContent:'' }">
    <Orderinfo ref="orderInfoRef" />
    <div style="margin-top:12px"><span style="font-weight:600">受理方式：</span>
      <el-radio-group v-model="handleTypeRadio"><el-radio :label="0">回访</el-radio><el-radio :label="1">预约回访</el-radio></el-radio-group>
    </div>

    <el-form v-show="handleTypeRadio === 0" label-width="100px"  style="margin-top:12px">
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item label="回访成功"><el-select v-model="formModel.isCallbackSuccess"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="告知诉求人"><el-select v-model="formModel.isInformTheCaller"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="满意度"><el-select v-model="formModel.satisfactionss"><el-option label="满意" :value="3" /><el-option label="一般" :value="2" /><el-option label="不满意" :value="1" /></el-select></el-form-item></el-col>
      </el-row>
      <el-form-item v-if="formModel.isCallbackSuccess === 0" label="失败原因"><el-input v-model="formModel.callbackFailReason" /></el-form-item>
      <el-form-item label="回访内容"><el-input v-model="formModel.callbackInfo" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
      <el-form-item label="答复意见"><el-input v-model="formModel.releaseContent" type="textarea" :autosize="{ minRows:2 }" /></el-form-item>
    </el-form>

    <el-form v-show="handleTypeRadio === 1" label-width="90px"  style="margin-top:12px">
      <el-form-item label="预约时间"><el-date-picker v-model="formModel.yyhfTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
      <el-form-item label="预约内容"><el-input v-model="formModel.yyhfContent" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
    </el-form>

    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
