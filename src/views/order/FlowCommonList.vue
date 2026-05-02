<script setup>
import { computed, inject, nextTick, onMounted, reactive, ref } from 'vue'
import Container from '@/components/Container.vue'
import OrderQuery from '@/components/OrderQuery.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'
import { getOrderList, getOrderDetail } from '@/services/orderService'
import flowApiMapping from '@/utils/flowApiMapping'
import { useAuthStore } from '@/stores/auth'
import { useGlobal } from '@/composables/useGlobal'
import { ElMessage, ElMessageBox } from 'element-plus'

// ── 表单组件 ──
import SqdbForm from '@/views/workbench/SqdbForm.vue'
import EcdbForm from '@/views/workbench/EcdbForm.vue'
import DgdForm from '@/views/workbench/DgdForm.vue'
import DfpForm from '@/views/order/form/DfpForm.vue'
import DfkForm from '@/views/order/form/DfkForm.vue'
import DjsForm from '@/views/order/form/DjsForm.vue'
import DhfAndYyhfForm from '@/views/order/form/DhfAndYyhfForm.vue'
import ShswForm from '@/views/order/form/ShswForm.vue'
import CbswForm from '@/views/order/form/CbswForm.vue'
import XjyqForm from '@/views/order/form/XjyqForm.vue'
import ExamineCommonForm from '@/views/order/form/ExamineCommonForm.vue'
import InstructionsCommonForm from '@/views/order/form/InstructionsCommonForm.vue'
import CallReminders from '@/views/order/form/CallReminders.vue'
import DbspForm from '@/views/order/form/DbspForm.vue'
import Dbsp from '@/views/order/form/Dbsp.vue'
import DbqkForm from '@/views/order/form/DbqkForm.vue'
import CxspForm from '@/views/order/form/CxspForm.vue'
import LdspForm from '@/views/order/form/LdspForm.vue'
import DbspForm2 from '@/views/order/form/DbspForm2.vue'
import bzDspForm from '@/views/order/form/bzDspForm.vue'
import SptDbForm from '@/views/order/form/SptDbForm.vue'

const props = defineProps({
  pageName: { type: String, default: '' },
  query: { type: Object, default: () => ({}) },
  md: { type: String, default: '' },
  rawPath: { type: String, default: '' }
})

const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)
const { getDictByCode } = useGlobal()

// ── 核心状态 ──
const method = ref('')
const loading = ref(false)
const tableData = ref([])
const tableHeight = ref(300)
const tableRef = ref()
const orderNo = ref('')
const orderId = ref('')
const orderInfoRef = ref()
const gdxqwin = ref(false)
const isshowPrint = ref(false)
const printData = ref({})
const printMode = ref('print')
const currentRow = ref({})
const selectRows = ref([])
const handlerShow = ref(true)
const isNewSbshPg = ref(false)
const isCbdw = ref(false)
const isDBRole = ref(false)
const isShowHistoryOrderHandle = ref(false)
const deleteOrderAuth = ref(false)
const isListenLY = ref(false)
const zxgzId = ref(-1)
const hffs = ref([])
const hfAssignState = ref('')
const autoHfstate = ref('')
const userGroupId = ref('')
const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ total: 0 })

// ── 表单弹窗 ──
const sqdbVisible = ref(false); const ecdbVisible = ref(false); const dgdVisible = ref(false)
const dfpVisible = ref(false); const dfkVisible = ref(false); const djsVisible = ref(false)
const dhfVisible = ref(false); const shswVisible = ref(false)
const cbswVisible = ref(false); const xjyqVisible = ref(false)
const examineCommonVisible = ref(false); const instructionsCommonVisible = ref(false)
const callRemindersVisible = ref(false); const dbspFormVisible = ref(false)
const dbspVisible = ref(false); const dbqkVisible = ref(false)
const cxspVisible = ref(false); const ldspVisible = ref(false)
const dbspForm2Visible = ref(false); const bzDspVisible = ref(false); const sptDbVisible = ref(false)
const currentPage = ref('')

