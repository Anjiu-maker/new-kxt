<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useCtiStore } from '@/stores/cti'
import { useGlobal } from '@/composables/useGlobal'
import Audio from './Audio.vue'

const route = useRoute()
const authStore = useAuthStore()
const ctiStore = useCtiStore()
const { getDictByCode, getCurrentDateTime, isSpecialFocus, getDateDiff, authCode } = useGlobal()

// ---- props ----
const props = defineProps({
  isShow: { type: Boolean, default: false },
  isShowHandle: { type: Boolean, default: true },
  isNameAndTelSecrecy: { type: Boolean, default: true },
  width: { type: String, default: '1000' },
  orderHeader: { type: String, default: '事务处理' },
  isShowHandleinfo: { type: Boolean, default: true },
  isShowLastHander: { type: Boolean, default: true },
  listen: { type: Boolean, default: false }
})

const emit = defineEmits(['update:isShow', 'before-close', 'open', 'close', 'isfocus', 'resultChange', 'show-order-info'])

// ---- dialog state ----
const visible = ref(false)
const loading = ref(false)
const more = ref(false)
const currentOrderId = ref('')
const orderNo = ref('')
const isNameSecurity = ref(false)
const isBaomi = ref(false)

// ---- audio state ----
const audioWin = ref(false)
const audioUrl = ref('')
const audioWinMaster = ref(false)
const audioUrlMaster = ref('')
const callID = ref('')
const isMaster = ref(false)

// ---- time tracking ----
const time = ref('')
let timeNameInterval = null
const intervalTimers = []

function addIntervalTimer(timer) {
  intervalTimers.push(timer)
}

// ---- basic data ----
const basicData = reactive({})
const orderinfoData = reactive({
  basicData: {
    isOverdue: 0, orderStateName: '', name: '', haveSound: 0, callTel: '',
    orderOriginName: '', handleEndTime: '', title: '', contentRemark: '',
    orderNo: '', orderTypeName: '', orderType: '', orderLevel: '', orderLevelName: '',
    handleTypeName: '', orderSubState: 0, orderSubStateName: '', isNameSecurity: 0,
    isStatistics: 0, isPublic: 0, isCallbackSuccess: 0, isManualOpenPage: 0,
    orderId: '', orderAddr: '', addr: '', deptName: '', handlerDeptName: '',
    handlerDeptId: '', acceptDeptName: '', createUserWorkNumber: '', createTime: '',
    transferTime: '', transferHandlerName: '', handlerName: '', upReportTime: '',
    placeOnFileTime: '', telCount: 0, telCountYf: 0, haveSoundName: '',
    feedbackerName: '', feedbackerDept: '', feedbackerTel: '', realTel: '',
    callbackerWorkNumber: '', callbackTime: '', callbackInfo: '',
    acceptCenterIdea: '', teamLeaderIdea: '', releaseContent: '',
    resultHandling: '', basicInfo: '', callerContent: '', contentRemark: '',
    isJointHandle: 0, isOverdue: 0, isChaoqiReminders: false, isChaoqiRemindersRed: false,
    qualityTester: '', qualityTesterName: '', qualityTestTime: '', qualityLabelName: '',
    sex: 0, ageRangeName: '', isNative: 0, shotMessageNumber: '', isBzpth: 0,
    portrait: [], emotion: '', idcard: '', massesRemarks: '', orderTagName: '',
    specialWork: '', specialWorkName: '', accessnum: '', transferInfoName: '',
    isReal: -1, handleInfoName: '', callbackFailReason: '', relevantOrderNode: '',
    secrecyInfo: '', isRecordSupplement: 0, haveAttachment: 0, xinDianOrderId: '',
    sptHandleEndTime: '', updateRecord: '', hotspot1: 0, hotspot2: 0, hotspot3: 0,
    hotspot4: 0, hotspot5: 0, hotspot1Name: '', hotspot2Name: '', hotspot3Name: '',
    hotspot4Name: '', hotspot5Name: '', zxAppraise: -1, satisfactionss: -1,
    noStatisticsReason: '', isContactPerson: -1, isReplyPerson: -1,
    contactTime: '', contactCause: '', replyTime: '', replyCause: '',
    incidentTime: '', openPageTime: ''
  },
  taskData: {}
})

// ---- task history ----
const hiTaskList = ref([])
const hiTaskDataList = reactive({
  tjList: [], fpList: [], clList: [], fkList: [], hfList: [], gdList: []
})
const dataList = ref([])
const handleAll = ref(true)

// ---- last handler ----
const lastData = reactive({
  deptName: '', assingeeUser: '', taskName: '', remarks: '', startTime: '',
  userName: '', handleDeptName: '', orderStateName: '', backReason: [],
  handleEndTime: '', groupLeaderOpinion: '', callbackInfo: ''
})

// ---- attachments ----
const fjList = ref([])
const fjTableData = ref([])
const isShowFj = ref(false)
const isHaveFj = ref(false)
const filters = ref([])

// ---- upload ----
const uploadFileWin = ref(false)
const attachmentTypeOpt = ref(false)
const attachmentTypes = ref([])
const fileList = ref([])
const fileData = reactive({ orderId: '', userPath: 'myHiOrderUpload', isSaveLog: 1, type: '', remarks: 'info' })

// ---- overdue dialog ----
const yqVisable = ref(false)
const yqhandleEndTime = ref('')
const yqLoading = ref(false)

// ---- modification records ----
const orderLogList = ref([])
const activeNames = ref([])
const modifyrecordPageInfo = reactive({ pageNum: 1, pageSize: 5, total: 0 })

// ---- update order ----
const updateOrderInfo = reactive({
  isStatistics: null, noStatisticsReason: '', zxAppraise: null,
  handleEndTime: '', title: '', resultHandling: '', basicInfo: '',
  callerContent: '', specialWork: '', contentRemark: '', orderAddr: '',
  hotspot1: 0, hotspot2: 0, hotspot3: 0, hotspot4: 0, hotspot5: 0,
  hotspot1Name: '', hotspot2Name: '', hotspot3Name: '', hotspot4Name: '', hotspot5Name: '',
  handlerDeptId: '', orderId: '', orderType: '', orderLevel: '', hotspotStr: '',
  orderTypeName: '', orderLevelName: '', handlerDeptName: '', hotspot: ''
})

// ---- time data ----
const timeData = ref({})
const cbAndDbData = ref({})

// ---- joint handling ----
const jointData = ref({})
const jointHandleRadio = ref(0)
const JointHandleTableData = ref([])

// ---- historical orders ----
const lsgdList = ref([])
const lsgdLoading = ref(true)
const tel = ref('')
const lsgdPageData = reactive({ total: 0, pageSize: 5, pageNum: 1 })

// ---- select options ----
const zxgzOptions = ref([])
const zxAppraiseOptions = ref([])
const satisfactionssOptions = ref([])
const orderTypeOptions = ref([])
const orderLevelOptions = ref([])
const hotspotOptions = ref([])
const portrait = ref([])

// ---- permission flags ----
const isHaveSbshUpdateOrder = ref(false)
const isHaveLookBaomi = ref(false)
const isHaveListenLy = ref(false)
const isInMyOrderAndUpdateOrder = ref(false)
const isInDfpAndUpdateOrder = ref(false)
const isInDzjUpdateOrder = ref(false)
const isLoginCTI = ref(false)
const isHaveSoftPhone = ref(false)
const showSpecialFocus = ref(false)
const isShowbmxxAndgdbz = ref(false)
const isCbdw = ref(false)
const isZjdf = ref(0)
const deleFj = ref(false)
const deleSelfFj = ref(false)
const isHasSourceOrderNo = ref(true)
const sourcePointOrderNo = ref(null)
const subRelevantOrderNode = ref(null)
const isHaveDownLoadSound = ref(false)
const relevantOrderNos = ref([])

// ---- computed ----
const userInfo = computed(() => authStore.userInfo ?? {})
const hasPermission = (code, type) => authStore.hasPermission(code, type)
const zxAppraise = computed(() => {
  const opt = zxAppraiseOptions.value.find(o => o.dictValue == orderinfoData.basicData.zxAppraise)
  return opt?.dictName ?? ''
})
const satisfactionssName = computed(() => {
  const opt = satisfactionssOptions.value.find(o => o.dictValue == orderinfoData.basicData.satisfactionss)
  return opt?.dictName ?? ''
})

const lastHandleText = computed(() => {
  let value = ''
  if (lastData.deptName) value += '【' + lastData.deptName + '】'
  value += '【' + lastData.assingeeUser + '】' + lastData.taskName
  if (lastData.handleDeptName) value += '【' + lastData.handleDeptName + '】'
  if (lastData.userName) value += lastData.handleDeptName + '【' + lastData.userName + '】'
  if (lastData.taskName != '上报处理') value += '处理'
  if (lastData.backReason && lastData.backReason.length) {
    value += '\t退回原因：'
    lastData.backReason.forEach((r, i) => { value += (i + 1) + '、' + r + '\t' })
  }
  if (lastData.remarks) value += '，处理内容：【' + lastData.remarks + '】'
  if (lastData.callbackInfo) value += '，处理内容：【' + lastData.callbackInfo + '】'
  if (lastData.taskName == '申请延期') value += '\t延期至：' + lastData.handleEndTime
  if (lastData.taskName == '申请疑难') value += '\t组长意见：' + lastData.groupLeaderOpinion
  return value
})

const surplusTime = computed(() => {
  const endTime = new Date(orderinfoData.basicData.handleEndTime?.replace(/-/g, '/'))
  const diff = endTime - Date.now()
  if (diff < 0) return false
  if (diff <= 3600000) getCountdown()
  return diff <= 3600000
})

const secrecyInfo = computed(() => {
  const parts = (orderinfoData.basicData.secrecyInfo || '').split(',').filter(Boolean)
  return parts.length ? '★' + parts.join('★') : ''
})

const handleInfo = computed(() => orderinfoData.basicData.handleInfoName || '')
const callbackFailReason = computed(() => orderinfoData.basicData.callbackFailReason || '')
const isShowJointHandle = computed(() => orderinfoData.basicData.isJointHandle > 0)

const isReal = computed(() => {
  switch (orderinfoData.basicData.isReal) {
    case 1: return '属实'
    case 2: return '部分属实'
    case 0: return '不属实'
    default: return ''
  }
})

const hotspotName = computed(() => {
  let name = ''
  for (let i = 1; i <= 5; i++) {
    if (orderinfoData.basicData['hotspot' + i + 'Name']) {
      name = name ? name + '/' + orderinfoData.basicData['hotspot' + i + 'Name'] : orderinfoData.basicData['hotspot' + i + 'Name']
    }
  }
  return name
})

const uploadAction = computed(() => {
  const config = window.common || window.__KXT_CONFIG__ || {}
  return config.baseApi + (config.apiVersion || '/api/v1') + '/uploadFile/upload'
})

const importHeaders = computed(() => ({
  token: sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
}))

// ---- watch ----
watch(() => props.isShow, (v) => {
  visible.value = v
  if (v) {
    isHasSourceOrderNo.value = true
    isShowbmxxAndgdbz.value = userInfo.value.deptId == (window.common?.zwrxId || window.__KXT_CONFIG__?.zwrxId)
  } else {
    sourcePointOrderNo.value = null
    isHasSourceOrderNo.value = false
  }
}, { immediate: true })

watch(visible, (v) => emit('update:isShow', v))

