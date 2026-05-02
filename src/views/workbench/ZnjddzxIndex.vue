<script setup>
import { inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
import { getWorkbenchCount, getWorkbenchList } from '@/services/workbenchService'
import { initChart, disposeChart, makeGaugeOption } from '@/utils/echarts'

defineProps({ pageName: { type: String, default: 'ZnjddzxIndex' } })
const workbenchNav = inject('workbenchNav', null)
const loading = ref(false)

const metrics = reactive({ djsgd: 0, dfkgd: 0, cbgd: 0, ldpsgd: 0, dypgd: 0, bmzsd: 0 })
const warnings = reactive({ znjdd_yyqgd: 0, znjdd_yqgd: 0, znjdd_ldps: 0, znjdd_yfpgd: 0 })
const subordinateList = ref([])
const chartInstances = {}

async function loadMetric(api, key) { try { const res=await getWorkbenchCount(api); if (res.data?.code===200) { const d=res.data.data; metrics[key]=typeof d?.total==='number'?d.total:(Array.isArray(d?.records)?d.records.length:0) } } catch { metrics[key]=0 } }
async function loadWarning(api, key) { try { const res=await getWorkbenchCount(api); if (res.data?.code===200) warnings[key]=res.data.data?.total??0 } catch { warnings[key]=0 } }

function totalNumber(code) {
  const map = {
    djssw: { id:'znjdd_djs',title:'待接收',url:'/flow/order/djssw',fullpath:'首页/待接收' },
    dfksw: { id:'znjdd_dfk',title:'待反馈',url:'/flow/order/dfksw',fullpath:'首页/待反馈' },
    cbsw: { id:'znjdd_cb',title:'重办',url:'/flow/order/cbsw',fullpath:'首页/重办' },
    znjdd_ldps: { id:'znjdd_ldps_t',title:'领导批示',url:'/flow/order/znjdd_ldps',fullpath:'首页/领导批示' },
    znj_dyp: { id:'znjdd_dyp',title:'待研判',url:'/flow/order/znj_dyp',fullpath:'首页/待研判' },
    zskxxgl: { id:'znjdd_zsk',title:'部门知识点',url:'/knowledgeBase',fullpath:'首页/部门知识点' },
    znjdd_yyqgd: { id:'znjdd_yyqgd_t',title:'预逾期',url:'/flow/order/znjdd_yyqgd',fullpath:'首页/预逾期' },
    znjdd_yqgd: { id:'znjdd_yqgd_t',title:'逾期',url:'/flow/order/znjdd_yqgd',fullpath:'首页/逾期' },
    znjdd_yfpgd: { id:'znjdd_yfpgd_t',title:'已分派(今日)',url:'/flow/order/znjdd_yfpgd',fullpath:'首页/已分派(今日)' }
  }
  const t=map[code]; if (t) workbenchNav?.openCustomTab(t.id,t.title,t.url,t.fullpath); else workbenchNav?.openMenuByCode(code)
}

async function loadSubordinate() {
  try { const res=await getWorkbenchList('orderInfo/znjdd_zsxjtj_order_list',{ pageSize:50 }); if (res.data?.code===200) subordinateList.value=res.data.data?.records??[] } catch { subordinateList.value=[] }
}
function cellClick(depId) { if (depId) workbenchNav?.openCustomTab('znjdd_dep_'+depId,'下级详情','/flow/order/znjdd_xjxx','首页/下级详情',{ depId }) }

async function loadCharts() {
  try {
    const [assbl,cbl,bthl,asspl] = await Promise.all([
      getWorkbenchCount('orderInfo/znj_assbl_order_list'),
      getWorkbenchCount('orderInfo/znj_cbl_order_list'),
      getWorkbenchCount('orderInfo/znj_bthl_order_list'),
      getWorkbenchCount('orderInfo/znj_asspl_order_list')
    ])
    await nextTick()
    const renderG = (id,color)=>(data)=>{ const inst=initChart(id); if(inst&&data){ inst.setOption(makeGaugeOption(Number(data?.per??data?.value??0),color)); chartInstances[id]=inst } }
    if (assbl.data?.code===200) renderG('jrxrzlr','#a5c340')(assbl.data.data)
    if (cbl.data?.code===200) renderG('xrzsj','#f75863')(cbl.data.data)
    if (bthl.data?.code===200) renderG('rzl','#fad337')(bthl.data.data)
    if (asspl.data?.code===200) renderG('llhl','#3aa0ff')(asspl.data.data)
  } catch {}
}
function resizeAll() { Object.values(chartInstances).forEach(i=>i?.resize?.()) }

async function refreshData() {
  await Promise.all([
    loadMetric('orderInfo/djs_order_list','djsgd'), loadMetric('orderInfo/dfk_order_list','dfkgd'),
    loadMetric('orderInfo/cb_order_list','cbgd'), loadMetric('orderInfo/znjdd_ldps_order_list','ldpsgd'),
    loadMetric('orderInfo/dyp_my_order_list','dypgd'), loadMetric('knowledgeBase/condition_list','bmzsd'),
    loadWarning('orderInfo/znjdd_yyqgd_order_list','znjdd_yyqgd'), loadWarning('orderInfo/znjdd_yqgd_order_list','znjdd_yqgd'),
    loadWarning('orderInfo/znjdd_ldps_order_list','znjdd_ldps'), loadWarning('orderInfo/znjdd_yfpgd_order_list','znjdd_yfpgd')
  ])
}

const refreshSeconds = ref((window.common?.refreshTime || window.__KXT_CONFIG__?.refreshTime) || 30)
let refreshTimer = null

onMounted(async () => {
  loading.value=true
  await Promise.all([
    loadMetric('orderInfo/djs_order_list','djsgd'), loadMetric('orderInfo/dfk_order_list','dfkgd'),
    loadMetric('orderInfo/cb_order_list','cbgd'), loadMetric('orderInfo/znjdd_ldps_order_list','ldpsgd'),
    loadMetric('orderInfo/dyp_my_order_list','dypgd'), loadMetric('knowledgeBase/condition_list','bmzsd'),
    loadWarning('orderInfo/znjdd_yyqgd_order_list','znjdd_yyqgd'), loadWarning('orderInfo/znjdd_yqgd_order_list','znjdd_yqgd'),
    loadWarning('orderInfo/znjdd_ldps_order_list','znjdd_ldps'), loadWarning('orderInfo/znjdd_yfpgd_order_list','znjdd_yfpgd'),
    loadSubordinate(), loadCharts()
  ])
  loading.value=false; window.addEventListener('resize',resizeAll)
  refreshTimer = setInterval(refreshData, refreshSeconds.value * 1000)

  const watchKey = '__kxt_isDjsRefresh_watch'
  if (!window[watchKey]) {
    window[watchKey] = true
    const orig = window.localStorage.setItem.bind(window.localStorage)
    window.localStorage.setItem = function(key, value) {
      if (key === 'isDjsRefresh' && value === 'true') {
        window.localStorage.setItem = orig
        metrics.djsgd++
        window.localStorage.removeItem('isDjsRefresh')
        window.localStorage.setItem = orig
        return
      }
      return orig(key, value)
    }
  }
})
onUnmounted(() => { window.removeEventListener('resize',resizeAll); Object.keys(chartInstances).forEach(id=>disposeChart(id)); clearInterval(refreshTimer) })
</script>

<template>
  <section class="znjddzx-index" v-loading="loading">
    <section class="metric-row">
      <div class="metric-card card-blue" @click="totalNumber('djssw')"><span>待接收 <small>(个)</small></span><strong>{{ metrics.djsgd }}</strong></div>
      <div class="metric-card card-green" @click="totalNumber('dfksw')"><span>待反馈 <small>(个)</small></span><strong>{{ metrics.dfkgd }}</strong></div>
      <div class="metric-card card-orange" @click="totalNumber('cbsw')"><span>重办 <small>(个)</small></span><strong>{{ metrics.cbgd }}</strong></div>
      <div class="metric-card card-red" @click="totalNumber('znjdd_ldps')"><span>领导批示 <small>(个)</small></span><strong>{{ metrics.ldpsgd }}</strong></div>
      <div class="metric-card card-yellow" @click="totalNumber('znj_dyp')"><span>待研判 <small>(个)</small></span><strong>{{ metrics.dypgd }}</strong></div>
      <div class="metric-card card-slate" @click="totalNumber('zskxxgl')"><span>部门知识点 <small>(个)</small></span><strong>{{ metrics.bmzsd }}</strong></div>
    </section>

    <div class="main-layout">
      <div class="main-left">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>预警类信息</strong></div></header>
          <div class="warning-list">
            <button @click="totalNumber('znjdd_yyqgd')"><span>1、预逾期</span><strong>{{ warnings.znjdd_yyqgd }} 件</strong></button>
            <button @click="totalNumber('znjdd_yqgd')"><span>2、逾期</span><strong>{{ warnings.znjdd_yqgd }} 件</strong></button>
            <button @click="totalNumber('znjdd_ldps')"><span>3、领导批示<span class="red">（未办）</span></span><strong>{{ warnings.znjdd_ldps }} 件</strong></button>
            <button @click="totalNumber('znjdd_yfpgd')"><span>4、已分派事务（今日）</span><strong>{{ warnings.znjdd_yfpgd }} 件</strong></button>
          </div>
        </section>
      </div>

      <div class="main-center">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>办理情况</strong></div></header>
          <div class="gauge-2x2">
            <div id="jrxrzlr" style="height:220px"></div>
            <div id="xrzsj" style="height:220px"></div>
            <div id="rzl" style="height:220px"></div>
            <div id="llhl" style="height:220px"></div>
          </div>
        </section>
      </div>

      <div class="main-right">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>直属下级数据展示</strong></div></header>
          <el-table :data="subordinateList" border max-height="500" size="small">
            <el-table-column prop="deptName" label="办理单位" min-width="140" show-overflow-tooltip />
            <el-table-column prop="djsCount" label="待接收" width="80" align="center"><template #default="{ row }"><a @click="cellClick(row.deptId)">{{ row.djsCount || 0 }}</a></template></el-table-column>
            <el-table-column prop="yyqCount" label="预逾期" width="80" align="center"><template #default="{ row }"><a @click="cellClick(row.deptId)">{{ row.yyqCount || 0 }}</a></template></el-table-column>
            <el-table-column prop="yqCount" label="逾期" width="80" align="center"><template #default="{ row }"><a @click="cellClick(row.deptId)">{{ row.yqCount || 0 }}</a></template></el-table-column>
            <el-table-column prop="cbCount" label="重办" width="80" align="center"><template #default="{ row }"><a @click="cellClick(row.deptId)">{{ row.cbCount || 0 }}</a></template></el-table-column>
          </el-table>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.znjddzx-index { min-height: calc(100dvh - 300px); padding: 18px; }
.metric-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 18px; }
.metric-card { display: flex; flex-direction: column; gap: 6px; min-height: 110px; padding: 18px 14px; border-radius: 10px; color: #fff; cursor: pointer; box-shadow: 0 3px 6px rgba(9,41,65,0.16); transition: transform 0.15s; &:hover { transform: translateY(-2px); } small { font-size: 12px; opacity: 0.85; } span { font-size: 14px; } strong { font-size: 32px; font-weight: 400; padding-left: 6px; } }
.card-blue { background: linear-gradient(20deg, #208aed, #3aa0ff); }
.card-green { background: linear-gradient(30deg, #13bd85, #15d496); }
.card-orange { background: linear-gradient(20deg, #ea580c, #f97316); }
.card-red { background: linear-gradient(20deg, #f3434f, #f85b66); }
.card-yellow { background: linear-gradient(20deg, #ca8a04, #eab308); }
.card-slate { background: linear-gradient(20deg, #475569, #64748b); }

.main-layout { display: grid; grid-template-columns: 260px 1fr 320px; gap: 18px; }
.main-right { display: grid; gap: 14px; align-content: start; }

.panel { border: 1px solid #e6ecf0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(49,103,221,0.12); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f4f8; .panel-title { display: flex; align-items: center; gap: 8px; color: #1c4886; font-size: 15px; } .panel-more { color: #999; font-size: 13px; cursor: pointer; &:hover { color: #3167dd; } } }

.warning-list { display: grid; gap: 8px; padding: 14px;
  button { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e6ecf0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; &:hover { border-color: #3167dd; } .red { color: #f3434f; } strong { color: #3167dd; font-size: 14px; } }
}

.gauge-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; }

@media (max-width: 1280px) { .main-layout { grid-template-columns: 1fr; } .metric-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); } .gauge-2x2 { grid-template-columns: 1fr 1fr; } }
</style>
