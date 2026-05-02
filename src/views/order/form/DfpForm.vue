<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { getOrderDetail } from '@/services/orderService'
import Orderinfo from '@/components/Orderinfo.vue'
import SelectDeptOrUser from '@/components/SelectDeptOrUser.vue'
import { useGlobal } from '@/composables/useGlobal'

const props = defineProps({ visible: Boolean, row: Object, page: { type: String, default: '' } })
const emit = defineEmits(['update:visible', 'success'])
const { getDictByCode } = useGlobal()

const innerVisible = ref(false)
const loading = ref(false)
const orderInfoRef = ref()
const deptAndUserRef = ref()
const handleTypeRadio = ref(0) // 0=分派 1=退回 2=直接答复
const ywdwOptions = ref([])

const fpModel = ref({ handleEndTime: '', handlerDeptId: null, handlerDeptName: '', remarks: '', autoHf: 1 })
const thModel = ref({ remarks: '', backReason: [] })
const zjdfModel = ref({ remarks: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) { loadDeptData(); setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100) }
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function loadDeptData() {
  try { const r = await http.get('/dept/tree_nodetype', { params: { isHeader: false } }); ywdwOptions.value = r.data?.data || [] } catch {}
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    let api, params
    if (handleTypeRadio.value === 0) {
      api = '/orderInfo/dispatch/save'
      params = { ...fpModel.value, orderId: props.row.orderId, taskId: props.row.taskId, pageType: props.page || '' }
    } else if (handleTypeRadio.value === 1) {
      api = '/orderInfo/fzg_back'
      params = { ...thModel.value, orderId: props.row.orderId, taskId: props.row.taskId }
    } else {
      api = '/orderInfo/fzg_direct_reply'
      params = { ...zjdfModel.value, orderId: props.row.orderId, taskId: props.row.taskId }
    }
    const res = await http.post(api, params)
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}

function handleDeptChange(val) { fpModel.value.handlerDeptId = val }
</script>

<template>
  <el-dialog v-model="innerVisible" title="分派处理" width="900px" :close-on-click-modal="false" append-to-body @closed="{ fpModel = { handleEndTime:'',handlerDeptId:null,handlerDeptName:'',remarks:'',autoHf:1 }; thModel = { remarks:'',backReason:[] }; zjdfModel = { remarks:'' } }">
    <Orderinfo ref="orderInfoRef" />

    <div style="margin-top:12px"><span style="font-weight:600">受理方式：</span>
      <el-radio-group v-model="handleTypeRadio"><el-radio :label="0">分派</el-radio><el-radio :label="1">退回</el-radio><el-radio :label="2">直接答复</el-radio></el-radio-group>
    </div>

    <el-form v-show="handleTypeRadio === 0" label-width="90px" size="small" style="margin-top:12px">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="限办时间"><el-date-picker v-model="fpModel.handleEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" placeholder="限办时间" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="处理部门"><SelectDeptOrUser ref="deptAndUserRef" v-model="fpModel.handlerDeptId" :show-tabs="['dept']" :is-filter="true" @update:model-value="handleDeptChange" /></el-form-item></el-col>
      </el-row>
      <el-form-item label="分派意见"><el-input v-model="fpModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="分派意见" maxlength="200" /></el-form-item>
      <el-checkbox v-model="fpModel.autoHf" :true-value="1" :false-value="0">自动回访</el-checkbox>
    </el-form>

    <el-form v-show="handleTypeRadio === 1" label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="退回原因"><el-input v-model="thModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="退回原因" maxlength="200" /></el-form-item>
    </el-form>

    <el-form v-show="handleTypeRadio === 2" label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="答复意见"><el-input v-model="zjdfModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="答复意见" maxlength="200" /></el-form-item>
    </el-form>

    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
