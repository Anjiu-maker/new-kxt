<script setup>
import { computed, defineAsyncComponent, inject, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Container from '@/components/Container.vue'
import OrderQuery from '@/components/OrderQuery.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'
import { getOrderList, getOrderDetail } from '@/services/orderService'
import { http } from '@/services/http'
import flowApiMapping from '@/utils/flowApiMapping'
import { useAuthStore } from '@/stores/auth'
import { useGlobal } from '@/composables/useGlobal'

// ── 所有表单组件（动态导入避免 OOM） ──
const SqdbForm = defineAsyncComponent(() => import('@/views/workbench/SqdbForm.vue'))
const EcdbForm = defineAsyncComponent(() => import('@/views/workbench/EcdbForm.vue'))
const DgdForm = defineAsyncComponent(() => import('@/views/workbench/DgdForm.vue'))
const DfpForm = defineAsyncComponent(() => import('@/views/order/form/DfpForm.vue'))
const DfkForm = defineAsyncComponent(() => import('@/views/order/form/DfkForm.vue'))
const DjsForm = defineAsyncComponent(() => import('@/views/order/form/DjsForm.vue'))
const DhfAndYyhfForm = defineAsyncComponent(() => import('@/views/order/form/DhfAndYyhfForm.vue'))
const ShswForm = defineAsyncComponent(() => import('@/views/order/form/ShswForm.vue'))
const CbswForm = defineAsyncComponent(() => import('@/views/order/form/CbswForm.vue'))
const XjyqForm = defineAsyncComponent(() => import('@/views/order/form/XjyqForm.vue'))
const ExamineCommonForm = defineAsyncComponent(() => import('@/views/order/form/ExamineCommonForm.vue'))
const InstructionsCommonForm = defineAsyncComponent(() => import('@/views/order/form/InstructionsCommonForm.vue'))
const CallReminders = defineAsyncComponent(() => import('@/views/order/form/CallReminders.vue'))
const DbspForm = defineAsyncComponent(() => import('@/views/order/form/DbspForm.vue'))
const Dbsp = defineAsyncComponent(() => import('@/views/order/form/Dbsp.vue'))
const DbqkForm = defineAsyncComponent(() => import('@/views/order/form/DbqkForm.vue'))
const CxspForm = defineAsyncComponent(() => import('@/views/order/form/CxspForm.vue'))
const LdspForm = defineAsyncComponent(() => import('@/views/order/form/LdspForm.vue'))
const DbspForm2 = defineAsyncComponent(() => import('@/views/order/form/DbspForm2.vue'))
const bzDspForm = defineAsyncComponent(() => import('@/views/order/form/bzDspForm.vue'))
const SptDbForm = defineAsyncComponent(() => import('@/views/order/form/SptDbForm.vue'))

const props = defineProps({ pageName: { type: String, default: '' }, query: { type: Object, default: () => ({}) }, md: { type: String, default: '' }, rawPath: { type: String, default: '' } })
const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)
const { getDictByCode } = useGlobal()

// ── 核心状态 ──
const method = ref(''); const loading = ref(false); const tableData = ref([]); const tableHeight = ref(300)
const tableRef = ref(); const orderInfoRef = ref()
const isshowPrint = ref(false); const printData = ref({}); const printMode = ref('print')
const currentRow = ref({}); const selectRows = ref([])
const handlerShow = ref(true); const isNewSbshPg = ref(false); const isCbdw = ref(false)
const isDBRole = ref(false); const isShowHistoryOrderHandle = ref(false)
const deleteOrderAuth = ref(false); const zxgzId = ref(-1)
const batchAudit = ref(false); const batchAuditLoading = ref(false)
const batchFpLoading = ref(false); const batchReturnVisitLoading = ref(false)
const batchAssignLoading = ref(false); const batchExtractLoading = ref(false); const allExtractLoading = ref(false)
const batchAssignOpt = ref(false); const batchReleaseOpt = ref(false)
const reportExcelWin = ref(false); const reportExcelLoading = ref(false)
const isShowSetTemplate = ref(false); const isShowSetTempBtn = ref(false)
const addTemplateLoading = ref(false); const reportTemplateJoinItemLoading = ref(false)
const hffs = ref([]); const hfAssignState = ref(''); const autoHfstate = ref(''); const userGroupId = ref('')
const userGroupList = ref([]); const hfGroupList = ref([]); const zxGroupList = ref([])
const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ total: 0 })
const currentPage = ref('')

// ── 导出系统 ──
const reportForm = reactive({ fileName: '', dataSize: 1, tempId: null })
const tempOptions = ref([])
const reportTempSonItemList = ref([])
const reportTemplateAndSonItem = ref([])
const ruleFormRef = ref()

// ── 批量指派 ──
const batchAssignVisible = ref(false)
const batchAssignModel = reactive({ groupId: '', userIds: [], orderIds: [], type: '' })
const radioDisabled = ref(false); const checkboxDisabled = ref(false)

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