// ---- helpers ----
function formatDate(v) {
  if (!v) return '-'
  const d = new Date(typeof v === 'string' ? v.replace(/-/g, '/') : (Number(v) * 1000))
  if (Number.isNaN(d.getTime())) return '-'
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function parseJsonSafe(str) {
  try { return typeof JSON.parse(str) === 'object' ? JSON.parse(str) : null } catch { return null }
}

function isJsonString(str) {
  try { return typeof JSON.parse(str) === 'object' } catch { return false }
}

function jsonStr2Obj(str) {
  try { return typeof JSON.parse(str) === 'object' ? JSON.parse(str) : {} } catch { return {} }
}

function isNull(data) { return data || '' }

function dateFormat(fmt, date) {
  const o = {
    'M+': date.getMonth() + 1, 'd+': date.getDate(), 'h+': date.getHours(),
    'm+': date.getMinutes(), 's+': date.getSeconds(), 'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  }
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return fmt
}

function getCountdown() {
  let minute1 = getDateDiff(dateFormat('yyyy-MM-dd hh:mm:ss', new Date()), orderinfoData.basicData.handleEndTime, 'minute')
  time.value = changeHourMinutestr(minute1)
  clearInterval(timeNameInterval)
  timeNameInterval = setInterval(() => {
    const minute = getDateDiff(dateFormat('yyyy-MM-dd hh:mm:ss', new Date()), orderinfoData.basicData.handleEndTime, 'minute')
    time.value = changeHourMinutestr(minute)
  }, 60000)
  addIntervalTimer(timeNameInterval)
}

function changeHourMinutestr(str) {
  if (str && str !== '0' && str !== '') {
    const hours = Math.floor(str / 60)
    const minutes = str % 60
    return hours + '时' + (minutes < 10 ? '0' + minutes : minutes) + '分'
  }
  return ''
}

function computeSecrecy(haveSoundRecording) {
  if (haveSoundRecording == 1) {
    if (isBaomi.value) {
      const roleName = userInfo.value.roleName || ''
      if (roleName.includes('承办单位')) return 0
      return 1
    }
    return isHaveListenLy.value ? 1 : 0
  }
  return 2
}

// ---- CTI ----
function hujiao(tel, cti_callNum, outType) {
  if (tel.length > 12) {
    ElMessage.error('请呼叫正确的手机号！')
    return
  }
  const md = route.params.md
  let pageType = '处理'
  if (['dfp', 'dgj', 'fzgcb', 'znjth'].includes(md)) pageType = '分派'
  else if (['dhf', 'yyhf', 'dgd'].includes(md)) pageType = '回访'
  const param = { tel, orderId: orderinfoData.basicData.orderId, pageType, outType: outType || 2 }
  ctiStore.ctiHujiao(param)
}

function guaduan(tel) {
  ctiStore.ctiGuaduan({ tel, orderId: orderinfoData.basicData.orderId })
}

function add0Click() {
  const tel = String(orderinfoData.basicData.callTel || '')
  if (!tel.startsWith('0')) {
    orderinfoData.basicData.callTel = '0' + tel
  }
  hujiao(orderinfoData.basicData.callTel, 1, orderinfoData.basicData.orderSubState == 5 ? 4 : 2)
}

// ---- audio ----
function playOrderSound() {
  isMaster.value = true
  if (orderinfoData.basicData.isRecordSupplement == 1) {
    transPrefix(orderinfoData.basicData.callId, true)
  } else {
    http.post('/orderInfo/findSoundByOrderId', { id: orderinfoData.basicData.orderId }).then(res => {
      if (res.data?.code == 200 && res.data.data) {
        cti_recordVoice(res.data.data, true)
      } else {
        ElMessage.error('无录音')
      }
    })
  }
}

function lookSound(item) {
  if (item.soundRecordingUrl?.includes('-')) {
    isMaster.value = false
    cti_recordVoice(item.soundRecordingUrl)
  } else {
    isMaster.value = false
    transPrefix(item.soundRecordingUrl)
  }
}

function cti_recordVoice(callIdParam, isMasterParam) {
  http.post('/incomeinfor/find', { callId: callIdParam }).then(res => {
    if (res.data?.code == '200' && res.data.data != null) {
      transPrefix(res.data.data.recordFile, isMasterParam, callIdParam)
    } else {
      ElMessage.error(res.data?.message || '无录音')
    }
  })
}

function transPrefix(oldUrl, isMasterParam, callIdParam) {
  callID.value = callIdParam || ''
  const config = window.common || window.__KXT_CONFIG__ || {}
  if (isMasterParam) audioWinMaster.value = false
  else audioWin.value = false
  setTimeout(() => {
    let url = 'http://' + (config.cti_webSocketBaseApi || 'webrtc.call12345.com') + ':12121' + oldUrl
    if (isMasterParam) {
      audioUrlMaster.value = url
      audioWinMaster.value = true
    } else {
      audioUrl.value = url
      audioWin.value = true
    }
  }, 1000)
}

function soundError() {
  if (isMaster.value) {
    audioWinMaster.value = false
    isMaster.value = false
  } else {
    audioWin.value = false
  }
  ElMessage.error('加载录音失败')
}

// ---- overdue ----
function yuqi() {
  yqhandleEndTime.value = orderinfoData.basicData.orderSubState == 99 ? orderinfoData.basicData.handleEndTime : ''
  yqVisable.value = true
}

function yuqiSubmit() {
  if (!yqhandleEndTime.value) {
    ElMessage.error('请选择限办时间')
    return
  }
  yqLoading.value = true
  http.post('/orderInfo/upUserIsOverdue', {
    orderId: orderinfoData.basicData.orderId,
    handleEndTime: yqhandleEndTime.value
  }).then(res => {
    yqLoading.value = false
    if (res.data?.code == 200) {
      yqVisable.value = false
      yqhandleEndTime.value = ''
      ElMessage.success(res.data.message)
      reloadDataByOrderId(orderinfoData.basicData.orderId)
    } else {
      ElMessage.error(res.data.message)
    }
  }).catch(() => { yqLoading.value = false })
}

// ---- secrecy ----
function editOrderBm(tips) {
  ElMessageBox.confirm('是否进行' + tips + '操作？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.post('/orderInfo/upUserIsBm', { orderId: orderinfoData.basicData.orderId }).then(res => {
      if (res.data?.code == 200) {
        reloadDataByOrderId(orderinfoData.basicData.orderId)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消'))
}

// ---- special focus ----
function getIsSpecialFocus(orderId) {
  isSpecialFocus(orderId).then(res => { showSpecialFocus.value = res })
}

function collectOff() {
  ElMessageBox.confirm('您确认取消此事务的特别关注吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.get('/orderInfo/special_focus', { params: { isFocus: false, orderId: orderinfoData.basicData.orderId } }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success('已取消特别关注')
        getIsSpecialFocus(orderinfoData.basicData.orderId)
        emit('isfocus')
      } else {
        ElMessage.error('取消失败')
      }
    })
  }).catch(() => ElMessage.info('已取消操作'))
}

// ---- attachments ----
function getFj(orderId) {
  const id = orderId || orderinfoData.basicData.orderId
  http.get('/orderAttachmentRecoding/list', { params: { flag: false, orderId: id } }).then(res => {
    if (res.data?.code == 200) {
      fjTableData.value = res.data.data || []
      isHaveFj.value = fjTableData.value.length > 0
    }
  })
}

function lockAccssory() {
  isShowFj.value = true
  getFj()
}

function lookAccessories(item) {
  if (item.accessoriesUrl) {
    try {
      fjTableData.value = JSON.parse(item.accessoriesUrl)
      isShowFj.value = true
    } catch { }
  }
}

function downLoad(row) {
  const config = window.common || window.__KXT_CONFIG__ || {}
  let url = row.attachmentUrl
  if (!url?.startsWith('http')) {
    url = (config.baseApi || '') + '/static/' + url
  }
  const attachmentName = orderinfoData.basicData.orderNo + '-' + row.attachmentName
  http({
    url: '/uploadFile/download', method: 'get', responseType: 'arraybuffer',
    params: { path: url, fileName: row.attachmentName }, timeout: 1200000
  }).then(async res => {
    const link = document.createElement('a')
    const blob = new Blob([res.data])
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = attachmentName
    link.click()
    URL.revokeObjectURL(objectUrl)
  })
}

function deleteFile(row) {
  ElMessageBox.confirm('此操作将永久删除该文件, 是否继续?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.post('/uploadFile/delete/' + row.attachmentId, { orderId: orderinfoData.basicData.orderId }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        getFj()
        getdatalist()
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消删除'))
}

function isShowDeleteFile(row) {
  if (!deleFj.value) return false
  if (route.name === 'integratedQuery' && orderinfoData.basicData.orderSubStateName == '已归档' && !isShowbmxxAndgdbz.value) return false
  if (deleSelfFj.value && row.createDeptId !== userInfo.value.deptId) return false
  return true
}

function getTagType(code, type) {
  let typeName = 'success', effect = 'dark'
  const dc = authCode.dictCode
  switch (code) {
    case dc.basisForHandling: typeName = 'success'; break
    case dc.backBasis: typeName = 'info'; break
    case dc.superviseBasis: typeName = 'warning'; break
    case dc.massesAddBasis: typeName = 'danger'; break
    case dc.zxAddBasis: typeName = ''; break
    case dc.noStatisticsBasis: typeName = 'success'; effect = 'dark'; break
    case dc.otherType: typeName = 'info'; effect = 'dark'; break
  }
  return type == 1 ? typeName : effect
}

function filterTag(value, row) {
  return row.fileType === value
}

function openUploadFileWin() {
  uploadFileWin.value = true
  attachmentTypeOpt.value = hasPermission(authCode.optCode.attachmentTypeOpt, 1)
  if (attachmentTypeOpt.value) {
    getDictByCode(false, 'attachmentType').then(res => {
      attachmentTypes.value = res
      setFileType(route.params.md)
    })
  }
}

function setFileType(md) {
  if (['zcsw', 'fzgth', 'yngd'].includes(md)) {
    fileData.type = authCode.dictCode?.zxAddBasis || ''
  } else {
    fileData.type = authCode.dictCode?.otherType || ''
  }
}

function upSuccess(response, file, fileListParam) {
  if (response.code == 200) {
    const data = response.data
    data.name = data.attachmentName
    delete data.attachmentName
    fileList.value.push(data)
    orderinfoData.basicData.haveAttachment = 1
    isHaveFj.value = true
    ElMessage.success('上传附件成功！')
  } else {
    ElMessage.error(response.message)
  }
}

function handleRemove(file) {
  http.post('/uploadFile/delete/' + file.attachmentId, { orderId: orderinfoData.basicData.orderId }).then(res => {
    if (res.data?.code == 200) {
      fileList.value = fileList.value.filter(o => o.attachmentId != file.attachmentId)
    } else {
      ElMessage.error(res.data.message)
    }
  })
}

function beforeRemove(file) {
  if (!hasPermission(authCode.optCode.deleteOrderFile, 1)) {
    ElMessage.info('删除失败！无删除附件权限！')
    return false
  }
  return ElMessageBox.confirm(`确定移除 ${file.name}？`)
}

function handleChange(file, fileListParam) {
  const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
  const allowed = ['png', 'docx', 'jpg', 'doc', 'jpeg', 'mp3', 'zip', 'rar', 'm4a', 'wav', 'pdf', 'mp4', 'wps', 'gif']
  if (file.size > 30 * 1024 * 1024) {
    ElMessage.warning('上传文件大小不能超过30M')
    fileList.value = fileList.value.slice(0, -1)
    return
  }
  if (!allowed.includes(ext)) {
    ElMessage.warning('上传失败！不支持' + ext + '类型的文件。')
    fileList.value = fileList.value.slice(0, -1)
    return
  }
}

function handleExceed() {
  ElMessage.warning('当前限制选择 50 个文件')
}

// ---- update order ----
function updateOrder(updateType, node) {
  const d = JSON.parse(JSON.stringify(basicData))
  updateOrderInfo.orderId = d.orderId
  const e = JSON.parse(JSON.stringify(updateOrderInfo))
  if (node) e.handlerDeptId = node.deptId

  let updateField = ''
  switch (updateType) {
    case 'resultHandling':
      if (d.resultHandling == e.resultHandling) return
      updateField = '处理结果及沟通情况'
      break
    case 'handleEndTime':
      if (d.handleEndTime == e.handleEndTime) return
      updateField = '限办时间'
      break
    case 'title':
      if (d.title == e.title) return
      updateField = '标题'
      break
    case 'callerContent':
      if (d.callerContent == e.callerContent) return
      updateField = '内容'
      break
    case 'basicInfo':
      if (d.basicInfo == e.basicInfo) return
      updateField = '基本情况及现场检查情况'
      break
    case 'hotspot': updateField = '热点'; break
    case 'orderType': updateField = '问题类型'; break
    case 'orderLevel': updateField = '问题级别'; break
    case 'orderAddr': updateField = '事发地址'; break
    case 'contentRemark': updateField = '备注'; break
    case 'specialWork': updateField = '专项工作'; break
    case 'handlerDeptId': updateField = '承办单位'; break
  }

  ElMessageBox.confirm('您确认修改' + updateField + '吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    e.orderTypeName = orderTypeOptions.value.find(o => o.dictId == e.orderType)?.dictName || ''
    e.orderLevelName = orderLevelOptions.value.find(o => o.levelId == e.orderLevel)?.levelName || ''
    if (node) {
      e.handlerDeptName = node.deptName
      e.handlerDeptId = node.deptId
    }
    e.hotspot = (hotspot.value || []).join(',')
    if (isNaN(e.specialWork)) e.specialWork = null
    e.callerContent = e.callerContent?.replace(/\n\n/g, '') || ''
    http.post('/orderInfo/update_order_info', e).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        getUpdateOrderHistory(d.orderId)
        emit('resultChange', updateOrderInfo.resultHandling)
      } else {
        ElMessage.error(res.data.message)
      }
      reloadDataByOrderId(d.orderId)
    })
  }).catch(() => {
    updateOrderInfo.handleEndTime = d.handleEndTime
    updateOrderInfo.orderLevel = d.orderLevel || ''
    updateOrderInfo.orderType = d.orderType
    updateOrderInfo.title = d.title
    updateOrderInfo.resultHandling = d.resultHandling
    updateOrderInfo.basicInfo = d.basicInfo
    updateOrderInfo.callerContent = d.callerContent
    updateOrderInfo.specialWork = d.specialWork ? d.specialWork - 0 : ''
    updateOrderInfo.contentRemark = d.contentRemark
    updateOrderInfo.orderAddr = d.orderAddr
    updateOrderInfo.handlerDeptId = d.handlerDeptId
    hotspot.value = []
    for (let i = 0; i < 5; i++) {
      const tmp = orderinfoData.basicData['hotspot' + (i + 1)]
      if (tmp != 0) hotspot.value.push(tmp)
    }
    ElMessage.info('已取消修改' + updateField)
  })
}

