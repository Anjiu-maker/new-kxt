<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '@/services/http'

const props = defineProps({
  visible: { type: Boolean, default: false },
  printData: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'print' }
})
const emit = defineEmits(['update:visible'])
const innerVisible = ref(false)
const hiTaskDataList = ref([])
const config = computed(() => window.common || window.__KXT_CONFIG__ || {})

watch(() => props.visible, (val) => {
  innerVisible.value = val
  if (val && props.printData?.orderId) {
    loadHiTaskList()
  }
})
watch(innerVisible, (val) => { if (!val) emit('update:visible', false) })

async function loadHiTaskList() {
  try {
    const res = await http.get('/hi_task/list', { params: { businessKey: props.printData.orderId } })
    if (res.data?.code === 200) {
      let list = (res.data.data || []).filter(o => o.taskName !== '流程开始')
      list.sort((a, b) => (a.historyTaskId || 0) - (b.historyTaskId || 0))
      hiTaskDataList.value = list
    }
  } catch { hiTaskDataList.value = [] }
}

function formatCell(val) { return val ?? '' }

function handlePrint() { window.print() }

async function handleExport() {
  try {
    const res = await http.post('/wordPrint/downWord', {
      orderIds: [props.printData.orderId],
      fileName: `${props.mode}.xml`,
      isHaveLookBaomi: false
    }, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `热线工单${props.printData.orderNo || ''}.doc`
    a.click()
    URL.revokeObjectURL(url)
  } catch { ElMessage.error('导出失败') }
}
</script>

<template>
  <el-dialog
    v-model="innerVisible"
    title="打印页面"
    width="1000px"
    top="0"
    :close-on-click-modal="false"
    :append-to-body="true"
  >
    <div id="printArea" style="font-family:SimSun;font-size:16px;padding:20px 60px 0;">
      <div class="print_head">
        <h1 style="text-align:center;font-size:20px;">{{ config.orderPrintTitle || '热线工单' }}</h1>
        <p style="text-align:right;">编号: {{ printData.orderNo }}
          <span v-if="printData.orderOriginName === '省平台渠道'">省平台编号: {{ printData.xinDianOrderId }}</span>
        </p>
      </div>
      <table style="margin:auto;width:100%;text-align:center;" rules="all" frame="box">
        <tr height="50">
          <td width="150">诉求人</td><td width="150">{{ formatCell(printData.name) }}</td>
          <td width="150">联系电话</td><td width="150">{{ formatCell(printData.callTel) }}</td>
          <td width="150">工单类型</td><td width="150">{{ formatCell(printData.orderTypeName) }}</td>
        </tr>
        <tr height="50"><td>群众地址</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.addr) }}</td></tr>
        <tr height="50"><td>事发地址</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.orderAddr) }}</td></tr>
        <tr height="50"><td>问题属地</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.deptName) }}</td></tr>
        <tr height="50"><td>承办部门</td><td colspan="2" style="text-align:left;padding-left:10px;">{{ formatCell(printData.handlerDeptName) }}</td>
          <td>办理部门</td><td colspan="2" style="text-align:left;padding-left:10px;">{{ formatCell(printData.acceptDeptName) }}</td></tr>
        <tr height="50"><td>登记人</td><td colspan="2" style="text-align:left;padding-left:10px;">{{ formatCell(printData.createUserWorkNumber) }}</td>
          <td>登记时间</td><td colspan="2" style="text-align:left;padding-left:10px;">{{ formatCell(printData.createTime) }}</td></tr>
        <tr height="50"><td>转办时间</td><td colspan="2" style="text-align:left;padding-left:10px;">{{ formatCell(printData.transferTime) }}</td>
          <td>限办时间</td><td colspan="2" style="text-align:left;padding-left:10px;">{{ formatCell(printData.handleEndTime) }}</td></tr>
        <tr height="50"><td>标题</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.title) }}</td></tr>
        <tr height="100"><td>内容</td><td colspan="5" style="text-align:left;padding-left:10px;white-space:pre-wrap;">{{ formatCell(printData.callerContent) }}</td></tr>
        <tr v-if="mode==='print'" height="100"><td>热线中心意见</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.acceptCenterIdea) }}</td></tr>
        <tr v-if="mode==='print'" height="100"><td>重办意见</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.cbContent) }}</td></tr>
        <tr v-if="mode==='print'" height="100"><td>重派意见</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.cpContent) }}</td></tr>
        <tr v-if="mode==='print'" height="100"><td>基本情况<br/>处理结果<br/>沟通情况</td><td colspan="5" style="text-align:left;padding-left:10px;white-space:pre-wrap;">{{ formatCell(printData.resultHandling) }}</td></tr>
        <tr v-if="mode==='print'" height="100"><td>备注</td><td colspan="5" style="text-align:left;padding-left:10px;">{{ formatCell(printData.callbackInfo) }}</td></tr>
      </table>
    </div>
    <template #footer>
      <el-button type="primary" @click="handlePrint">打印</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <el-button @click="innerVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
@media print {
  :deep(.el-dialog__header), :deep(.el-dialog__footer), :deep(.el-overlay) { display: none !important; }
  :deep(.el-dialog) { box-shadow: none !important; position: static !important; margin: 0 !important; }
}
</style>