// ── method 配置 ──
const methodConfig = computed(() => {
  const m = {
    dfp: { title: '待分派', form: 'dfp', handler: 'dfp' }, djs: { title: '待接收', form: 'djs', handler: 'djs' },
    dfk: { title: '待反馈', form: 'dfk', handler: 'dfk' }, shsw: { title: '审核事务', form: 'shsw', handler: 'shsw' },
    shswYn: { title: '审核疑难', form: 'shsw', handler: 'shswYn' }, cbsw: { title: '重办事务', form: 'cbsw', handler: 'cbsw' },
    xjyq: { title: '下级延期', form: 'xjyq', handler: 'xjyq' }, dhf: { title: '待回访', form: 'dhf', handler: 'dhf' },
    yyhf: { title: '预约回访', form: 'dhf', handler: 'yyhf' }, dgd: { title: '待归档', form: 'dgd', handler: 'dgd' },
    dgdYn: { title: '待归档疑难', form: 'dgd', handler: 'dgdYn' }, yqsp: { title: '延期审批', form: 'examineCommon', handler: 'yqsp' },
    cbsp: { title: '重办审批', form: 'examineCommon', handler: 'cbsp' }, dxsp: { title: '典型审批', form: 'examineCommon', handler: 'dxsp' },
    thsp: { title: '退回审批', form: 'examineCommon', handler: 'thsp' }, dbspgd: { title: '督办审批', form: 'examineCommon', handler: 'dbspgd' },
    bjrtj: { title: '不计入统计', form: 'examineCommon', handler: 'bjrtj' }, yqps: { title: '延期批示', form: 'instructionsCommon', handler: 'yqps' },
    ynps: { title: '疑难批示', form: 'instructionsCommon', handler: 'ynps' }, fpps: { title: '分派批示', form: 'instructionsCommon', handler: 'fpps' },
    sbdps: { title: '上报批示', form: 'instructionsCommon', handler: 'sbdps' },
    remindersRed: { title: '红色催办', form: 'callReminders', handler: 'remindersRed' },
    callReminders: { title: '电话催办', form: 'callReminders', handler: 'callReminders' },
    dbsp_sqd: { title: '督办审批', form: 'dbspForm', handler: 'dbsp_sqd' }, dbsp_ghdb: { title: '挂号督办', form: 'dbsp', handler: 'dbsp_ghdb' },
    ghdb_ddydb: { title: '待打印督办', form: 'dbspForm2', handler: 'ghdb_ddydb' },
    dbspz: { title: '班长督办', form: 'bzDsp', handler: 'dbspz' },
    spt_dcdb: { title: '省平台督查', form: 'sptDb', handler: 'spt_dcdb' },
    spt_jcdb: { title: '省平台监察', form: 'sptDb', handler: 'spt_jcdb' },
    lhhf: { title: '联合回访', form: null, handler: 'lhhf' },
    hf_csdhfgd: { title: '超时待回访', form: null, handler: 'hf_csdhfgd' },
    hsz: { title: '回收站', form: null, handler: 'hsz' }, myOrder: { title: '我的历史工单', form: null, handler: 'myOrder' }
  }
  return m[method.value] || { title: method.value, form: null, handler: method.value }
})

const showAddYbkBtn = computed(() => !['SampleLibrary', 'orderSearch', 'orderSearchCy'].includes(method.value) && authStore.hasPermission('addYbk', 1))
const showSelectionCol = computed(() => ['hsz', 'myOrder', 'hfrwc', 'dfp', 'znjth'].includes(method.value) || batchAudit.value)

const ybkImportUrl = computed(() => (window.common?.baseApi || '') + '/sample/importExcel')
const importHeaders = computed(() => { const t = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || ''; return t ? { token: t } : {} })

// ── 动态列 ──
const dataFiled = ref([])
function initDataFiled() {
  if (method.value === 'shsw' && isNewSbshPg.value) {
    dataFiled.value = [
      { label: '工单内容', model: 'callerContent', align: 'left', show: true, tip: true },
      { label: '办理结果', model: 'resultHandling', show: true, tip: true },
      { label: '办理单位', model: 'acceptDeptName', show: true, tip: true },
      { label: '工单办理次数', model: 'handleCount', show: true },
      { label: '工单办理时长', model: 'createTime', show: true, fmtDur: true }
    ]
  } else {
    dataFiled.value = [
      { label: '标题', model: 'title', align: 'left', show: true, tip: true },
      { label: '内容', model: 'callerContent', align: 'left', show: false, tip: true },
      { label: '登记时间', model: 'createTime', width: 170, show: true, fmt: 'dt' },
      { label: '限办时间', model: 'handleEndTime', width: 170, show: true, fmt: 'dt' },
      { label: '上报时间', model: 'upReportTime', width: 170, show: method.value === 'hfrwc', fmt: 'dt' },
      { label: '办理部门', model: 'acceptDeptName', width: 140, show: true, tip: true },
      { label: '状态', model: 'orderSubStateName', width: 90, show: true, tip: true },
      { label: '办理方式', model: 'handleTypeName', width: 80, show: true, tip: true },
      { label: '服务渠道', model: 'orderOriginName', width: 110, show: true, tip: true, fmt: 'origin' },
      { label: '指派回访人', model: 'callbackerName', width: 100, show: method.value === 'hfrwc', tip: true },
      { label: '重复事务', model: 'isRepeatOrderName', width: 80, show: true, tip: true }
    ]
  }
}

