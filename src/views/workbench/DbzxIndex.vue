<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { Bell, Close, Collection, DataLine, DocumentChecked, Microphone, Plus, Printer, Star, StarFilled, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  addKnowledgeCollect, checkKnowledgeCollected, deleteMyMenu,
  getKnowledgeDetail, getKnowledgeList, getMyMenuList, getOrderDetail,
  getWorkbenchCount, getWorkbenchList, getWorkbenchNotices,
  removeKnowledgeCollect, saveMyMenu
} from '@/services/workbenchService'
import { useAuthStore } from '@/stores/auth'
import PrintExport from '@/components/PrintExport.vue'
import EcdbForm from './EcdbForm.vue'

defineProps({ pageName: { type: String, default: 'DbzxIndex' } })
const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)
const loading = ref(false)
const printVisible = ref(false)
const printData = ref({})
const printMode = ref('print')
const ecdbVisible = ref(false)
const ecdbRow = ref(null)

const metrics = reactive({ dbsqd: 0, ddydbd: 0, dbz: 0, yellowyjd: 0, redyjd: 0 })
const extraMetrics = reactive({ overseeInstructions: 0, requestForApproval: 0 })
const dbTypeList = ref([])
const tableData = ref([])
const knowledges = ref([])
const notices = ref([])
const noticesYhsc = ref([])
const noticeDetail = ref({})
const noticeDetailWin = ref(false)
const myKjcdList = ref([])
const kjcdShow = ref(false)
const currentKjcdList = ref([])
const currentSelectNode = ref({ id: 1 })
const zsd = reactive({ detailVisible: false, detailIsSc: false, detailRow: {}, studyId: '' })

const userInfo = computed(() => authStore.userInfo ?? {})
const menus = computed(() => authStore.menus ?? [])
const currentSubMenus = computed(() => {
  const menu = menus.value.find((m) => m.id === currentSelectNode.value.id)
  return menu?.submenu ?? []
})
const defaultProps = { children: 'submenu', label: 'text' }

