<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { useGlobal } from '@/composables/useGlobal'
import { useAuthStore } from '@/stores/auth'
import Container from '@/components/Container.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'
import DbspForm2 from '@/views/order/form/DbspForm2.vue'
import sqcfForm from '@/views/order/form/sqcfForm.vue'
import tableStyle from './tableStyle.vue'
import queryData from '@/utils/integratedQuery'

const route = useRoute()
const authStore = useAuthStore()
const { getDictByCode, getCurrentDateTime, isSpecialFocus: checkSpecialFocus, hasPermission, authCode } = useGlobal()

// ---- state ----
const loading = ref(false)
const tableHeight = ref(400)
const showTable = ref(false)
const isShowOrderinfo = ref(false)
const isshowPrint = ref(false)
const showDuban = ref(false)
const showSqcf = ref(false)
const addTemplateWin = ref(false)
const templateJoinItemWin = ref(false)
const dialogVisible = ref(false)
const wxhfFormVisible = ref(false)
const reportExcelWin = ref(false)
const isShowSetTemplate = ref(false)
const isSelectAll = ref(false)
const currentRow = ref({})
const selectRows = ref([])
const dataList = ref([])
const tempSonItemList = ref([])
const allItemList = ref([])
const currentItemList = ref([])
const templateList = ref([])
const currentTemplate = ref({})
const printData = ref({})

// ---- component refs ----
const orderInfo = ref(null)
const printExport = ref(null)
const dbsp2 = ref(null)
const sqcfFormRef = ref(null)
const tabStyle = ref(null)
const addTemplateForm = ref(null)
const ruleForm = ref(null)

// ---- params ----
const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ pageSize: 10, total: 0 })
const model = reactive({})
const tempModel = reactive({ tempId: '', tempName: '', tempCode: '', isDefault: 0, remarks: '' })
const emptyTempModel = { ...tempModel }
const wxhfForm = reactive({ remarks: '' })
const printType = ref(1)
const batchPrintLoading = ref(false)
const wxhfLoading = ref(false)
const tempLoading = ref(false)
const reportExcelLoading = ref(false)
const addTemplateLoading = ref(false)
const reportTemplateJoinItemLoading = ref(false)

// ---- data field definitions ----
const dataFiled = ref([])
const reDataFiled = ref([])
const sendDataFiled = ref([])

const defaultDataFiled = [
  { label: '编号', model: 'orderNo', width: 170, show: true, 'show-overflow-tooltip': true, disabled: true, sortable: false },
  { label: '标题', model: 'title', align: 'left', show: true, 'show-overflow-tooltip': true, disabled: true, sortable: false },
  { label: '内容', model: 'callerContent', align: 'left', 'show-overflow-tooltip': true, show: false, disabled: true, sortable: false },
  { label: '登记时间', model: 'createTime', width: 155, show: true, 'show-overflow-tooltip': true, disabled: true, sortable: false },
  { label: '限办时间', model: 'handleEndTime', width: 155, show: true, disabled: true, 'show-overflow-tooltip': true, sortable: false },
  { label: '承办单位', model: 'handlerDeptName', width: 155, show: true, disabled: true, 'show-overflow-tooltip': true, sortable: false },
  { label: '办理单位', model: 'acceptDeptName', 'show-overflow-tooltip': true, width: 155, show: true, disabled: true, sortable: false },
  { label: '状态', model: 'orderSubStateName', 'show-overflow-tooltip': true, width: 90, show: true, disabled: true, sortable: false },
  { label: '分派人', model: 'transferHandlerName', width: 130, show: true, disabled: true, 'show-overflow-tooltip': true, sortable: false },
  { label: '办理方式', model: 'handleTypeName', width: 80, show: true, 'show-overflow-tooltip': true, disabled: true, sortable: false },
  { label: '服务渠道', width: 80, model: 'orderOriginName', show: true, disabled: true, 'show-overflow-tooltip': true, sortable: false },
  { label: '重复事务', width: 80, model: 'isRepeatOrderName', 'show-overflow-tooltip': true, show: true, disabled: true, sortable: false }
]

// ---- dict/cascader props ----
const deptProps = { value: 'deptId', label: 'deptName', children: 'children', expandTrigger: 'hover', checkStrictly: true }
const dictProps = { value: 'dictId', label: 'dictName', children: 'children', expandTrigger: 'hover', checkStrictly: true }
const dictProps1 = { value: 'dictId', label: 'dictName', children: 'children', expandTrigger: 'hover', checkStrictly: true }
const originDictProps = { value: 'dictId', label: 'dictName', children: 'children', expandTrigger: 'hover', checkStrictly: false, multiple: true }

