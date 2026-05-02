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

const formModel = ref({ remarks: '' })

const pageConfig = {
  yqps: { title: '延期批示', api: '/orderInfo/delayApproval' },
  ynps: { title: '疑难批示', api: '/orderInfo/difficultApproval' },
  fpps: { title: '分派批示', api: '/orderInfo/requestingInstructionsApproval' },
  sbdps: { title: '上报批示', api: '/orderInfo/fzr_ps' }
}

const currentPage = ref({ title: '批示', api: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  currentPage.value = pageConfig[props.page] || { title: '批示', api: '' }
  if (val && props.row) setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function handleClick(isAgree) {
  try {
    await ElMessageBox.confirm(`确认${isAgree ? '同意' : '不同意'}吗?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post(currentPage.value.api, {
      remarks: formModel.value.remarks, orderId: props.row?.orderId, taskId: props.row?.taskId, isAgree
    })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" :title="currentPage.title" width="800px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks:'' }">
    <Orderinfo ref="orderInfoRef" />
    <el-form label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="批示意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="批示意见" maxlength="500" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button type="danger" :loading="loading" @click="handleClick(0)">不同意</el-button>
      <el-button type="primary" :loading="loading" @click="handleClick(1)">同意</el-button>
      <el-button @click="innerVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
