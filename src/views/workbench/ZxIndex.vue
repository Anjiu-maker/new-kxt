<script setup>
import { computed, inject, nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Clock,
  Close,
  Collection,
  DataLine,
  DocumentChecked,
  Microphone,
  Plus,
  Printer,
  Refresh,
  Star,
  StarFilled,
  Tickets,
  View
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addKnowledgeCollect,
  checkKnowledgeCollected,
  deleteMyMenu,
  getInteractionData,
  getKnowledgeDetail,
  getKnowledgeList,
  getMyMenuList,
  getOrderDetail,
  getWorkbenchCount,
  getWorkbenchList,
  getWorkbenchNotices,
  removeKnowledgeCollect,
  saveMyMenu
} from '@/services/workbenchService'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  pageName: { type: String, default: 'ZxIndex' }
})

const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)

const loading = ref(false)
const tableLoading = ref(false)

// ── 统计卡片 ──
const totals = reactive({
  zcgd: 0,
  thgd: 0,
  tbgzgd: 0,
  ywcgd: 0,
  ycqgd: 0
})

// ── 交互数据 ──
const sjlyData = ref([])
const sjlyWrapRef = ref(null)
const sjlyListRef = ref(null)
const sjlyOffset = ref(0)
const sjlyStep = 205

// ── 我的事务 ──
const activeTab = ref(0)
const tableData = ref([])
const tabOptions = [
  { value: '暂存事务', index: 0, api: 'orderInfo/zcgd_order_list' },
  { value: '退回事务', index: 1, api: 'orderInfo/fzgth_order_list' }
]

// ── 快捷功能 ──
const myKjcdList = ref([])
const kjcdShow = ref(false)
const currentSelectNode = ref({ id: 1 })
const currentKjcdList = ref([])

// ── 新知识点 ──
const knowledges = ref([])
const zsd = reactive({
  detailVisible: false,
  detailIsSc: false,
  detailRow: {},
  studyId: ''
})

// ── 通知公告 & 用户手册 ──
const notices = ref([])
const noticesYhsc = ref([])
const noticeDetailWin = ref(false)
const noticeDetail = ref({})

// ── 打印 ──
import PrintExport from '@/components/PrintExport.vue'
const printVisible = ref(false)
const printData = ref({})
const printMode = ref('print')

// ── 计算属性 ──
const userInfo = computed(() => authStore.userInfo ?? {})
const menus = computed(() => authStore.menus ?? [])
const currentSubMenus = computed(() => {
  const menu = menus.value.find((m) => m.id === currentSelectNode.value.id)
  return menu?.submenu ?? []
})

// ── 工具函数 ──
function formatTime(value) {
  if (!value) return '-'
  const date = new Date(Number(value) * 1000)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(typeof value === 'string' ? value.replace(/-/g, '/') : value)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(typeof value === 'string' ? value.replace(/-/g, '/') : value)
  if (Number.isNaN(d.getTime())) return '-'
  return formatTime(d.getTime() / 1000)
}

// ── 统计卡片加载 ──
async function loadMetric(api, key) {
  try {
    const res = await getWorkbenchCount(api)
    if (res.data?.code === 200) {
      const data = res.data.data
      totals[key] = typeof data?.total === 'number' ? data.total : (Array.isArray(data?.records) ? data.records.length : 0)
    }
  } catch {
    totals[key] = 0
  }
}

async function loadAllMetrics() {
  await Promise.all([
    loadMetric('orderInfo/zcgd_order_list', 'zcgd'),
    loadMetric('orderInfo/fzgth_order_list', 'thgd'),
    loadMetric('orderInfo/tbgz_order_list', 'tbgzgd'),
    loadMetric('orderInfo/today_over_order_list', 'ywcgd'),
    loadMetric('orderInfo/zxycq_order_list', 'ycqgd')
  ])
}

// ── 交互数据 ──
async function loadInteractionData() {
  try {
    const res = await getInteractionData()
    if (res.data?.code === 200) {
      let list = res.data.data ?? []
      if (Array.isArray(list)) {
        const roleCode = userInfo.value.roleCode
        list = list.filter((item) => {
          if (item.source === '网上受理渠道' || item.source === '省平台渠道' || item.source === '公众号渠道') {
            return roleCode === 'wsslqd'
          }
          return true
        })
      }
      sjlyData.value = list
    }
  } catch {
    sjlyData.value = []
  }
}