function handleDataFiled() {
  initDataFiled()
  const m = method.value; const fd = dataFiled.value; const ins = (idx, ...cols) => fd.splice(idx, 0, ...cols)
  const rm = model => { const i = fd.findIndex(o => o.model === model); if (i >= 0) fd.splice(i, 1) }
  if (['dfp', 'znjth'].includes(m)) { ins(6, { label: '是否预处理', model: 'dispatchSaveState', width: 100, show: true, fmt: 'yn' }, { label: '分派人', model: 'transferHandlerName', width: 130, show: true }) }
  if (m === 'yyhf') { ins(2, { label: '预约时间', model: 'visitTime', width: 170, show: true, fmt: 'dt' }); ins(5, { label: '上报时间', model: 'upReportTime', width: 170, show: true, fmt: 'dt' }); rm('createTime') }
  if (m === 'djs') { const i = fd.findIndex(o => o.model === 'createTime'); if (i >= 0) { fd[i].label = '分派时间'; fd[i].model = 'transferTime' } }
  if (['znjth', 'dgj'].includes(m)) ins(8, { label: '转办人员', model: 'transferHandlerName', width: 100, show: true, tip: true })
  if (['dgd', 'dhf'].includes(m)) { rm('createTime'); const lb = m === 'dgd' ? '回访时间' : '上报时间'; const ml = m === 'dgd' ? 'callbackTime' : 'upReportTime'; ins(2, { label: lb, model: ml, width: 170, show: true, fmt: 'dt' }); ins(6, { label: '事务级别', model: 'orderLevelName', width: 100, show: true, fmt: 'lv' }) }
  if (['dfk', 'cbsw', 'yqgd'].includes(m)) { ins(3, { label: '事务级别', model: 'orderLevelName', width: 100, show: true, fmt: 'lv' }, { label: '分派时间', model: 'transferTime', width: 170, show: true, fmt: 'dt' }); rm('orderOriginName') }
  if (m === 'focusOrder') { rm('isRepeatOrderName'); rm('createUser'); fd.push({ label: '特别关注原因', model: 'remarks', width: 140, show: true, tip: true }, { label: '特别关注时间', model: 'addTime', width: 170, show: true, fmt: 'dt' }) }
  if (m === 'hsz') { const si = fd.findIndex(o => o.model === 'orderSubStateName'); fd.splice(si, 1, { label: '删除人', model: 'delUser', width: 90, show: true }, { label: '删除时间', model: 'delTime', width: 170, show: true, fmt: 'dt' }) }
  if (m === 'remindersYellow') { const ci = fd.findIndex(o => o.model === 'createTime'); fd.splice(ci, 1, { label: '分派时间', model: 'transferTime', width: 170, show: true, fmt: 'dt' }, { label: '级别', model: 'orderLevelName', width: 90, show: true }) }
  if (m === 'remindersRed') ins(9, { label: '催办次数', model: 'isPhoneRemindersCount', width: 100, show: true })
  if (m === 'agent') ins(9, { label: '当前处理人', model: 'userName', width: 100, show: true })
  if (['spt_dcdb', 'spt_jcdb'].includes(m)) fd.push({ label: '是否反馈', model: 'isFeedback', width: 100, show: true })
  if (m === 'lhhf') { const si = fd.findIndex(o => o.model === 'orderSubStateName'); if (si >= 0) fd.splice(si, 1, { label: '办理进度', model: 'progress', width: 90, show: true, tip: true }) }
  if (m === 'hf_csdhfgd') { const ci = fd.findIndex(o => o.model === 'createTime'); if (ci >= 0) { fd[ci].label = '限制回访时间'; fd[ci].model = 'lastRestrictCallbackTime' } }
  if (m === 'hfrwc') { if (!fd.find(o => o.model === 'callbackerName')) fd.push({ label: '指派回访人', model: 'callbackerName', width: 100, show: true }) }
}

// 操作列：""查看"" vs ""处理"" 行级判断
function showDetailLink(row) {
  if (!handlerShow.value) return true
  if (row.isThApprovalComplete === 1 && ['djs', 'dfk', 'thgd'].includes(method.value)) return true
  if (row.fz !== row.fm) return true  // 非本级
  if (method.value === 'dbgd_yjdb') return true
  if (row.isInstructionsToComplete && method.value === 'dfp') return true
  return false
}

// ── 工具 ──
const fmt = v => { if (!v && v !== 0) return '-'; const d = new Date(v); if (Number.isNaN(d.getTime())) return '-'; const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }
const secondsFormatDHMS = value => { let t = parseInt(value), t1 = 0, t2 = 0, t3 = 0; if (t > 60) { t1 = parseInt(t / 60); t = parseInt(t % 60); if (t1 > 60) { t2 = parseInt(t1 / 60); t1 = parseInt(t1 % 60); if (t2 > 24) { t3 = parseInt(t2 / 24); t2 = parseInt(t2 % 24) } } } return `${t3 ? t3 + '天' : ''}${t2 ? t2 + '小时' : ''}${t1 ? t1 + '分' : ''}${t}秒` }

function formatCell(col, row) {
  const v = row[col.model]; if (!v && v !== 0) return '-'
  if (col.fmtDur) return secondsFormatDHMS(parseInt((new Date().getTime() - v) / 1000))
  if (col.fmt === 'dt') return fmt(v)
  if (col.fmt === 'yn') return v === 0 ? '否' : v === 1 ? '是' : v
  if (col.fmt === 'lv') return v + '(' + (row.orderLevelValue || '') + '日)'
  if (col.fmt === 'origin') return v ? (row.orderOrigin2Name ? v + '/' + row.orderOrigin2Name : v) : '-'
  return v
}

// ── API ──
function getApi() { const e = flowApiMapping.listApi[method.value]; return e?.api || `/orderInfo/${method.value}_order_list` }

async function loadData() {
  loading.value = true
  try {
    let api = getApi()
    if (['shsw', 'shswYn', 'dgd', 'dgdYn'].includes(method.value) && isNewSbshPg.value) { api = ['shsw', 'shswYn'].includes(method.value) ? 'orderInfo/dsh_order_list' : 'orderInfo/dgd_order_list'; params.menuCode = method.value }
    if (method.value === 'dfp') params.orderLevelSort = 1
    if (method.value === 'dfk') params.isInterviewed = 1
    if (method.value === 'hfrwc') { params.autoHfstate = autoHfstate.value || 0; params.hfAssignState = hfAssignState.value || 0; params.userGroupId = userGroupId.value || '' }
    if (method.value === 'dhf') params.hffs = hffs.value.join(',')
    if (!['jjcfOrder', 'ycfOrder', 'dcfOrder'].includes(method.value)) delete params.hffs
    const res = await getOrderList(api, params)
    if (res.data?.code === 200) {
      tableData.value = res.data.data?.records ?? []; pageInfo.total = res.data.data?.total ?? 0
      if (params.pageNum > (res.data.data?.pages || 0) && res.data.data?.pages > 0) { params.pageNum = res.data.data.pages; await loadData() }
      await nextTick(); selectRows.value.forEach(sr => { const r = tableData.value.find(t => t.orderId === sr.orderId); if (r) tableRef.value?.toggleRowSelection(r, true) })
    } else { tableData.value = []; pageInfo.total = 0 }
  } catch { tableData.value = [] } finally { loading.value = false }
}