function saveZxAppraiseAndIsStatisticsAndReason() {
  if (updateOrderInfo.isStatistics && !updateOrderInfo.noStatisticsReason) {
    ElMessage.warning('当选择不计入统计时原因必填！')
    return
  }
  ElMessageBox.confirm('您确认修改办理结果评价、是否计入统计和不计入统计原因吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const param = {
      orderId: orderinfoData.basicData.orderId,
      saveZxAppraiseAndIsStatisticsAndReason: true,
      oldZxAppraise: orderinfoData.basicData.zxAppraise,
      newZxAppraise: updateOrderInfo.zxAppraise,
      oldIsStatistics: orderinfoData.basicData.isStatistics,
      newIsStatistics: updateOrderInfo.isStatistics ? 0 : 1,
      oldNoStatisticsReason: orderinfoData.basicData.noStatisticsReason,
      newNoStatisticsReason: updateOrderInfo.noStatisticsReason
    }
    http.post('/orderInfo/update_order_info', param).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        getUpdateOrderHistory(orderinfoData.basicData.orderId)
      } else {
        ElMessage.error(res.data.message)
      }
      reloadDataByOrderId(orderinfoData.basicData.orderId)
    })
  }).catch(() => ElMessage.info('已取消修改'))
}

// ---- dict loading ----
function getOriginLevel() {
  http.get('/order_level/list', { params: { flag: false } }).then(res => {
    if (res.data?.code == 200) {
      orderLevelOptions.value = res.data.data || []
      const found = orderLevelOptions.value.find(o => o.levelId == orderinfoData.basicData.orderLevel)
      if (found) orderinfoData.basicData.orderLevel = found.levelName
    }
  })
}

function getTaskData(orderId) {
  http.get('/orderInfo/findRuTask', { params: { orderId } }).then(res => {
    if (res.data?.code == 200) orderinfoData.taskData = res.data.data
  })
}

function getqzqx() {
  getDictByCode(true, 'qzqx').then(res => {
    const found = res.find(o => o.dictId == orderinfoData.basicData.emotion)
    if (found) orderinfoData.basicData.emotion = found.dictName
  })
}

function getzxgz() {
  getDictByCode(true, 'zxgz').then(res => {
    const found = res.find(o => o.dictId == orderinfoData.basicData.specialWork)
    if (found) orderinfoData.basicData.specialWork = found.dictName
  })
}

function getRwhx() {
  getDictByCode(true, 'rwhx').then(res => {
    portrait.value = []
    if (orderinfoData.basicData.portrait?.length) {
      orderinfoData.basicData.portrait.forEach(p => {
        const found = res.find(o => o.dictId == p)
        if (found) portrait.value.push(found.dictName)
      })
    }
  })
}

function getProcessTime(orderId) {
  http.get('/orderInfo/findProcessTime', { params: { id: orderId } }).then(res => {
    if (res.data?.code == 200) {
      const td = {}
      for (const key in res.data.data) {
        const tem = res.data.data[key].split(',')
        td[key] = { time: tem[0], timeDiffer: [tem[1], tem[2], tem[3]] }
      }
      timeData.value = td
    }
  })
}

function howTime(handleType) {
  if (timeData.value[handleType]?.timeDiffer) {
    const arr = timeData.value[handleType].timeDiffer
    return `<font color='#1ec161'>${arr[0]}</font>天<font color='#1ec161'>${arr[1]}</font>小时<font color='#1ec161'>${arr[2]}</font>分钟`
  }
  return "<font color='#1ec161'>0</font>天<font color='#1ec161'>0</font>小时<font color='#1ec161'>0</font>分钟"
}

function getTimeData_time(handleType) {
  return timeData.value[handleType]?.time || ''
}

function findCbAndDbCountByOrderId(orderId) {
  http.get('/orderInfo/findCbAndDbCountByOrderId', { params: { orderId } }).then(res => {
    if (res.data?.code == 200) cbAndDbData.value = res.data.data
  })
}

// ---- modification records ----
function getUpdateOrderHistory(orderId) {
  http.get('/orderLogItem/list_update', {
    params: { orderId: orderId || orderinfoData.basicData.orderId, pageNum: modifyrecordPageInfo.pageNum, pageSize: modifyrecordPageInfo.pageSize }
  }).then(res => {
    if (res.data?.code == 200) {
      orderLogList.value = res.data.data.records || []
      modifyrecordPageInfo.total = res.data.data.total || 0
    }
  })
}

function modifyrecordsCurrentChange(e) {
  modifyrecordPageInfo.pageNum = e
  getUpdateOrderHistory()
}

function modifyrecordsSizeChange(e) {
  modifyrecordPageInfo.pageSize = e
  getUpdateOrderHistory()
}

// ---- joint handling ----
function getOrderListByParentOrderNo(orderId) {
  http.get('/orderInfo/getJointOrderListByOrderId', { params: { orderId } }).then(res => {
    if (res.data?.code == 200) {
      jointData.value = res.data.data || {}
      if (jointData.value?.level2Orders?.length && !jointData.value?.level1Orders?.length) {
        JointHandleTableData.value = jointData.value.level2Orders
        jointHandleRadio.value = 1
      } else {
        JointHandleTableData.value = jointData.value.level1Orders || []
      }
    }
  })
}

// ---- task history ----
function getdatalist() {
  http.get('/hi_task/list', { params: { businessKey: orderinfoData.basicData.orderId } }).then(res => {
    if (res.data?.code == 200) {
      const copyData = (res.data.data || []).filter(o => o.taskName != '流程开始')
      isZjdf.value = copyData.findIndex(o => o.taskName == '直接答复')
      if (route.params?.md === 'orderSearch' || route.params?.md === 'orderSearchCy') {
        dataList.value = copyData.filter(o => !['添加样本库', '删除样本库'].includes(o.taskName))
      } else {
        dataList.value = [...copyData]
      }
      const sorted = [...copyData].sort((a, b) => (a.historyTaskId || 0) - (b.historyTaskId || 0))
      handleDataList(sorted)

      const last = dataList.value[0]
      if (last) {
        lastData.assingeeUser = last.assingeeUser || ''
        lastData.taskName = last.taskName || ''
        lastData.deptName = last.deptName || ''
        lastData.startTime = last.endTime || ''
        if (last.handleContentAll && isJsonString(last.handleContentAll)) {
          const lc = JSON.parse(last.handleContentAll)
          lastData.handleEndTime = lc.handleEndTime
          lastData.remarks = lc.remarks
          lastData.backReason = lc.backReason || []
          lastData.groupLeaderOpinion = lc.groupLeaderOpinion
          lastData.handleDeptName = lc.handlerDeptName
          lastData.callbackInfo = lc.callbackInfo
        }
      }
    }
  })
}

function handleDataList(list) {
  hiTaskDataList.tjList = []
  hiTaskDataList.fpList = []
  hiTaskDataList.clList = []
  hiTaskDataList.fkList = []
  hiTaskDataList.hfList = []
  hiTaskDataList.gdList = []

  for (const item of list) {
    if (item.taskName == '外呼') {
      try {
        const pageType = JSON.parse(item.handleContentAll).pageType
        const map = { '登记': 'tjList', '分派': 'fpList', '处理': 'clList', '回访': 'hfList' }
        if (map[pageType]) hiTaskDataList[map[pageType]].push(item)
      } catch { }
    }
    if (['提交', '交办', '待跟进', '暂存', '继续受理', '重启流程', '坐席撤单', '申请疑难'].includes(item.taskName)) {
      hiTaskDataList.tjList.push(item); continue
    }
    if (['分派', '退回', '职能局退回', '分派上报申请', '分派上报批示', '分转岗撤单', '分转岗退回'].includes(item.taskName)) {
      hiTaskDataList.fpList.push(item); continue
    }
    const clCondition = ['职能局分派', '接收', '超期自动接收', '催办', '督办', '直接答复',
      '延期审批-同意', '延期审批-不同意', '延期上报请示', '上报审核-同意', '上报审核-不同意',
      '疑难审批', '申请延期', '处理记录', '上报请示', '同意重办', '不同意重办', '系统自动处理',
      '延期自动处理', '延期批示', '退回审批-不同意', '退回审批-同意', '上报审核修改'].includes(item.taskName)
    if (clCondition) { hiTaskDataList.clList.push(item); continue }
    if (['上报处理', '保存', '提交反馈', '同意上报', '重办', '审批'].includes(item.taskName)) {
      hiTaskDataList.fkList.push(item); continue
    }
    if (['回访完成', '回访记录', '申请典型', '回访', '申请重办', '典型批示', '重新回访', '预约回访'].includes(item.taskName)) {
      hiTaskDataList.hfList.push(item); continue
    }
    if (item.taskName == '归档') hiTaskDataList.gdList.push(item)
  }
}

function showHandleAll() { handleAll.value = true }

function jump(index) {
  handleAll.value = false
  nextTick(() => {
    const box = document.querySelector('.scroll-content')
    if (!box) return
    const items = box.querySelectorAll('.scroll-item')
    if (items[index]) {
      box.style.transform = 'translateY(' + (-items[index].offsetTop) + 'px)'
    }
  })
}

function toggleDetail(item) {
  item.isShow = !item.isShow
}

// ---- more section ----
function showMore() {
  more.value = !more.value
  if (more.value) {
    findRelevantOrder(orderinfoData.basicData.orderNo)
  }
}

function findRelevantOrder(orderNoParam) {
  relevantOrderNos.value = []
  if (!orderNoParam || orderNoParam != sourcePointOrderNo.value) return
  http.get('/orderInfo/findRelevantOrder', { params: { orderNo: orderNoParam } }).then(res => {
    if (res.data?.code == 200) {
      relevantOrderNos.value = (res.data.data || []).filter(o => o != orderinfoData.basicData.relevantOrderNode)
    }
  })
}

// ---- historical orders ----
function getLsgdList(page = 1) {
  lsgdLoading.value = true
  http.get('/orderInfo/findHistoryOrderByCallTel', {
    params: { callTel: tel.value, pageNum: page, pageSize: lsgdPageData.pageSize }
  }).then(res => {
    if (res.data?.code == 200) {
      const r = res.data.data
      lsgdPageData.total = r.total || 0
      lsgdPageData.pageSize = r.size || 5
      lsgdPageData.pageNum = r.current || 1
      lsgdList.value = r.records || []
    }
    lsgdLoading.value = false
  })
}

function rowClick(row) {
  reloadDataByOrderId(row.orderId)
}

