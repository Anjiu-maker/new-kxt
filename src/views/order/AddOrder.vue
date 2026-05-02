<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Container from '@/components/Container.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import Audio from '@/components/Audio.vue'
import SelectDeptOrUser from '@/components/SelectDeptOrUser.vue'
import { saveOrder, getOrderDetail, getOrderList, getDeptList, getDeptTree } from '@/services/orderService'
import { useAuthStore } from '@/stores/auth'
import { useGlobal } from '@/composables/useGlobal'
import { useCtiStore } from '@/stores/cti'
import { http } from '@/services/http'

const props = defineProps({
  pageName: { type: String, default: '' },
  query: { type: Object, default: () => ({}) }
})

const authStore = useAuthStore()
const ctiStore = useCtiStore()
const workbenchNav = inject('workbenchNav', null)
const { getDictByCode, getDictValueByCode } = useGlobal()

// ── 核心状态 ──
const loading = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const orderId = ref('')
const qzbz = ref(false)
const activeClass = ref(0) // 右侧面板标签索引
const audioWinMaster = ref(false)
const audioUrlMaster = ref('')
const audioCallId = ref('')
const gdxqwin = ref(false)
const orderInfoRef = ref()
const deptAndUserRef = ref()

// ── 表单模型 ──
const model = reactive({
  orderId: '', orderNo: '',
  name: '', callTel: '', sex: '', ageRange: '', ageRangeName: '',
  shotMessageNumber: '', isBzpth: 1, portrait: [], addr: '',
  idcard: '', massesRemarks: '', isNative: 1, isNameSecurity: 0,
  orderTagName: '个人', orderOrigin: '', orderOriginName: '', orderOrigin2: '', orderOrigin2Name: '',
  orderType: '', orderTypeName: '', orderLevel: '', orderLevelValue: '', orderLevelName: '',
  deptId: '', deptName: '', dept1Id: '', dept2Id: '', dept3Id: '', dept4Id: '', dept5Id: '',
  handlerDeptId: null, handlerDeptName: '',
  title: '', orderAddr: '', callerContent: '',
  contentRemark: '', secrecyInfo: '', incidentTime: '',
  handleType: 1, handleTypeName: '直接答复', handleEndTime: '',
  transferInfo: 0, transferInfoName: '',
  acceptCenterIdea: '', groupLeaderOpinion: '',
  emotion: '', hotspot1: '', hotspot1Name: '', hotspot2: '', hotspot2Name: '',
  specialWork: '', messageCode: '', messageName: '', messageContent: '',
  haveSound: 0, haveSoundName: '', isContinueAccept: 0, isManualOpenPage: 1
})

const sexOptions = [{ label: '男', value: '1' }, { label: '女', value: '0' }]
const ageRangeOptions = []
const portraitOptions = []
const emotionOptions = []
const orderTagOptions = [{ label: '个人', value: '个人' }, { label: '企业', value: '企业' }]
const bzpthOptions = [{ label: '是', value: 1 }, { label: '否', value: 0 }]
const isNativeOptions = [{ label: '是', value: 1 }, { label: '否', value: 0 }]
const handleTypeOptions = [
  { label: '直接答复', value: 1 }, { label: '交办', value: 2 },
  { label: '不予受理', value: 3 }, { label: '无效电话', value: 4 },
  { label: '暂存', value: 0 }, { label: '申请疑难', value: 6 },
  { label: '关联', value: 7 }, { label: '退回省平台', value: 10 }
]
const transferInfoOptions = [{ label: '未接通', value: 1 }, { label: '已接通', value: 2 }]

// 字典
const swlyOptions = ref([])
const orderTypeOptions = ref([])
const orderLevelOptions = ref([])
const wtsdOptions = ref([])
const ywdwOptions = ref([])
const hotspotOptions = ref([])
const specialWorkOptions = ref([])

// 右侧面板
const zskList = ref([])
const zskKeyword = ref('')
const blxxList = ref([])
const lsgdList = ref([])
const xggdList = ref([])
const lostgdList = ref([])
const rxList = ref([])
const zskPageInfo = reactive({ pageNum: 1, pageSize: 10, total: 0 })

