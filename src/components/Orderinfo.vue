<script setup>
import { ref, reactive, computed } from 'vue'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import Audio from './Audio.vue'

const authStore = useAuthStore()

const visible = ref(false)
const loading = ref(false)
const currentOrderId = ref('')
const orderNo = ref('')
const callID = ref('')
const audioUrlMaster = ref('')
const audioWinMaster = ref(false)
const isNameSecurity = ref(false)

const basicData = reactive({
  name: '', callTel: '', orderOriginName: '', orderOrigin2Name: '',
  handleEndTime: '', orderNo: '', orderTypeName: '', orderStateName: '',
  orderSubStateName: '', title: '', callerContent: '',
  createTime: '', transferTime: '', handlerDeptName: '', acceptDeptName: '',
  addr: '', orderAddr: '', deptName: '', createUserWorkNumber: '',
  isNameSecurity: 0, isOverdue: 0, telCount: 0, telCountYf: 0,
  haveSound: 0, haveSoundName: ''
})

const hiTaskList = ref([])
const fjList = ref([])

const userInfo = computed(() => authStore.userInfo ?? {})
const hasPermission = (code, type) => authStore.hasPermission(code, type)

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

async function reloadDataByOrderId(orderId) {
  if (!orderId) return
  currentOrderId.value = orderId
  loading.value = true
  try {
    const res = await http.get('/orderInfo/find', { params: { orderId, isHaveLookBaomi: false } })
    if (res.data?.code === 200) {
      const d = res.data.data
      basicData.name = d.name ?? ''
      basicData.callTel = d.callTel ?? ''
      basicData.orderOriginName = d.orderOriginName ?? ''
      basicData.orderOrigin2Name = d.orderOrigin2Name ?? ''
      basicData.handleEndTime = d.handleEndTime ?? ''
      basicData.orderNo = d.orderNo ?? ''
      basicData.orderTypeName = d.orderTypeName ?? ''
      basicData.orderStateName = d.orderStateName ?? ''
      basicData.orderSubStateName = d.orderSubStateName ?? ''
      basicData.title = d.title ?? ''
      basicData.callerContent = d.callerContent ?? ''
      basicData.createTime = d.createTime ?? ''
      basicData.transferTime = d.transferTime ?? ''
      basicData.handlerDeptName = d.handlerDeptName ?? ''
      basicData.acceptDeptName = d.acceptDeptName ?? ''
      basicData.addr = d.addr ?? ''
      basicData.orderAddr = d.orderAddr ?? ''
      basicData.deptName = d.deptName ?? ''
      basicData.createUserWorkNumber = d.createUserWorkNumber ?? ''
      basicData.isNameSecurity = d.isNameSecurity ?? 0
      basicData.isOverdue = d.isOverdue ?? 0
      basicData.telCount = d.telCount ?? 0
      basicData.telCountYf = d.telCountYf ?? 0
      basicData.haveSound = d.haveSound ?? 0
      basicData.haveSoundName = d.haveSoundName ?? ''
      orderNo.value = d.orderNo ?? ''
      isNameSecurity.value = d.isNameSecurity === 1

      // Load task history
      try {
        const hiRes = await http.get('/hi_task/list', { params: { businessKey: orderId } })
        if (hiRes.data?.code === 200) {
          hiTaskList.value = (hiRes.data.data || [])
            .filter(o => o.taskName !== '流程开始')
            .sort((a, b) => (a.historyTaskId || 0) - (b.historyTaskId || 0))
        }
      } catch { hiTaskList.value = [] }

      // Load attachments
      try {
        const fjRes = await http.get('/orderInfo/findFile', { params: { orderId } })
        if (fjRes.data?.code === 200) fjList.value = fjRes.data.data ?? []
      } catch { fjList.value = [] }
    }
  } finally { loading.value = false }
}

function getIsSpecialFocus(orderId) {
  return http.get('/orderInfo/special_focus', { params: { isFocus: true, orderId } })
}

function show(orderId) {
  currentOrderId.value = orderId
  visible.value = true
  reloadDataByOrderId(orderId)
}

function beforeClose(done) { done() }
function close() { hiTaskList.value = []; fjList.value = [] }

function playOrderSound() {
  if (basicData.haveSoundName && basicData.haveSoundName !== '无') {
    const baseApi = window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
    audioUrlMaster.value = `${baseApi}${basicData.haveSoundName}`
    audioWinMaster.value = true
  }
}

function computeSecrecy(haveSound) {
  if (isNameSecurity.value) return 0
  return haveSound
}

function formatHiContent(item) {
  const parsed = parseJsonSafe(item.handleContentAll)
  if (parsed?.remarks) return parsed.remarks
  if (parsed?.callbackInfo) return parsed.callbackInfo
  return item.handleContent || '-'
}