function formatTime(v) { if (!v) return '-'; const d = new Date(Number(v) * 1000); if (Number.isNaN(d.getTime())) return '-'; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }
function formatDate(v) { if (!v) return '-'; const d = new Date(typeof v === 'string' ? v.replace(/-/g, '/') : v); if (Number.isNaN(d.getTime())) return '-'; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` }
function formatDateTime(v) { if (!v) return '-'; const d = new Date(typeof v === 'string' ? v.replace(/-/g, '/') : v); if (Number.isNaN(d.getTime())) return '-'; return formatTime(d.getTime() / 1000) }

async function loadMetric(api, key) {
  try {
    const res = await getWorkbenchCount(api)
    if (res.data?.code === 200) { const d = res.data.data; metrics[key] = typeof d?.total === 'number' ? d.total : (Array.isArray(d?.records) ? d.records.length : 0) }
  } catch { metrics[key] = 0 }
}

async function loadExtra() {
  try {
    const [r1, r2] = await Promise.all([
      getWorkbenchCount('hi_task/requestForApproval'),
      getWorkbenchCount('hi_task/overseeInstructions')
    ])
    if (r1.data?.code === 200) extraMetrics.requestForApproval = r1.data.data?.total ?? 0
    if (r2.data?.code === 200) extraMetrics.overseeInstructions = r2.data.data?.total ?? 0
  } catch {}
}

async function loadDbTypes() {
  try {
    const res = await getWorkbenchCount('orderDbInfo/dataAnalysis')
    if (res.data?.code === 200 && Array.isArray(res.data.data)) dbTypeList.value = res.data.data
  } catch { dbTypeList.value = [] }
}

async function loadTable() {
  try {
    const res = await getWorkbenchList('orderInfo/registeredSupervisor', { pageSize: 10 })
    if (res.data?.code === 200) tableData.value = res.data.data?.records ?? []
  } catch { tableData.value = [] }
}

function totalNumber(code) {
  const map = {
    dbsqd: { id: 'dbzx_sqd', title: '督办申请单', url: '/flow/order/dbsp_sqd', fullpath: '首页/督办申请单' },
    ddydbd: { id: 'dbzx_dy', title: '待打印督办', url: '/flow/order/registeredSupervisor', fullpath: '首页/待打印督办' },
    dbz: { id: 'dbzx_dbz', title: '督办中', url: '/flow/order/supervisingAll', fullpath: '首页/督办中' },
    yellowyjd: { id: 'dbzx_yellow', title: '黄色预警单', url: '/flow/order/allNonResponse', fullpath: '首页/黄色预警单' },
    redyjd: { id: 'dbzx_red', title: '红色预警单', url: '/flow/order/allOverDueOrder', fullpath: '首页/红色预警单' }
  }
  const t = map[code]
  if (t) workbenchNav?.openCustomTab(t.id, t.title, t.url, t.fullpath)
}

function handleClick(row) {
  workbenchNav?.openCustomTab('dbzx_ecdb', '二次督办', '/order/addOrder', '二次督办', { orderId: row.orderId })
}

async function printOrder(row, mode) {
  const isHaveLookBaomi = authStore.hasPermission('lookOrderInfo', 1)
  try {
    const res = await getOrderDetail(row.orderNo, isHaveLookBaomi)
    if (res.data?.code === 200) { printData.value = res.data.data ?? {}; printMode.value = mode; printVisible.value = true }
  } catch { ElMessage.error('获取工单详情失败') }
}

function playSound(row) {
  if (row.haveSoundName && row.haveSoundName !== '无') {
    const baseApi = window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
    const audio = new Audio(`${baseApi}${row.haveSoundName}`)
    audio.play().catch(() => ElMessage.warning('录音播放失败'))
  }
}

// Knowledge, Notices, Quick Menu (same pattern as CbgIndex)
async function loadKnowledge() { try { const res = await getKnowledgeList(); if (res.data?.code === 200) knowledges.value = res.data.data?.records ?? [] } catch { knowledges.value = [] } }
function knowledgeMore() { workbenchNav?.openMenuByCode('xxrw') }
async function knowledgeShowDetail(item) {
  zsd.studyId = item.klStudyId
  try { const [dr, cr] = await Promise.all([getKnowledgeDetail(item.klKnowledgeId), checkKnowledgeCollected(item.klKnowledgeId)]); if (dr.data?.code === 200) zsd.detailRow = dr.data.data ?? {}; zsd.detailIsSc = cr.data?.data ?? false; zsd.detailVisible = true } catch { ElMessage.error('获取失败') }
}
async function knowledgeClickCSc(row, type) { try { if (type===0) { await removeKnowledgeCollect(row.id); zsd.detailIsSc=false } else { await addKnowledgeCollect(row.id); zsd.detailIsSc=true } } catch { ElMessage.error('操作失败') } }
async function loadNotices() { try { const res = await getWorkbenchNotices({ pageSize: 4 }); if (res.data?.code===200) notices.value=res.data.data?.records??[] } catch { notices.value=[] } }
async function loadNoticesYhsc() { try { const res = await getWorkbenchNotices({ pageSize: 4, typeId: 1206 }); if (res.data?.code===200) noticesYhsc.value=res.data.data?.records??[] } catch { noticesYhsc.value=[] } }
function noticeDetailClick(row) { noticeDetail.value=row; noticeDetailWin.value=true }
function noticesMore(type) { if (type===1) workbenchNav?.openMenuByCode('noticemine'); else workbenchNav?.openMenuByCode('noticemine', (m) => { m.tmp_url='typeId=1206' }) }
async function refreshKjcd() { try { const res=await getMyMenuList(); if (res.data?.code===200) { myKjcdList.value=res.data.data??[]; currentKjcdList.value=myKjcdList.value.map(i=>i.menuId) } } catch { myKjcdList.value=[]; currentKjcdList.value=[] } }
function clickAddKjgn() { currentSelectNode.value=menus.value[0]??{id:1}; currentKjcdList.value=myKjcdList.value.map(i=>i.menuId); kjcdShow.value=true }
function kjcdClick(kjcd) { const t=menus.value.flatMap(m=>m.submenu??[]).find(s=>s.id===kjcd.menuId); if (t) workbenchNav?.openCustomTab('kjcd_'+t.id, t.text, t.url||'/', t.fullpath||t.text) }
async function saveKjcdFn() { const d=menus.value.flatMap(m=>m.submenu??[]).filter(item=>currentKjcdList.value.includes(item.id)); try { await saveMyMenu(d); await refreshKjcd(); kjcdShow.value=false; ElMessage.success('保存成功') } catch { ElMessage.error('保存失败') } }
async function closeKjcd(id) { try { await deleteMyMenu(id); await refreshKjcd() } catch { ElMessage.error('删除失败') } }
function treeClick(d) { if (d) currentSelectNode.value.id=d.id }

onMounted(async () => {
  loading.value = true
  await Promise.all([
    loadMetric('orderInfo/dbsp_sqd', 'dbsqd'),
    loadMetric('orderInfo/registeredSupervisor', 'ddydbd'),
    loadMetric('orderInfo/supervisingAll', 'dbz'),
    loadMetric('orderInfo/allNonResponse', 'yellowyjd'),
    loadMetric('orderInfo/allOverDueOrder', 'redyjd'),
    loadExtra(), loadDbTypes(), loadTable(),
    loadKnowledge(), loadNotices(), loadNoticesYhsc(), refreshKjcd()
  ])
  loading.value = false
})
</script>

<template>
  <section class="dbzx-index" v-loading="loading">
    <section class="metric-row">
      <div class="metric-card card-orange" @click="totalNumber('dbsqd')"><span>督办申请单 <small>(个)</small></span><strong>{{ metrics.dbsqd }}</strong></div>
      <div class="metric-card card-cyan" @click="totalNumber('ddydbd')"><span>待打印督办 <small>(个)</small></span><strong>{{ metrics.ddydbd }}</strong></div>
      <div class="metric-card card-yellow" @click="totalNumber('dbz')"><span>督办中 <small>(个)</small></span><strong>{{ metrics.dbz }}</strong></div>
      <div class="metric-card card-blue" @click="totalNumber('yellowyjd')"><span>黄色预警单 <small>(个)</small></span><strong>{{ metrics.yellowyjd }}</strong></div>
      <div class="metric-card card-red" @click="totalNumber('redyjd')"><span>红色预警单 <small>(个)</small></span><strong>{{ metrics.redyjd }}</strong></div>
    </section>

    <div class="main-layout">
      <div class="main-left">
        <section class="panel">
          <header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>数据汇总</strong></div></header>
          <div class="extra-row">
            <div class="extra-item"><span>审批申请单</span><strong>{{ extraMetrics.requestForApproval }}</strong><small>个</small></div>
            <div class="extra-item"><span>督办批示次数</span><strong>{{ extraMetrics.overseeInstructions }}</strong><small>次</small></div>
            <div v-for="item in dbTypeList" :key="item.type" class="extra-item"><span>{{ item.type || item.name }}</span><strong>{{ item.count || 0 }}</strong><small>个</small></div>
          </div>
        </section>

        <section class="panel" style="margin-top:14px">
          <header class="panel-header"><div class="panel-title"><el-icon><Tickets /></el-icon><strong>挂号督办单</strong></div></header>
          <el-table :data="tableData" border max-height="320" size="small">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column prop="orderNo" label="事务编号" width="140" show-overflow-tooltip />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column label="登记时间" width="155" align="center"><template #default="{ row }">{{ formatDateTime(row.createTime) }}</template></el-table-column>
            <el-table-column prop="handlerDeptName" label="办理单位" width="140" show-overflow-tooltip />
            <el-table-column prop="orderStateName" label="状态" width="100" show-overflow-tooltip />
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" round @click="ecdbRow = row; ecdbVisible = true">二次督办</el-button>
                <el-button :icon="DocumentChecked" size="small" text @click="printOrder(row, 'print')" />
                <el-button :icon="Printer" size="small" text @click="printOrder(row, 'dbprint')" />
                <el-icon v-if="row.haveSoundName !== '无'" color="#e19f22" :size="18" @click="playSound(row)" style="cursor:pointer"><Microphone /></el-icon>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <aside class="main-right">
        <section class="panel">
          <header class="panel-header"><div class="panel-title"><el-icon><Collection /></el-icon><strong>快捷功能</strong></div></header>
          <div class="kj-grid">
            <div v-for="kjcd in myKjcdList" :key="kjcd.myMenuId" class="kj-item">
              <button class="kj-close" @click="closeKjcd(kjcd.myMenuId)"><el-icon><Close /></el-icon></button>
              <div class="kj-icon" @click="kjcdClick(kjcd)"><el-icon :size="20"><StarFilled /></el-icon></div>
              <p class="kj-text" @click="kjcdClick(kjcd)" :title="kjcd.text">{{ kjcd.text }}</p>
            </div>
            <div v-if="myKjcdList.length < 5" class="kj-item" @click="clickAddKjgn"><div class="kj-icon kj-add"><el-icon :size="22"><Plus /></el-icon></div><p class="kj-text">添加</p></div>
          </div>
        </section>

        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><StarFilled /></el-icon><strong>新知识点</strong></div><a class="panel-more" @click="knowledgeMore">更多 &gt;</a></header>
          <ul v-if="knowledges.length>0" class="knowledge-list"><li v-for="(item,idx) in knowledges" :key="idx"><span class="k-num">{{ idx+1 }}</span><span class="k-title" @click="knowledgeShowDetail(item)" :title="item.title">{{ item.title }}</span><span class="k-badge">新</span><span class="k-date">{{ formatDate(item.createTime) }}</span></li></ul>
          <el-empty v-else description="暂无数据" :image-size="48" /></section>

        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><Bell /></el-icon><strong>通知公告</strong></div><a class="panel-more" @click="noticesMore(1)">更多 &gt;</a></header>
          <ul v-if="notices.length>0" class="notice-list"><li v-for="(n,idx) in notices" :key="idx" @click="noticeDetailClick(n)"><span>{{ idx+1 }}、{{ n.title }}</span><span v-if="n.state===0" class="k-badge">新</span><span class="n-date">{{ formatTime(n.addTime) }}</span></li></ul>
          <el-empty v-else description="暂无数据" :image-size="48" /></section>

        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><Collection /></el-icon><strong>用户手册</strong></div><a class="panel-more" @click="noticesMore(2)">更多 &gt;</a></header>
          <ul v-if="noticesYhsc.length>0" class="notice-list"><li v-for="(item,idx) in noticesYhsc" :key="idx" @click="noticeDetailClick(item)"><span>{{ idx+1 }}、{{ item.title }}</span><span v-if="item.state===0" class="k-badge">新</span><span class="n-date">{{ formatTime(item.addTime) }}</span></li></ul>
          <el-empty v-else description="暂无数据" :image-size="48" /></section>
      </aside>
    </div>

    <el-dialog v-model="zsd.detailVisible" title="查看知识点" width="70%" :close-on-click-modal="false" append-to-body>
      <div class="knowledge-detail"><div class="kd-header"><h3>{{ zsd.detailRow.title }}</h3><el-button :type="zsd.detailIsSc?'warning':'default'" size="small" @click="knowledgeClickCSc(zsd.detailRow,zsd.detailIsSc?0:1)"><el-icon><StarFilled v-if="zsd.detailIsSc"/><Star v-else/></el-icon>{{ zsd.detailIsSc?'取消收藏':'添加收藏' }}</el-button></div><div class="kd-meta"><span>{{ zsd.detailRow.createUserName }}</span><span>创建于 {{ zsd.detailRow.createTime }}</span><span>分类：{{ zsd.detailRow.classifyName }}</span></div><div class="kd-content" v-html="zsd.detailRow.htmlContent"></div></div>
      <template #footer><el-button type="danger" size="small" @click="zsd.detailVisible=false">关闭</el-button></template>
    </el-dialog>
    <el-dialog v-model="noticeDetailWin" title="查看公告" width="80%" append-to-body @close="noticeDetail={}"><div><h3>{{ noticeDetail.title }}</h3><div class="nd-meta"><span>发布人：{{ noticeDetail.createUserName||'-' }}</span><span>发布时间：{{ formatTime(noticeDetail.addTime) }}</span></div><div v-html="noticeDetail.htmlContent||noticeDetail.content||'暂无内容'"></div></div></el-dialog>
    <el-dialog v-model="kjcdShow" title="添加快捷功能" width="700px" :close-on-click-modal="false" append-to-body top="11vh">
      <div class="kjcd-dialog"><div class="kjcd-left"><el-tree node-key="id" :data="menus" :props="defaultProps" highlight-current accordion :expand-on-click-node="true" :current-node-key="currentSelectNode.id" @node-click="treeClick" /></div><div class="kjcd-right"><el-checkbox-group v-model="currentKjcdList" :max="5"><el-checkbox v-for="item in currentSubMenus" :key="item.id" :label="item.id" :value="item.id">{{ item.text }}</el-checkbox></el-checkbox-group></div></div>
      <template #footer><div class="kjcd-footer"><span>最多可选5项，已选 (<em>{{ currentKjcdList.length }}</em>) 项</span><div><el-button @click="kjcdShow=false">关闭</el-button><el-button type="primary" @click="saveKjcdFn">保存</el-button></div></div></template>
    </el-dialog>

    <PrintExport :visible="printVisible" :print-data="printData" :mode="printMode" @update:visible="printVisible = $event" />
    <EcdbForm :visible="ecdbVisible" :row="ecdbRow" @update:visible="ecdbVisible = $event" @success="loadTable()" />
  </section>
</template>

<style scoped lang="scss">
.dbzx-index { min-height: calc(100dvh - 300px); padding: 18px; }
.metric-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 18px; }
.metric-card { display: flex; flex-direction: column; gap: 8px; min-height: 116px; padding: 20px 16px; border-radius: 10px; color: #fff; cursor: pointer; box-shadow: 0 3px 6px rgba(9,41,65,0.16); transition: transform 0.15s; &:hover { transform: translateY(-2px); } small { font-size: 13px; opacity: 0.85; } span { font-size: 15px; } strong { font-size: 36px; font-weight: 400; padding-left: 8px; } }
.card-blue { background: linear-gradient(20deg, #208aed, #3aa0ff); }
.card-red { background: linear-gradient(20deg, #f3434f, #f85b66); }
.card-orange { background: linear-gradient(20deg, #ea580c, #f97316); }
.card-cyan { background: linear-gradient(20deg, #05afd4, #13cae1); }
.card-yellow { background: linear-gradient(20deg, #ca8a04, #eab308); }
.main-layout { display: grid; grid-template-columns: 1fr 320px; gap: 18px; }
.main-right { display: grid; gap: 14px; align-content: start; }
.panel { border: 1px solid #e6ecf0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(49,103,221,0.12); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f4f8; .panel-title { display: flex; align-items: center; gap: 8px; color: #1c4886; font-size: 15px; } .panel-more { color: #999; font-size: 13px; cursor: pointer; &:hover { color: #3167dd; } } }
.extra-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; padding: 18px; }
.extra-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px; border: 1px solid #e6ecf0; border-radius: 6px; span { color: #666; font-size: 13px; } strong { font-size: 28px; color: #1c4886; } small { color: #999; font-size: 12px; } }
.kj-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; }
.kj-item { position: relative; width: 70px; text-align: center; &:hover .kj-close { display: flex; } }
.kj-close { display: none; position: absolute; top: -4px; right: 0; width: 18px; height: 18px; padding: 0; border: none; background: #ddd; border-radius: 50%; cursor: pointer; align-items: center; justify-content: center; font-size: 10px; color: #666; z-index: 1; }
.kj-icon { width: 36px; height: 36px; margin: 8px auto 0; background: #5b83dc; border: 1px solid #c2c5cc; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; }
.kj-add { background: none; border: 1px dashed #c2c5cc; color: #c2c5cc; }
.kj-text { margin: 6px 0 0; font-size: 12px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.knowledge-list, .notice-list { list-style: none; margin: 0; padding: 12px 16px; li { display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px dashed #dedede; font-size: 13px; &:last-child { border-bottom: none; } } .k-num { flex-shrink: 0; width: 18px; height: 18px; line-height: 18px; text-align: center; background: #2acc97; color: #fff; border-radius: 50%; font-size: 11px; } .k-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333; cursor: pointer; &:hover { color: #3167dd; } } .k-badge { flex-shrink: 0; background: #df0024; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; } .k-date { flex-shrink: 0; color: #999; font-size: 12px; } }
.notice-list { li { display: grid; grid-template-columns: 1fr auto; cursor: pointer; &:hover { color: #3167dd; } span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: #333; } } .n-date { grid-column: 1/-1; font-size: 12px; color: #999; } .k-badge { justify-self: start; } }
.knowledge-detail { .kd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; h3 { margin: 0; color: #1c4886; } } .kd-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f4f8; font-size: 13px; color: #666; } .kd-content { max-height: 50vh; overflow-y: auto; line-height: 1.7; } }
.nd-meta { display: flex; gap: 16px; margin: 12px 0 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f4f8; font-size: 13px; color: #666; }
.kjcd-dialog { display: grid; grid-template-columns: 1fr 1fr; height: 350px; border: 1px solid #dedede; border-radius: 4px; }
.kjcd-left { border-right: 1px solid #dedede; overflow-y: auto; padding: 8px; }
.kjcd-right { overflow-y: auto; padding: 8px 16px; :deep(.el-checkbox) { display: flex; height: 40px; line-height: 40px; margin-right: 0; padding-left: 16px; } }
.kjcd-footer { display: flex; align-items: center; justify-content: space-between; width: 100%; em { color: #f46366; font-style: normal; } }
@media (max-width: 1280px) { .metric-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); } .main-layout { grid-template-columns: 1fr; } }
</style>