// ---- permissions ----
const dbOption = computed(() => hasPermission(authCode.optCode.dbsp, 1))
const applyInterviewOption = computed(() => hasPermission(authCode.optCode.applyInterviewOption, 1))
const restartProcessOption = computed(() => hasPermission(authCode.optCode.restartProcess, 1))
const wxhfBtnShow = computed(() => hasPermission(authCode.optCode.wxhfBtnShow, 1))
const showAddYbkBtn = computed(() => route.path !== '/query/SampleLibrary' && hasPermission(authCode.optCode.addYbk, 1))

// ---- export ----
const reportForm = reactive({ fileName: '', dataSize: 1, tempId: null })
const tempOptions = ref([])
const isShowSetTempBtn = ref(true)
const reportTempSonItemList = ref([])
const reportTemplateAndSonItem = ref([])
const reportRules = {
  fileName: [{ required: true, message: '请输入导出文件名称', trigger: 'blur' }, { min: 3, max: 30, message: '长度在 3 到 30 个字符', trigger: 'blur' }],
  dataSize: [{ required: true, message: '请选择要导出的数据', trigger: 'change' }],
  tempId: [{ required: true, message: '请选择模板名称', trigger: 'change' }]
}

const operation = ref(true)

// ---- template rules ----
const templateRules = {
  tempName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { validator: (rule, value, callback) => { callback(value?.trim() ? undefined : new Error('请输入模板名称')) }, trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ],
  tempCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ]
}

// ---- methods ----
function formatMoment(v) {
  if (!v) return ''
  const d = new Date(v)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

const isEmptyTempSonItemList = computed(() => tempSonItemList.value.length > 0)

function handleParams(data) {
  const m = JSON.parse(JSON.stringify(data))
  m.pageNum = params.pageNum
  m.pageSize = params.pageSize
  for (const key of Object.keys(m)) {
    if (Array.isArray(m[key]) && m[key].length === 2 && typeof m[key][0] === 'string' && m[key][0].includes(':')) {
      m[key.replace(/^/, '') + 'StartTime'] = m[key][0]
      m[key.replace(/^/, '') + 'EndTime'] = m[key][1]
      delete m[key]
    }
  }
  if (m.handlerDeptId && Array.isArray(m.handlerDeptId)) m.handlerDeptId = m.handlerDeptId[m.handlerDeptId.length - 1]
  if (m.acceptDeptId && Array.isArray(m.acceptDeptId)) m.acceptDeptId = m.acceptDeptId[m.acceptDeptId.length - 1]
  if (m.deptId && Array.isArray(m.deptId)) m.deptId = m.deptId[m.deptId.length - 1]
  if (m.orderOrigin && Array.isArray(m.orderOrigin)) {
    const first = m.orderOrigin.map(o => Array.isArray(o) ? o[0] : o).filter(Boolean)
    const second = m.orderOrigin.map(o => Array.isArray(o) ? o[1] : o).filter(Boolean)
    m.orderOrigin = first.join(',')
    m.orderOrigin2 = second.join(',')
  }
  for (const key of Object.keys(m)) {
    if (Array.isArray(m[key])) m[key] = m[key].join(',')
  }
  return m
}

function queryOrder(resetPage) {
  const param = handleParams({ ...model })
  if (resetPage) { param.pageNum = 1; param.pageSize = 10 }
  if (route.path === '/query/SampleLibrary') param.cwFlag = 'ybk'
  loading.value = true
  http.get('/orderInfo/integrated_query_order', { params: param }).then(res => {
    loading.value = false
    if (res.data?.code == 200) {
      showTable.value = true
      dataList.value = res.data.data.records
      pageInfo.pageSize = res.data.data.size
      pageInfo.total = res.data.data.total
      params.pageNum = res.data.data.current
    }
  }).catch(() => { loading.value = false; dataList.value = [] })
}

function refresh() {
  http.get('/queryTemplateItem/listTempSonItem', { params: { flag: 'false' } }).then(res => {
    if (res.data?.code == 200) {
      tempSonItemList.value = res.data.data || []
      isEmptyTempSonItemList.value = tempSonItemList.value.length > 0
      tempSonItemList.value.forEach(item => {
        if (item.queryItemCode === 'focusRemark') item.show = true
        loadItemData(item)
      })
    }
  })
}

function loadItemData(item) {
  const code = item.queryItemCode
  const type = item.queryItemType
  if (type == 2) {
    if (code === 'orderLevel') {
      http.get('/order_level/list', { params: { flag: false } }).then(res => {
        if (res.data?.code == 200) item.data = res.data.data
      })
    } else if (code === 'qualityLabelId') {
      item.data = queryData.qualityLabelId
    } else if (['handleType', 'orderSubState', 'orderSubStateE'].includes(code)) {
      item.data = queryData[code] || []
    } else {
      getDictDataForItem(item)
    }
  } else if (type == 3) {
    if (code === 'orderOrigin') {
      getDictByCode(true, 'swly').then(res => {
        item.data = res || []
        getdeptOptions(item)
      })
    } else if (code === 'handlerDeptId' || code === 'acceptDeptId' || code === 'deptId') {
      getdeptOptions(item)
    } else if (code === 'hotspot') {
      getDictByCode(true, 'rdfl').then(res => { item.data = res || [] })
    } else {
      getDictDataForItem(item)
    }
  }
}

function getDictDataForItem(item) {
  getDictByCode(true, item.queryItemCode).then(res => { item.data = res || [] })
}

function getdeptOptions(item) {
  http.get('/dept/comprehensiveQueryDepartmentTree').then(res => {
    if (res.data?.code == 200) item.data = res.data.data
  })
}

function selectTable(selection) { selectRows.value = selection }

function detail(row) {
  isShowOrderinfo.value = true
  nextTick(() => orderInfo.value?.reloadDataByOrderId(row.orderId))
}

function collectClick(row) {
  ElMessageBox.prompt('请输入添加特别关注的原因', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputValidator: (v) => v?.trim() ? true : '原因必填!',
    inputErrorMessage: '原因必填!'
  }).then(({ value }) => {
    http.get('/orderInfo/special_focus', { params: { isFocus: true, orderId: row.orderId, remarks: value } }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        queryOrder(false)
        checkSpecialFocus(row.orderId)
      } else {
        ElMessage.error('已添加到特别关注，请勿重复操作')
      }
    })
  }).catch(() => ElMessage.info('取消输入'))
}