function initSjlyScroll() {
  nextTick(() => {
    if (!sjlyListRef.value || !sjlyWrapRef.value) return
    let maxWidth = 0
    for (const child of sjlyListRef.value.children) {
      maxWidth += child.clientWidth + 18
    }
    const wrapWidth = sjlyWrapRef.value.clientWidth
    if (maxWidth <= wrapWidth) {
      sjlyOffset.value = 0
    }
  })
}

function arrowClick(dir) {
  const listEl = sjlyListRef.value
  const wrapEl = sjlyWrapRef.value
  if (!listEl || !wrapEl) return

  let maxWidth = 0
  for (const child of listEl.children) {
    maxWidth += child.clientWidth + 18
  }
  const wrapWidth = wrapEl.clientWidth

  if (dir === 'right') {
    sjlyOffset.value -= sjlyStep
    if (wrapWidth - sjlyOffset.value >= maxWidth) {
      sjlyOffset.value = wrapWidth - maxWidth
    }
  } else {
    sjlyOffset.value += sjlyStep
    if (sjlyOffset.value >= 0) {
      sjlyOffset.value = 0
    }
  }
}

function ldWclClick() {
  workbenchNav?.openMenuByCode('zcsw')
}

function fldWclClick(source) {
  workbenchNav?.openCustomTab(
    'rwfpmx' + source,
    source + '-待处理',
    '/xxcx/rwfpmx',
    source + '-待处理',
    { handler: userInfo.value.userId, sjly: source }
  )
}

function fldYclClick(source) {
  workbenchNav?.openCustomTab(
    'rwfpmx_ycl_' + source,
    source + '-已处理',
    '/flow/order/sjlylist',
    source + '-已处理',
    { source }
  )
}

// ── 我的事务 ──
async function loadTableData(index, refreshOnly) {
  tableLoading.value = true
  try {
    const api = tabOptions[index].api
    const res = await getWorkbenchList(api, { pageSize: 100 })
    if (res.data?.code === 200) {
      if (!refreshOnly) {
        tableData.value = res.data.data?.records ?? []
      }
      const key = index === 0 ? 'zcgd' : 'thgd'
      totals[key] = res.data.data?.total ?? (res.data.data?.records?.length ?? 0)
    }
  } catch {
    if (!refreshOnly) {
      tableData.value = []
    }
    const key = index === 0 ? 'zcgd' : 'thgd'
    totals[key] = 0
  } finally {
    tableLoading.value = false
  }
}

function changeActive(index) {
  activeTab.value = index
  loadTableData(index, false)
}

function handleClick(row) {
  const cfg = activeTab.value === 0
    ? { id: 'zcswcl', title: '暂存事务处理' }
    : { id: 'thswcl', title: '退回事务处理' }
  workbenchNav?.openCustomTab(cfg.id, cfg.title, '/order/addOrder', cfg.title, { orderId: row.orderId })
}

function myGdMore() {
  const code = activeTab.value === 0 ? 'zcsw' : 'fzgth'
  workbenchNav?.openMenuByCode(code)
}

function totalNumber(code) {
  const map = {
    jrwcgd: { id: 'zxsy_today_over', title: '今日完成', url: '/flow/order/jrwcgd', fullpath: '首页/今日完成' },
    tbgz: { id: 'zxsy_tbgz', title: '特别关注', url: '/flow/order/tbgz', fullpath: '首页/特别关注' },
    zxycqgd: { id: 'zxsy_zxycq', title: '预超期工单', url: '/flow/order/zxycqgd', fullpath: '首页/预超期' }
  }
  const target = map[code]
  if (target) {
    workbenchNav?.openCustomTab(target.id, target.title, target.url, target.fullpath)
  } else {
    workbenchNav?.openMenuByCode(code)
  }
}

// ── 知识库 ──
async function loadKnowledge() {
  try {
    const res = await getKnowledgeList()
    if (res.data?.code === 200) {
      knowledges.value = res.data.data?.records ?? []
    }
  } catch {
    knowledges.value = []
  }
}