// 弹窗
const cbFormVisible = ref(false)
const cbModel = reactive({ orderId: '', urgeContent: '', isSendMessage: false })
const zsdDetailVisible = ref(false)
const zsdDetail = ref({})
const uploadFileWin = ref(false)
const isShowFj = ref(false)
const fjList = ref([])
const uploadAction = computed(() => (window.common?.baseApi || '') + '/uploadFile/upload')
const uploadHeaders = computed(() => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || ''
  return token ? { token } : {}
})
const sendMessage = ref(false)
const recommendedDeptActive = ref(false)
const groupOptions = ref([])
const tel1 = ref('')
const tel2 = ref('')

const userInfo = computed(() => authStore.userInfo ?? {})
const isSpt = computed(() => model.orderOriginName === '省平台渠道' || model.orderOrigin === '省平台渠道')
const is110 = computed(() => model.orderOriginName === '110平台' || model.orderOrigin === '110平台')

// ── 工具函数 ──
function formatTime(v) { if (!v) return '-'; const d = new Date(v); if (Number.isNaN(d.getTime())) return '-'; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }

// ── 字典加载 ──
async function loadDicts() {
  try {
    const [origins, types, levels, wtsdRes, ywdwRes, hotspots, specialWorks, ageRanges, emotions, portraits] = await Promise.all([
      getDictByCode(true, 'orderOrigin'), getDictByCode(true, 'orderType'),
      getDictByCode(false, 'orderLevel'), getDeptTree(true),
      getDeptTree(false), getDictByCode(true, 'hotspot'),
      getDictByCode(false, 'specialWork'), getDictByCode(false, 'ageRange'),
      getDictByCode(false, 'emotion'), getDictByCode(false, 'rwhx')
    ])
    swlyOptions.value = origins || []
    orderTypeOptions.value = types || []
    orderLevelOptions.value = levels || []
    wtsdOptions.value = wtsdRes?.data?.data || []
    ywdwOptions.value = ywdwRes?.data?.data || []
    hotspotOptions.value = hotspots || []
    specialWorkOptions.value = specialWorks || []
    ageRangeOptions.splice(0, ageRangeOptions.length, ...(ageRanges || []).map(d => ({ label: d.dictName, value: d.dictId })))
    emotionOptions.splice(0, emotionOptions.length, ...(emotions || []).map(d => ({ label: d.dictName, value: d.dictId })))
    portraitOptions.splice(0, portraitOptions.length, ...(portraits || []).map(d => ({ label: d.dictName, value: d.dictId })))
    await nextTick()
    if (deptAndUserRef.value) deptAndUserRef.value.setDeptData({ deptOptions: ywdwOptions.value })
  } catch {}
}

// ── 加载已有工单 ──
async function loadOrderData() {
  const oid = props.query?.orderId
  if (!oid) return
  isEdit.value = true; orderId.value = oid
  try {
    const res = await getOrderDetail(props.query?.orderNo || '', authStore.hasPermission('lookOrderInfo', 1))
    if (res.data?.code === 200) {
      const d = res.data.data
      Object.assign(model, {
        orderId: d.orderId || '', orderNo: d.orderNo || '',
        name: d.name || '', callTel: d.callTel || '', sex: d.sex || '',
        addr: d.addr || '', title: d.title || '', callerContent: d.callerContent || '',
        orderOrigin: d.orderOrigin || '', orderOrigin2: d.orderOrigin2 || '',
        orderType: d.orderType || '', orderLevel: d.orderLevel || '',
        handlerDeptId: d.handlerDeptId || null, handlerDeptName: d.handlerDeptName || '',
        deptId: d.deptId || '', deptName: d.deptName || '',
        orderAddr: d.orderAddr || '', handleType: d.handleType || 1,
        handleEndTime: d.handleEndTime || '', haveSound: d.haveSound || 0,
        haveSoundName: d.haveSoundName || '', acceptCenterIdea: d.acceptCenterIdea || '',
        contentRemark: d.contentRemark || '', specialWork: d.specialWork || '',
        isNameSecurity: d.isNameSecurity || 0, incidentTime: d.incidentTime || '',
        emotion: d.emotion || '', hotspot1: d.hotspot1 || '', hotspot2: d.hotspot2 || ''
      })
      if (model.callTel) { getlsgdList(); getblxxList() }
    }
  } catch {}
}