function collectOff(row) {
  ElMessageBox.confirm('您确认取消此事务的特别关注吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.get('/orderInfo/special_focus', { params: { isFocus: false, orderId: row.orderId } }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        queryOrder(false)
        checkSpecialFocus(row.orderId)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('取消操作'))
}

function speicalDbClick(row, Type) {
  ElMessageBox.confirm('您确认' + (Type == 1 ? '取消' : '') + '特别督办此工单吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.get('/orderInfo/special_db', { params: { isFocus: (Type == 1 ? 'false' : 'true'), orderId: row.orderId } }).then(res => {
      if (res.data?.code == 200) {
        queryOrder(false)
        ElMessage.success(res.data.message)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('取消操作'))
}

function printD(row, print) {
  isshowPrint.value = true
  const isHaveLookBaomi = hasPermission(authCode.optCode.lookOrderInfo, 1)
  http.get('/orderInfo/find', { params: { orderNo: row.orderNo, isHaveLookBaomi } }).then(res => {
    if (res.data?.code == 200) {
      printData.value = res.data.data
      nextTick(() => printExport.value?.setPrintDataPrint(printData.value, isshowPrint.value, print))
    }
  })
}

function duban(row) {
  showDuban.value = true
  nextTick(() => dbsp2.value?.loadData(row))
}

function sqcf(row) {
  showSqcf.value = true
  nextTick(() => sqcfFormRef.value?.loadData(row))
}

function wxhfClick(row) {
  currentRow.value = row
  wxhfForm.remarks = ''
  wxhfFormVisible.value = true
}

function wxhfSubmit() {
  if (!wxhfForm.remarks) { ElMessage.warning('请输入原因'); return }
  wxhfLoading.value = true
  http.post('/orderInfo/zx_db_callback', {
    orderId: currentRow.value.orderId,
    remarks: wxhfForm.remarks
  }).then(res => {
    wxhfLoading.value = false
    if (res.data?.code == 200) {
      ElMessage.success(res.data.message)
      wxhfFormVisible.value = false
      queryOrder(false)
    } else {
      ElMessage.error(res.data.message)
    }
  })
}

function restartProcess(row) {
  ElMessageBox.confirm('您确认重启此工单流程吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.post('/orderInfo/zx_reset', { orderId: row.orderId }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        queryOrder(false)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消'))
}

