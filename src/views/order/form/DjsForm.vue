<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'
import SelectDeptOrUser from '@/components/SelectDeptOrUser.vue'

const props = defineProps({ visible: Boolean, row: Object })
const emit = defineEmits(['update:visible', 'success'])

const innerVisible = ref(false)
const loading = ref(false)
const orderInfoRef = ref()
const deptAndUserRef = ref()
const handleTypeRadio = ref(0) // 0=接收 1=退回 2=分派

const formModel = ref({ handlerDeptId: null, handlerDeptName: '', handleEndTime: '', remarks: '', backReason: [] })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

function getApi() {
  if (handleTypeRadio.value === 0) return '/orderInfo/znj_accept'
  if (handleTypeRadio.value === 1) return '/orderInfo/znj_inside_back'
  return '/orderInfo/znj_assign'
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const params = { ...formModel.value, orderId: props.row?.orderId, taskId: props.row?.taskId }
    const res = await http.post(getApi(), params)
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="待接收处理" width="900px" :close-on-click-modal="false" append-to-body @closed="formModel = { handlerDeptId:null, handlerDeptName:'', handleEndTime:'', remarks:'', backReason:[] }">
    <Orderinfo ref="orderInfoRef" />
    <div style="margin-top:12px"><span style="font-weight:600">受理方式：</span>
      <el-radio-group v-model="handleTypeRadio"><el-radio :label="0">接收</el-radio><el-radio :label="1">退回</el-radio><el-radio :label="2">分派</el-radio></el-radio-group>
    </div>

    <el-form v-show="handleTypeRadio === 0" label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="处理意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="处理意见" maxlength="200" /></el-form-item>
    </el-form>

    <el-form v-show="handleTypeRadio === 1" label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="退回原因"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="退回原因" maxlength="200" /></el-form-item>
    </el-form>

    <el-form v-show="handleTypeRadio === 2" label-width="90px" size="small" style="margin-top:12px">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="处理部门"><SelectDeptOrUser ref="deptAndUserRef" v-model="formModel.handlerDeptId" :show-tabs="['dept']" :is-filter="true" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="限办时间"><el-date-picker v-model="formModel.handleEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
      </el-row>
      <el-form-item label="处理意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" /></el-form-item>
    </el-form>

    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