// ── method 配置 ──
const methodConfig = computed(() => {
  const map = {
    dfp: { title: '待分派', form: 'dfp', handler: 'dfp' },
    djs: { title: '待接收', form: 'djs', handler: 'djs' },
    dfk: { title: '待反馈', form: 'dfk', handler: 'dfk' },
    shsw: { title: '审核事务', form: 'shsw', handler: 'shsw' },
    shswYn: { title: '审核疑难', form: 'shsw', handler: 'shswYn' },
    cbsw: { title: '重办事务', form: 'cbsw', handler: 'cbsw' },
    xjyq: { title: '下级延期', form: 'xjyq', handler: 'xjyq' },
    dhf: { title: '待回访', form: 'dhf', handler: 'dhf' },
    yyhf: { title: '预约回访', form: 'dhf', handler: 'yyhf' },
    dgd: { title: '待归档', form: 'dgd', handler: 'dgd' },
    dgdYn: { title: '待归档疑难', form: 'dgd', handler: 'dgdYn' },
    yqsp: { title: '延期审批', form: 'examineCommon', handler: 'yqsp' },
    cbsp: { title: '重办审批', form: 'examineCommon', handler: 'cbsp' },
    dxsp: { title: '典型审批', form: 'examineCommon', handler: 'dxsp' },
    thsp: { title: '退回审批', form: 'examineCommon', handler: 'thsp' },
    dbspgd: { title: '督办审批', form: 'examineCommon', handler: 'dbspgd' },
    bjrtj: { title: '不计入统计', form: 'examineCommon', handler: 'bjrtj' },
    yqps: { title: '延期批示', form: 'instructionsCommon', handler: 'yqps' },
    ynps: { title: '疑难批示', form: 'instructionsCommon', handler: 'ynps' },
    fpps: { title: '分派批示', form: 'instructionsCommon', handler: 'fpps' },
    sbdps: { title: '上报批示', form: 'instructionsCommon', handler: 'sbdps' },
    remindersRed: { title: '红色催办', form: 'callReminders', handler: 'remindersRed' },
    callReminders: { title: '电话催办', form: 'callReminders', handler: 'callReminders' },
    dbsp_sqd: { title: '督办审批', form: 'dbspForm', handler: 'dbsp_sqd' },
    dbsp_ghdb: { title: '挂号督办', form: 'dbsp', handler: 'dbsp_ghdb' },
    ghdb_ddydb: { title: '待打印督办', form: 'dbspForm2', handler: 'ghdb_ddydb' },
    dbspz: { title: '班长督办', form: 'bzDsp', handler: 'dbspz' },
    spt_dcdb: { title: '省平台督查', form: 'sptDb', handler: 'spt_dcdb' },
    spt_jcdb: { title: '省平台监察', form: 'sptDb', handler: 'spt_jcdb' },
    hsz: { title: '回收站', form: null, handler: 'hsz' },
    myOrder: { title: '我的历史工单', form: null, handler: 'myOrder' }
  }
  return map[method.value] || { title: method.value, form: null, handler: method.value }
})

// ── 动态列配置 ──
const dataFiled = ref([])

