<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'

const props = defineProps({ visible: Boolean, row: Object, page: { type: String, default: '' } })
const emit = defineEmits(['update:visible', 'success'])
const innerVisible = ref(false)
const loading = ref(false)
const orderInfoRef = ref()

const formModel = ref({ handleEndTime: '', remarks: '', isSendMassMessage: false, isSendDeptMessage: false })

const pageConfig = {
  yqsp: { title: '延期审批', api: '/orderInfo/delayApproval' },
  cbsp: { title: '重办审批', api: '/orderInfo/againHandleApproval' },
  dxsp: { title: '典型审批', api: '/orderInfo/typicalApproval' },
  thsp: { title: '退回审批', api: '/orderInfo/thApproval' },
  dbsp: { title: '督办审批', api: '/orderInfo/dbApproval' },
  bjrtj: { title: '不计入统计', api: '/orderInfo/approve/nostatistic' }
}

const currentPage = ref({ title: '审批', api: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  currentPage.value = pageConfig[props.page] || { title: '审批', api: '' }
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleClick(isAgree) {
  try {
    await ElMessageBox.confirm(`确认${isAgree ? '同意' : '不同意'}吗?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post(currentPage.value.api, {
      ...formModel.value, orderId: props.row?.orderId, taskId: props.row?.taskId, isAgree
    })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}

const showHandleEndTime = computed(() => ['yqsp', 'cbsp'].includes(props.page))
</script>

<template>
  <el-dialog v-model="innerVisible" :title="currentPage.title" width="800px" :close-on-click-modal="false" append-to-body @closed="formModel = { handleEndTime:'', remarks:'', isSendMassMessage:false, isSendDeptMessage:false }">
    <Orderinfo ref="orderInfoRef" />
    <el-form label-width="90px"  style="margin-top:12px">
      <el-form-item v-if="showHandleEndTime" label="延期至"><el-date-picker v-model="formModel.handleEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
      <el-form-item label="审批意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="审批意见" maxlength="500" /></el-form-item>
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <el-checkbox v-model="formModel.isSendMassMessage">群众短信</el-checkbox>
        <el-checkbox v-model="formModel.isSendDeptMessage">部门短信</el-checkbox>
      </div>
    </el-form>
    <template #footer>
      <el-button type="danger" :loading="loading" @click="handleClick(0)">不同意</el-button>
      <el-button type="primary" :loading="loading" @click="handleClick(1)">同意</el-button>
      <el-button @click="innerVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