// ---- main data loading ----
async function reloadDataByOrderId(orderId, callback) {
  if (!orderId) return
  getIsHanderDept()
  getFilters()
  currentOrderId.value = orderId
  loading.value = true
  portrait.value = []
  orderLogList.value = []
  jointHandleRadio.value = 0
  getIsSpecialFocus(orderId)
  getIsInDfpAndUpdateOrder()
  getIsInDzjUpdateOrder()
  getProcessTime(orderId)
  getUpdateOrderHistory(orderId)
  findCbAndDbCountByOrderId(orderId)
  getFj(orderId)
  fileList.value = []
  fileData.orderId = orderId
  isHaveSbshUpdateOrder.value = hasPermission(authCode.optCode.sbshUpdateOrder, 1)
  isHaveListenLy.value = hasPermission(authCode.optCode.listenLY, 1)
  isHaveLookBaomi.value = hasPermission(authCode.optCode.lookOrderInfo, 1)

  try {
    const res = await http.get('/orderInfo/find', { params: { orderId, isHaveLookBaomi: isHaveLookBaomi.value } })
    if (res.data?.code == 200) {
      Object.assign(orderinfoData.basicData, res.data.data)
      Object.assign(basicData, JSON.parse(JSON.stringify(res.data.data)))
      getIsInMyOrderAndHaveUpdateOrderAuth()
      if (route.name === 'integratedQuery' && orderinfoData.basicData.orderSubStateName == '已归档' && !isShowbmxxAndgdbz.value) {
        isHaveSbshUpdateOrder.value = false
      }
      orderNo.value = orderinfoData.basicData.orderNo
      isNameSecurity.value = orderinfoData.basicData.isNameSecurity == 1
      if (orderinfoData.basicData.isNameSecurity) isBaomi.value = true
      tel.value = orderinfoData.basicData.realTel || orderinfoData.basicData.callTel
      getLsgdList()
      getTaskData(orderId)
      getdatalist()
      getRwhx()
      getqzqx()
      getzxgz()
      getOriginLevel()
      getorderType()
      getIsLoginCTI()

      if (isShowJointHandle.value) getOrderListByParentOrderNo(orderId)

      if (isInMyOrderAndUpdateOrder.value || isHaveSbshUpdateOrder.value || isInDfpAndUpdateOrder.value || isInDzjUpdateOrder.value) {
        updateOrderInfo.handleEndTime = orderinfoData.basicData.handleEndTime
        updateOrderInfo.orderLevel = orderinfoData.basicData.orderLevel || ''
        updateOrderInfo.orderType = orderinfoData.basicData.orderType
        updateOrderInfo.title = orderinfoData.basicData.title
        updateOrderInfo.callerContent = (orderinfoData.basicData.callerContent || '').replace(/\n\n/g, '')
        updateOrderInfo.resultHandling = orderinfoData.basicData.resultHandling || ''
        updateOrderInfo.basicInfo = orderinfoData.basicData.basicInfo || ''
        updateOrderInfo.zxAppraise = orderinfoData.basicData.zxAppraise == -1 ? null : orderinfoData.basicData.zxAppraise
        updateOrderInfo.isStatistics = !orderinfoData.basicData.isStatistics
        updateOrderInfo.noStatisticsReason = orderinfoData.basicData.noStatisticsReason || ''
        updateOrderInfo.orderAddr = orderinfoData.basicData.orderAddr || ''
        updateOrderInfo.contentRemark = orderinfoData.basicData.contentRemark || ''
        updateOrderInfo.specialWork = orderinfoData.basicData.specialWork || ''
        updateOrderInfo.handlerDeptId = orderinfoData.basicData.handlerDeptId || ''
        gethotspotOptions()
      }

      if (isHasSourceOrderNo.value) {
        sourcePointOrderNo.value = orderinfoData.basicData.orderNo
        isHasSourceOrderNo.value = false
      }
      if (subRelevantOrderNode.value) {
        orderinfoData.basicData.relevantOrderNode = subRelevantOrderNode.value
        subRelevantOrderNode.value = null
      }
      if (callback) callback(res.data.data)
    }
  } finally {
    loading.value = false
  }
}

function reloadDataByOrderNo(orderNoParam, relevantNo) {
  subRelevantOrderNode.value = relevantNo
  http.get('/orderInfo/find', { params: { orderNo: orderNoParam } }).then(res => {
    if (res.data?.code == 200) {
      reloadDataByOrderId(res.data.data.orderId, () => { findRelevantOrder(orderNoParam) })
    }
  })
}

// ---- permission helpers ----
function getIsInMyOrderAndHaveUpdateOrderAuth() {
  if (route.name !== 'integratedQuery' && route.params.md != 'myOrder') {
    isInMyOrderAndUpdateOrder.value = false; return
  }
  if (route.name == 'integratedQuery' && orderinfoData.basicData.orderSubStateName == '已归档' && !isShowbmxxAndgdbz.value) {
    isInMyOrderAndUpdateOrder.value = false; return
  }
  isInMyOrderAndUpdateOrder.value = hasPermission(authCode.optCode.updateOrder, 1)
}

function getIsInDfpAndUpdateOrder() {
  const md = route.params.md
  if (md != 'dfp' && md != 'znjth') { isInDfpAndUpdateOrder.value = false; return }
  isInDfpAndUpdateOrder.value = hasPermission(authCode.optCode.updateOrder, 1)
}

function getIsInDzjUpdateOrder() {
  if (route.name != 'dzj') { isInDzjUpdateOrder.value = false; return }
  isInDzjUpdateOrder.value = hasPermission(authCode.optCode.updateOrder, 1)
}

function getIsHanderDept() {
  const rc = userInfo.value.roleCode || ''
  isCbdw.value = rc.includes('znj') || rc.includes('cbdw') || rc.includes('xzclry')
}

function getIsLoginCTI() {
  isLoginCTI.value = ctiStore.ctiTelNumState === '已注册'
}

function getFilters() {
  getDictByCode(false, 'attachmentType').then(res => {
    filters.value = (res || []).map(e => ({ text: e.dictName, value: e.dictId }))
  })
}

function getorderType() {
  getDictByCode(false, 'swlx').then(res => { orderTypeOptions.value = res || [] })
}

function gethotspotOptions() {
  getDictByCode(true, 'rdfl').then(res => {
    hotspotOptions.value = res || []
    setHotspot2()
  })
}

function getOrderSpecialWork() {
  getDictByCode(false, 'zxgz').then(res => { zxgzOptions.value = res || [] })
}

function getZxAppraise() {
  getDictByCode(false, 'zxAppraise').then(res => {
    zxAppraiseOptions.value = (res || []).map(v => ({ ...v, dictValue: parseInt(v.dictValue) }))
  })
}

function getSatisfactionss() {
  getDictByCode(false, 'satisfactionss').then(res => {
    satisfactionssOptions.value = (res || []).map(v => ({ ...v, dictValue: parseInt(v.dictValue) }))
  })
}

function setHotspot2() {
  hotspot.value = []
  const d = orderinfoData.basicData
  for (let i = 1; i <= 5; i++) {
    if (d['hotspot' + i]) {
      hotspot.value.push(d['hotspot' + i])
      updateOrderInfo['hotspot' + i] = d['hotspot' + i]
      updateOrderInfo['hotspot' + i + 'Name'] = d['hotspot' + i + 'Name'] || ''
    }
  }
}

const hotspot = ref([])
const hotspotProps = { expandTrigger: 'hover', label: 'dictName', value: 'dictId', children: 'children' }

function changeHotspot(value) {
  const d = orderinfoData.basicData
  const hotspotArr = [d.hotspot1, d.hotspot2, d.hotspot3, d.hotspot4, d.hotspot5].filter(Boolean)
  if (hotspotArr.length != value.length || hotspotArr.some((v, i) => v != value[i])) {
    updateOrderInfo.hotspot1 = ''
    updateOrderInfo.hotspot1Name = ''
    updateOrderInfo.hotspot2 = ''
    updateOrderInfo.hotspot2Name = ''
    updateOrderInfo.hotspot3 = ''
    updateOrderInfo.hotspot3Name = ''
    updateOrderInfo.hotspot4 = ''
    updateOrderInfo.hotspot4Name = ''
    updateOrderInfo.hotspot5 = ''
    updateOrderInfo.hotspot5Name = ''
    for (let i = 0; i < value.length; i++) {
      updateOrderInfo['hotspot' + (i + 1)] = value[i]
    }
    updateOrder('hotspot')
  }
}

// ---- format ----
function formatHiContent(item) {
  const parsed = parseJsonSafe(item.handleContentAll)
  if (parsed?.remarks) return parsed.remarks
  if (parsed?.callbackInfo) return parsed.callbackInfo
  return item.handleContent || '-'
}

// ---- lifecycle helpers ----
function getTaskDescription(item) {
  const map = {
    '分派上报申请': '上报请示', '分派上报批示': '分派批示', '处理记录': '添加处理记录',
    '疑难审批-同意': '疑难审批', '疑难审批-不同意': '疑难审批',
    '延期审批-同意': '延期审批', '延期审批-不同意': '延期审批',
    '退回审批-同意': '退回审批', '退回审批-不同意': '退回审批',
    '上报审核-同意': '上报审核', '上报审核-不同意': '上报审核',
    '职能局分派': '分派', '同意重办': '重办审批', '不同意重办': '重办审批',
    '继续受理': '暂存', '采访审批同意': '采访审批', '采访审批驳回': '采访审批',
    '班长同意': '采访审批', '班长驳回': '采访审批', '重办批示完成': '重办批示',
    '回访记录': '添加', '回访': '回访完成'
  }
  return map[item.taskName] || item.taskName
}

function getTaskColor(item) {
  const greenTasks = ['分派上报申请', '分派上报批示', '疑难审批-同意', '职能局分派', '重办批示完成',
    '同意重办', '延期审批-同意', '退回审批-同意', '上报审核-同意', '延期上报请示', '采访审批同意', '班长同意']
  const redTasks = ['疑难审批-不同意', '不同意重办', '延期审批-不同意', '退回审批-不同意', '上报审核-不同意', '采访审批驳回', '班长驳回']
  if (greenTasks.includes(item.taskName)) return 'more-nano-green'
  if (redTasks.includes(item.taskName)) return 'more-nano-red'
  return 'more-nano-green'
}

function getHandleUserLabel(item) {
  if (['提交', '暂存', '坐席撤单', '继续受理'].includes(item.taskName)) return '【坐席】'
  if (['回访记录', '预约回访'].includes(item.taskName)) return '【回访席】'
  if (item.assingeeUser) return '【' + item.assingeeUser + '】'
  return ''
}

function sptHandleTime() {
  if (orderinfoData.basicData.orderOriginName === '省平台渠道') {
    // will be set from data
  }
}

// ---- event handlers ----
function beforeClose(done) {
  audioWin.value = false
  audioWinMaster.value = false
  emit('before-close', done)
  done()
}

function open() {
  isHaveSoftPhone.value = hasPermission('rdh', 2)
  getOrderSpecialWork()
  getZxAppraise()
  getSatisfactionss()
  isHaveDownLoadSound.value = hasPermission(authCode.optCode.downLoadSound, 1)
  const deleteAllFile = hasPermission(authCode.optCode.deleteOrderFile, 1)
  if (deleteAllFile) {
    deleFj.value = true
    deleSelfFj.value = hasPermission(authCode.optCode.deleteSelfFile, 1)
  }
  emit('open')
}

function close() {
  clearInterval(timeNameInterval)
  for (const t of intervalTimers) clearInterval(t)
  intervalTimers.length = 0
  isShowbmxxAndgdbz.value = true
  more.value = false
  activeNames.value = []
  hiTaskDataList.tjList = []
  hiTaskDataList.fpList = []
  hiTaskDataList.clList = []
  hiTaskDataList.fkList = []
  hiTaskDataList.hfList = []
  hiTaskDataList.gdList = []
  dataList.value = []
  portrait.value = []
  timeData.value = {}
  orderLogList.value = []
  Object.assign(updateOrderInfo, {
    isStatistics: null, noStatisticsReason: '', zxAppraise: null, handleEndTime: '',
    title: '', resultHandling: '', basicInfo: '', callerContent: '', specialWork: '',
    contentRemark: '', orderAddr: '', hotspot1: 0, hotspot2: 0, hotspot3: 0, hotspot4: 0, hotspot5: 0,
    hotspot1Name: '', hotspot2Name: '', hotspot3Name: '', hotspot4Name: '', hotspot5Name: '', handlerDeptId: ''
  })
  Object.assign(lastData, { deptName: '', assingeeUser: '', taskName: '', remarks: '', startTime: '', userName: '', handleDeptName: '', orderStateName: '', backReason: [] })
  visible.value = false
}