function initDataFiled() {
  // shsw 特殊列（新审核岗）
  if (method.value === 'shsw' && isNewSbshPg.value) {
    dataFiled.value = [
      { label: '工单内容', model: 'callerContent', align: 'left', show: true, 'show-overflow-tooltip': true },
      { label: '办理结果', model: 'resultHandling', show: true, 'show-overflow-tooltip': true },
      { label: '办理单位', model: 'acceptDeptName', show: true, 'show-overflow-tooltip': true },
      { label: '工单办理次数', model: 'handleCount', show: true },
      { label: '工单办理时长', model: 'createTime', show: true, formatterDuration: true }
    ]
  } else {
    dataFiled.value = [
      { label: '标题', model: 'title', align: 'left', show: true, 'show-overflow-tooltip': true },
      { label: '内容', model: 'callerContent', align: 'left', 'show-overflow-tooltip': true, show: false },
      { label: '登记时间', model: 'createTime', width: 170, show: true, formatter: 'datetime' },
      { label: '限办时间', model: 'handleEndTime', width: 170, show: true, formatter: 'datetime' },
      { label: '上报时间', model: 'upReportTime', width: 170, show: method.value === 'hfrwc', formatter: 'datetime' },
      { label: '办理部门', model: 'acceptDeptName', width: 140, show: true, 'show-overflow-tooltip': true },
      { label: '状态', model: 'orderSubStateName', width: 90, show: true, 'show-overflow-tooltip': true },
      { label: '办理方式', model: 'handleTypeName', width: 80, show: true, 'show-overflow-tooltip': true },
      { label: '服务渠道', model: 'orderOriginName', width: 110, show: true, 'show-overflow-tooltip': true, formatter: 'origin' },
      { label: '指派回访人', model: 'callbackerName', width: 100, show: method.value === 'hfrwc', 'show-overflow-tooltip': true },
      { label: '重复事务', model: 'isRepeatOrderName', width: 80, show: true, 'show-overflow-tooltip': true }
    ]
  }
}

function handleDataFiled() {
  initDataFiled()
  const m = method.value
  const fd = dataFiled.value

  if (['dfp', 'znjth'].includes(m)) {
    fd.splice(6, 0, { label: '是否预处理', model: 'dispatchSaveState', width: 100, show: true, formatter: 'yesno' })
    fd.splice(6, 0, { label: '分派人', model: 'transferHandlerName', width: 130, show: true })
  }
  if (m === 'yyhf') {
    fd.splice(2, 0, { label: '预约时间', model: 'visitTime', width: 170, show: true, formatter: 'datetime' })
    fd.splice(5, 0, { label: '上报时间', model: 'upReportTime', width: 170, show: true, formatter: 'datetime' })
    fd.splice(fd.findIndex(o => o.model === 'createTime'), 1)
  }
  if (m === 'djs') {
    const idx = fd.findIndex(o => o.model === 'createTime')
    if (idx >= 0) { fd[idx].label = '分派时间'; fd[idx].model = 'transferTime' }
  }
  if (['znjth', 'dgj'].includes(m)) {
    fd.splice(8, 0, { label: '转办人员', model: 'transferHandlerName', width: 100, show: true, 'show-overflow-tooltip': true })
  }
  if (['dgd', 'dhf'].includes(m)) {
    const createIdx = fd.findIndex(o => o.model === 'createTime')
    if (createIdx >= 0) fd.splice(createIdx, 1)
    const label = m === 'dgd' ? '回访时间' : '上报时间'
    const model = m === 'dgd' ? 'callbackTime' : 'upReportTime'
    fd.splice(2, 0, { label, model, width: 170, show: true, formatter: 'datetime' })
    fd.splice(6, 0, { label: '事务级别', model: 'orderLevelName', width: 100, show: true, formatter: 'orderLevel' })
  }
  if (['dfk', 'cbsw', 'yqgd'].includes(m)) {
    fd.splice(3, 0, { label: '事务级别', model: 'orderLevelName', width: 100, show: true, formatter: 'orderLevel' })
    fd.splice(3, 0, { label: '分派时间', model: 'transferTime', width: 170, show: true, formatter: 'datetime' })
    const idx = fd.findIndex(o => o.model === 'orderOriginName')
    if (idx >= 0) fd.splice(idx, 1)
  }
  if (m === 'focusOrder') {
    fd.splice(fd.findIndex(o => o.model === 'isRepeatOrderName'), 1)
    fd.splice(fd.findIndex(o => o.model === 'createUser'), 1)
    fd.push({ label: '特别关注原因', model: 'remarks', width: 140, show: true, 'show-overflow-tooltip': true })
    fd.push({ label: '特别关注时间', model: 'addTime', width: 170, show: true, formatter: 'datetime' })
  }
  if (m === 'hsz') {
    const statusIdx = fd.findIndex(o => o.model === 'orderSubStateName')
    fd.splice(statusIdx, 1, { label: '删除人', model: 'delUser', width: 90, show: true }, { label: '删除时间', model: 'delTime', width: 170, show: true, formatter: 'datetime' })
  }
  if (m === 'remindersYellow') {
    const createIdx = fd.findIndex(o => o.model === 'createTime')
    fd.splice(createIdx, 1, { label: '分派时间', model: 'transferTime', width: 170, show: true, formatter: 'datetime' }, { label: '级别', model: 'orderLevelName', width: 90, show: true })
  }
  if (m === 'remindersRed') {
    fd.splice(9, 0, { label: '催办次数', model: 'isPhoneRemindersCount', width: 100, show: true })
  }
  if (m === 'agent') {
    fd.splice(9, 0, { label: '当前处理人', model: 'userName', width: 100, show: true })
  }
  if (['spt_dcdb', 'spt_jcdb'].includes(m)) {
    fd.push({ label: '是否反馈', model: 'isFeedback', width: 100, show: true })
  }
  if (m === 'hfrwc') {
    const fjIdx = fd.findIndex(o => o.model === 'callbackerName')
    if (fjIdx < 0) fd.push({ label: '指派回访人', model: 'callbackerName', width: 100, show: true })
  }
}

