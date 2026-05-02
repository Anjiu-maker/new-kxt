<script setup>
import { inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Bell, DataLine, Tickets } from '@element-plus/icons-vue'
import { getWorkbenchCount, getWorkbenchNotices } from '@/services/workbenchService'
import flowApiMapping from '@/utils/flowApiMapping'
import { initChart, disposeChart, makeDonutOption, makeLineOption, makeGaugeOption } from '@/utils/echarts'

defineProps({ pageName: { type: String, default: 'FzgIndex' } })
const workbenchNav = inject('workbenchNav', null)
const loading = ref(false)

const metrics = reactive({ dfp: 0, sp: 0, gdsp: 0, dgj: 0 })
const warnings = reactive({ fzg_yyqgd: 0, fzg_yqgd: 0, fzg_ldps: 0, fzg_yfpgd: 0 })
const notices = ref([])
const noticeDetail = ref({})
const noticeDetailWin = ref(false)

function formatTime(v) { if (!v) return '-'; const d = new Date(Number(v) * 1000); if (Number.isNaN(d.getTime())) return '-'; const p=(n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }

async function loadMetric(api, key) { try { const res = await getWorkbenchCount(api); if (res.data?.code===200) { const d=res.data.data; metrics[key] = typeof d?.total==='number' ? d.total : (Array.isArray(d?.records) ? d.records.length : 0) } } catch { metrics[key]=0 } }
async function loadWarning(api, key) { try { const res = await getWorkbenchCount(api); if (res.data?.code===200) warnings[key]=res.data.data?.total??0 } catch { warnings[key]=0 } }

function totalNumber(code) {
  const map = {
    dfpsw: { id:'fzg_dfp', title:'待分派', url:'/flow/order/dfpsw', fullpath:'首页/待分派' },
    fzgsp: { id:'fzg_sp', title:'审批', url:'/flow/order/fzgsp', fullpath:'首页/审批' },
    fzggdsp: { id:'fzg_gdsp', title:'归档审批', url:'/flow/order/fzggdsp', fullpath:'首页/归档审批' },
    dgjsw: { id:'fzg_dgj', title:'待跟进', url:'/flow/order/dgjsw', fullpath:'首页/待跟进' },
    fzg_yyqgd: { id:'fzg_yyqgd', title:'预逾期', url:'/flow/order/fzg_yyqgd', fullpath:'首页/预逾期' },
    fzg_yqgd: { id:'fzg_yqgd', title:'逾期', url:'/flow/order/fzg_yqgd', fullpath:'首页/逾期' },
    fzg_ldps: { id:'fzg_ldps', title:'领导批示', url:'/flow/order/fzg_ldps', fullpath:'首页/领导批示' },
    fzg_yfpgd: { id:'fzg_yfpgd', title:'已分派(今日)', url:'/flow/order/fzg_yfpgd', fullpath:'首页/已分派(今日)' }
  }
  const t=map[code]
  if (t) workbenchNav?.openCustomTab(t.id, t.title, t.url, t.fullpath)
  else workbenchNav?.openMenuByCode(code)
}

function noticeDetailClick(row) { noticeDetail.value=row; noticeDetailWin.value=true }
function noticesMore() { workbenchNav?.openMenuByCode('noticemine') }
async function loadNotices() { try { const res=await getWorkbenchNotices({ pageSize:4 }); if (res.data?.code===200) notices.value=res.data.data?.records??[] } catch { notices.value=[] } }

// ECharts lifecycle
const chartInstances = {}

function renderGdqxzb(data) {
  const inst = initChart('gdqxzb')
  if (!inst || !data) return
  const series = data.series || []
  const legend = data.legend || []
  const colors = ['#3aa0ff', '#a5c340', '#f75863', '#fad337', '#36cfc9', '#b37feb', '#ff9c6e']
  inst.setOption(makeDonutOption(series, legend, colors))
  chartInstances['gdqxzb'] = inst
}

function renderFpzqlzs(data) {
  const inst = initChart('fpzqlzs')
  if (!inst || !data || !Array.isArray(data)) return
  const xData = data.map(d => d[1] || d.name || '')
  const values = data.map(d => Number(d[0]) || 0)
  inst.setOption(makeLineOption(xData, [{ name: '分派准确率', data: values, color: '#3aa0ff' }]))
  chartInstances['fpzqlzs'] = inst
}

function renderGauge(id, color, title) {
  return (data) => {
    const inst = initChart(id)
    if (!inst || !data) return
    const per = data?.per ?? data?.value ?? 0
    inst.setOption(makeGaugeOption(Number(per), color, title))
    chartInstances[id] = inst
  }
}

async function loadCharts() {
  try {
    const [gdqxzb, fpzqlqs, asfpl, fpzql, tdl] = await Promise.all([
      getWorkbenchCount('orderInfo/gdqxzb_order_list'),
      getWorkbenchCount('orderInfo/fpzqlqs_order_list'),
      getWorkbenchCount('orderInfo/asfpl_order_list'),
      getWorkbenchCount('orderInfo/fpzql_order_list'),
      getWorkbenchCount('orderInfo/tdl_order_list')
    ])
    await nextTick()
    if (gdqxzb.data?.code===200) renderGdqxzb(gdqxzb.data.data)
    if (fpzqlqs.data?.code===200) renderFpzqlzs(fpzqlqs.data.data)
    if (asfpl.data?.code===200) renderGauge('asfpl', '#a5c340', '按时分派率')(asfpl.data.data)
    if (fpzql.data?.code===200) renderGauge('fpzql', '#3aa0ff', '分派准确率')(fpzql.data.data)
    if (tdl.data?.code===200) renderGauge('tdl', '#f75863', '退单率')(tdl.data.data)
  } catch {}
}

function resizeAll() {
  Object.values(chartInstances).forEach(inst => inst?.resize?.())
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    loadMetric('orderInfo/dfp_order_list', 'dfp'),
    loadMetric('orderInfo/fzg_sp_order_list', 'sp'),
    loadMetric('orderInfo/fzg_gdsp_order_list', 'gdsp'),
    loadMetric('orderInfo/dgj_order_list', 'dgj'),
    loadWarning(flowApiMapping.listApi.fzg_yyqgd?.api, 'fzg_yyqgd'),
    loadWarning(flowApiMapping.listApi.fzg_yqgd?.api, 'fzg_yqgd'),
    loadWarning(flowApiMapping.listApi.fzg_ldps?.api, 'fzg_ldps'),
    loadWarning(flowApiMapping.listApi.fzg_yfpgd?.api, 'fzg_yfpgd'),
    loadNotices(), loadCharts()
  ])
  loading.value = false
  window.addEventListener('resize', resizeAll)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeAll)
  Object.keys(chartInstances).forEach(id => disposeChart(id))
})
</script>