function show(orderId) {
  currentOrderId.value = orderId
  visible.value = true
  reloadDataByOrderId(orderId)
}

function handleClick(orderId) {
  reloadDataByOrderId(orderId)
}

function handleClickByOrderNo(relevantNo, orderNoParam) {
  reloadDataByOrderNo(relevantNo, orderNoParam)
}

defineExpose({ reloadDataByOrderId, getIsSpecialFocus, show })

// ---- init ----
getOrderSpecialWork()
getZxAppraise()
getSatisfactionss()

// ---- keyboard ----
function jtKeyUp(e) {
  if (e.code == 'Escape') close()
}

onBeforeUnmount(() => {
  window.removeEventListener('keyup', jtKeyUp, true)
  clearInterval(timeNameInterval)
  for (const t of intervalTimers) clearInterval(t)
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="问题详情"
    width="1000px"
    top="0"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="beforeClose"
    append-to-body
    @opened="open"
    @close="close"
  >
    <div v-loading="loading" class="orderinfo-content">
      <!-- Master Audio -->
      <div v-if="audioWinMaster" style="margin-bottom:8px">
        <Audio :the-url="audioUrlMaster" :call-i-d="callID" @soundError="audioWinMaster = false" />
        <el-button  @click="audioWinMaster = false">关闭</el-button>
      </div>

      <!-- Header -->
      <div class="oi-header">
        <div class="oi-header-left">基本情况</div>
        <div class="oi-header-right">
          <span style="color:#1890ff;font-weight:700">
            累计拨打：<span>{{ orderinfoData.basicData.telCount }}</span>
          </span>
          <span style="color:#1890ff;font-weight:700;margin-left:12px">
            近期拨打：<span>{{ orderinfoData.basicData.telCountYf }}</span>
          </span>
          <template v-if="orderinfoData.basicData.isOverdue == 1">
            <span style="color:#f56c6c;font-weight:bold;margin-left:12px">
              <el-icon><WarningFilled /></el-icon> 已超期
            </span>
          </template>
          <template v-else>
            <span v-if="orderinfoData.basicData.isChaoqiReminders && !orderinfoData.basicData.isChaoqiRemindersRed" style="color:#FF8800;margin-left:12px">预超期</span>
            <span v-if="surplusTime" style="color:#FF8800;margin-left:12px">剩余：{{ time }}</span>
          </template>
          <el-button v-if="hasPermission(authCode.optCode.modifyYq, 1) && (orderinfoData.basicData.orderSubStateName == '逾期' || (orderinfoData.basicData.isOverdue == 1 && orderinfoData.basicData.orderSubState == 99))" type="primary"  @click="yuqi" style="margin-left:10px">修改逾期标识</el-button>
          <template v-if="hasPermission(authCode.optCode.editOrderBm, 1)">
            <el-button type="primary"  @click="editOrderBm('改不保密')" v-if="orderinfoData.basicData.isNameSecurity == 1">改不保密</el-button>
            <el-button type="primary"  @click="editOrderBm('改保密')" v-else>改保密</el-button>
          </template>
          <span style="margin-left:10px;font-weight:bold">是否保密：<span style="color:#0188fb">{{ orderinfoData.basicData.isNameSecurity == 1 ? '是' : '否' }}</span></span>
          <span style="margin-left:10px;font-weight:bold">是否计入统计：<span style="color:#0188fb">{{ orderinfoData.basicData.isStatistics == 1 ? '是' : '否' }}</span></span>
          <span style="margin-left:10px;font-weight:bold">实时状态：<span style="color:#0188fb">{{ orderinfoData.basicData.orderSubStateName }}</span></span>
          <span v-if="showSpecialFocus" class="collectOn" @click="collectOff">已关注</span>
        </div>
      </div>

      <!-- Basic Info Card -->
      <el-card class="oi-card" shadow="never">
        <!-- Row 1: Name, Phone, Channel, Deadline -->
        <div class="oi-row">
          <div class="oi-col oi-col-6">
            <span class="oi-key">姓名<span class="oi-suffix">：</span></span>
            <span class="oi-value">{{ orderinfoData.basicData.name }}</span>
            <el-button v-if="computeSecrecy(orderinfoData.basicData.haveSound) === 1"  type="primary" link @click="playOrderSound">播放</el-button>
            <el-icon v-if="orderinfoData.basicData.isNameSecurity == 1" title="群众信息保密" style="color:#999"><Lock /></el-icon>
          </div>
          <div class="oi-col oi-col-6">
            <span class="oi-key">电话<span class="oi-suffix">：</span></span>
            <template v-if="isHaveSoftPhone && isLoginCTI">
              <el-input v-model="orderinfoData.basicData.callTel"  class="call-tel-input" />
              <el-button  class="add0" @click="add0Click">+0</el-button>
              <el-button v-if="ctiStore.ctiState == '通话'"  type="danger" @click="guaduan(orderinfoData.basicData.callTel)">挂断</el-button>
              <el-button v-else  type="success" @click="hujiao(orderinfoData.basicData.callTel, 1, orderinfoData.basicData.orderSubState == 5 ? 4 : 2)">呼叫</el-button>
            </template>
            <span class="oi-value" v-else>{{ orderinfoData.basicData.callTel }}</span>
          </div>
          <div class="oi-col oi-col-5">
            <span class="oi-key">服务渠道<span class="oi-suffix">：</span></span>
            <span class="oi-value">{{ orderinfoData.basicData.orderOriginName }}{{ orderinfoData.basicData.orderOrigin2Name ? '/' + orderinfoData.basicData.orderOrigin2Name : '' }}</span>
          </div>
          <div class="oi-col oi-col-7">
            <span class="oi-key">办理时限<span class="oi-suffix">：</span></span>
            <el-date-picker
              v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder"
              v-model="updateOrderInfo.handleEndTime"
              @blur="updateOrder('handleEndTime')"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime"
              
              :editable="false"
              :clearable="false"
              style="width:153px"
              placeholder="选择限办时间"
            />
            <span class="oi-value bold" v-else>{{ orderinfoData.basicData.handleEndTime }}</span>
          </div>
        </div>

        <!-- Row 2: Order No, Type, Level, Handle Type -->
        <div class="oi-row">
          <div class="oi-col oi-col-6">
            <span class="oi-key">问题编号<span class="oi-suffix">：</span></span>
            <span class="oi-value">{{ orderinfoData.basicData.orderNo }}</span>
          </div>
          <div class="oi-col oi-col-6">
            <span class="oi-key">问题类型<span class="oi-suffix">：</span></span>
            <el-select v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder || isInDzjUpdateOrder" v-model="updateOrderInfo.orderType"  style="width:100px" @change="updateOrder('orderType')">
              <el-option v-for="item in orderTypeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictId" />
            </el-select>
            <span class="oi-value" v-else>{{ orderinfoData.basicData.orderTypeName }}</span>
          </div>
          <div class="oi-col oi-col-5">
            <span class="oi-key">问题级别<span class="oi-suffix">：</span></span>
            <el-select v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder" v-model="updateOrderInfo.orderLevel"  style="width:100px" @change="updateOrder('orderLevel')">
              <el-option v-for="item in orderLevelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
            </el-select>
            <span class="oi-value" v-else>{{ orderinfoData.basicData.orderLevel || '' }}</span>
          </div>
          <div class="oi-col oi-col-6">
            <span class="oi-key">办理方式<span class="oi-suffix">：</span></span>
            <span class="oi-value">{{ orderinfoData.basicData.handleTypeName }}</span>
          </div>
        </div>

        <!-- Row 3: Hotspot, Attachments, Special Work -->
        <div class="oi-row">
          <div class="oi-col oi-col-12">
            <span class="oi-key">热点<span class="oi-suffix">：</span></span>
            <el-cascader
              v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder || isInDzjUpdateOrder"
              v-model="hotspot"
              
              :options="hotspotOptions"
              :props="hotspotProps"
              filterable
              style="width:88%"
              @change="changeHotspot"
            />
            <span class="oi-value" v-else>{{ hotspotName }}</span>
          </div>
          <div class="oi-col oi-col-5">
            <span class="oi-key">是否有附件<span class="oi-suffix">：</span></span>
            <span class="oi-value">{{ isHaveFj ? '有' : '无' }}</span>
            <el-button v-if="isHaveFj"  link @click="lockAccssory">查看</el-button>
            <el-button v-if="!(route.name == 'integratedQuery' && orderinfoData.basicData.orderSubStateName == '已归档' && !isShowbmxxAndgdbz)"  link @click="openUploadFileWin">上传</el-button>
          </div>
          <div class="oi-col oi-col-7">
            <span class="oi-key">专项工作<span class="oi-suffix">：</span></span>
            <el-select v-if="isInDzjUpdateOrder" v-model="updateOrderInfo.specialWork"  style="width:68%" @change="updateOrder('specialWork')">
              <el-option v-for="item in zxgzOptions" :key="item.dictId" :label="item.dictName" :value="item.dictId" />
            </el-select>
            <span class="oi-value" v-else>{{ orderinfoData.basicData.specialWork }}</span>
          </div>
        </div>

        <!-- Row 4: Incident Address -->
        <div class="oi-row">
          <div class="oi-col" style="width:8.4%">
            <span class="oi-key">事发地址<span class="oi-suffix">：</span></span>
          </div>
          <div class="oi-col" style="width:91%">
            <el-input v-if="isInDzjUpdateOrder" v-model="updateOrderInfo.orderAddr"  style="width:80%" @blur="updateOrder('orderAddr')" />
            <span class="oi-value" v-else>{{ orderinfoData.basicData.orderAddr }}</span>
          </div>
        </div>

        <!-- Row 5: Title, Order Tag -->
        <div class="oi-row">
          <div class="oi-col oi-col-18">
            <span class="oi-key">标题<span class="oi-suffix">：</span></span>
            <el-input v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder || isInDzjUpdateOrder" v-model="updateOrderInfo.title"  style="width:90%" @blur="updateOrder('title')" />
            <span class="oi-value" v-else style="white-space:pre-wrap">{{ orderinfoData.basicData.title }}</span>
          </div>
          <div class="oi-col oi-col-6">
            <span class="oi-key">诉求人类型<span class="oi-suffix">：</span></span>
            <span class="oi-value">{{ orderinfoData.basicData.orderTagName }}</span>
          </div>
        </div>

        <!-- Row 6: Content -->
        <div class="oi-row">
          <div class="oi-col" style="width:5.4%">
            <span class="oi-key">内容<span class="oi-suffix">：</span></span>
          </div>
          <div class="oi-col" style="width:94.2%">
            <el-input
              v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder || isInDzjUpdateOrder"
              v-model="updateOrderInfo.callerContent"
              type="textarea"
              :autosize="{ minRows: 4 }"
              maxlength="3000"
              show-word-limit
              @blur="updateOrder('callerContent')"
            />
            <span class="oi-value" v-else style="white-space:pre-wrap">{{ orderinfoData.basicData.callerContent }}</span>
          </div>
        </div>

        <!-- Row 7: Content Remark -->
        <div v-if="orderinfoData.basicData.contentRemark" class="oi-row">
          <div class="oi-col" style="width:5.4%">
            <span class="oi-key">备注<span class="oi-suffix">：</span></span>
          </div>
          <div class="oi-col" style="width:94.2%">
            <el-input v-if="isInDzjUpdateOrder" v-model="updateOrderInfo.contentRemark" maxlength="1000" show-word-limit @blur="updateOrder('contentRemark')" />
            <span class="oi-value" v-else style="white-space:pre-wrap">{{ orderinfoData.basicData.contentRemark }}</span>
          </div>
        </div>

        <!-- Result Handling -->
        <div v-if="orderinfoData.basicData.resultHandling" class="oi-row oi-row-high">
          <div class="oi-col" style="width:5.4%">
            <span class="oi-key">处理结果<span class="oi-suffix">：</span></span>
          </div>
          <div class="oi-col" style="width:94.2%">
            <el-input
              v-if="isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder || isHaveSbshUpdateOrder || isInDzjUpdateOrder"
              v-model="updateOrderInfo.resultHandling"
              type="textarea"
              :autosize="{ minRows: 4 }"
              maxlength="3000"
              show-word-limit
              @blur="updateOrder('resultHandling')"
            />
            <span class="oi-value" v-else style="white-space:pre-wrap">{{ orderinfoData.basicData.resultHandling }}</span>
          </div>
        </div>

        <!-- More toggle -->
        <div class="oi-more" @click="showMore">
          更多 <el-icon><component :is="more ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
        </div>

        <!-- More Section -->
        <div v-show="more" class="oi-more-section">
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">性别<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.sex ? '男' : '女' }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">年龄<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.ageRangeName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">本地人<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.isNative ? '是' : '否' }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">接收短信号码<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.shotMessageNumber }}</span></div>
          </div>
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">标准普通话<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.isBzpth ? '是' : '否' }}</span></div>
            <div class="oi-col oi-col-12">
              <span class="oi-key">人物画像<span class="oi-suffix">：</span></span>
              <span class="oi-value"><el-tag v-for="(item, idx) in portrait" :key="idx"  type="info" effect="plain" style="margin:0 2px">{{ item }}</el-tag></span>
            </div>
            <div class="oi-col oi-col-6"><span class="oi-key">群众情绪<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.emotion }}</span></div>
          </div>
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">身份证号<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.idcard }}</span></div>
            <div class="oi-col oi-col-12"><span class="oi-key">群众备注<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.massesRemarks }}</span></div>
            <div class="oi-col oi-col-12"><span class="oi-key">群众地址<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.addr }}</span></div>
          </div>

          <!-- Secrecy Info -->
          <div v-if="isHaveLookBaomi" class="oi-row">
            <div class="oi-col oi-col-24"><span class="oi-key">保密信息<span class="oi-suffix">：</span></span><span class="oi-value">{{ secrecyInfo }}</span></div>
          </div>

          <!-- Service Dept / Accept Dept / Transfer Info -->
          <div class="oi-row">
            <div class="oi-col oi-col-12"><span class="oi-key">承办单位<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.handlerDeptName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">转接情况<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.transferInfoName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">问题属地<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.deptName }}</span></div>
          </div>

          <!-- Callback Info -->
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">回访人员<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.callbackerWorkNumber }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">回访时间<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.callbackTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">是否公开<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.isPublic ? '是' : '否' }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">是否回访成功<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.isCallbackSuccess ? '是' : '否' }}</span></div>
          </div>

          <!-- Callback Fail Reason -->
          <div v-if="!orderinfoData.basicData.isCallbackSuccess" class="oi-row">
            <div class="oi-col oi-col-24"><span class="oi-key">回访失败原因<span class="oi-suffix">：</span></span><span class="oi-value">{{ callbackFailReason }}</span></div>
          </div>

          <!-- Callback Success Details -->
          <div v-if="orderinfoData.basicData.isCallbackSuccess" class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">是否与市民联系<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.isNotifyCallPerson ? '是' : '否' }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">是否解决了问题<span class="oi-suffix">：</span></span><span class="oi-value">{{ handleInfo }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">办理结果评价<span class="oi-suffix">：</span></span><span class="oi-value">{{ zxAppraise }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">服务态度评价<span class="oi-suffix">：</span></span><span class="oi-value">{{ satisfactionssName }}</span></div>
          </div>

          <!-- Statistics -->
          <div v-if="orderinfoData.basicData.isCallbackSuccess == 1" class="oi-row">
            <div class="oi-col oi-col-6">
              <span class="oi-key">不计入统计<span class="oi-suffix">：</span></span>
              <span class="oi-value" v-if="!isInMyOrderAndUpdateOrder">{{ orderinfoData.basicData.isStatistics == 0 ? '是' : '否' }}</span>
              <el-checkbox v-else v-model="updateOrderInfo.isStatistics" />
            </div>
            <div class="oi-col oi-col-18">
              <span class="oi-key">不计入统计原因<span class="oi-suffix">：</span></span>
              <span class="oi-value" v-if="!isInMyOrderAndUpdateOrder">{{ orderinfoData.basicData.noStatisticsReason }}</span>
              <template v-else>
                <el-input v-model="updateOrderInfo.noStatisticsReason" type="textarea" :autosize="{ minRows: 1 }" maxlength="500" style="width:520px" />
                <el-button link @click="saveZxAppraiseAndIsStatisticsAndReason">保存</el-button>
              </template>
            </div>
          </div>

          <!-- Platform Info -->
          <div class="oi-row">
            <div class="oi-col oi-col-9"><span class="oi-key">省平台工单编号<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.xinDianOrderId }}</span></div>
            <div class="oi-col oi-col-9"><span class="oi-key">省平台限办时间<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.sptHandleEndTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">热线号码<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.accessnum == '3330989' ? '12366' : orderinfoData.basicData.accessnum }}</span></div>
          </div>

          <!-- Registration Info -->
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">登记人<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.createUserWorkNumber }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">登记时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.createTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">分派人<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.transferHandlerName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">分派时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.transferTime }}</span></div>
          </div>

          <!-- Processing Info -->
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">办理部门<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.acceptDeptName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">上报人员<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.handlerName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">上报时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.upReportTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">归档时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.placeOnFileTime }}</span></div>
          </div>

          <!-- Feedback Handler Info -->
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">处理人员<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.feedbackerName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">处理部门<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.feedbackerDept }}</span></div>
            <div class="oi-col oi-col-12">
              <span class="oi-key">处理人联系方式<span class="oi-suffix">：</span></span>
              <template v-if="isHaveSoftPhone && isLoginCTI">
                <el-input v-model="orderinfoData.basicData.feedbackerTel"  class="call-tel-input" />
                <el-button v-if="ctiStore.ctiState == '通话'"  type="danger" @click="guaduan(orderinfoData.basicData.feedbackerTel)">挂断</el-button>
                <el-button v-else  type="success" @click="hujiao(orderinfoData.basicData.feedbackerTel, 2, 2)">呼叫</el-button>
              </template>
              <span class="oi-value" v-else>{{ orderinfoData.basicData.feedbackerTel }}</span>
            </div>
          </div>

          <!-- Times -->
          <div class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">事发时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.incidentTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">来电时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.openPageTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">是否关注<span class="oi-suffix">：</span></span><span class="oi-value">{{ showSpecialFocus ? '是' : '否' }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">是否属实<span class="oi-suffix">：</span></span><span class="oi-value">{{ isReal }}</span></div>
          </div>

          <!-- Relevant Orders -->
          <div v-if="orderinfoData.basicData.relevantOrderNode || relevantOrderNos.length > 0" class="oi-row">
            <div class="oi-col oi-col-24">
              <span class="oi-key">关联问题单编号<span class="oi-suffix">：</span></span>
              <el-link v-if="orderinfoData.basicData.relevantOrderNode" type="primary" @click="handleClickByOrderNo(orderinfoData.basicData.relevantOrderNode, orderinfoData.basicData.orderNo)">{{ orderinfoData.basicData.relevantOrderNode }}</el-link>
              <el-link v-for="(item, idx) in relevantOrderNos" :key="idx" type="primary" style="margin-left:10px" @click="handleClickByOrderNo(item, orderinfoData.basicData.orderNo)">{{ item }}</el-link>
            </div>
          </div>

          <!-- QC Info -->
          <div v-if="orderinfoData.basicData.qualityTester && hasPermission(authCode.optCode.lookQCInfo, 1)" class="oi-row">
            <div class="oi-col oi-col-6"><span class="oi-key">质检人员<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.qualityTesterName }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">质检时间<span class="oi-suffix">：</span></span><span class="oi-value time">{{ orderinfoData.basicData.qualityTestTime }}</span></div>
            <div class="oi-col oi-col-6"><span class="oi-key">问题单标签<span class="oi-suffix">：</span></span><span class="oi-value">{{ orderinfoData.basicData.qualityLabelName }}</span></div>
          </div>

          <!-- Center Opinion -->
          <div class="oi-row oi-row-high">
            <div class="oi-col" style="width:9%"><span class="oi-key">热线中心意见<span class="oi-suffix">：</span></span></div>
            <div class="oi-col" style="width:91%"><span class="oi-value" style="white-space:pre-wrap;line-height:22px">{{ orderinfoData.basicData.acceptCenterIdea }}</span></div>
          </div>

          <!-- Leader Opinion -->
          <div class="oi-row oi-row-high">
            <div class="oi-col" style="width:9%"><span class="oi-key">批示意见<span class="oi-suffix">：</span></span></div>
            <div class="oi-col" style="width:91%"><span class="oi-value" style="white-space:pre-wrap;line-height:22px">{{ orderinfoData.basicData.teamLeaderIdea }}</span></div>
          </div>

          <!-- Callback Info -->
          <div class="oi-row oi-row-high">
            <div class="oi-col" style="width:9%"><span class="oi-key">回访情况<span class="oi-suffix">：</span></span></div>
            <div class="oi-col" style="width:91%"><span class="oi-value" style="white-space:pre-wrap;line-height:22px">{{ orderinfoData.basicData.callbackInfo }}</span></div>
          </div>

          <!-- Release Content -->
          <div class="oi-row oi-row-high">
            <div class="oi-col" style="width:9%"><span class="oi-key">发布内容<span class="oi-suffix">：</span></span></div>
            <div class="oi-col" style="width:91%"><span class="oi-value" style="white-space:pre-wrap" v-html="orderinfoData.basicData.releaseContent"></span></div>
          </div>
        </div>
      </el-card>

      <!-- Process Timeline (hidden for simplicity, data is loaded) -->
      <el-card v-if="isShowLastHander && isShowLastHander && Object.keys(timeData).length > 0" class="oi-card" shadow="never" style="margin-top:9px;height:200px">
        <div class="db-info">
          <div class="db-info-count">
            <span>催办</span>
            <span class="sms-cb" title="短信催办"></span>
            (<span style="color:#e70505">{{ cbAndDbData?.smsCbCount || 0 }}</span>)
            <span class="call-cb" title="电话催办"></span>
            (<span style="color:#e70505">{{ cbAndDbData?.callCbCount || 0 }}</span>)
            <span style="margin-left:40px">督办</span>
            (<span style="color:#e70505">{{ cbAndDbData?.dbCount >= 0 ? cbAndDbData.dbCount : 0 }}</span>)
          </div>
        </div>
      </el-card>

      <!-- Last Handler -->
      <el-card v-if="isShowLastHander && isShowLastHander && lastData.taskName" class="oi-card" shadow="never" style="margin-top:9px">
        <div class="oi-row" style="border:none">
          <div style="width:9%;font-weight:bold;color:#0188fb">上一操作<span class="oi-suffix">：</span></div>
          <div style="width:75%" :title="lastHandleText">{{ lastHandleText }}</div>
          <div style="width:16%;color:#1b1b1b">{{ lastData.startTime }}</div>
        </div>
      </el-card>

      <!-- Modification Records -->
      <div v-if="(isInMyOrderAndUpdateOrder || isInDfpAndUpdateOrder || isHaveSbshUpdateOrder || isInDzjUpdateOrder) && orderLogList.length > 0" style="margin-top:9px">
        <div class="oi-header">
          <div class="oi-header-left">修改记录</div>
        </div>
        <el-card class="oi-card" shadow="never">
          <el-collapse v-model="activeNames" style="max-height:241px;overflow-y:auto">
            <el-collapse-item v-for="item in orderLogList" :key="item.id" :name="item.id">
              <template #title>
                <div class="log-header">
                  <el-icon><UserFilled /></el-icon>【{{ item.userName }}】&nbsp;&nbsp;
                  <el-icon><Timer /></el-icon>【{{ formatDate(item.createTime) }}】&nbsp;&nbsp;
                  <el-icon><Edit /></el-icon>【{{ item.operation }}】
                </div>
              </template>
              <div v-for="sub in item.orderSubLogs" :key="sub.id" class="log-content">
                修改字段：【{{ sub.updateField }}】&nbsp;&nbsp;修改前：【{{ sub.oldContent }}】&nbsp;&nbsp;修改后：【{{ sub.newContent }}】
              </div>
            </el-collapse-item>
          </el-collapse>
          <el-pagination
            v-if="modifyrecordPageInfo.total > 0"
            style="text-align:right;margin-top:8px"
            
            background
            @size-change="modifyrecordsSizeChange"
            @current-change="modifyrecordsCurrentChange"
            :current-page="modifyrecordPageInfo.pageNum"
            :page-sizes="[5, 10, 20, 50, 100]"
            :page-size="modifyrecordPageInfo.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="modifyrecordPageInfo.total"
          />
        </el-card>
      </div>

      <!-- Joint Handling -->
      <div v-if="isShowJointHandle" style="margin-top:9px">
        <div class="oi-header"><div class="oi-header-left">联合办理情况</div></div>
        <el-card class="oi-card" shadow="never">
          <div class="slot-header">
            <span>联合办理级别</span>
            <el-radio-group v-model="jointHandleRadio" @change="(v) => JointHandleTableData = v == 1 ? jointData?.level2Orders : jointData?.level1Orders">
              <el-radio :value="0" v-if="jointData?.level1Orders?.length">一级联合办理</el-radio>
              <el-radio :value="1" v-if="jointData?.level2Orders?.length">二级联合办理</el-radio>
            </el-radio-group>
          </div>
          <el-table :data="JointHandleTableData" border stripe style="width:100%">
            <el-table-column prop="orderNo" label="问题单编号" align="center">
              <template #default="{ row }">
                <el-link type="primary" @click="handleClick(row.orderId)">{{ row.orderNo }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="acceptDeptName" label="办理部门" width="180" align="center" />
            <el-table-column prop="orderSubStateName" label="问题单状态" width="180" align="center" />
            <el-table-column prop="transferHandlerName" label="分派人员" width="180" align="center" />
          </el-table>
        </el-card>
      </div>

      <!-- Order Processing Slot -->
      <div v-if="props.isShowHandle && isShowHandleInside" style="margin-top:9px">
        <div class="oi-header"><div class="oi-header-left">{{ orderHeader }}</div></div>
        <el-card class="oi-card" shadow="never">
          <slot name="body">
            <slot><!-- processing slot --></slot>
          </slot>
        </el-card>
      </div>

      <!-- Historical Orders -->
      <div v-if="!(orderinfoData.basicData.isNameSecurity == 1 && !isShowbmxxAndgdbz) && route.params?.md !== 'orderSearch' && route.params?.md !== 'orderSearchCy'" style="margin-top:9px">
        <div class="oi-header"><div class="oi-header-left">历史工单</div></div>
        <el-card class="oi-card" shadow="never">
          <el-table :data="lsgdList" border style="width:100%" max-height="710" v-loading="lsgdLoading" @cell-click="rowClick">
            <el-table-column prop="incidentTime" label="登记时间" width="190" align="center">
              <template #default="{ row }">{{ formatDate(row.incidentTime) }}</template>
            </el-table-column>
            <el-table-column prop="orderNo" label="事务编号" width="150" align="center">
              <template #default="{ row }"><el-link type="primary">{{ row.orderNo }}</el-link></template>
            </el-table-column>
            <el-table-column prop="title" label="标题" show-overflow-tooltip align="center" />
            <el-table-column prop="handlerDeptName" label="承办单位" width="150" show-overflow-tooltip align="center" />
            <el-table-column prop="handleTypeName" label="办理方式" width="150" show-overflow-tooltip align="center" />
            <el-table-column prop="orderSubStateName" label="工单状态" width="150" show-overflow-tooltip align="center" />
          </el-table>
          <el-pagination
            style="text-align:right;margin-top:8px"
            
            background
            @size-change="(s) => { lsgdPageData.pageSize = s; getLsgdList() }"
            @current-change="getLsgdList"
            :current-page="lsgdPageData.pageNum"
            :page-sizes="[5, 10]"
            :page-size="lsgdPageData.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="lsgdPageData.total"
          />
        </el-card>
      </div>

      <!-- Process Details -->
      <div v-if="props.isShowHandleinfo && isShowHandleinfoInside && dataList.length > 0" style="margin-top:9px">
        <div class="oi-header">
          <div class="oi-header-left" style="width:12%">处理详情</div>
          <div style="color:#f56c6c;float:left;width:60%;line-height:52px">{{ orderinfoData.basicData.updateRecord }}</div>
        </div>
        <!-- Audio player -->
        <div v-if="audioWin" style="margin-bottom:8px">
          <Audio :the-url="audioUrl" :call-i-d="callID" @soundError="audioWin = false" />
          <el-button  @click="audioWin = false">关闭</el-button>
        </div>

        <el-card class="oi-card" shadow="never">
          <!-- Tab buttons -->
          <div class="handle-tabs">
            <el-button :type="handleAll ? 'primary' : ''"  @click="showHandleAll">所有</el-button>
            <el-button v-for="(name, idx) in ['登记', '分派', '处理', '反馈', '回访', '归档']" :key="idx"  @click="jump(idx)">{{ name }}</el-button>
          </div>

          <!-- All items view -->
          <div v-show="handleAll" class="scroll-content1">
            <div class="scroll-item-content" v-for="item in dataList" :key="item.historyTaskId">
              <div class="scroll-item-content-more-nano">
                <div class="handle-wrapper">
                  <span class="more-nano-time">{{ isNull(item.endTime) }}</span>
                  <span class="more-nano-dept">{{ isNull(item.deptName) }}</span>
                  <span class="more-nano-blod">{{ getHandleUserLabel(item) }}</span>
                  {{ getTaskDescription(item) }}
                  <span class="more-nano-blod" v-if="jsonStr2Obj(item.handleContentAll)?.handlerDeptName">【{{ jsonStr2Obj(item.handleContentAll).handlerDeptName }}】</span>
                  <span class="more-nano-blod" v-if="jsonStr2Obj(item.handleContentAll)?.handlerUse">【{{ jsonStr2Obj(item.handleContentAll).handlerUse.split(',')[1] }}】</span>
                  {{ jsonStr2Obj(item.handleContentAll)?.handlerUse?.split(',')[0] || '' }}
                  <span :class="getTaskColor(item)">({{ getTaskDescription(item) }})</span>
                  <span class="more-nano-red" v-if="item.taskName == '重办'">({{ jsonStr2Obj(item.handleContentAll)?.isAgree ? '同意' : '不同意' }})</span>
                </div>
                <span class="cursor-pointer" @click="toggleDetail(item)">详情 <el-icon><component :is="item.isShow ? 'ArrowUp' : 'ArrowDown'" /></el-icon></span>
                <span class="fj">
                  <span v-if="item.haveAccessories" class="fj-yes" @click="lookAccessories(item)">有附件</span>
                  <span v-else class="fj-no">无附件</span>
                  <template v-if="computeSecrecy(item.haveSoundRecording) != 2">
                    <span v-if="computeSecrecy(item.haveSoundRecording) == 1" class="ly-yes" @click="lookSound(item)">有录音</span>
                    <span v-else class="ly-no">保密</span>
                  </template>
                </span>
              </div>
              <div v-if="item.isShow" class="scroll-item-content-more">
                <div class="more-row-header">处理内容:</div>
                <div class="more-row-content">
                  <!-- Submit content -->
                  <template v-if="item.taskName == '提交'">
                    坐席{{ dataList.indexOf(item) != 0 ? '添加【新问题单】处理' : item.taskName }}
                    <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.lastRestrictTransferTime">最后限制分派时间：{{ jsonStr2Obj(item.handleContent).lastRestrictTransferTime }}</span>
                  </template>
                  <!-- General content -->
                  <template v-else>
                    {{ item.taskName == '暂存' ? '坐席暂存问题单。' : '' }}
                    {{ item.taskName == '继续受理' ? '坐席继续受理问题。' : '' }}
                    {{ jsonStr2Obj(item.handleContentAll)?.remarks || '' }}
                    {{ item.taskName == '申请疑难' ? jsonStr2Obj(item.handleContentAll)?.groupLeaderOpinion : '' }}
                    {{ (item.taskName == '处理记录' || item.taskName == '催办') ? item.handleContent : '' }}
                    <span class="more-row-header" v-if="item.taskName == '申请延期' || item.taskName == '延期审批'">延期至：{{ jsonStr2Obj(item.handleContentAll)?.handleEndTime }}</span>
                    <!-- Back reason -->
                    <template v-if="jsonStr2Obj(item.handleContentAll)?.backReason?.length > 0">
                      <span class="more-row-header">&nbsp;退回原因：</span>
                      <span v-for="(r, i) in jsonStr2Obj(item.handleContentAll).backReason" :key="i">{{ '\t' + (i + 1) + '、' + r }}</span>
                    </template>
                    <!-- Feedback details -->
                    <template v-if="item.taskName == '上报处理' || item.taskName == '保存'">
                      <p><span class="more-row-header">是否属实：</span>{{ jsonStr2Obj(item.handleContent)?.isReal }}</p>
                      <p>
                        <span class="more-row-header">是否已联系群众：</span>{{ jsonStr2Obj(item.handleContent)?.isContactPerson ? '是' : '否' }}
                        <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.isContactPerson">联系时间：</span>
                        <span class="more-row-header" v-else>未联系原因：</span>
                        {{ jsonStr2Obj(item.handleContent)?.contactTime }}{{ jsonStr2Obj(item.handleContent)?.contactCause }}
                        <span class="more-row-header">是否已回复群众：</span>{{ jsonStr2Obj(item.handleContent)?.isReplyPerson ? '是' : '否' }}
                        <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.isReplyPerson">回复时间：</span>
                        <span class="more-row-header" v-else>未回复原因：</span>
                        {{ jsonStr2Obj(item.handleContent)?.replyTime }}{{ jsonStr2Obj(item.handleContent)?.replyCause }}
                      </p>
                      <p><span class="more-row-header">基本情况及现场检查情况：</span>{{ jsonStr2Obj(item.handleContentAll)?.basicInfo }}</p>
                      <p><span class="more-row-header">处理结果及沟通情况：</span>{{ jsonStr2Obj(item.handleContentAll)?.resultHandling }}</p>
                      <p>
                        <span class="more-row-header">部门名称：</span>{{ jsonStr2Obj(item.handleContentAll)?.feedbackerDept }}
                        <span class="more-row-header">处理人员：</span>{{ jsonStr2Obj(item.handleContentAll)?.feedbackerName }}
                        <span class="more-row-header">联系方式：</span>{{ jsonStr2Obj(item.handleContentAll)?.feedbackerTel }}
                      </p>
                    </template>
                    <!-- Callback content -->
                    {{ item.taskName == '回访记录' ? item.handleContent : '' }}
                    {{ jsonStr2Obj(item.handleContentAll)?.callbackInfo || '' }}
                    <span class="more-row-header" v-if="jsonStr2Obj(item.handleContentAll)?.callbackTime">预约回访时间：</span>
                    {{ jsonStr2Obj(item.handleContentAll)?.callbackTime || '' }}
                    <!-- Follow up -->
                    <template v-if="(item.taskName == '待跟进' || item.taskName == '归档') && jsonStr2Obj(item.handleContentAll)?.followUpTime">
                      <p>
                        <span class="more-row-header">跟进时间：</span>{{ jsonStr2Obj(item.handleContentAll).followUpTime }}
                        <span class="more-row-header">跟进问题单编号：</span>
                        <el-link type="primary" @click="handleClickByOrderNo(jsonStr2Obj(item.handleContentAll).followUpOrder, orderinfoData.basicData.orderNo)">{{ jsonStr2Obj(item.handleContentAll).followUpOrderNo }}</el-link>
                        <span class="more-row-header">跟进内容：</span>{{ jsonStr2Obj(item.handleContentAll).followUpContent }}
                      </p>
                    </template>
                    <!-- Restrict times -->
                    <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.lastRestrictCallbackTime">最后限制回访时间：{{ jsonStr2Obj(item.handleContent).lastRestrictCallbackTime }}</span>
                    <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.lastRestrictTransferTime">最后限制分派时间：{{ jsonStr2Obj(item.handleContent).lastRestrictTransferTime }}</span>
                    <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.lastRestrictAcceptTime">最后限制接收时间：{{ jsonStr2Obj(item.handleContent).lastRestrictAcceptTime }}</span>
                    <span class="more-row-header" v-if="jsonStr2Obj(item.handleContent)?.lastRestrictFileTile">最后限制归档时间：{{ jsonStr2Obj(item.handleContent).lastRestrictFileTile }}</span>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Categorized view -->
          <div v-show="!handleAll" class="scroll-content">
            <div v-for="(section, secIdx) in [
              { name: '新问题单', list: hiTaskDataList.tjList },
              { name: '分派记录', list: hiTaskDataList.fpList },
              { name: '处理记录', list: hiTaskDataList.clList },
              { name: '反馈记录', list: hiTaskDataList.fkList },
              { name: '回访记录', list: hiTaskDataList.hfList },
              { name: '归档记录', list: hiTaskDataList.gdList }
            ]" :key="secIdx" class="scroll-item">
              <div class="scroll-item-header">
                <div class="kxy"></div>
                <div class="scroll-item-header-text">{{ section.name }}</div>
              </div>
              <div class="scroll-item-content" v-for="item in section.list" :key="item.historyTaskId">
                <div class="scroll-item-content-more-nano">
                  <div class="handle-wrapper">
                    <span class="more-nano-time">{{ isNull(item.endTime) }}</span>
                    <span class="more-nano-dept">{{ isNull(item.deptName) }}</span>
                    <span class="more-nano-blod">{{ secIdx === 0 && item.taskName != '提交' ? '' : '【' + isNull(item.assingeeUser) + '】' }}</span>
                    {{ item.taskName }}
                    <span :class="getTaskColor(item)">({{ getTaskDescription(item) }})</span>
                  </div>
                  <span class="cursor-pointer" @click="toggleDetail(item)">详情 <el-icon><component :is="item.isShow ? 'ArrowUp' : 'ArrowDown'" /></el-icon></span>
                  <span class="fj">
                    <span v-if="item.haveAccessories" class="fj-yes" @click="lookAccessories(item)">有附件</span>
                    <span v-else class="fj-no">无附件</span>
                    <template v-if="computeSecrecy(item.haveSoundRecording) != 2">
                      <span v-if="computeSecrecy(item.haveSoundRecording) == 1" class="ly-yes" @click="lookSound(item)">有录音</span>
                      <span v-else class="ly-no">保密</span>
                    </template>
                  </span>
                </div>
                <div v-if="item.isShow" class="scroll-item-content-more">
                  <div class="more-row-header">处理内容:</div>
                  <div class="more-row-content">
                    {{ jsonStr2Obj(item.handleContentAll)?.remarks || item.handleContent || '' }}
                    <template v-if="jsonStr2Obj(item.handleContentAll)?.backReason?.length > 0">
                      <span class="more-row-header">&nbsp;退回原因：</span>
                      <span v-for="(r, i) in jsonStr2Obj(item.handleContentAll).backReason" :key="i">{{ '\t' + (i + 1) + '、' + r }}</span>
                    </template>
                    {{ jsonStr2Obj(item.handleContentAll)?.callbackInfo || '' }}
                    <span class="more-row-header" v-if="item.taskName == '申请延期' || item.taskName == '延期审批'">延期至：{{ jsonStr2Obj(item.handleContentAll)?.handleEndTime }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="y-strip"></div>
          </div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- Attachment Dialog -->
  <el-dialog v-model="isShowFj" title="查看附件" append-to-body :close-on-click-modal="false" top="10vh" width="55%">
    <el-table :data="fjTableData" border style="width:100%">
      <el-table-column prop="attachmentName" label="文件名" align="center" />
      <el-table-column prop="createUserName" label="上传人员" align="center" />
      <el-table-column prop="createDeptName" label="所属部门" align="center" />
      <el-table-column prop="createTime" label="上传时间" align="center" />
      <el-table-column prop="fileTypeName" label="附件类型" align="center" width="180" :filters="filters" :filter-method="filterTag">
        <template #default="{ row }">
          <el-tag  :type="getTagType(row.fileTypeCode, 1)" :effect="getTagType(row.fileTypeCode, 2)">{{ row.fileTypeName || '无' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-link type="primary" @click="downLoad(row)">下载</el-link>
          &nbsp;
          <el-link type="danger" v-if="isShowDeleteFile(row)" @click="deleteFile(row)">删除</el-link>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <!-- Upload Dialog -->
  <el-dialog v-model="uploadFileWin" title="上传附件" append-to-body :close-on-click-modal="false" top="16vh" width="30%">
    <el-form  label-width="100px">
      <el-row v-if="attachmentTypeOpt">
        <el-form-item label="附件类型">
          <el-select v-model="fileData.type" placeholder="请选择附件类型">
            <el-option v-for="item in attachmentTypes" :key="item.dictId" :label="item.dictName" :value="item.dictCode" />
          </el-select>
        </el-form-item>
      </el-row>
      <el-row>
        <el-form-item label="上传附件">
          <el-upload
            class="upload-demo"
            :action="uploadAction"
            :headers="importHeaders"
            accept=".png,.docx,.jpg,.doc,.jpeg,.mp3,.zip,.rar,.m4a,.WAV,.wav,.pdf,.aac,.amr,.mp4,.awb,.wps,.gif"
            :data="fileData"
            multiple
            :limit="50"
            :show-file-list="true"
            :on-success="upSuccess"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            :on-change="handleChange"
            :on-exceed="handleExceed"
            :file-list="fileList"
          >
            <el-tooltip effect="dark" content="请上传doc,docx,pdf,jpeg,png,jpg,mp4,mp3,wav,m4a,zip,rar格式" placement="top">
              <el-button  type="primary">上传文件</el-button>
            </el-tooltip>
            <template #tip>
              <div style="color:red">只允许上传（doc,docx,pdf,jpeg,png,jpg,mp4,mp3,wav,m4a,zip,rar）格式的文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-row>
    </el-form>
  </el-dialog>

  <!-- Overdue Dialog -->
  <el-dialog v-model="yqVisable" title="修改逾期标识" append-to-body top="20vh" :close-on-click-modal="false" width="22%">
    <div>
      <font v-if="orderinfoData.basicData.orderSubState != 99" style="color:red">*</font> 限办时间：
      <el-date-picker
        :disabled="orderinfoData.basicData.orderSubState == 99"
        v-model="yqhandleEndTime"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        :disabled-date="(time) => time.getTime() < Date.now()"
        placeholder="请选择限办时间"
        default-time="23:59:59"
        
        type="datetime"
      />
    </div>
    <template #footer>
      <el-button @click="yqVisable = false" >取消</el-button>
      <el-button type="primary" @click="yuqiSubmit" :loading="yqLoading" >确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.orderinfo-content { max-height: 70vh; overflow-y: auto; }

/* Header */
.oi-header {
  width: 100%; height: 45px; display: flex; align-items: center;
}
.oi-header-left {
  font-size: 16px; font-weight: bold; color: #00151b; padding-left: 20px; width: 15%;
}
.oi-header-right {
  flex: 1; text-align: right; padding-right: 10px; display: flex; align-items: center;
  justify-content: flex-end; flex-wrap: wrap; gap: 4px;
}

/* Card */
.oi-card { border-radius: 0; margin-top: 5px; }
.oi-card :deep(.el-card__body) { padding: 10px 20px; }

/* Rows */
.oi-row {
  width: 100%; line-height: 40px; padding-left: 10px; border-bottom: 1px solid #e5e6e2;
  display: flex; flex-wrap: wrap;
}
.oi-row-high { min-height: 50px; line-height: 50px; }
.oi-col { padding: 0 !important; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.oi-col-5 { width: 21%; }
.oi-col-6 { width: 25%; }
.oi-col-7 { width: 26.5%; }
.oi-col-9 { width: 37.5%; }
.oi-col-12 { width: 50%; }
.oi-col-18 { width: 75%; display: flex; }
.oi-col-24 { width: 100%; }

/* Key/Value */
.oi-key {
  display: inline-block; font-size: 14px; font-weight: bold; color: #0188fb; line-height: 26px;
}
.oi-suffix { color: #373737; }
.oi-value { font-size: 14px; color: #4b4b4a; line-height: 26px; white-space: normal; max-height: 50px; }
.bold { color: #f56c6c; font-weight: bold; }
.time { font-size: 12px; }

/* More */
.oi-more { cursor: pointer; text-align: center; font-size: 15px; font-weight: bold; color: #0074cd; padding: 8px 0; }
.oi-more-section { border-top: 1px solid #e5e6e2; }

/* Call buttons */
.call-tel-input { width: 40% !important; }
.add0 { padding: 5px 1px !important; margin-left: 5px; }
.collectOn {
  border: 1px solid #ccc; border-radius: 2px; font-size: 12px; padding: 4px 10px;
  margin-left: 10px; cursor: pointer; color: #787878; display: inline-flex; align-items: center;
}

/* DB Info */
.db-info { height: 100px; padding: 10px; }
.db-info-count { padding: 10px 0 0 120px; }
.db-info-count span { font-weight: bold; }
.sms-cb, .call-cb {
  display: inline-block; width: 20px; height: 17px; margin-left: 12px; vertical-align: middle;
}

/* Log */
.log-header { padding-left: 20px; font-size: 14px; font-weight: bold; }
.log-content { padding: 0 40px; }

/* Slot */
.slot-header {
  width: 100%; height: 40px; background: #f5fafe; line-height: 40px;
}
.slot-header > span {
  display: inline-block; padding: 0 35px 0 20px; font-size: 14px; font-weight: bold; color: #2f2f2f;
}

/* Handle tabs */
.handle-tabs {
  position: absolute; width: 80px; left: 35px; display: flex; flex-direction: column; gap: -1px;
}
.handle-tabs .el-button { border-radius: 0; border-bottom: 0; }

/* Scroll content */
.scroll-content {
  width: 91%; padding-left: 14px; margin-bottom: 20px; position: relative; right: -70px;
  transition: transform 0.5s; min-height: 200px;
}
.scroll-content1 {
  width: 95%; padding-right: 17px; max-height: 500px; overflow-y: auto;
  position: relative; right: -63px;
}
.scroll-item { width: 100%; position: relative; min-height: 70px; }
.scroll-item-header { display: flex; align-items: center; }
.kxy {
  width: 21px; height: 21px; background: #fff; border-radius: 50%; border: 6px solid #0188fb;
  position: absolute; left: -14px; z-index: 2;
}
.scroll-item-header-text { padding-left: 20px; font-size: 16px; font-weight: bold; color: #232323; }
.scroll-item-content { border: 1px solid #bfbfbf; margin: 8px 0 5px 20px; }
.scroll-item-content-more-nano { padding: 10px 5px 10px 15px; display: flex; align-items: center; flex-wrap: wrap; }
.handle-wrapper { width: 74%; display: inline-block; }
.scroll-item-content-more {
  padding: 10px; margin: 0 10px 4px 5px; background-color: #f3f3f3;
}
.more-nano-time { font-weight: bold; padding-right: 20px; }
.more-nano-dept { font-size: 14px; color: #0188fb; }
.more-nano-blod { font-weight: bold; }
.more-nano-green { color: #00bd65; font-weight: bold; }
.more-nano-red { color: #b83f3f; font-weight: bold; }
.more-row-header { width: 8%; font-weight: 600; font-size: 13px; }
.more-row-content { padding: 0 5px; font-size: 13px; white-space: pre-wrap; }
.more-row-content p { padding: 2px 0; text-align: left; }

/* File icons */
.fj { float: right; display: block; padding-right: 5px; }
.fj-yes { color: #1296db; font-weight: bold; cursor: pointer; padding-left: 17px; font-size: 14px; }
.fj-no { color: #7d7d7d; font-weight: bold; padding-left: 17px; font-size: 14px; }
.ly-yes { color: #01c267; font-weight: bold; cursor: pointer; margin-left: 5px; padding-left: 17px; font-size: 14px; }
.ly-no { color: #7d7d7d; font-weight: bold; margin-left: 5px; padding-left: 17px; font-size: 14px; }
.cursor-pointer { float: right; cursor: pointer; color: #006cf3; }

/* Y-strip */
.y-strip { position: absolute; width: 5px; height: 100%; left: 8px; top: 0; z-index: 1; background-color: #ddd; }
</style>