defineExpose({ reloadDataByOrderId, getIsSpecialFocus, show })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="问题详情"
    width="1000px"
    top="0"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    append-to-body
  >
    <div v-loading="loading" class="orderinfo-content">
      <!-- 录音播放 -->
      <div v-if="audioWinMaster" style="margin-bottom:8px">
        <Audio :the-url="audioUrlMaster" :call-i-d="callID" @soundError="audioWinMaster = false" />
        <el-button size="small" @click="audioWinMaster = false">关闭</el-button>
      </div>

      <!-- 基本情况 -->
      <div class="oi-section">
        <el-descriptions :column="2" border size="small" title="基本情况">
          <el-descriptions-item label="姓名">
            {{ basicData.name }}
            <el-button v-if="computeSecrecy(basicData.haveSound) === 1" size="small" type="primary" link @click="playOrderSound">播放</el-button>
            <el-icon v-if="basicData.isNameSecurity === 1" title="群众信息保密"><svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M832 464h-68V352c0-140.8-115.2-256-256-256S252 211.2 252 352v112h-68c-17.6 0-32 14.4-32 32v320c0 17.6 14.4 32 32 32h640c17.6 0 32-14.4 32-32V496c0-17.6-14.4-32-32-32zM512 736c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z m156-272H356V352c0-86.4 70.4-156 156-156s156 69.6 156 156v112z" fill="#999"/></svg></el-icon>
          </el-descriptions-item>
          <el-descriptions-item label="电话">{{ basicData.callTel }}</el-descriptions-item>
          <el-descriptions-item label="服务渠道">{{ basicData.orderOriginName }}{{ basicData.orderOrigin2Name ? '/' + basicData.orderOrigin2Name : '' }}</el-descriptions-item>
          <el-descriptions-item label="办理时限">{{ basicData.handleEndTime }}</el-descriptions-item>
          <el-descriptions-item label="问题编号">{{ basicData.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">{{ basicData.orderTypeName }}</el-descriptions-item>
          <el-descriptions-item label="登记人">{{ basicData.createUserWorkNumber }}</el-descriptions-item>
          <el-descriptions-item label="办理单位">{{ basicData.handlerDeptName }}</el-descriptions-item>
          <el-descriptions-item label="登记时间">{{ basicData.createTime }}</el-descriptions-item>
          <el-descriptions-item label="转办时间">{{ basicData.transferTime }}</el-descriptions-item>
          <el-descriptions-item label="实时状态">
            <el-tag :type="basicData.isOverdue === 1 ? 'danger' : 'info'" size="small">{{ basicData.orderSubStateName || basicData.orderStateName }}</el-tag>
            <span v-if="basicData.isOverdue === 1" style="color:#f56c6c;margin-left:8px">已超期</span>
          </el-descriptions-item>
          <el-descriptions-item label="累计拨打 / 近期拨打">{{ basicData.telCount }} / {{ basicData.telCountYf }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 诉求地址 -->
      <div class="oi-section">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="诉求人地址" :span="2">{{ basicData.addr }}</el-descriptions-item>
          <el-descriptions-item label="问题属地">{{ basicData.deptName }}</el-descriptions-item>
          <el-descriptions-item label="事发地址" :span="3">{{ basicData.orderAddr }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 标题和内容 -->
      <div class="oi-section">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="标题">{{ basicData.title }}</el-descriptions-item>
          <el-descriptions-item label="内容"><div style="white-space:pre-wrap;max-height:200px;overflow:auto">{{ basicData.callerContent }}</div></el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 办理过程 -->
      <div v-if="hiTaskList.length > 0" class="oi-section">
        <h4 style="margin:0 0 8px">工单处理流程详情</h4>
        <el-table :data="hiTaskList" border size="small" max-height="400">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column label="处理时间" width="155" align="center">
            <template #default="{ row }">{{ formatDate(row.endTime) }}</template>
          </el-table-column>
          <el-table-column prop="deptName" label="处理部门" width="140" show-overflow-tooltip />
          <el-table-column prop="assingeeUser" label="处理人" width="100" show-overflow-tooltip />
          <el-table-column prop="taskName" label="操作" width="110" show-overflow-tooltip />
          <el-table-column label="处理内容" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ formatHiContent(row) }}</template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 附件 -->
      <div v-if="fjList.length > 0" class="oi-section">
        <h4 style="margin:0 0 8px">附件 ({{ fjList.length }})</h4>
        <ul class="fj-list">
          <li v-for="(fj, idx) in fjList" :key="idx">
            <a :href="fj.url || fj.filePath" target="_blank">{{ fj.fileName || fj.name || '附件' + (idx + 1) }}</a>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.oi-section { margin-bottom: 14px; }
.fj-list { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.fj-list a { color: #3167dd; font-size: 13px; }
</style>