function knowledgeMore() {
  workbenchNav?.openMenuByCode('xxrw')
}

async function knowledgeShowDetail(item) {
  zsd.studyId = item.klStudyId
  try {
    const [detailRes, collectRes] = await Promise.all([
      getKnowledgeDetail(item.klKnowledgeId),
      checkKnowledgeCollected(item.klKnowledgeId)
    ])
    if (detailRes.data?.code === 200) {
      zsd.detailRow = detailRes.data.data ?? {}
    }
    zsd.detailIsSc = collectRes.data?.data ?? false
    zsd.detailVisible = true
  } catch {
    ElMessage.error('获取知识点详情失败')
  }
}

async function knowledgeClickCSc(row, type) {
  try {
    if (type === 0) {
      await removeKnowledgeCollect(row.id)
      zsd.detailIsSc = false
    } else {
      await addKnowledgeCollect(row.id)
      zsd.detailIsSc = true
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

function knowledgeCloseDialog() {
  zsd.detailVisible = false
  zsd.detailRow = {}
  zsd.studyId = ''
}

// ── 通知公告 ──
async function loadNotices() {
  try {
    const res = await getWorkbenchNotices({ pageSize: 5 })
    if (res.data?.code === 200) {
      const list = res.data.data?.records ?? []
      notices.value = list.filter((o) => o.typeName !== '用户手册')
    }
  } catch {
    notices.value = []
  }
}

async function loadNoticesYhsc() {
  try {
    const res = await getWorkbenchNotices({ pageSize: 5, typeId: 1206 })
    if (res.data?.code === 200) {
      noticesYhsc.value = res.data.data?.records ?? []
    }
  } catch {
    noticesYhsc.value = []
  }
}

function noticeDetailClick(row) {
  noticeDetail.value = row
  noticeDetailWin.value = true
}

function noticesMore(type) {
  if (type === 1) {
    workbenchNav?.openMenuByCode('noticemine')
  } else {
    workbenchNav?.openMenuByCode('noticemine', (menu) => {
      menu.tmp_url = 'typeId=1206'
    })
  }
}

// ── 快捷功能 ──
async function refreshKjcd() {
  try {
    const res = await getMyMenuList()
    if (res.data?.code === 200) {
      myKjcdList.value = res.data.data ?? []
      currentKjcdList.value = (res.data.data ?? []).map((item) => item.menuId)
    }
  } catch {
    myKjcdList.value = []
    currentKjcdList.value = []
  }
}

function clickAddKjgn() {
  currentSelectNode.value = menus.value[0] ?? { id: 1 }
  currentKjcdList.value = myKjcdList.value.map((item) => item.menuId)
  kjcdShow.value = true
}

function kjcdClick(kjcd) {
  const allSubmenus = menus.value.flatMap((m) => m.submenu ?? [])
  const target = allSubmenus.find((s) => s.id === kjcd.menuId)
  if (target) {
    workbenchNav?.openCustomTab(
      'kjcd_' + target.id,
      target.text,
      target.url || '/',
      target.fullpath || target.text,
      target.query ?? {}
    )
  }
}

async function saveKjcdFn() {
  const allSubs = menus.value.flatMap((m) => m.submenu ?? [])
  const data = allSubs.filter((item) => currentKjcdList.value.includes(item.id))
  try {
    const res = await saveMyMenu(data)
    if (res.data?.code === 200) {
      await refreshKjcd()
      kjcdShow.value = false
      ElMessage.success('快捷功能保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

async function closeKjcd(myMenuId) {
  try {
    await deleteMyMenu(myMenuId)
    await refreshKjcd()
  } catch {
    ElMessage.error('删除失败')
  }
}

function treeClick(data) {
  if (data) {
    currentSelectNode.value.id = data.id
  }
}

function emptyKjcdData() {
  currentKjcdList.value = []
}

// ── 打印 ──
async function printOrder(row, mode) {
  try {
    const res = await getOrderDetail(row.orderNo)
    if (res.data?.code === 200) {
      printData.value = res.data.data ?? {}
      printMode.value = mode
      printVisible.value = true
    }
  } catch {
    ElMessage.error('获取工单详情失败')
  }
}

function playSound(row) {
  if (row.haveSoundName && row.haveSoundName !== '无') {
    const baseApi = window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
    const audio = new Audio(`${baseApi}${row.haveSoundName}`)
    audio.play().catch(() => ElMessage.warning('录音播放失败'))
  }
}

// ── 知识库内容 HTML 渲染 ──
const defaultProps = {
  children: 'submenu',
  label: 'text'
}

watch(() => currentKjcdList.value.length, (val) => {
  if (val > 5) {
    ElMessage.warning('快捷菜单最多只能选择5个')
  }
})

onMounted(async () => {
  loading.value = true
  await Promise.all([
    loadAllMetrics(),
    loadInteractionData(),
    loadTableData(1, true),
    loadTableData(0, false),
    loadKnowledge(),
    loadNotices(),
    loadNoticesYhsc(),
    refreshKjcd()
  ])
  loading.value = false
  initSjlyScroll()
})
</script>

<template>
  <section class="zx-index" v-loading="loading">
    <div class="main-layout">
      <!-- ── 左侧主区域 ── -->
      <div class="main-left">
        <!-- ── 统计卡片 ── -->
        <section class="metric-row">
          <div class="metric-card card-blue" @click="totalNumber('zcsw')">
            <span class="metric-label">暂存 <small>(个)</small></span>
            <strong>{{ totals.zcgd }}</strong>
          </div>
          <div class="metric-card card-green" @click="totalNumber('fzgth')">
            <span class="metric-label">退回 <small>(个)</small></span>
            <strong>{{ totals.thgd }}</strong>
          </div>
          <div class="metric-card card-red" @click="totalNumber('tbgz')">
            <span class="metric-label">特别关注 <small>(个)</small></span>
            <strong>{{ totals.tbgzgd }}</strong>
          </div>
          <div class="metric-card card-cyan" @click="totalNumber('jrwcgd')">
            <span class="metric-label">今日已完成 <small>(个)</small></span>
            <strong>{{ totals.ywcgd }}</strong>
          </div>
          <div class="metric-card card-yellow" @click="totalNumber('zxycqgd')">
            <span class="metric-label">预超期 <small>(个)</small></span>
            <strong>{{ totals.ycqgd }}</strong>
          </div>
        </section>

        <!-- 交互数据 -->
        <section class="panel interaction-panel">
          <header class="panel-header">
            <div class="panel-title">
              <el-icon><DataLine /></el-icon>
              <strong>交互数据</strong>
            </div>
            <span class="panel-extra">共 <em>{{ sjlyData.length }}</em> 种来源</span>
          </header>
          <div class="interaction-wrap">
            <button class="arrow-btn arrow-left" @click="arrowClick('left')" :disabled="sjlyOffset >= 0">
              <el-icon><ArrowLeft /></el-icon>
            </button>
            <div class="interaction-scroll" ref="sjlyWrapRef">
              <div
                class="interaction-track"
                ref="sjlyListRef"
                :style="{ transform: `translateX(${sjlyOffset}px)` }"
              >
                <div class="source-card" v-for="item in sjlyData" :key="item.dictId">
                  <div
                    class="source-top"
                    :class="{ clickable: item.source === '话务' }"
                    @click="item.source === '话务' ? ldWclClick() : fldWclClick(item.source)"
                  >
                    <span class="source-pending">{{ item.wclcount }}</span>
                    <small>待处理</small>
                  </div>
                  <div class="source-bottom" @click="fldYclClick(item.source)">
                    <span class="source-name">{{ item.source }}</span>
                    <span class="source-done">已处理: <strong>{{ item.yclcount }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            <button class="arrow-btn arrow-right" @click="arrowClick('right')">
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </section>

        <!-- 我的事务 -->
        <section class="panel order-panel">
          <header class="panel-header">
            <div class="panel-title">
              <el-icon><Tickets /></el-icon>
              <strong>我的事务</strong>
            </div>
            <a class="panel-more" @click="myGdMore">更多 &gt;</a>
          </header>
          <div class="order-tabs">
            <button
              v-for="(tab, idx) in tabOptions"
              :key="tab.index"
              :class="['tab-btn', { active: activeTab === idx }]"
              @click="changeActive(idx)"
            >{{ tab.value }}</button>
          </div>
          <el-table
            :data="tableData"
            border
            max-height="320"
            v-loading="tableLoading"
            size="small"
          >
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column prop="orderNo" label="事务编号" width="140" show-overflow-tooltip />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column label="登记时间" width="155" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="handlerDeptName" label="办理单位" width="140" show-overflow-tooltip />
            <el-table-column prop="orderStateName" label="状态" width="100" show-overflow-tooltip />
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" round @click="handleClick(row)">立即处理</el-button>
                <el-button :icon="DocumentChecked" size="small" text @click="printOrder(row, 'print')" />
                <el-button :icon="Printer" size="small" text @click="printOrder(row, 'zprint')" />
                <el-icon v-if="row.haveSoundName !== '无'" color="#e19f22" :size="18" @click="playSound(row)" style="cursor:pointer"><Microphone /></el-icon>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <!-- ── 右侧面板 ── -->
      <aside class="main-right">
        <!-- 快捷功能 -->
        <section class="panel kj-panel">
          <header class="panel-header">
            <div class="panel-title">
              <el-icon><Collection /></el-icon>
              <strong>快捷功能</strong>
            </div>
          </header>
          <div class="kj-grid">
            <div
              v-for="kjcd in myKjcdList"
              :key="kjcd.myMenuId"
              class="kj-item"
            >
              <button class="kj-close" @click="closeKjcd(kjcd.myMenuId)">
                <el-icon><Close /></el-icon>
              </button>
              <div class="kj-icon" @click="kjcdClick(kjcd)">
                <el-icon :size="20"><StarFilled /></el-icon>
              </div>
              <p class="kj-text" @click="kjcdClick(kjcd)" :title="kjcd.text">{{ kjcd.text }}</p>
            </div>
            <div v-if="myKjcdList.length < 5" class="kj-item" @click="clickAddKjgn">
              <div class="kj-icon kj-add">
                <el-icon :size="22"><Plus /></el-icon>
              </div>
              <p class="kj-text">添加</p>
            </div>
          </div>
        </section>

        <!-- 新知识点 -->
        <section class="panel knowledge-panel">
          <header class="panel-header">
            <div class="panel-title">
              <el-icon><StarFilled /></el-icon>
              <strong>新知识点</strong>
            </div>
            <a class="panel-more" @click="knowledgeMore">更多 &gt;</a>
          </header>
          <ul v-if="knowledges.length > 0" class="knowledge-list">
            <li v-for="(item, idx) in knowledges" :key="idx">
              <span class="k-num">{{ idx + 1 }}</span>
              <span class="k-title" @click="knowledgeShowDetail(item)" :title="item.title">{{ item.title }}</span>
              <span class="k-badge-new">新</span>
              <span class="k-date">{{ formatDate(item.createTime) }}</span>
            </li>
          </ul>
          <el-empty v-else description="暂无数据" :image-size="48" />
        </section>

        <!-- 通知公告 -->
        <section class="panel notice-panel">
          <header class="panel-header">
            <div class="panel-title">
              <el-icon><Bell /></el-icon>
              <strong>通知公告</strong>
            </div>
            <a class="panel-more" @click="noticesMore(1)">更多 &gt;</a>
          </header>
          <ul v-if="notices.length > 0" class="notice-list">
            <li v-for="(notice, idx) in notices" :key="idx" @click="noticeDetailClick(notice)">
              <span>{{ idx + 1 }}、{{ notice.title }}</span>
              <span v-if="notice.state === 0" class="k-badge-new">新</span>
              <span class="n-date">{{ formatTime(notice.addTime) }}</span>
            </li>
          </ul>
          <el-empty v-else description="暂无数据" :image-size="48" />
        </section>

        <!-- 用户手册 -->
        <section class="panel manual-panel">
          <header class="panel-header">
            <div class="panel-title">
              <el-icon><Collection /></el-icon>
              <strong>用户手册</strong>
            </div>
            <a class="panel-more" @click="noticesMore(2)">更多 &gt;</a>
          </header>
          <ul v-if="noticesYhsc.length > 0" class="notice-list">
            <li v-for="(item, idx) in noticesYhsc" :key="idx" @click="noticeDetailClick(item)">
              <span>{{ idx + 1 }}、{{ item.title }}</span>
              <span v-if="item.state === 0" class="k-badge-new">新</span>
              <span class="n-date">{{ formatTime(item.addTime) }}</span>
            </li>
          </ul>
          <el-empty v-else description="暂无数据" :image-size="48" />
        </section>
      </aside>
    </div>

    <!-- ── 知识点详情弹窗 ── -->
    <el-dialog
      v-model="zsd.detailVisible"
      title="查看知识点"
      width="70%"
      :close-on-click-modal="false"
      :append-to-body="true"
    >
      <div class="knowledge-detail">
        <div class="kd-header">
          <h3>{{ zsd.detailRow.title }}</h3>
          <el-button
            :type="zsd.detailIsSc ? 'warning' : 'default'"
            size="small"
            @click="knowledgeClickCSc(zsd.detailRow, zsd.detailIsSc ? 0 : 1)"
          >
            <el-icon><StarFilled v-if="zsd.detailIsSc" /><Star v-else /></el-icon>
            {{ zsd.detailIsSc ? '取消收藏' : '添加收藏' }}
          </el-button>
        </div>
        <div class="kd-meta">
          <span>{{ zsd.detailRow.createUserName }}</span>
          <span>创建于 {{ zsd.detailRow.createTime }}</span>
          <span><el-icon><View /></el-icon> {{ zsd.detailRow.readTime }}</span>
          <span><el-icon><StarFilled /></el-icon> {{ zsd.detailRow.collectTime }}</span>
          <span>所属分类：{{ zsd.detailRow.classifyName }}</span>
          <span>所属部门：{{ zsd.detailRow.subDeptName }}</span>
        </div>
        <div class="kd-content" v-html="zsd.detailRow.htmlContent"></div>
      </div>
      <template #footer>
        <el-button type="danger" size="small" @click="knowledgeCloseDialog">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ── 公告详情弹窗 ── -->
    <el-dialog
      v-model="noticeDetailWin"
      title="查看公告"
      width="80%"
      :close-on-click-modal="false"
      :append-to-body="true"
      @close="noticeDetail = {}"
    >
      <div class="notice-detail-content">
        <h3>{{ noticeDetail.title }}</h3>
        <div class="nd-meta">
          <span>发布人：{{ noticeDetail.createUserName || '-' }}</span>
          <span>发布时间：{{ formatTime(noticeDetail.addTime) }}</span>
        </div>
        <div class="nd-body" v-html="noticeDetail.htmlContent || noticeDetail.content || '暂无内容'"></div>
      </div>
    </el-dialog>

    <!-- ── 快捷功能配置弹窗 ── -->
    <el-dialog
      v-model="kjcdShow"
      title="添加快捷功能"
      width="700px"
      :close-on-click-modal="false"
      :append-to-body="true"
      top="11vh"
    >
      <div class="kjcd-dialog">
        <div class="kjcd-left">
          <el-tree
            ref="treeRef"
            node-key="id"
            :data="menus"
            :props="defaultProps"
            highlight-current
            accordion
            :expand-on-click-node="true"
            :current-node-key="currentSelectNode.id"
            @node-click="treeClick"
          />
        </div>
        <div class="kjcd-right">
          <el-checkbox-group v-model="currentKjcdList" :max="5">
            <el-checkbox
              v-for="item in currentSubMenus"
              :key="item.id"
              :label="item.id"
              :value="item.id"
            >{{ item.text }}</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <div class="kjcd-footer">
          <span>最多可选5项，已选 (<em>{{ currentKjcdList.length }}</em>) 项</span>
          <div>
            <el-button @click="kjcdShow = false; emptyKjcdData()">关闭</el-button>
            <el-button type="primary" @click="saveKjcdFn">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <PrintExport :visible="printVisible" :print-data="printData" :mode="printMode" @update:visible="printVisible = $event" />

    <!-- 录音播放 -->
    <audio ref="audioRef" style="display:none" />
  </section>
</template>

<style scoped lang="scss">
.zx-index {
  min-height: calc(100dvh - 300px);
  padding: 22px 24px 32px;
  background: #f3f8fb;
  color: #263548;
}

// ── 统计卡片 ──
.metric-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 96px;
  padding: 16px 20px 18px;
  border-radius: 7px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 5px 12px rgba(26, 69, 115, 0.16);
  overflow: hidden;
  position: relative;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &::after {
    content: "";
    position: absolute;
    inset: auto -30px -46px auto;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 18px rgba(26, 69, 115, 0.2);
  }

  small {
    font-size: 12px;
    opacity: 0.85;
  }

  .metric-label {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
  }

  strong {
    font-size: 30px;
    font-weight: 600;
    line-height: 1;
    position: relative;
    z-index: 1;
  }
}

.card-blue  { background: linear-gradient(135deg, #238be8 0%, #3aa5ff 100%); }
.card-green { background: linear-gradient(135deg, #10b878 0%, #18d19a 100%); }
.card-red   { background: linear-gradient(135deg, #f33f4d 0%, #ff6270 100%); }
.card-cyan  { background: linear-gradient(135deg, #08aed0 0%, #19c4dc 100%); }
.card-yellow{ background: linear-gradient(135deg, #8dbb10 0%, #a7c72d 100%); }

// ── 主布局 ──
.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(320px, 24vw, 486px);
  gap: 16px;
  align-items: start;
}

.main-left {
  min-width: 0;
}

.main-right {
  display: grid;
  gap: 24px;
  align-content: start;

  .panel + .panel {
    margin-top: 0;
  }
}

// ── 通用面板 ──
.panel {
  border: 1px solid #dfe8ef;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(57, 88, 117, 0.04);
  overflow: hidden;

  + .panel {
    margin-top: 12px;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  padding: 0 16px;
  border-bottom: 1px solid #edf2f6;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #174b88;
    font-size: 14px;
    font-weight: 700;

    .el-icon {
      color: #2267b0;
    }
  }

  .panel-extra {
    color: #7f8a96;
    font-size: 12px;

    em {
      color: #2d3c4f;
      font-style: normal;
      font-weight: 600;
    }
  }

  .panel-more {
    color: #818b97;
    font-size: 12px;
    cursor: pointer;

    &:hover { color: #0f63b6; }
  }
}

// ── 交互数据 ──
.interaction-panel {
  margin-bottom: 12px;
}

.interaction-wrap {
  display: flex;
  align-items: center;
  min-height: 128px;
  padding: 10px 16px 24px;
  position: relative;
}

.interaction-scroll {
  flex: 1;
  overflow: hidden;
}

.interaction-track {
  display: flex;
  gap: 8px;
  white-space: nowrap;
  transition: transform 0.3s ease;
}

.source-card {
  flex: 0 0 auto;
  width: 148px;
  border: 1px solid #dfe8ef;
  border-radius: 5px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: #bcd4ec;
    box-shadow: 0 6px 14px rgba(25, 74, 122, 0.08);
    transform: translateY(-1px);
  }
}

.source-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 66px;
  padding: 10px;
  cursor: default;

  &.clickable {
    cursor: pointer;
  }

  .source-pending {
    font-size: 21px;
    font-weight: 700;
    color: #2b3542;
    line-height: 1;
  }

  small {
    color: #5d6875;
    font-size: 12px;
    margin-top: 6px;
  }
}

.source-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  padding: 0 10px;
  border-top: 1px solid #edf2f6;
  cursor: pointer;
  font-size: 12px;

  .source-name {
    color: #2f3d4e;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .source-done {
    color: #596675;
    flex-shrink: 0;

    strong { color: #1d2d3f; }
  }

  &:hover { background: #f7fbff; }
}

.arrow-btn {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  border: none;
  background: none;
  color: #c1c9d1;
  cursor: pointer;
  font-size: 16px;

  &:hover:not(:disabled) { color: #0f63b6; }
  &:disabled { opacity: 0.3; cursor: default; }
}

// ── 我的事务 ──
.order-panel {
  .order-tabs {
    display: flex;
    padding-left: 14px;
    border-bottom: 1px solid #e6ecf0;
  }

  .tab-btn {
    flex: 0 0 auto;
    width: 100px;
    height: 36px;
    border: none;
    border-right: 1px solid #e6ecf0;
    background: #fbfdff;
    color: #627083;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease;

    &:first-child { border-left: 1px solid #e6ecf0; }

    &.active {
      background: #eef6ff;
      color: #174b88;
      font-weight: 600;
    }
  }

  :deep(.el-table) {
    margin-top: 0;
    color: #2f3d4e;
    font-size: 12px;
  }

  :deep(.el-table__header th) {
    height: 39px;
    background: #f4f8fc;
    color: #2b4058;
    font-weight: 700;
  }

  :deep(.el-table__row) {
    height: 30px;
  }

  :deep(.el-button.is-round) {
    height: 24px;
    padding: 0 14px;
    background: #0067ad;
    border-color: #0067ad;
    font-weight: 600;
  }
}

// ── 快捷功能 ──
.kj-panel {
  min-height: 150px;
}

.kj-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  padding: 20px 16px 18px;
}

.kj-item {
  position: relative;
  width: 54px;
  text-align: center;

  &:hover .kj-close {
    display: flex;
  }
}

.kj-close {
  display: none;
  position: absolute;
  top: -4px;
  right: 0;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: #d9e1e8;
  border-radius: 50%;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #657285;
  z-index: 1;
}

.kj-icon {
  width: 30px;
  height: 30px;
  margin: 0 auto;
  background: #2f73bd;
  border: 1px solid #d3dbe4;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: transform 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(47, 115, 189, 0.2);
  }

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
}

.kj-add {
  background: none;
  border: 1px dashed #c2cad3;
  color: #b3bdc8;
}

.kj-text {
  margin: 7px 0 0;
  font-size: 12px;
  color: #2f3d4e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

// ── 知识库 ──
.knowledge-list {
  list-style: none;
  margin: 0;
  padding: 8px 14px 12px;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 7px 0;
    border-bottom: 1px dashed #dce3ea;
    font-size: 12px;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .k-num {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    background: #25c69a;
    color: #fff;
    border-radius: 50%;
    font-size: 11px;
  }

  .k-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #2f3d4e;
    cursor: pointer;

    &:hover { color: #0f63b6; }
  }

  .k-badge-new {
    flex-shrink: 0;
    background: #e4002b;
    color: #fff;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
  }

  .k-date {
    flex-shrink: 0;
    color: #8a96a4;
    font-size: 11px;
  }
}

// ── 通知/手册列表 ──
.notice-list {
  list-style: none;
  margin: 0;
  padding: 8px 14px 12px;

  li {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: 4px 8px;
    min-height: 36px;
    padding: 7px 0;
    border-bottom: 1px dashed #dce3ea;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:hover { color: #0f63b6; }

    span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: #2f3d4e;
    }
  }

  .k-badge-new {
    background: #e4002b;
    color: #fff;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    justify-self: start;
  }

  .n-date {
    grid-column: 1 / -1;
    font-size: 11px;
    color: #8a96a4;
  }
}

// ── 知识点详情弹窗 ──
.knowledge-detail {
  .kd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h3 { margin: 0; color: #1c4886; }
  }

  .kd-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f4f8;
    font-size: 13px;
    color: #666;
  }

  .kd-content {
    max-height: 50vh;
    overflow-y: auto;
    line-height: 1.7;
  }
}

// ── 公告详情弹窗 ──
.notice-detail-content {
  h3 { margin: 0 0 12px; color: #1c4886; }

  .nd-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f4f8;
    font-size: 13px;
    color: #666;
  }

  .nd-body {
    max-height: 50vh;
    overflow-y: auto;
    line-height: 1.7;
  }
}

// ── 快捷功能弹窗 ──
.kjcd-dialog {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 350px;
  border: 1px solid #dedede;
  border-radius: 4px;
}

.kjcd-left {
  border-right: 1px solid #dedede;
  overflow-y: auto;
  padding: 8px;
}

.kjcd-right {
  overflow-y: auto;
  padding: 8px 16px;

  :deep(.el-checkbox) {
    display: flex;
    height: 40px;
    line-height: 40px;
    margin-right: 0;
    padding-left: 16px;
  }
}

.kjcd-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  em { color: #f46366; font-style: normal; }
}

// ── 响应式 ──
@media (max-width: 1280px) {
  .metric-row {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .main-layout {
    grid-template-columns: 1fr;
  }
}
</style>