// ── 工具函数 ──
function fmt(val) {
  if (!val && val !== 0) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '-'
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function secondsFormatDHMS(value) {
  let theTime = parseInt(value)
  let theTime1 = 0, theTime2 = 0, theTime3 = 0
  if (theTime > 60) { theTime1 = parseInt(theTime / 60); theTime = parseInt(theTime % 60)
    if (theTime1 > 60) { theTime2 = parseInt(theTime1 / 60); theTime1 = parseInt(theTime1 % 60)
      if (theTime2 > 24) { theTime3 = parseInt(theTime2 / 24); theTime2 = parseInt(theTime2 % 24) } } }
  return `${theTime3 ? theTime3 + '天' : ''}${theTime2 ? theTime2 + '小时' : ''}${theTime1 ? theTime1 + '分' : ''}${theTime}秒`
}

function formatCell(col, row) {
  const val = row[col.model]
  if (!val && val !== 0) return '-'
  if (col.formatterDuration) return secondsFormatDHMS(parseInt((new Date().getTime() - val) / 1000))
  if (col.formatter === 'datetime') return fmt(val)
  if (col.formatter === 'yesno') return val === 0 ? '否' : val === 1 ? '是' : val
  if (col.formatter === 'orderLevel') return val + '(' + (row.orderLevelValue || '') + '日)'
  if (col.formatter === 'origin') return val ? (row.orderOrigin2Name ? val + '/' + row.orderOrigin2Name : val) : '-'
  return val
}

// ── API ──
function getApi() {
  const entry = flowApiMapping.listApi[method.value]
  return entry?.api || `/orderInfo/${method.value}_order_list`
}

async function loadData() {
  loading.value = true
  try {
    let api = getApi()
    // shsw/dgd 新审核岗特殊 api
    if (['shsw', 'shswYn', 'dgd', 'dgdYn'].includes(method.value) && isNewSbshPg.value) {
      api = ['shsw', 'shswYn'].includes(method.value) ? 'orderInfo/dsh_order_list' : 'orderInfo/dgd_order_list'
      params.menuCode = method.value
    }
    // method 特定参数
    if (method.value === 'dfp') params.orderLevelSort = 1
    if (method.value === 'dfk') params.isInterviewed = 1
    if (method.value === 'hfrwc') {
      params.autoHfstate = autoHfstate.value || 0
      params.hfAssignState = hfAssignState.value || 0
      params.userGroupId = userGroupId.value || ''
    }
    if (method.value === 'dhf') params.hffs = hffs.value.join(',')
    if (!['jjcfOrder', 'ycfOrder', 'dcfOrder'].includes(method.value)) delete params.hffs

    const res = await getOrderList(api, params)
    if (res.data?.code === 200) {
      tableData.value = res.data.data?.records ?? []
      pageInfo.total = res.data.data?.total ?? 0
      // 页码溢出回退
      if (params.pageNum > (res.data.data?.pages || 0) && res.data.data?.pages > 0) {
        params.pageNum = res.data.data.pages; await loadData()
      }
      // 恢复行选中
      await nextTick()
      selectRows.value.forEach(sr => {
        const row = tableData.value.find(t => t.orderId === sr.orderId)
        if (row) tableRef.value?.toggleRowSelection(row, true)
      })
    } else { tableData.value = []; pageInfo.total = 0 }
  } catch { tableData.value = [] } finally { loading.value = false }
}

function handleSearch(p) { Object.assign(params, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(params).forEach(k => { if (!['pageNum', 'pageSize'].includes(k)) delete params[k] }); loadData() }
function sizeChange(size) { params.pageSize = size; loadData() }
function currentChange(page) { params.pageNum = page; loadData() }
function handleSelectionChange(rows) { selectRows.value = rows }

// ── 行样式 ──
function getRowClassName({ row }) {
  const m = method.value
  if (['SampleLibrary', 'orderSearch', 'orderSearchCy'].includes(m)) return ''
  const classes = []
  if (row.isJointHandle === 1 && ['dhf', 'hfrwc', 'yyhf'].includes(m)) classes.push('isLhblClass')
  if (row.isFollow === 1 && ['dgd', 'dgdYn', 'dhf', 'hfrwc', 'yyhf'].includes(m)) classes.push('isFollowClass')
  if (row.orderOriginName === '市长信箱') classes.push('szxxSpeicalClass')
  if (row.specialWork === zxgzId.value || row.specialWork === '营商环境') classes.push('isYshjOrderClass')
  if (row.orderOriginName === '省平台渠道') classes.push('isSptOrderClass')
  return classes.join(' ')
}

// ── 排序 ──
function handleSortChange({ prop, order }) {
  if (order) { params.filed = prop; params.type = order === 'ascending' ? 'asc' : 'desc' }
  else { delete params.filed; delete params.type }
  loadData()
}

// ── 操作按钮 ──
function ckDispose(row) { gdxqwin.value = true; orderInfoRef.value?.reloadDataByOrderId(row.orderId) }

function handle(row) {
  const formType = methodConfig.value.form
  if (formType) { openForm(row, formType); return }
  forwordAddOrder(row)
}

function forwordAddOrder(row) {
  const isQuick = row.channelHandleType === 0
  workbenchNav?.openCustomTab('flow_cl_' + row.orderId, '事务处理(' + row.orderNo + ')', isQuick ? '/order/quickAddOrder' : '/order/editOrder', '事务处理', { orderId: row.orderId, taskId: row.taskId })
}

async function printD(row, mode) {
  try {
    const res = await getOrderDetail(row.orderNo, authStore.hasPermission('lookOrderInfo', 1))
    if (res.data?.code === 200) { printData.value = res.data.data; printMode.value = mode; isshowPrint.value = true }
  } catch { ElMessage.error('获取失败') }
}

function openForm(row, formType) {
  currentRow.value = row; currentPage.value = methodConfig.value.handler || ''
  const m = {
    dfp: dfpVisible, dfk: dfkVisible, djs: djsVisible, dhf: dhfVisible, shsw: shswVisible,
    sqdb: sqdbVisible, ecdb: ecdbVisible, dgd: dgdVisible,
    cbsw: cbswVisible, xjyq: xjyqVisible,
    examineCommon: examineCommonVisible, instructionsCommon: instructionsCommonVisible,
    callReminders: callRemindersVisible, dbspForm: dbspFormVisible, dbsp: dbspVisible,
    dbqk: dbqkVisible, cxsp: cxspVisible, ldsp: ldspVisible,
    dbspForm2: dbspForm2Visible, bzDsp: bzDspVisible, sptDb: sptDbVisible
  }
  if (m[formType]) { m[formType].value = true; return }
  forwordAddOrder(row)
}

function onFormSuccess() { loadData() }

// shsw 批量操作
async function handleClick(agree, row) {
  try {
    await ElMessageBox.confirm(agree ? '确认同意吗?' : '确认不同意吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await http.post('/orderInfo/sbOrderApproval', { isAgree: agree ? '同意' : '不同意', orderId: row.orderId, taskId: row.taskId })
    ElMessage.success('操作成功'); loadData()
  } catch {}
}

async function YnClick(row) {
  try {
    await ElMessageBox.confirm('确认操作疑难吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    const res = await http.post('/orderInfo/sbOrderApprovalDifficult', { orderId: row.orderId })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); loadData() } else { ElMessage.error(res.data?.message || '操作失败') }
  } catch {}
}

// hsz 恢复
async function restoreOrder(row) {
  try {
    await ElMessageBox.confirm('确认恢复此工单吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await http.get('/orderInfo/restore', { params: { orderId: row.orderId } })
    ElMessage.success('恢复成功'); loadData()
  } catch {}
}

// 短信催办
async function remindersMessage(row) {
  try {
    const res = await http.get('orderRemindersRecords/remindersMessage', { params: { isUser: true, orderId: row.orderId } })
    if (res.data?.code === 200) { ElMessage.success(res.data.message); loadData() } else { ElMessage.error(res.data.message) }
  } catch {}
}

// 取消典型
async function cancelTypical(row) {
  try {
    await ElMessageBox.confirm('确认取消典型吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await http.post('/orderInfo/cancelTypical', { orderId: row.orderId })
    ElMessage.success('操作成功'); loadData()
  } catch {}
}

// ── 初始化 ──
function getTableHeight(h) { tableHeight.value = h - 154 }

onMounted(async () => {
  const fromPath = props.rawPath?.startsWith('flow/order/') ? props.rawPath.replace('flow/order/', '') : ''
  method.value = props.md || props.query?.md || fromPath || 'dfp'

  // 权限
  const roleCode = authStore.userInfo?.roleCode || ''
  isNewSbshPg.value = roleCode === 'xyzxCbg'
  isCbdw.value = ['znj', 'cbdw', 'xzclry'].some(c => roleCode.includes(c))
  isDBRole.value = authStore.hasPermission('isDBRole', 1) || false
  isShowHistoryOrderHandle.value = authStore.hasPermission('historyOrderHandle', 1)
  deleteOrderAuth.value = authStore.hasPermission('deleteOrder', 1)
  isListenLY.value = authStore.hasPermission('listenLY', 1)

  // 营商环境ID
  try {
    const r = await getDictByCode(true, 'zxgz')
    if (r?.length) zxgzId.value = r.find(item => item.dictName === '营商环境')?.dictId || -1
  } catch {}

  // handlerShow
  const entry = flowApiMapping.listApi[method.value]
  handlerShow.value = (![null, undefined].includes(entry?.status) && entry?.status >= 0) || entry?.isHandle || method.value === 'yqgd'

  // 列配置
  handleDataFiled()

  // 部分 method 由 OrderQuery 触发首次查询
  if (['dgd', 'remindersRed', 'gdsw', 'dfp', 'znjth', 'reBack', 'reAssign', 'emphasis'].includes(method.value)) return
  loadData()
})

import { http } from '@/services/http'
</script>

<template>
  <Container type="box" @resize="getTableHeight">
    <div class="list">
      <div class="search">
        <OrderQuery :method="method" @search="handleSearch" @reset="handleReset">
          <template v-if="method === 'hfrwc'">
            <el-select v-model="hfAssignState" size="small" clearable placeholder="是否已指派" style="width:160px;margin:0 5px">
              <el-option label="是" :value="1" /><el-option label="否" :value="2" />
            </el-select>
            <el-select v-model="autoHfstate" size="small" clearable placeholder="智能回访状态" style="width:160px;margin:0 5px">
              <el-option label="无人接听" :value="1" /><el-option label="不满意" :value="2" />
              <el-option label="智能回访中" :value="3" /><el-option label="智能完成" :value="4" />
              <el-option label="非智能回访" :value="5" />
            </el-select>
          </template>
        </OrderQuery>
      </div>

      <!-- shsw 批量审核 -->
      <div v-if="method === 'shsw' && selectRows.length > 0 && isNewSbshPg" class="batch-bar">
        <span>已选 {{ selectRows.length }} 项</span>
        <el-button type="success" size="small" @click="selectRows.forEach(r => handleClick(1, r))">批量同意</el-button>
      </div>

      <div class="list-wrap">
        <el-table ref="tableRef" border v-loading="loading" :max-height="tableHeight" :data="tableData"
          :row-class-name="getRowClassName"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column type="index" label="序号" width="50" align="center" />
          <template v-for="(col, ci) in dataFiled" :key="ci">
            <el-table-column
              v-if="col.show !== false"
              :prop="col.model"
              :label="col.label"
              :width="col.width"
              :min-width="col.minWidth"
              :align="col.align || 'center'"
              :show-overflow-tooltip="col['show-overflow-tooltip']"
              :sortable="col.model !== 'callerContent' && col.model !== 'handleCount' ? 'custom' : false"
            >
              <template #default="{ row }">{{ formatCell(col, row) }}</template>
            </el-table-column>
          </template>

          <!-- 操作列 -->
          <el-table-column v-if="method !== 'znj_login_logs'" label="操作" width="220" align="center" fixed="right">
            <template #default="{ row }">
              <!-- shsw 新审核岗 -->
              <template v-if="method === 'shsw' && isNewSbshPg && authStore.hasPermission('isNewSbshPg', 1)">
                <el-link type="primary" :underline="false" @click="handleClick(1, row)">同意</el-link>
                <el-link v-if="method !== 'shswYn'" type="warning" :underline="false" style="margin-left:5px" @click="YnClick(row)">疑难</el-link>
                <el-link type="primary" :underline="false" style="margin-left:5px" @click="handle(row)">处理</el-link>
              </template>

              <!-- 通用操作 -->
              <template v-else>
                <el-link v-if="method === 'dxgd'" type="primary" :underline="false" @click="cancelTypical(row)">取消</el-link>
                <el-link v-if="!isDBRole" type="primary" :underline="false" @click="printD(row, 'print')">打印</el-link>
                <el-link v-if="!isDBRole" type="primary" :underline="false" style="margin-left:3px" @click="printD(row, 'zprint')">交办打印</el-link>
                <el-link v-if="isDBRole" type="primary" :underline="false" @click="printD(row, 'dbprint')">督办打印</el-link>

                <!-- 查看/处理 分支 -->
                <el-link v-if="!handlerShow" type="primary" :underline="false" style="margin-left:3px" @click="ckDispose(row)">查看</el-link>
                <el-link v-else type="primary" :underline="false" style="margin-left:3px" @click="handle(row)">处理</el-link>

                <!-- myOrder 特殊 -->
                <el-link v-if="method === 'myOrder' && isShowHistoryOrderHandle" type="primary" :underline="false" style="margin-left:3px" @click="handle(row)">处理</el-link>

                <!-- hsz 恢复 -->
                <el-link v-if="method === 'hsz'" type="success" :underline="false" style="margin-left:3px" @click="restoreOrder(row)">恢复</el-link>

                <!-- remindersRed 短信催办 -->
                <el-link v-if="['remindersRed', 'remindersYellow'].includes(method)" type="primary" :underline="false" style="margin-left:3px" @click="remindersMessage(row)">短信催办</el-link>
              </template>

              <!-- 样本库 -->
              <template v-if="method === 'SampleLibrary'">
                <el-link type="danger" :underline="false" style="margin-left:3px" @click="onFormSuccess">删除</el-link>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-pagination background @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="params.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total"
        style="float:right;padding-top:10px"
      />
    </div>

    <Orderinfo ref="orderInfoRef" />
    <PrintExport :visible="isshowPrint" :print-data="printData" :mode="printMode" @update:visible="isshowPrint = $event" />

    <!-- 表单弹窗 -->
    <SqdbForm :visible="sqdbVisible" :row="currentRow" @update:visible="sqdbVisible = $event" @success="onFormSuccess" />
    <EcdbForm :visible="ecdbVisible" :row="currentRow" @update:visible="ecdbVisible = $event" @success="onFormSuccess" />
    <DgdForm :visible="dgdVisible" :row="currentRow" @update:visible="dgdVisible = $event" @success="onFormSuccess" />
    <DfpForm :visible="dfpVisible" :row="currentRow" @update:visible="dfpVisible = $event" @success="onFormSuccess" />
    <DfkForm :visible="dfkVisible" :row="currentRow" @update:visible="dfkVisible = $event" @success="onFormSuccess" />
    <DjsForm :visible="djsVisible" :row="currentRow" @update:visible="djsVisible = $event" @success="onFormSuccess" />
    <DhfAndYyhfForm :visible="dhfVisible" :row="currentRow" @update:visible="dhfVisible = $event" @success="onFormSuccess" />
    <ShswForm :visible="shswVisible" :row="currentRow" @update:visible="shswVisible = $event" @success="onFormSuccess" />
    <CbswForm :visible="cbswVisible" :row="currentRow" @update:visible="cbswVisible = $event" @success="onFormSuccess" />
    <XjyqForm :visible="xjyqVisible" :row="currentRow" @update:visible="xjyqVisible = $event" @success="onFormSuccess" />
    <ExamineCommonForm :visible="examineCommonVisible" :row="currentRow" :page="currentPage" @update:visible="examineCommonVisible = $event" @success="onFormSuccess" />
    <InstructionsCommonForm :visible="instructionsCommonVisible" :row="currentRow" :page="currentPage" @update:visible="instructionsCommonVisible = $event" @success="onFormSuccess" />
    <CallReminders :visible="callRemindersVisible" :row="currentRow" @update:visible="callRemindersVisible = $event" @success="onFormSuccess" />
    <DbspForm :visible="dbspFormVisible" :row="currentRow" @update:visible="dbspFormVisible = $event" @success="onFormSuccess" />
    <Dbsp :visible="dbspVisible" :row="currentRow" :page="currentPage" @update:visible="dbspVisible = $event" @success="onFormSuccess" />
    <DbqkForm :visible="dbqkVisible" :row="currentRow" @update:visible="dbqkVisible = $event" @success="onFormSuccess" />
    <CxspForm :visible="cxspVisible" :row="currentRow" @update:visible="cxspVisible = $event" @success="onFormSuccess" />
    <LdspForm :visible="ldspVisible" :row="currentRow" @update:visible="ldspVisible = $event" @success="onFormSuccess" />
    <DbspForm2 :visible="dbspForm2Visible" :row="currentRow" @update:visible="dbspForm2Visible = $event" @success="onFormSuccess" />
    <bzDspForm :visible="bzDspVisible" :row="currentRow" @update:visible="bzDspVisible = $event" @success="onFormSuccess" />
    <SptDbForm :visible="sptDbVisible" :row="currentRow" @update:visible="sptDbVisible = $event" @success="onFormSuccess" />
  </Container>
</template>

<style scoped>
.search { border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.list-wrap { margin-top: 20px; }
.batch-bar { display: flex; align-items: center; gap: 10px; padding: 8px 16px; background: #f0f9eb; border: 1px solid #e1f3d8; border-radius: 4px; margin-top: 8px; }
</style>