// ── 提交逻辑 ──
function getSubmitApi() {
  if (model.handleType === 6) return '/orderInfo/applyDifficult'
  return (isEdit.value && model.handleType !== 0) ? '/orderInfo/zx_submit' : '/orderInfo/save'
}

async function handleSubmit(continueAccept = false) {
  if (!model.title) { ElMessage.warning('请输入标题'); return }
  if (!model.callerContent) { ElMessage.warning('请输入内容'); return }
  try {
    submitLoading.value = true
    const payload = { ...model }
    if (isEdit.value) payload.orderId = orderId.value
    payload.isContinueAccept = continueAccept ? 1 : 0
    payload.isSubmit = continueAccept ? '' : '1'
    payload.isSendMassMessage = sendMessage.value
    const api = getSubmitApi()
    const res = await http.post(api, payload)
    if (res.data?.code === 200) {
      ElMessage.success(continueAccept ? '保存成功，继续受理' : '提交成功')
      if (continueAccept) { resetForm() } else { workbenchNav?.openMenuByCode('zcsw') }
    } else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

function resetForm() {
  const keep = { callTel: model.callTel, name: model.name, addr: model.addr, sex: model.sex, isNameSecurity: model.isNameSecurity }
  model.title = ''; model.callerContent = ''; model.orderAddr = ''; model.contentRemark = ''; model.acceptCenterIdea = ''; model.handleType = 1
}

// ── 电话相关 ──
function hujiao(tel) {
  if (!tel) return
  ctiStore.ctiHujiao({ tel, orderId: model.orderId, type: 1 })
}

function guaduan(tel) {
  if (!tel) return
  ctiStore.ctiGuaduan({ tel })
}

function blindTransfer(tel) {
  if (!tel) return
  ElMessage.info('盲转功能待接入')
}

// ── 右侧面板 ──
async function searchZsk() {
  try {
    const res = await http.get('/knowledgeBase/findHistoryOrderByTitle', { params: { title: zskKeyword.value || '', pageNum: zskPageInfo.pageNum, pageSize: zskPageInfo.pageSize } })
    if (res.data?.code === 200) { zskList.value = res.data.data?.records || []; zskPageInfo.total = res.data.data?.total || 0 }
  } catch { zskList.value = [] }
}
async function getblxxList() {
  try {
    const res = await getOrderList('/orderInfo/listOrderByTime', { pageSize: 5 })
    if (res.data?.code === 200) blxxList.value = res.data.data?.records || []
  } catch { blxxList.value = [] }
}
async function getlsgdList() {
  if (!model.callTel) return
  try {
    const res = await getOrderList('/orderInfo/findHistoryOrderByCallTel', { callTel: model.callTel, pageSize: 10 })
    if (res.data?.code === 200) lsgdList.value = res.data.data?.records || []
  } catch { lsgdList.value = [] }
}
async function searchOrigin() {
  try {
    const res = await getOrderList('/orderInfo/findOrderByHotSpot', { title: model.title, content: model.callerContent, pageSize: 10 })
    if (res.data?.code === 200) xggdList.value = res.data.data?.records || []
  } catch { xggdList.value = [] }
}
async function searchLost() {
  try {
    const res = await getOrderList('/orderInfo/findOrderByHotSpot', { pageSize: 10 })
    if (res.data?.code === 200) lostgdList.value = res.data.data?.records || []
  } catch { lostgdList.value = [] }
}
async function loadRxList() {
  try {
    const res = await http.get('/sys/params/find', { params: { code: 'rxNum' } })
    if (res.data?.code === 200 && res.data.data?.value) rxList.value = res.data.data.value.split(',').map(s => s.trim()).filter(Boolean)
  } catch { rxList.value = [] }
}
function zskViewDetail(item) {
  http.get('/knowledgeBase/zsk_knowledge_one', { params: { id: item.klKnowledgeId || item.id, isSave: 1 } }).then(res => {
    if (res.data?.code === 200) { zsdDetail.value = res.data.data || {}; zsdDetailVisible.value = true }
  })
}
function useKnowledge() {
  model.acceptCenterIdea = (model.acceptCenterIdea || '') + '\n' + (zsdDetail.value.title || '') + ': ' + (zsdDetail.value.content || '')
  zsdDetailVisible.value = false
  ElMessage.success('已引用')
}
function zskSizeChange(size) { zskPageInfo.pageSize = size; searchZsk() }
function zskCurrentChange(page) { zskPageInfo.pageNum = page; searchZsk() }

// ── 关联工单 ──
function glRow(row) {
  if (row.orderId === model.orderId) return
  model.relevantOrderNode = row.orderNo
  ElMessage.success('已关联工单: ' + row.orderNo)
}
function qxgl() { model.relevantOrderNode = null; ElMessage.success('已取消关联') }

// ── 催办 ──
function cbClick(row) { cbModel.orderId = row.orderId; cbModel.urgeContent = ''; cbFormVisible.value = true }
async function cbSubmit() {
  try {
    const res = await http.get('/orderInfo/addUrgeSupervise', { params: { orderId: cbModel.orderId, urgeContent: cbModel.urgeContent, isSendMessage: cbModel.isSendMessage } })
    if (res.data?.code === 200) { ElMessage.success('催办成功'); cbFormVisible.value = false }
    else { ElMessage.error(res.data?.message || '催办失败') }
  } catch { ElMessage.error('催办失败') }
}

// ── 附件上传 ──
function beforeUpload(file) {
  const isValid = /\.(doc|docx|pdf|jpeg|jpg|png|mp4|mp3|wav|m4a|zip|rar)$/i.test(file.name)
  if (!isValid) { ElMessage.error('不支持的文件格式'); return false }
  if (file.size > 30 * 1024 * 1024) { ElMessage.error('文件大小不能超过30MB'); return false }
  return true
}
function handleUploadSuccess(res) {
  if (res?.code === 200 || res?.data?.code === 200) { ElMessage.success('上传成功'); loadFjList() }
}
async function loadFjList() {
  try { const r = await http.get('/orderAttachmentRecoding/list', { params: { orderId: orderId.value || 0, pageSize: 20 } }); if (r.data?.code === 200) fjList.value = r.data.data?.records || [] } catch { fjList.value = [] }
}

// ── 智能推荐 ──
async function recommendedDept() {
  if (!model.hotspot1) return
  try {
    const res = await http.get('/hotspotDept/recommend', { params: { hotspot: model.hotspot1 } })
    if (res.data?.code === 200) {
      groupOptions.value = res.data.data || []
      recommendedDeptActive.value = true
    }
  } catch {}
}
function selectRecommendedDept(dept) {
  model.handlerDeptId = dept.deptId; model.handlerDeptName = dept.deptName
  if (deptAndUserRef.value) deptAndUserRef.value.setCurrentDept(dept.deptId, dept.deptName)
  recommendedDeptActive.value = false
  getDeptTels(dept.deptId)
}
async function getDeptTels(deptId) {
  try { const r = await http.get('/dept/find', { params: { deptId } }); if (r.data?.code === 200) { tel1.value = r.data.data?.tel || ''; tel2.value = r.data.data?.tel2 || '' } } catch { tel1.value = ''; tel2.value = '' }
}
function ckDispose(row) { gdxqwin.value = true; setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(row.orderId), 100) }
function playOrderSound() {
  const baseApi = window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
  audioUrlMaster.value = baseApi + model.haveSoundName; audioWinMaster.value = true
}
function computeSecrecy(haveSound) { return model.isNameSecurity ? 0 : haveSound }

// ── 初始化 ──
onMounted(async () => {
  await loadDicts()
  await loadOrderData()
  getblxxList()
  searchOrigin()
  searchLost()
  loadRxList()
  if (model.callTel) getlsgdList()
  if (!isEdit.value) model.incidentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
})
</script>

<template>
  <Container type="scroll">
    <div class="addOrder">
      <el-row :gutter="16">
        <!-- ── 左侧表单 ── -->
        <el-col :span="14">
          <div class="form-panel">
            <div class="panel-head"><span>{{ isEdit ? '编辑工单' : '新增工单' }}</span></div>

            <div v-if="audioWinMaster" style="margin:8px">
              <Audio :the-url="audioUrlMaster" :call-i-d="audioCallId" @soundError="audioWinMaster = false" />
              <el-button size="small" @click="audioWinMaster = false">关闭</el-button>
            </div>

            <!-- 市民信息 -->
            <div class="info-section">
              <div class="section-head">
                <span>市民信息</span>
                <el-button text type="primary" size="small" @click="qzbz = !qzbz">{{ qzbz ? '收起' : '展开' }}</el-button>
                <el-button v-if="computeSecrecy(model.haveSound) === 1" type="primary" size="small" @click="playOrderSound">通话录音</el-button>
              </div>
              <el-form label-width="90px" size="small">
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="市民姓名"><el-input v-model="model.name" placeholder="请输入" clearable /></el-form-item></el-col>
                  <el-col :span="10">
                    <el-form-item label="呼叫号码">
                      <el-input v-model="model.callTel" placeholder="呼叫号码" maxlength="12" show-word-limit clearable @keyup.enter="getlsgdList" />
                      <el-button size="small" style="margin-left:4px" @click="getlsgdList">查询</el-button>
                      <el-button size="small" type="success" style="margin-left:2px" @click="hujiao(model.callTel)">呼叫</el-button>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6"><el-form-item label="性别"><el-select v-model="model.sex" placeholder="选择" clearable><el-option v-for="s in sexOptions" :key="s.value" :label="s.label" :value="s.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12" v-show="qzbz">
                  <el-col :span="8"><el-form-item label="年龄"><el-select v-model="model.ageRange" placeholder="选择" clearable><el-option v-for="a in ageRangeOptions" :key="a.value" :label="a.label" :value="a.value" /></el-select></el-form-item></el-col>
                  <el-col :span="10"><el-form-item label="短信接收号"><el-input v-model="model.shotMessageNumber" placeholder="接收短信号码" maxlength="11" clearable /></el-form-item></el-col>
                  <el-col :span="6"><el-form-item label="普通话"><el-select v-model="model.isBzpth"><el-option v-for="b in bzpthOptions" :key="b.value" :label="b.label" :value="b.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12" v-show="qzbz">
                  <el-col :span="12"><el-form-item label="人像"><el-select v-model="model.portrait" multiple placeholder="最多3项" :multiple-limit="3"><el-option v-for="p in portraitOptions" :key="p.value" :label="p.label" :value="p.value" /></el-select></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="本地人"><el-select v-model="model.isNative"><el-option v-for="b in isNativeOptions" :key="b.value" :label="b.label" :value="b.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="16"><el-form-item label="群众地址"><el-input v-model="model.addr" placeholder="请输入群众地址" clearable /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="身份证"><el-input v-model="model.idcard" placeholder="身份证号" maxlength="18" clearable v-show="qzbz" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12" v-show="qzbz">
                  <el-col :span="24"><el-form-item label="群众备注"><el-input v-model="model.massesRemarks" placeholder="群众备注" clearable /></el-form-item></el-col>
                </el-row>
              </el-form>
            </div>

            <!-- 受理单信息 -->
            <div class="info-section">
              <div class="section-head"><span>受理单信息</span><el-button size="small" @click="uploadFileWin = true">上传附件</el-button><el-button size="small" @click="isShowFj = true">查看附件</el-button></div>
              <el-form label-width="90px" size="small">
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="服务渠道"><el-cascader v-model="model.orderOrigin" :options="swlyOptions" :props="{ value:'dictId', label:'dictName', children:'children', expandTrigger:'hover' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="类型"><el-select v-model="model.orderType" placeholder="请选择" clearable filterable style="width:100%"><el-option v-for="o in orderTypeOptions" :key="o.dictId" :label="o.dictName" :value="o.dictId" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="群众情绪"><el-select v-model="model.emotion" placeholder="请选择" clearable><el-option v-for="e in emotionOptions" :key="e.value" :label="e.label" :value="e.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="热点分类"><el-cascader v-model="model.hotspot1" :options="hotspotOptions" :props="{ value:'dictId', label:'dictName', children:'children' }" placeholder="请选择" clearable filterable style="width:100%" @change="recommendedDept" /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="诉求类型"><el-select v-model="model.orderTagName"><el-option v-for="o in orderTagOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="问题属地"><el-cascader v-model="model.deptId" :options="wtsdOptions" :props="{ value:'deptId', label:'deptName', children:'children', expandTrigger:'hover', checkStrictly:true }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="标题"><el-input v-model="model.title" placeholder="请输入工单标题" maxlength="200" show-word-limit @change="searchOrigin" /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="事发时间"><el-date-picker v-model="model.incidentTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="事发时间" style="width:100%" /></el-form-item></el-col>
                </el-row>
                <el-form-item label="反映内容"><el-input v-model="model.callerContent" type="textarea" :autosize="{ minRows:4, maxRows:12 }" placeholder="请输入反映内容" maxlength="2000" show-word-limit /></el-form-item>
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="保密信息"><el-input v-model="model.secrecyInfo" placeholder="保密信息" clearable /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="备注"><el-input v-model="model.contentRemark" placeholder="工单备注" clearable /></el-form-item></el-col>
                </el-row>
              </el-form>
            </div>

            <!-- 办理信息 -->
            <div class="info-section">
              <div class="section-head"><span>办理信息</span></div>
              <el-form label-width="90px" size="small">
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="办理方式"><el-select v-model="model.handleType"><el-option v-for="h in handleTypeOptions" :key="h.value" :label="h.label" :value="h.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="级别"><el-select v-model="model.orderLevel" placeholder="请选择" clearable><el-option v-for="o in orderLevelOptions" :key="o.dictId" :label="o.dictName" :value="o.dictId" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="办理时限"><el-date-picker v-model="model.handleEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="限办时间" style="width:100%" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="办理部门">
                    <div v-if="recommendedDeptActive && groupOptions.length" style="margin-bottom:4px">
                      <el-tag v-for="(g, gi) in groupOptions" :key="gi" size="small" type="success" style="cursor:pointer;margin:2px" @click="selectRecommendedDept(g)">{{ g.deptName }}</el-tag>
                      <el-button text size="small" type="danger" @click="recommendedDeptActive = false">关闭</el-button>
                    </div>
                    <SelectDeptOrUser ref="deptAndUserRef" v-model="model.handlerDeptId" :show-tabs="['dept']" :is-filter="true" />
                  </el-form-item></el-col>
                  <el-col :span="12">
                    <div style="display:flex;gap:8px">
                      <span style="line-height:32px;white-space:nowrap">单位电话:</span>
                      <el-input v-model="tel1" placeholder="电话1" size="small" />
                      <el-button size="small" type="success" @click="hujiao(tel1)">呼叫</el-button>
                      <el-button size="small" type="danger" @click="guaduan(tel1)">挂断</el-button>
                      <el-button size="small" @click="blindTransfer(tel1)">盲转</el-button>
                    </div>
                    <div v-if="tel2" style="display:flex;gap:8px;margin-top:4px">
                      <span style="line-height:32px;white-space:nowrap">电话2:</span>
                      <el-input v-model="tel2" placeholder="电话2" size="small" />
                      <el-button size="small" type="success" @click="hujiao(tel2)">呼叫</el-button>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="转接情况"><el-select v-model="model.transferInfo" clearable><el-option v-for="t in transferInfoOptions" :key="t.value" :label="t.label" :value="t.value" /></el-select></el-form-item></el-col>
                  <el-col :span="16"><el-form-item label="专项工作"><el-select v-model="model.specialWork" placeholder="请选择" clearable filterable><el-option v-for="s in specialWorkOptions" :key="s.dictId" :label="s.dictName" :value="s.dictId" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item v-if="model.handleType === 3" label="短信模板"><el-input v-model="model.messageName" placeholder="短信模板" readonly /><el-input v-model="model.messageContent" placeholder="短信内容" style="margin-top:4px" /></el-form-item>
                <el-form-item label="处理意见"><el-input v-model="model.acceptCenterIdea" type="textarea" :autosize="{ minRows:3, maxRows:8 }" placeholder="请输入处理意见" maxlength="500" show-word-limit /></el-form-item>
                <el-form-item v-if="model.handleType === 6" label="组长意见"><el-input v-model="model.groupLeaderOpinion" type="textarea" :autosize="{ minRows:2, maxRows:6 }" placeholder="请输入组长意见" maxlength="500" show-word-limit /></el-form-item>
              </el-form>
            </div>

            <!-- 操作按钮 -->
            <div class="form-actions">
              <el-checkbox v-model="sendMessage" style="margin-right:8px">群众短信</el-checkbox>
              <el-button type="success" :loading="submitLoading" @click="handleSubmit(true)">继续受理</el-button>
              <el-button type="primary" :loading="submitLoading" @click="handleSubmit(false)">提交</el-button>
              <el-button @click="workbenchNav?.openMenuByCode('zcsw')">返回列表</el-button>
            </div>
          </div>
        </el-col>

        <!-- ── 右侧面板 ── -->
        <el-col :span="10">
          <div class="form-panel">
            <div class="panel-tabs">
              <button v-for="(tab, ti) in ['知识库','办理信息','历史单','重复单','失物单','热线']" :key="ti"
                :class="{ active: activeClass === ti }" @click="activeClass = ti">{{ tab }}</button>
            </div>

            <!-- 标签0: 知识库 -->
            <div v-show="activeClass === 0" style="padding:10px">
              <div style="display:flex;gap:6px;margin-bottom:8px"><el-input v-model="zskKeyword" size="small" placeholder="关键字" @keyup.enter="searchZsk" /><el-button type="primary" size="small" @click="searchZsk">搜索</el-button></div>
              <el-table :data="zskList" size="small" border max-height="400">
                <el-table-column type="index" label="#" width="40" />
                <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
                <el-table-column label="操作" width="60"><template #default="{ row }"><el-button link type="primary" size="small" @click="zskViewDetail(row)">查看</el-button></template></el-table-column>
              </el-table>
              <el-pagination small background layout="total, prev, next" :total="zskPageInfo.total" :page-size="zskPageInfo.pageSize" @size-change="zskSizeChange" @current-change="zskCurrentChange" style="margin-top:6px;justify-content:flex-end" />
            </div>

            <!-- 标签1: 办理信息 -->
            <div v-show="activeClass === 1" style="padding:10px">
              <el-table :data="blxxList" size="small" border max-height="400">
                <el-table-column type="index" label="#" width="40" />
                <el-table-column prop="orderNo" label="编号" width="160" show-overflow-tooltip />
                <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
              </el-table>
            </div>

            <!-- 标签2: 历史受理单 -->
            <div v-show="activeClass === 2" style="padding:10px">
              <el-table :data="lsgdList" size="small" border max-height="400">
                <el-table-column type="index" label="#" width="40" />
                <el-table-column prop="orderNo" label="编号" width="160" show-overflow-tooltip />
                <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
                <el-table-column label="时间" width="140"><template #default="{ row }">{{ formatTime(row.createTime) }}</template></el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="ckDispose(row)">查看</el-button>
                    <el-button link type="warning" size="small" @click="cbClick(row)">催办</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 标签3: 重复受理单 -->
            <div v-show="activeClass === 3" style="padding:10px">
              <el-table :data="xggdList" size="small" border max-height="400">
                <el-table-column type="index" label="#" width="40" />
                <el-table-column prop="orderNo" label="编号" width="160" show-overflow-tooltip />
                <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
                <el-table-column label="关联"><template #default="{ row }"><el-button link type="primary" size="small" @click="glRow(row)">关联</el-button></template></el-table-column>
              </el-table>
            </div>

            <!-- 标签4: 失物受理单 -->
            <div v-show="activeClass === 4" style="padding:10px">
              <el-table :data="lostgdList" size="small" border max-height="400">
                <el-table-column type="index" label="#" width="40" />
                <el-table-column prop="orderNo" label="编号" width="160" show-overflow-tooltip />
                <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
                <el-table-column label="关联"><template #default="{ row }"><el-button link type="primary" size="small" @click="glRow(row)">关联</el-button></template></el-table-column>
              </el-table>
            </div>

            <!-- 标签5: 热线整合 -->
            <div v-show="activeClass === 5" style="padding:10px">
              <el-tag v-for="(rx, rxi) in rxList" :key="rxi" size="small" style="margin:3px;cursor:pointer" @click="hujiao(rx)">{{ rx }}</el-tag>
              <el-empty v-if="!rxList.length" description="暂无热线数据" :image-size="40" />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 弹窗 -->
    <Orderinfo ref="orderInfoRef" />

    <!-- 催办弹窗 -->
    <el-dialog v-model="cbFormVisible" title="催办" width="420px" append-to-body>
      <el-form size="small"><el-form-item label="催办意见"><el-input v-model="cbModel.urgeContent" type="textarea" :autosize="{ minRows:3 }" /></el-form-item></el-form>
      <el-checkbox v-model="cbModel.isSendMessage">发送短信</el-checkbox>
      <template #footer><el-button @click="cbFormVisible = false">取消</el-button><el-button type="primary" @click="cbSubmit">确定</el-button></template>
    </el-dialog>

    <!-- 知识点详情 -->
    <el-dialog v-model="zsdDetailVisible" title="知识点详情" width="600px" append-to-body>
      <div><h3>{{ zsdDetail.title }}</h3><div v-html="zsdDetail.content || zsdDetail.htmlContent" style="max-height:400px;overflow:auto" /></div>
      <template #footer><el-button @click="zsdDetailVisible = false">关闭</el-button><el-button type="primary" @click="useKnowledge">使用此知识点</el-button></template>
    </el-dialog>

    <!-- 上传附件 -->
    <el-dialog v-model="uploadFileWin" title="上传附件" width="500px" append-to-body>
      <el-upload drag :action="uploadAction" :headers="uploadHeaders" :before-upload="beforeUpload" :on-success="handleUploadSuccess" multiple>
        <el-icon class="el-icon--upload"><svg viewBox="0 0 1024 1024" width="40" height="40"><path d="M544 864V672h128L512 480 352 672h128v192H320v-1.6c-5.376 0.32-10.496 1.6-16 1.6-61.76 0-117.248-27.264-153.6-71.04A192 192 0 0 1 96 640c0-106.048 85.952-192 192-192 14.336 0 28.16 2.048 41.6 5.376C360.064 318.528 430.4 224 544 224c121.984 0 220.864 82.944 220.864 185.6 85.376 16.576 160.96 85.248 160.96 166.4 0 91.392-85.312 164.48-188.224 164.48H544z" fill="#ccc"/></svg></el-icon>
        <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
        <template #tip><div class="el-upload__tip">支持 doc/docx/pdf/jpg/png/mp3/mp4，最大30MB</div></template>
      </el-upload>
      <template #footer><el-button @click="uploadFileWin = false">关闭</el-button></template>
    </el-dialog>

    <!-- 查看附件 -->
    <el-dialog v-model="isShowFj" title="附件列表" width="600px" append-to-body @opened="loadFjList">
      <ul v-if="fjList.length" class="fj-list"><li v-for="(fj, fi) in fjList" :key="fi"><a :href="fj.filePath || fj.url" target="_blank">{{ fj.fileName || '附件'+(fi+1) }}</a></li></ul>
      <el-empty v-else description="暂无附件" :image-size="48" />
      <template #footer><el-button @click="isShowFj = false">关闭</el-button></template>
    </el-dialog>
  </Container>
</template>

<style scoped>
.addOrder { min-height: 600px; }
.form-panel { border: 1px solid #e6eaf0; border-radius: 8px; background: #fff; margin-bottom: 14px; }
.panel-head { padding: 12px 16px; border-bottom: 1px solid #f0f4f8; font-weight: 700; font-size: 15px; color: #1c4886; display:flex; align-items:center; justify-content:space-between; }
.panel-tabs { display: flex; border-bottom: 1px solid #f0f4f8; }
.panel-tabs button { flex:1; padding: 10px 4px; border: 0; background: transparent; font-size: 13px; cursor: pointer; color: #666; border-bottom: 2px solid transparent; }
.panel-tabs button.active { color: #3167dd; border-bottom-color: #3167dd; font-weight: 700; }
.info-section { padding: 14px 16px; border-bottom: 1px solid #f5f7fa; }
.section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 700; font-size: 14px; color: #333; }
.form-actions { display: flex; gap: 10px; padding: 16px; justify-content: center; align-items: center; }
.fj-list { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.fj-list a { color: #3167dd; font-size: 13px; }
</style>