<template>
  <section class="fzg-index" v-loading="loading">
    <section class="metric-row">
      <div class="metric-card card-blue" @click="totalNumber('dfpsw')"><span>待分派 <small>(个)</small></span><strong>{{ metrics.dfp }}</strong></div>
      <div class="metric-card card-orange" @click="totalNumber('fzgsp')"><span>审批 <small>(个)</small></span><strong>{{ metrics.sp }}</strong></div>
      <div class="metric-card card-green" @click="totalNumber('fzggdsp')"><span>归档审批 <small>(个)</small></span><strong>{{ metrics.gdsp }}</strong></div>
      <div class="metric-card card-yellow" @click="totalNumber('dgjsw')"><span>待跟进 <small>(个)</small></span><strong>{{ metrics.dgj }}</strong></div>
    </section>

    <div class="main-layout">
      <div class="main-left">
        <section class="panel">
          <header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>预警类信息</strong></div></header>
          <div class="warning-list">
            <button @click="totalNumber('fzg_yyqgd')"><span>1、预逾期事务</span><strong>{{ warnings.fzg_yyqgd }} 件 &gt;</strong></button>
            <button @click="totalNumber('fzg_yqgd')"><span>2、逾期事务<span class="red">（未办）</span></span><strong>{{ warnings.fzg_yqgd }} 件 &gt;</strong></button>
            <button @click="totalNumber('fzg_ldps')"><span>3、领导批示<span class="red">（未办）</span></span><strong>{{ warnings.fzg_ldps }} 件 &gt;</strong></button>
            <button @click="totalNumber('fzg_yfpgd')"><span>4、已分派事务（今日）</span><strong>{{ warnings.fzg_yfpgd }} 件 &gt;</strong></button>
          </div>
        </section>

        <section class="panel" style="margin-top:14px">
          <header class="panel-header"><div class="panel-title"><el-icon><Bell /></el-icon><strong>通知公告</strong></div><a class="panel-more" @click="noticesMore">更多 &gt;</a></header>
          <ul v-if="notices.length>0" class="notice-list">
            <li v-for="(n,idx) in notices" :key="idx" @click="noticeDetailClick(n)"><span>{{ idx+1 }}、{{ n.title }}</span><span v-if="n.state===0" class="k-badge">新</span><span class="n-date">{{ formatTime(n.addTime) }}</span></li>
          </ul>
          <el-empty v-else description="暂无数据" :image-size="48" />
        </section>
      </div>

      <div class="main-center">
        <section class="panel">
          <header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>事务去向占比（最近7日热线中心数据）</strong></div></header>
          <div id="gdqxzb" style="height:240px;width:100%"></div>
          <h4 class="chart-subtitle">最近7日分派准确率（本账号）</h4>
          <div id="fpzqlzs" style="height:340px;width:100%" title="参照分派时间"></div>
        </section>
      </div>

      <div class="main-right">
        <section class="panel">
          <header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>本月内办理情况（本账号）</strong></div></header>
          <div class="gauge-grid">
            <div id="asfpl" style="height:240px" title="参照分派时间"></div>
            <div id="fpzql" style="height:240px" title="参照分派时间"></div>
            <div id="tdl" style="height:240px" title="参照分派时间"></div>
          </div>
        </section>
      </div>
    </div>

    <el-dialog v-model="noticeDetailWin" title="查看公告" width="80%" append-to-body @close="noticeDetail={}"><div><h3>{{ noticeDetail.title }}</h3><div class="nd-meta"><span>发布人：{{ noticeDetail.createUserName||'-' }}</span><span>发布时间：{{ formatTime(noticeDetail.addTime) }}</span></div><div v-html="noticeDetail.htmlContent||noticeDetail.content||'暂无内容'"></div></div></el-dialog>
  </section>