function handleSearch(p) { Object.assign(params, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(params).forEach(k => { if (!['pageNum', 'pageSize'].includes(k)) delete params[k] }); loadData() }
function sizeChange(s) { params.pageSize = s; loadData() }
function currentChange(p) { params.pageNum = p; loadData() }
function handleSelectionChange(rows) { selectRows.value = rows }

// ── 行样式 ──
function getRowClassName({ row }) {
  const m = method.value; if (['SampleLibrary', 'orderSearch', 'orderSearchCy'].includes(m)) return ''
  const c = []
  if (row.isJointHandle === 1 && ['dhf', 'hfrwc', 'yyhf'].includes(m)) c.push('isLhblClass')
  if (row.isFollow === 1 && ['dgd', 'dgdYn', 'dhf', 'hfrwc', 'yyhf'].includes(m)) c.push('isFollowClass')
  if (row.orderOriginName === '市长信箱') c.push('szxxSpeicalClass')
  if (row.specialWork === zxgzId.value || row.specialWork === '营商环境') c.push('isYshjOrderClass')
  if (row.orderOriginName === '省平台渠道') c.push('isSptOrderClass')
  return c.join(' ')
}

function handleSortChange({ prop, order }) { if (order) { params.filed = prop; params.type = order === 'ascending' ? 'asc' : 'desc' } else { delete params.filed; delete params.type }; loadData() }
function getRowKey(row) { return row.orderId || Math.random() }

// ── 操作 ──
function ckDispose(row) { orderInfoRef.value?.reloadDataByOrderId(row.orderId) }

function handle(row) {
  const ft = methodConfig.value.form
  if (ft) { openForm(row, ft); return }
  forwordAddOrder(row)
}

function forwordAddOrder(row) {
  workbenchNav?.openCustomTab('flow_cl_' + row.orderId, '事务处理(' + row.orderNo + ')', row.channelHandleType === 0 ? '/order/quickAddOrder' : '/order/editOrder', '事务处理', { orderId: row.orderId, taskId: row.taskId })
}

async function printD(row, mode) {
  try { const r = await getOrderDetail(row.orderNo, authStore.hasPermission('lookOrderInfo', 1)); if (r.data?.code === 200) { printData.value = r.data.data; printMode.value = mode; isshowPrint.value = true } } catch { ElMessage.error('获取失败') }
}

function openForm(row, ft) {
  currentRow.value = row; currentPage.value = methodConfig.value.handler || ''
  const f = { dfp: dfpVisible, dfk: dfkVisible, djs: djsVisible, dhf: dhfVisible, shsw: shswVisible, sqdb: sqdbVisible, ecdb: ecdbVisible, dgd: dgdVisible, cbsw: cbswVisible, xjyq: xjyqVisible, examineCommon: examineCommonVisible, instructionsCommon: instructionsCommonVisible, callReminders: callRemindersVisible, dbspForm: dbspFormVisible, dbsp: dbspVisible, dbqk: dbqkVisible, cxsp: cxspVisible, ldsp: ldspVisible, dbspForm2: dbspForm2Visible, bzDsp: bzDspVisible, sptDb: sptDbVisible }
  if (f[ft]) { f[ft].value = true; return }
  forwordAddOrder(row)
}
function onFormSuccess() { loadData() }

// ── 批量操作 ──
async function batchFp() {
  if (!selectRows.value.length) return ElMessage.warning('请选择至少一条预处理的工单')
  if (selectRows.value.length > 20) return ElMessage.warning('最多可选择20条')
  const ids = selectRows.value.filter(r => r.dispatchSaveState === 1).map(r => r.orderId)
  if (!ids.length) return ElMessage.warning('请选择至少一条预处理的工单')
  try { await ElMessageBox.confirm(`共选中${ids.length}条工单,确认批量分派?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); batchFpLoading.value = true; const r = await http.post('/orderInfo/batch/dispatch', { orderId: ids }); if (r.data?.code === 200) { ElMessage.success(r.data.message); tableRef.value?.clearSelection(); selectRows.value = []; loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} finally { batchFpLoading.value = false }
}
async function batchAuditClick() {
  if (!selectRows.value.length) return ElMessage.warning('请选择至少一条工单')
  if (selectRows.value.length > 10) return ElMessage.warning('一次最多选择10条')
  const ids = selectRows.value.map(r => r.orderId)
  try { await ElMessageBox.confirm(`共选中${ids.length}条工单,确认批量审核?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); batchAuditLoading.value = true; const r = await http.post('/orderInfo/sbOrderBatchApproval', { orderIds: ids }); if (r.data?.code === 200) { ElMessage.success(r.data.message); tableRef.value?.clearSelection(); selectRows.value = []; loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} finally { batchAuditLoading.value = false }
}
async function batchReturnVisitClick() {
  if (!selectRows.value.length) return ElMessage.warning('请选择至少一条工单')
  if (selectRows.value.length > 50) return ElMessage.warning('一次最多选择50条')
  const ids = selectRows.value.map(r => r.orderId)
  try { await ElMessageBox.confirm(`共选中${ids.length}条工单,确认批量回访完成?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); batchReturnVisitLoading.value = true; const r = await http.post('/orderInfo/batch/returnVisit', { orderId: ids }); if (r.data?.code === 200) { ElMessage.success(r.data.message); tableRef.value?.clearSelection(); selectRows.value = []; loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} finally { batchReturnVisitLoading.value = false }
}
async function batchAssign() {
  batchAssignModel.orderIds = selectRows.value.map(r => r.orderId); batchAssignModel.type = 'assign'; batchAssignModel.groupId = ''; batchAssignModel.userIds = []
  if (!batchAssignModel.orderIds.length) return ElMessage.warning('请选择至少一条工单')
  batchAssignVisible.value = true
}
async function doBatchAssign() {
  if (!batchAssignModel.groupId && !batchAssignModel.userIds.length) return ElMessage.warning('请选择小组或人员')
  try { await ElMessageBox.confirm('确认批量指派吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); batchAssignLoading.value = true; const r = await http.post('/orderInfo/batch/assign', batchAssignModel); if (r.data?.code === 200) { ElMessage.success('操作成功'); batchAssignVisible.value = false; tableRef.value?.clearSelection(); selectRows.value = []; loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} finally { batchAssignLoading.value = false }
}
async function batchExtract() {
  if (!selectRows.value.length) return ElMessage.warning('请选择至少一条工单')
  const ids = selectRows.value.map(r => r.orderId)
  try { await ElMessageBox.confirm(`共选中${ids.length}条工单,确认批量释放?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); batchExtractLoading.value = true; const r = await http.post('/orderInfo/batch/extract', { orderIds: ids }); if (r.data?.code === 200) { ElMessage.success('操作成功'); tableRef.value?.clearSelection(); selectRows.value = []; loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} finally { batchExtractLoading.value = false }
}
async function allExtract() {
  try { await ElMessageBox.confirm('确认全部释放吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); allExtractLoading.value = true; const r = await http.post('/orderInfo/batch/extractAll', {}); if (r.data?.code === 200) { ElMessage.success('操作成功'); loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} finally { allExtractLoading.value = false }
}

// ── shsw ──
async function handleClick(agree, row) { try { await ElMessageBox.confirm(agree ? '确认同意吗?' : '确认不同意吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await http.post('/orderInfo/sbOrderApproval', { isAgree: agree ? '同意' : '不同意', orderId: row.orderId, taskId: row.taskId }); ElMessage.success('操作成功'); loadData() } catch {} }
async function YnClick(row) { try { await ElMessageBox.confirm('确认操作疑难吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); const r = await http.post('/orderInfo/sbOrderApprovalDifficult', { orderId: row.orderId }); if (r.data?.code === 200) { ElMessage.success('操作成功'); loadData() } else ElMessage.error(r.data?.message || '操作失败') } catch {} }

// ── hsz/myOrder ──
async function restoreOrder(row) { try { await ElMessageBox.confirm('确认恢复此工单吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await http.get('/orderInfo/restore', { params: { orderId: row.orderId } }); ElMessage.success('恢复成功'); loadData() } catch {} }
async function recycle() { if (!selectRows.value.length) return ElMessage.warning('请选择工单'); const ids = selectRows.value.map(r => r.orderId); try { await ElMessageBox.confirm(`确认还原${ids.length}条工单吗?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await http.post('/orderInfo/batchRestore', { orderIds: ids }); ElMessage.success('还原成功'); tableRef.value?.clearSelection(); selectRows.value = []; loadData() } catch {} }
async function remove() { if (!selectRows.value.length) return ElMessage.warning('请选择工单'); const ids = selectRows.value.map(r => r.orderId); try { await ElMessageBox.confirm(`确认彻底删除${ids.length}条工单吗?此操作不可恢复!`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await http.post('/orderInfo/batchDelete', { orderIds: ids }); ElMessage.success('删除成功'); tableRef.value?.clearSelection(); selectRows.value = []; loadData() } catch {} }
async function remindersMessage(row) { try { const r = await http.get('orderRemindersRecords/remindersMessage', { params: { isUser: true, orderId: row.orderId } }); if (r.data?.code === 200) { ElMessage.success(r.data.message); loadData() } else ElMessage.error(r.data.message) } catch {} }
async function cancelTypical(row) { try { await ElMessageBox.confirm('确认取消典型吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await http.post('/orderInfo/cancelTypical', { orderId: row.orderId }); ElMessage.success('操作成功'); loadData() } catch {} }
async function addYbk(row) { try { await http.post('/sample/add', { orderId: row.orderId }); ElMessage.success('已添加到样本库') } catch { ElMessage.error('添加失败') } }
async function delYbk(row) { try { await ElMessageBox.confirm('确认从样本库删除吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await http.post('/orderInfo/deleteSample', { orderId: row.orderId }); ElMessage.success('删除成功'); loadData() } catch {} }

// ── 导出 ──
function exportOrder(type) {
  if (['SampleLibrary', 'orderSearch', 'orderSearchCy'].includes(method.value) || method.value === 'myOrder') {
    reportExcelWin.value = true
  } else {
    // 简单导出
    window.open((window.common?.baseApi || '') + '/orderInfo/exportOrder?method=' + method.value + '&token=' + (sessionStorage.getItem('accessToken') || ''))
  }
}
function getTempOptions() { http.get('/reportTemplate/list?isPage=false').then(r => { if (r.data?.code === 200 && r.data.data?.length) { tempOptions.value = r.data.data; reportForm.tempId = r.data.data[0].id; changeReportTemplate(); isShowSetTempBtn.value = true } else { tempOptions.value = []; isShowSetTempBtn.value = false } }) }
function getReportItem() { http.get('/reportItem/list?isPage=false').then(r => { if (r.data?.code === 200) reportTempSonItemList.value = r.data.data || [] }) }
function changeReportTemplate() { reportTemplateAndSonItem.value = []; http.get('/reportTemplateItem/listItemByTempId?tempId=' + reportForm.tempId).then(r => { if (r.data?.code === 200) reportTemplateAndSonItem.value = (r.data.data || []).map(o => o.id) }) }
function reportTemplateJoinItem() { ElMessageBox.confirm('确认配置该导出模板吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => { reportTemplateJoinItemLoading.value = true; http.post('/reportTemplateItem/tempJoinItem', { tempId: reportForm.tempId, itemIds: reportTemplateAndSonItem.value }).then(r => { if (r.data?.code === 200) { ElMessage.success(r.data.message); isShowSetTemplate.value = false; changeReportTemplate() } else ElMessage.error(r.data.message) }).finally(() => reportTemplateJoinItemLoading.value = false) }).catch(() => {}) }
function addTemplateFn() { ElMessageBox.prompt('请为您的模板命名', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', inputValidator: v => !!v?.trim(), inputErrorMessage: '模板名称必填' }).then(({ value }) => { addTemplateLoading.value = true; http.post('/reportTemplate/save', { name: value }).then(r => { if (r.data?.code === 200) { ElMessage.success(r.data.message); getTempOptions() } else ElMessage.error(r.data.message) }).finally(() => addTemplateLoading.value = false) }).catch(() => {}) }
function exportReportForm() {
  if (!reportTemplateAndSonItem.value.length) return ElMessage.warning('当前模板没有配置导出字段')
  ElMessageBox.confirm('确认选择该模板导出Excel吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
    reportExcelLoading.value = true
    const link = document.createElement('a')
    http({ url: '/reportTemplate/reportExcel', method: 'post', responseType: 'arraybuffer', timeout: 1200000, params: { cwFlag: 'ybk', fileName: reportForm.fileName, dataSize: 1, tempId: reportForm.tempId, isHaveLookBaomi: true } }).then(res => {
      reportExcelWin.value = false; reportExcelLoading.value = false
      const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' }); const url = URL.createObjectURL(blob); link.href = url; link.download = (reportForm.fileName || 'export') + '.xlsx'; link.click(); URL.revokeObjectURL(url)
    })
  }).catch(() => {})
}
function checkAllAndCounter(type) {
  if (type === 1) reportTemplateAndSonItem.value = reportTempSonItemList.value.map(o => o.id)
  else { const tmp = reportTempSonItemList.value.filter(o => !reportTemplateAndSonItem.value.includes(o.id)); reportTemplateAndSonItem.value = tmp.map(o => o.id) }
}
function ybkExport() { window.open((window.common?.baseApi || '') + '/sample/exportExcel?token=' + (sessionStorage.getItem('accessToken') || '')) }
function downYbkmb() { http({ url: '/sample/excel_template', method: 'get', responseType: 'arraybuffer', timeout: 1200000 }).then(res => { const link = document.createElement('a'); const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' }); const url = URL.createObjectURL(blob); link.href = url; link.download = '样本库模板.xlsx'; link.click(); URL.revokeObjectURL(url) }) }
function ybkImportSuccess(res) { if (res?.code === 200) { ElMessage.success('导入成功'); loadData() } else ElMessage.error(res?.message || '导入失败') }

// ── hfrwc 小组 ──
async function getUseGroup() { try { const r = await http.get('/group/list', { params: { deptId: 15, flag: false } }); if (r.data?.code === 200) userGroupList.value = r.data.data || [] } catch {} }
async function getHfGroup() { try { const r = await http.get('/group/findHfGroup'); if (r.data?.code === 200) hfGroupList.value = r.data.data || [] } catch {} }
async function getZxGroup() { try { const r = await http.get('/group/findZxGroup'); if (r.data?.code === 200) zxGroupList.value = r.data.data || [] } catch {} }

// ── 初始化 ──
function getTableHeight(h) { tableHeight.value = h - 154 }
onMounted(async () => {
  const fromPath = props.rawPath?.startsWith('flow/order/') ? props.rawPath.replace('flow/order/', '') : ''
  method.value = props.md || props.query?.md || fromPath || 'dfp'
  const rc = authStore.userInfo?.roleCode || ''
  isNewSbshPg.value = rc === 'xyzxCbg'; isCbdw.value = ['znj', 'cbdw', 'xzclry'].some(c => rc.includes(c))
  isDBRole.value = method.value.startsWith('dbsp_') || method.value.startsWith('spdc_') || method.value.startsWith('ghdb_') || method.value.startsWith('dbbj_')
  isShowHistoryOrderHandle.value = authStore.hasPermission('historyOrderHandle', 1)
  deleteOrderAuth.value = authStore.hasPermission('deleteOrder', 1)
  batchAudit.value = method.value === 'shsw' && authStore.userInfo?.deptId === (window.common?.zwrxId || window.__KXT_CONFIG__?.zwrxId)
  batchAssignOpt.value = authStore.hasPermission('batchAssign', 1)
  batchReleaseOpt.value = authStore.hasPermission('batchRelease', 1)
  try { const r = await getDictByCode(true, 'zxgz'); if (r?.length) zxgzId.value = r.find(i => i.dictName === '营商环境')?.dictId || -1 } catch {}
  const e = flowApiMapping.listApi[method.value]
  handlerShow.value = (![null, undefined].includes(e?.status) && e?.status >= 0) || e?.isHandle || method.value === 'yqgd'
  handleDataFiled()
  if (method.value === 'hfrwc') { getUseGroup(); getHfGroup(); getZxGroup() }
  if (['SampleLibrary', 'orderSearch', 'orderSearchCy'].includes(method.value)) { getTempOptions(); getReportItem() }
  if (['dgd', 'remindersRed', 'gdsw', 'dfp', 'znjth', 'reBack', 'reAssign', 'emphasis'].includes(method.value)) return // OrderQuery 触发首次查询
  loadData()
})
</script>

<template>
  <Container type="box" @resize="getTableHeight">
    <div class="list">
      <div class="search">
        <OrderQuery :method="method" @search="handleSearch" @reset="handleReset">
          <template v-if="method === 'hfrwc'">
            <el-select v-model="hfAssignState" size="small" clearable placeholder="是否已指派" style="width:160px;margin:0 5px"><el-option label="是" :value="1" /><el-option label="否" :value="2" /></el-select>
            <el-select v-model="autoHfstate" size="small" clearable placeholder="智能回访状态" style="width:160px;margin:0 5px"><el-option label="无人接听" :value="1" /><el-option label="不满意" :value="2" /><el-option label="智能回访中" :value="3" /><el-option label="智能完成" :value="4" /><el-option label="非智能回访" :value="5" /></el-select>
            <el-select v-model="userGroupId" size="small" clearable placeholder="小组" style="width:160px;margin:0 5px"><el-option v-for="g in userGroupList" :key="g.groupId" :label="g.groupName" :value="g.groupId" /></el-select>
          </template>
        </OrderQuery>

        <!-- 工具栏按钮 -->
        <div class="toolbar-row">
          <template v-if="['hsz', 'myOrder', 'deptAssessDataDetail'].includes(method)">
            <el-button type="info" size="small" @click="exportOrder('诉求数据')">导出</el-button>
            <el-button v-if="method === 'hsz'" type="info" size="small" @click="recycle">还原</el-button>
            <el-button v-if="deleteOrderAuth" type="danger" size="small" @click="remove">删除</el-button>
          </template>
          <template v-if="batchAudit">
            <el-button size="small" type="primary" plain :disabled="!selectRows.length" :loading="batchAuditLoading" @click="batchAuditClick">批量审核</el-button>
          </template>
          <template v-if="method === 'hfrwc'">
            <el-button size="small" type="primary" plain :disabled="!selectRows.length" :loading="batchReturnVisitLoading" @click="batchReturnVisitClick">批量回访完成</el-button>
            <el-button v-if="batchAssignOpt" size="small" type="primary" plain :disabled="!selectRows.length" :loading="batchAssignLoading" @click="batchAssign">批量指派</el-button>
            <el-button v-if="batchReleaseOpt" size="small" type="warning" plain :disabled="!selectRows.length" :loading="batchExtractLoading" @click="batchExtract">批量释放</el-button>
            <el-button v-if="batchReleaseOpt" size="small" type="warning" plain :loading="allExtractLoading" @click="allExtract">全部释放</el-button>
          </template>
          <template v-if="['dfp', 'znjth'].includes(method)">
            <el-button size="small" type="primary" plain :disabled="!selectRows.length" :loading="batchFpLoading" @click="batchFp">批量分派</el-button>
          </template>
          <template v-if="['SampleLibrary', 'orderSearch', 'orderSearchCy'].includes(method)">
            <template v-if="method === 'SampleLibrary'">
              <el-button type="primary" size="small" @click="downYbkmb">下载模板</el-button>
              <el-upload :action="ybkImportUrl" :on-success="ybkImportSuccess" :headers="importHeaders" :show-file-list="false" :limit="10" style="display:inline-block;margin:0 5px">
                <el-button size="small" type="info">导入样本库</el-button>
              </el-upload>
            </template>
            <el-button type="info" size="small" @click="ybkExport">导出</el-button>
          </template>
        </div>
      </div>

      <!-- 批量操作状态栏 -->
      <div v-if="method === 'shsw' && selectRows.length > 0 && isNewSbshPg" class="batch-bar">
        <span>已选 {{ selectRows.length }} 项</span>
        <el-button type="success" size="small" @click="selectRows.forEach(r => handleClick(1, r))">批量同意</el-button>
      </div>

      <div class="list-wrap">
        <el-table ref="tableRef" border v-loading="loading" :max-height="tableHeight" :data="tableData" :row-class-name="getRowClassName" :row-key="getRowKey" @selection-change="handleSelectionChange" @sort-change="handleSortChange">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column v-if="showSelectionCol" type="selection" width="45" :reserve-selection="true" align="center" />

          <!-- 编号列（带标签） -->
          <el-table-column v-if="method !== 'znj_login_logs'" prop="orderNo" label="编号" width="200" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.orderLevel == 2 && ['dfp','dgd'].includes(method)" size="small" type="danger">紧急</el-tag>
              <el-tag v-if="row.orderLevel == 11 && ['dfp','dgd'].includes(method)" size="small" type="danger">特急</el-tag>
              <el-tag v-if="row.isStartInsideSbqs && method === 'dfk'" size="small" type="warning">请示</el-tag>
              <el-tag v-if="row.isSubscribeCallback == 1 && method === 'dhf'" size="small" type="danger">预约</el-tag>
              <el-tag v-else-if="row.isFollowUp == 1 && method === 'dfp'" size="small" type="warning">跟进</el-tag>
              {{ row.orderNo }}
            </template>
          </el-table-column>

          <!-- 动态列 -->
          <template v-for="(col, ci) in dataFiled" :key="ci">
            <el-table-column v-if="col.show !== false" :prop="col.model" :label="col.label" :width="col.width" :min-width="col.minWidth" :align="col.align || 'center'" :show-overflow-tooltip="col.tip" :sortable="col.model !== 'callerContent' && col.model !== 'handleCount' ? 'custom' : false">
              <template #default="{ row }">{{ formatCell(col, row) }}</template>
            </el-table-column>
          </template>

          <!-- 操作列 -->
          <el-table-column v-if="method !== 'znj_login_logs'" label="操作" width="220" align="center" fixed="right">
            <template #default="{ row }">
              <!-- shsw 新审核岗 -->
              <template v-if="method === 'shsw' && isNewSbshPg && authStore.hasPermission('isNewSbshPg', 1)">
                <el-link type="primary" :underline="false" @click="handleClick(1, row)">同意</el-link>
                <el-link v-if="method !== 'shswYn'" type="warning" :underline="false" style="margin-left:3px" @click="YnClick(row)">疑难</el-link>
                <el-link type="primary" :underline="false" style="margin-left:3px" @click="handle(row)">处理</el-link>
              </template>
              <!-- 通用 -->
              <template v-else>
                <el-link v-if="method === 'dxgd'" type="primary" :underline="false" @click="cancelTypical(row)">取消</el-link>
                <el-link v-if="!isDBRole" type="primary" :underline="false" @click="printD(row, 'print')">打印</el-link>
                <el-link v-if="!isDBRole" type="primary" :underline="false" style="margin-left:3px" @click="printD(row, 'zprint')">交办打印</el-link>
                <el-link v-if="isDBRole" type="primary" :underline="false" @click="printD(row, 'dbprint')">督办打印</el-link>
                <el-link v-if="showDetailLink(row)" type="primary" :underline="false" style="margin-left:3px" @click="ckDispose(row)">查看</el-link>
                <el-link v-else type="primary" :underline="false" style="margin-left:3px" @click="handle(row)">处理</el-link>
                <el-link v-if="method === 'myOrder' && isShowHistoryOrderHandle" type="primary" :underline="false" style="margin-left:3px" @click="handle(row)">处理</el-link>
                <el-link v-if="method === 'hsz'" type="success" :underline="false" style="margin-left:3px" @click="restoreOrder(row)">恢复</el-link>
                <el-link v-if="['remindersRed','remindersYellow'].includes(method)" type="primary" :underline="false" style="margin-left:3px" @click="remindersMessage(row)">短信催办</el-link>
                <el-link v-if="showAddYbkBtn" type="primary" :underline="false" style="margin-left:3px" @click="addYbk(row)">样本库</el-link>
              </template>
              <template v-if="method === 'SampleLibrary'">
                <el-link type="danger" :underline="false" style="margin-left:3px" @click="delYbk(row)">删除</el-link>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-pagination background @size-change="sizeChange" @current-change="currentChange" :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="params.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" style="float:right;padding-top:10px" />
    </div>

    <Orderinfo ref="orderInfoRef" />
    <PrintExport :visible="isshowPrint" :print-data="printData" :mode="printMode" @update:visible="isshowPrint = $event" />

    <!-- 批量指派弹窗 -->
    <el-dialog v-model="batchAssignVisible" title="批量指派" width="550px" append-to-body>
      <el-form label-width="80px" size="small">
        <el-form-item label="指派小组"><el-select v-model="batchAssignModel.groupId" clearable filterable placeholder="选择小组" style="width:100%" :disabled="checkboxDisabled"><el-option v-for="g in [...hfGroupList, ...zxGroupList]" :key="g.groupId" :label="g.groupName" :value="g.groupId" /></el-select></el-form-item>
        <el-form-item label="指派人员"><el-select v-model="batchAssignModel.userIds" multiple clearable filterable placeholder="选择人员" style="width:100%" :disabled="radioDisabled"><el-option v-for="g in [...hfGroupList, ...zxGroupList]" :key="'u' + g.groupId" :label="g.groupName" :value="g.groupId" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="batchAssignVisible = false">取消</el-button><el-button type="primary" :loading="batchAssignLoading" @click="doBatchAssign">确认</el-button></template>
    </el-dialog>

    <!-- Excel 导出弹窗 -->
    <el-dialog v-model="reportExcelWin" title="导出Excel" width="700px" append-to-body @closed="reportForm.fileName = ''">
      <el-form ref="ruleFormRef" :model="reportForm" label-width="80px" size="small" :rules="{ fileName: [{ required: true, message: '请输入文件名' }], tempId: [{ required: true, message: '请选择模板' }] }">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="文件名" prop="fileName"><el-input v-model="reportForm.fileName" placeholder="导出文件名" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模板" prop="tempId">
            <el-select v-model="reportForm.tempId" filterable placeholder="选择模板" style="width:100%" @change="changeReportTemplate"><el-option v-for="t in tempOptions" :key="t.id" :label="t.name" :value="t.id" /></el-select>
          </el-form-item></el-col>
        </el-row>
        <div v-if="isShowSetTempBtn" style="margin-bottom:12px">
          <el-button size="small" @click="isShowSetTemplate = !isShowSetTemplate">配置模板</el-button>
          <el-button size="small" type="primary" :loading="addTemplateLoading" @click="addTemplateFn">添加模板</el-button>
        </div>
        <div v-if="isShowSetTemplate">
          <div style="margin-bottom:6px"><el-button size="small" @click="checkAllAndCounter(1)">全选</el-button><el-button size="small" @click="checkAllAndCounter(0)">反选</el-button></div>
          <el-checkbox-group v-model="reportTemplateAndSonItem">
            <el-checkbox v-for="item in reportTempSonItemList" :key="item.id" :label="item.id" :value="item.id">{{ item.name || item.itemName }}</el-checkbox>
          </el-checkbox-group>
          <div style="margin-top:8px"><el-button size="small" type="primary" :loading="reportTemplateJoinItemLoading" @click="reportTemplateJoinItem">保存配置</el-button></div>
        </div>
      </el-form>
      <template #footer><el-button @click="reportExcelWin = false">取消</el-button><el-button type="primary" :loading="reportExcelLoading" @click="exportReportForm">导出</el-button></template>
    </el-dialog>

    <!-- 21 个表单弹窗 -->
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
.toolbar-row { display: inline-flex; gap: 6px; align-items: center; margin-top: 8px; }
</style>