function addYbk(row) {
  ElMessageBox.confirm('您确认添加此工单到样本库吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.post('/orderInfo/addSample', { orderId: row.orderId }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        queryOrder(false)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => {})
}

function delYbk(row) {
  ElMessageBox.confirm('您确认从样本库删除此工单吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.post('/orderInfo/deleteSample', { orderId: row.orderId }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        queryOrder(false)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => {})
}

// ---- export ----
function openReportDialog() {
  reportExcelWin.value = true
  reportForm.fileName = formatMoment(new Date()).split(' ')[0] + '数据导出'
  getTempOptions()
  getReportItem()
}

function getReportItem() {
  http.get('/reportItem/list', { params: { isPage: false } }).then(res => {
    if (res.data?.code == 200 && res.data.data) {
      reportTempSonItemList.value = res.data.data
    }
  })
}

function getTempOptions() {
  http.get('/reportTemplate/list', { params: { isPage: false } }).then(res => {
    if (res.data?.code == 200 && res.data.data?.length) {
      tempOptions.value = res.data.data
      reportForm.tempId = tempOptions.value[0].id
      changeReportTemplate()
      isShowSetTempBtn.value = true
    } else {
      tempOptions.value = []
      isShowSetTempBtn.value = false
    }
  })
}

function changeReportTemplate() {
  if (!reportForm.tempId) return
  http.get('/reportTemplateItem/listItemByTempId', { params: { tempId: reportForm.tempId } }).then(res => {
    if (res.data?.code == 200) {
      reportTemplateAndSonItem.value = (res.data.data || []).map(o => o.id || o)
    }
  })
}

function exportReportForm() {
  ruleForm.value?.validate((valid) => {
    if (!valid) return
    if (!reportTemplateAndSonItem.value.length) {
      ElMessage.warning('请先配置模板的导出字段')
      return
    }
    reportExcelLoading.value = true
    const param = handleParams({ ...model })
    param.fileName = reportForm.fileName
    param.dataSize = reportForm.dataSize
    param.tempId = reportForm.tempId
    param.isHaveLookBaomi = hasPermission(authCode.optCode.lookOrderInfo, 1)
    if (reportForm.dataSize == 0) {
      if (!selectRows.value.length) { ElMessage.warning('请选择要导出的记录'); reportExcelLoading.value = false; return }
      param.orderIds = selectRows.value.map(o => o.orderId).join(',')
    }
    if (route.path === '/query/SampleLibrary') param.cwFlag = 'ybk'
    delete param.pageNum
    delete param.pageSize
    http.post('/reportTemplate/reportExcel', param, { responseType: 'arraybuffer', timeout: 1200000 }).then(res => {
      const link = document.createElement('a')
      const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' })
      const objectUrl = URL.createObjectURL(blob)
      link.href = objectUrl
      link.download = reportForm.fileName + '.xlsx'
      link.click()
      URL.revokeObjectURL(objectUrl)
      reportExcelLoading.value = false
      ElMessage.success('导出成功')
    }).catch(() => { reportExcelLoading.value = false })
  })
}

function setTemplate() { isShowSetTemplate.value = true }
function addTemplate() {
  addTemplateLoading.value = true
  http.post('/reportTemplate/save', { tempName: '默认模板', tempCode: 'default', remarks: '' }).then(res => {
    addTemplateLoading.value = false
    if (res.data?.code == 200) {
      ElMessage.success('添加成功')
      getTempOptions()
    } else {
      ElMessage.error(res.data.message)
    }
  })
}

function checkAllAndCounter(type) {
  if (type == 1) reportTemplateAndSonItem.value = reportTempSonItemList.value.map(o => o.id)
  else reportTemplateAndSonItem.value = []
}

function reportTemplateJoinItem() {
  reportTemplateJoinItemLoading.value = true
  http.post('/reportTemplateItem/tempJoinItem', {
    tempId: reportForm.tempId,
    itemIds: reportTemplateAndSonItem.value
  }).then(res => {
    reportTemplateJoinItemLoading.value = false
    if (res.data?.code == 200) {
      isShowSetTemplate.value = false
      ElMessage.success('配置成功')
    } else {
      ElMessage.error(res.data.message)
    }
  })
}

// ---- print ----
function openDialogVisible() { dialogVisible.value = true }

function batchPrinting() {
  const orderIds = selectRows.value.map(o => o.orderId)
  batchPrintLoading.value = true
  const isHaveLookBaomi = hasPermission(authCode.optCode.lookOrderInfo, 1)
  http.post('/wordPrint/downWord', {
    orderIds,
    fileName: printType.value == 1 ? 'print.xml' : 'zprint.xml',
    isHaveLookBaomi
  }).then(res => {
    const link = document.createElement('a')
    const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' })
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = formatMoment(new Date()).replace(/:/g, '-') + '批量导出.doc'
    link.click()
    URL.revokeObjectURL(objectUrl)
    batchPrintLoading.value = false
    dialogVisible.value = false
  }).catch(() => { batchPrintLoading.value = false })
}

// ---- template management ----
function getTemplateList() {
  http.get('/queryTemplate/list', { params: { flag: false } }).then(res => {
    if (res.data?.code == 200) templateList.value = res.data.data || []
  })
}

function openTemplateJoinItemWin() {
  getTemplateList()
  templateJoinItemWin.value = true
  changeTemplate()
}

function changeTemplate() {
  if (!currentTemplate.value.tempId) return
  http.get('/queryTemplateItem/listTempAndItem', { params: { tempId: currentTemplate.value.tempId } }).then(res => {
    if (res.data?.code == 200) {
      allItemList.value = res.data.data.listAll || []
      currentItemList.value = res.data.data.currentTempList || []
    }
  })
}

function openAddTemplateWin() { addTemplateWin.value = true }

function saveTemplate() {
  addTemplateForm.value?.validate((valid) => {
    if (valid) {
      tempLoading.value = true
      http.post('/queryTemplate/save', { ...tempModel }).then(res => {
        tempLoading.value = false
        if (res.data?.code == 200) {
          addTemplateWin.value = false
          getTemplateList()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.warning(res.data.message)
        }
      })
    }
  })
}

function templateJoinItem() {
  if (!currentTemplate.value.tempId) return
  ElMessageBox.confirm('您确认配置模板吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    tempLoading.value = true
    http.post('/queryTemplateItem/templateJoinItem', {
      tempId: currentTemplate.value.tempId,
      itemIds: currentItemList.value
    }).then(res => {
      tempLoading.value = false
      if (res.data?.code == 200) {
        templateJoinItemWin.value = false
        refresh()
        ElMessage.success(res.data.message)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => {})
}

function changeIsSelectAll(value) {
  currentItemList.value = value ? allItemList.value.map(o => o.queryItemId) : []
}

function changeCurrentItemList() {
  isSelectAll.value = currentItemList.value.length === allItemList.value.length
}

function closeAddTemplate() {
  addTemplateWin.value = false
  Object.assign(tempModel, emptyTempModel)
}

function focusRemarkBlur() {
  if (model.focusRemark) model.isAttention = '1'
}

function emptyModel() { Object.keys(model).forEach(k => delete model[k]) }

function backQuery() {
  showTable.value = false
  dataList.value = []
  params.pageNum = 1
}

function empty() { templateJoinItemWin.value = false }

function styleTableshow() { tabStyle.value?.changeTabStyleShow() }

function getTabStyleCompData(d) {
  if (!d.normal && d.data) {
    dataFiled.value = d.data.map(o => ({ ...o }))
  } else {
    dataFiled.value = JSON.parse(JSON.stringify(reDataFiled.value))
  }
  sendDataFiled.value = dataFiled.value.filter(o => o.model).map(o => ({ ...o }))
}

function tableInit() {
  dataFiled.value = JSON.parse(JSON.stringify(defaultDataFiled))
  reDataFiled.value = JSON.parse(JSON.stringify(defaultDataFiled))
  sendDataFiled.value = JSON.parse(JSON.stringify(defaultDataFiled))
}

function sizeChange(size) { params.pageSize = size; queryOrder() }
function currentChange(page) { params.pageNum = page; queryOrder() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

onMounted(() => {
  tableInit()
  refresh()
})
</script>

<template>
  <Container type="box" class="integrated-query" @resize="getTableHeight">
    <el-row>
      <el-col :span="12">
        <el-button @click="emptyModel" type="warning" size="small">重置</el-button>
        <el-button v-if="!showTable" @click="queryOrder(true)" type="primary" size="small" :loading="loading">查询</el-button>
        <el-button v-else @click="backQuery" type="info" size="small">返回</el-button>
        <el-button v-if="showTable" @click="openReportDialog" type="primary" size="small">导出Excel</el-button>
        <el-button v-if="showTable" @click="openDialogVisible" type="success" size="small">批量导出Word</el-button>
      </el-col>
      <el-col :span="12" style="text-align:right">
        <el-button v-if="!showTable" @click="openTemplateJoinItemWin" type="info" size="small">创建/设置模板</el-button>
        <el-button v-else @click="styleTableshow" type="info" size="small">设置</el-button>
      </el-col>
    </el-row>

    <!-- Query Form -->
    <template v-if="!showTable">
      <el-row v-if="isEmptyTempSonItemList">
        <template v-for="(item, index) in tempSonItemList" :key="index">
          <el-col :span="6" v-show="item.show !== false" class="query-item">
            <!-- Time Range (type 0) -->
            <template v-if="item.queryItemType === 0">
              <div class="text-justify"><span class="span-justify">{{ item.queryItemName }}:</span></div>
              <el-date-picker v-model="model[item.queryItemCode]" clearable type="datetimerange" size="small"
                value-format="YYYY-MM-DD HH:mm:ss" range-separator="-" :default-time="['00:00:00', '23:59:59']"
                start-placeholder="开始日期" end-placeholder="结束日期" style="width:80%" />
            </template>
            <!-- Input (type 1) -->
            <template v-else-if="item.queryItemType === 1">
              <div class="text-justify"><span class="span-justify">{{ item.queryItemName }}:</span></div>
              <el-input v-if="item.queryItemCode === 'focusRemark'" v-model="model[item.queryItemCode]"
                :placeholder="'请输入' + item.queryItemName" style="width:60%" clearable size="small" @blur="focusRemarkBlur" />
              <el-input v-else v-model="model[item.queryItemCode]" :placeholder="'请输入' + item.queryItemName"
                style="width:60%" clearable size="small" />
            </template>
            <!-- Select (type 2) -->
            <template v-else-if="item.queryItemType === 2">
              <div class="text-justify"><span class="span-justify">{{ item.queryItemName }}:</span></div>
              <el-select v-if="item.queryItemCode === 'orderLevel'" v-model="model[item.queryItemCode]" multiple collapse-tags clearable
                :placeholder="'请选择' + item.queryItemName" size="small" style="width:60%">
                <el-option v-for="son in item.data" :key="son.levelId" :label="son.levelName + ' (' + son.handleDays + '日)'" :value="son.levelId" />
              </el-select>
              <el-select v-else v-model="model[item.queryItemCode]" multiple collapse-tags clearable
                :placeholder="'请选择' + item.queryItemName" size="small" style="width:60%">
                <el-option v-for="son in item.data" :key="son.dictId" :label="son.dictName" :value="son.dictId" />
              </el-select>
            </template>
            <!-- Cascader (type 3) -->
            <template v-else-if="item.queryItemType === 3">
              <div class="text-justify"><span class="span-justify">{{ item.queryItemName }}:</span></div>
              <el-cascader v-if="item.queryItemCode === 'orderOrigin'" clearable collapse-tags
                :placeholder="'请选择' + item.queryItemName" v-model="model[item.queryItemCode]"
                :options="item.data" :props="originDictProps" filterable style="width:80%" size="small" />
              <el-cascader v-else clearable :placeholder="'请选择' + item.queryItemName"
                v-model="model[item.queryItemCode]" :options="item.data"
                :props="item.queryItemCode === 'handlerDeptId' || item.queryItemCode === 'acceptDeptId' || item.queryItemCode === 'deptId' ? deptProps : (item.queryItemCode === 'hotspot' ? dictProps1 : dictProps)"
                filterable style="width:60%" size="small" />
            </template>
            <!-- Radio (type 4) -->
            <template v-else>
              <div style="line-height:33px">
                <div class="text-justify"><span class="span-justify">{{ item.queryItemName }}:</span></div>
                <el-select v-if="item.queryItemCode === 'isCallBackSuccess'" v-model="model[item.queryItemCode]"
                  :placeholder="'请选择' + item.queryItemName" clearable size="small" style="width:60%">
                  <el-option label="是" value="1" /><el-option label="否" value="0" />
                </el-select>
                <el-select v-else-if="item.queryItemCode === 'isTimelyReceive'" v-model="model[item.queryItemCode]"
                  :placeholder="'请选择' + item.queryItemName" clearable size="small" style="width:60%">
                  <el-option label="否" value="0" />
                </el-select>
                <el-select v-else v-model="model[item.queryItemCode]" :placeholder="'请选择' + item.queryItemName"
                  clearable size="small" style="width:60%">
                  <el-option v-for="son in (item.queryItemCode === 'sex' ? [{ label: '男', value: '1' }, { label: '女', value: '0' }] : [{ label: '是', value: '1' }, { label: '否', value: '0' }])"
                    :key="son.value" :label="son.label" :value="son.value" />
                </el-select>
              </div>
            </template>
          </el-col>
        </template>
      </el-row>
      <div v-else class="empty-wrapper" style="padding:40px;text-align:center;color:#999">
        您还没有创建模板，请先创建模板再设置您要查询的条件。
      </div>
    </template>

    <!-- Table -->
    <template v-if="showTable">
      <el-table ref="dfpTable" border stripe v-loading="loading" :max-height="tableHeight" :data="dataList"
        @select="selectTable" @select-all="selectTable" style="margin-top:10px">
        <el-table-column type="index" width="50" label="序号" align="center" />
        <el-table-column type="selection" width="55" align="center" />
        <template v-for="col in dataFiled" :key="col.model || col.type">
          <template v-if="col.show && (col.model === 'createTime' || col.model === 'handleEndTime')">
            <el-table-column :align="col.align || 'center'" header-align="center" :prop="col.model"
              :label="col.label" :width="col.width" :show-overflow-tooltip="col['show-overflow-tooltip'] || false">
              <template #default="{ row: r }">{{ formatMoment(r[col.model]) }}</template>
            </el-table-column>
          </template>
          <template v-else-if="col.show && col.model === 'orderOriginName'">
            <el-table-column :align="col.align || 'center'" header-align="center" :prop="col.model"
              :label="col.label" :width="col.width" :show-overflow-tooltip="col['show-overflow-tooltip'] || false">
              <template #default="{ row: r }">{{ r.orderOriginName }}{{ r.orderOrigin2Name ? '/' + r.orderOrigin2Name : '' }}</template>
            </el-table-column>
          </template>
          <el-table-column v-else-if="col.show && col.model !== 'createTime' && col.model !== 'handleEndTime' && col.model !== 'orderOriginName'"
            :align="col.align || 'center'" header-align="center" :type="col.type" :fixed="col.fixed || false"
            :prop="col.model" :label="col.label" :width="col.width" :sortable="col.sortable || false"
            :show-overflow-tooltip="col['show-overflow-tooltip'] || false" />
        </template>
        <el-table-column label="操作" header-align="center" align="center" v-if="operation">
          <template #default="{ row: r }">
            <el-link v-if="r.isSpecialFocus" type="success" :underline="false" style="margin-left:5px" @click="collectOff(r)">取消关注</el-link>
            <el-link v-else type="danger" :underline="false" @click="collectClick(r)" style="margin-left:5px">特别关注</el-link>
            <el-link v-if="r.isFollow === 0 && hasPermission(authCode.optCode.isFocusDb, 1)" type="danger" :underline="false" @click="speicalDbClick(r)" style="margin-left:5px">特别督办</el-link>
            <el-link v-if="r.isFollow == 1 && hasPermission(authCode.optCode.isFocusDb, 1)" type="danger" :underline="false" @click="speicalDbClick(r, 1)" style="margin-left:5px">取消特别督办</el-link>
            <el-link type="primary" :underline="false" @click="printD(r, 'print')" style="margin-left:5px">打印</el-link>
            <el-link type="primary" :underline="false" @click="printD(r, 'zprint')" style="margin-left:5px">交办打印</el-link>
            <el-link v-if="applyInterviewOption && r.orderSubStateName == '待反馈'" type="success" :underline="false" @click="sqcf(r)" style="margin-left:5px">申请采访</el-link>
            <el-link v-if="dbOption" type="success" :underline="false" @click="duban(r)" style="margin-left:5px">督办</el-link>
            <el-link v-if="r.orderSubStateName == '已归档' && restartProcessOption" type="warning" :underline="false" @click="restartProcess(r)" style="margin-left:5px">重启流程</el-link>
            <el-link v-if="r.orderSubStateName == '待回访' && wxhfBtnShow" type="primary" :underline="false" @click="wxhfClick(r)" style="margin-left:5px">无需回访</el-link>
            <el-link v-if="showAddYbkBtn" type="success" :underline="false" @click="addYbk(r)" style="margin-left:5px">添加样本库</el-link>
            <el-link v-if="route.path == '/query/SampleLibrary'" type="danger" :underline="false" @click="delYbk(r)" style="margin-left:5px">删除样本库</el-link>
            <el-link type="primary" :underline="false" @click="detail(r)" style="margin-left:5px">查看</el-link>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="pageInfo.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </template>

    <!-- Template Config Dialog -->
    <el-dialog title="配置模板中的条件项" v-model="templateJoinItemWin" width="50%" :append-to-body="true" :close-on-click-modal="false" top="16vh">
      <el-row type="flex" align="middle">
        <el-col :span="6">
          <el-select :disabled="!currentTemplate.tempId" v-model="currentTemplate.tempId" @change="changeTemplate" placeholder="请选择模板" size="small">
            <el-option v-for="item in templateList" :key="item.tempId" :label="item.tempName" :value="item.tempId">
              <span style="float:left">{{ item.tempName }}</span>
              <span style="float:right;color:#8492a6;font-size:13px">{{ item.isDefault ? '默认模板' : '' }}</span>
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="2" style="padding-left:15px" v-if="currentTemplate.tempId">
          <el-checkbox v-model="isSelectAll" @change="changeIsSelectAll">全选</el-checkbox>
        </el-col>
        <el-col :span="3" style="padding-left:15px">
          <el-link @click="openAddTemplateWin">添加模板</el-link>
        </el-col>
      </el-row>
      <el-row>
        <el-checkbox-group v-model="currentItemList" @change="changeCurrentItemList">
          <el-col :span="4" v-for="item in allItemList" :key="item.queryItemId" style="padding:10px 0">
            <el-checkbox :label="item.queryItemId" :title="item.remarks">{{ item.queryItemName }}</el-checkbox>
          </el-col>
        </el-checkbox-group>
      </el-row>
      <template #footer>
        <el-button type="primary" @click="templateJoinItem" :loading="tempLoading" :disabled="!currentTemplate.tempId">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- Add Template Dialog -->
    <el-dialog title="添加综合查询模板" v-model="addTemplateWin" width="37%" :append-to-body="true" :close-on-click-modal="false" top="16vh">
      <el-form ref="addTemplateForm" :rules="templateRules" size="small" :model="tempModel" label-width="120px" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="模板名称" prop="tempName">
              <el-input v-model="tempModel.tempName" placeholder="请输入模板名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="模板编码" prop="tempCode">
              <el-input v-model="tempModel.tempCode" clearable placeholder="请输入模板名称首字母" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="模板备注" prop="remarks">
              <el-input v-model="tempModel.remarks" type="textarea" :rows="3" placeholder="请输入模板备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveTemplate" :loading="tempLoading">确认</el-button>
        <el-button @click="closeAddTemplate">取消</el-button>
      </template>
    </el-dialog>

    <!-- Export Excel Dialog -->
    <el-dialog title="导出Excel" v-model="reportExcelWin" append-to-body top="20vh" :close-on-click-modal="false" width="700px" @close="() => {}">
      <el-form :model="reportForm" :rules="reportRules" ref="ruleForm" size="small" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="文件名" prop="fileName"><el-input v-model="reportForm.fileName" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="要导出的数据" prop="dataSize">
              <el-radio-group v-model="reportForm.dataSize">
                <el-radio :value="0">选中记录</el-radio>
                <el-radio :value="1">全部记录</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="选择模板" prop="tempId">
              <el-select v-model="reportForm.tempId" @change="changeReportTemplate" placeholder="请选择导出使用的模板" style="width:220px">
                <el-option v-for="item in tempOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>&nbsp;
              <el-button v-if="isShowSetTempBtn" @click="setTemplate">设置模板</el-button>
              <el-button :loading="addTemplateLoading" @click="addTemplate">添加模板</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="reportExcelWin = false" size="small">取消</el-button>
        <el-button type="primary" @click="exportReportForm" :loading="reportExcelLoading" size="small">导出</el-button>
      </template>
    </el-dialog>

    <!-- Set Export Template Dialog -->
    <el-dialog title="设置模板" v-model="isShowSetTemplate" append-to-body top="20vh" :close-on-click-modal="false" width="800px">
      <el-row>
        <el-button size="small" type="primary" @click="checkAllAndCounter(1)">全选</el-button>
        <el-button size="small" type="success" @click="checkAllAndCounter(2)">反选</el-button>
      </el-row>
      <el-row>
        <el-checkbox-group v-model="reportTemplateAndSonItem">
          <el-col :span="6" v-for="item in reportTempSonItemList" :key="item.id" style="padding:5px">
            <el-checkbox :label="item.id">{{ item.name }}</el-checkbox>
          </el-col>
        </el-checkbox-group>
      </el-row>
      <template #footer>
        <el-button @click="isShowSetTemplate = false" size="small">取消</el-button>
        <el-button type="primary" @click="reportTemplateJoinItem" :loading="reportTemplateJoinItemLoading" size="small">确定</el-button>
      </template>
    </el-dialog>

    <!-- Batch Print Dialog -->
    <el-dialog v-model="dialogVisible" title="打印选项" append-to-body top="30vh" width="300px">
      <el-radio v-model="printType" :value="1">打印</el-radio>
      <el-radio v-model="printType" :value="2">交办打印</el-radio>
      <template #footer>
        <el-button @click="dialogVisible = false" size="small">取消</el-button>
        <el-button type="primary" @click="batchPrinting" :loading="batchPrintLoading" size="small">确定</el-button>
      </template>
    </el-dialog>

    <!-- No Callback Dialog -->
    <el-dialog title="无需回访" v-model="wxhfFormVisible" append-to-body top="20vh" :close-on-click-modal="false" width="800px">
      <el-form :model="wxhfForm" label-width="80px">
        <el-form-item label="原因" required>
          <el-input v-model.trim="wxhfForm.remarks" type="textarea" :autosize="{ minRows: 4, maxRows: 16 }" show-word-limit
            placeholder="请填写无需回访原因，最多输入1000个字符" maxlength="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wxhfFormVisible = false" size="small">取消</el-button>
        <el-button @click="wxhfSubmit" :loading="wxhfLoading" type="primary" size="small">确定</el-button>
      </template>
    </el-dialog>

    <!-- Child Components -->
    <Orderinfo ref="orderInfo" v-model:isShow="isShowOrderinfo" />
    <DbspForm2 :page="'dbsp2'" v-model:isShowForm="showDuban" ref="dbsp2" />
    <sqcfForm :page="'sqcf'" v-model:isShowForm="showSqcf" ref="sqcfFormRef" />
    <PrintExport ref="printExport" v-model:isshowPrint="isshowPrint" />
    <tableStyle ref="tabStyle" :headList="sendDataFiled" @saveTabStyle="getTabStyleCompData" />
  </Container>
</template>

<style scoped>
.integrated-query .query-item { padding: 10px 5px; }
.integrated-query .text-justify { display: inline-block; width: 35%; text-align: right; overflow: hidden; white-space: nowrap; }
.integrated-query .span-justify { font-size: 13px; color: #606266; }
.integrated-query .empty-wrapper { padding: 80px 0; text-align: center; }
.integrated-query .empty-wrapper-title { font-size: 16px; color: #909399; }
.integrated-query .el-col { padding: 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
</style>