</template>

<style scoped lang="scss">
.fzg-index { min-height: calc(100dvh - 300px); padding: 18px; }
.metric-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.metric-card { display: flex; flex-direction: column; gap: 8px; min-height: 116px; padding: 20px 16px; border-radius: 10px; color: #fff; cursor: pointer; box-shadow: 0 3px 6px rgba(9,41,65,0.16); transition: transform 0.15s; &:hover { transform: translateY(-2px); } small { font-size: 13px; opacity: 0.85; } span { font-size: 15px; } strong { font-size: 36px; font-weight: 400; padding-left: 8px; } }
.card-blue { background: linear-gradient(20deg, #208aed, #3aa0ff); }
.card-green { background: linear-gradient(30deg, #13bd85, #15d496); }
.card-orange { background: linear-gradient(20deg, #ea580c, #f97316); }
.card-yellow { background: linear-gradient(20deg, #ca8a04, #eab308); }

.main-layout { display: grid; grid-template-columns: 280px 1fr 280px; gap: 18px; }
.main-right { display: grid; gap: 14px; align-content: start; }

.panel { border: 1px solid #e6ecf0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(49,103,221,0.12); min-height: 100px; }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f4f8; .panel-title { display: flex; align-items: center; gap: 8px; color: #1c4886; font-size: 15px; } .panel-more { color: #999; font-size: 13px; cursor: pointer; &:hover { color: #3167dd; } } }

.chart-subtitle { text-align: center; color: #1c4886; font-size: 14px; margin: 8px 0; }

.warning-list { display: grid; gap: 8px; padding: 14px;
  button { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e6ecf0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px;
    &:hover { border-color: #3167dd; } .red { color: #f3434f; } strong { color: #3167dd; font-size: 14px; }
  }
}

.gauge-grid { display: grid; gap: 8px; padding: 8px; }

.notice-list { list-style: none; margin: 0; padding: 12px 16px;
  li { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 4px 8px; padding: 10px 0; border-bottom: 1px dashed #dedede; cursor: pointer; &:hover { color: #3167dd; } &:last-child { border-bottom: none; }
    span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: #333; } }
  .k-badge { background: #df0024; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; justify-self: start; }
  .n-date { grid-column: 1/-1; font-size: 12px; color: #999; }
}

.nd-meta { display: flex; gap: 16px; margin: 12px 0 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f4f8; font-size: 13px; color: #666; }

@media (max-width: 1280px) { .main-layout { grid-template-columns: 1fr; } .metric-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); } }
</style>
