<script setup>
import { inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Bell, DataLine } from '@element-plus/icons-vue'
import { getWorkbenchCount, getWorkbenchNotices } from '@/services/workbenchService'
import { initChart, disposeChart, makeDonutOption, makeLineOption, makeGaugeOption } from '@/utils/echarts'

defineProps({ pageName: { type: String, default: 'ZnjIndex' } })
const workbenchNav = inject('workbenchNav', null)
const loading = ref(false)

const metrics = reactive({ djsgd: 0, dfkgd: 0, cbgd: 0, ldpsgd: 0, dypgd: 0, bmzsd: 0 })
const warnings = reactive({ znj_yyqgd: 0, znj_yqgd: 0, znj_ysbgd: 0 })
const notices = ref([])
const noticeDetail = ref({})
const noticeDetailWin = ref(false)
const chartInstances = {}

function formatTime(v) { if (!v) return '-'; const d = new Date(Number(v) * 1000); if (Number.isNaN(d.getTime())) return '-'; const p=(n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }

async function loadMetric(api, key) { try { const res = await getWorkbenchCount(api); if (res.data?.code===200) { const d=res.data.data; metrics[key]=typeof d?.total==='number'?d.total:(Array.isArray(d?.records)?d.records.length:0) } } catch { metrics[key]=0 } }
async function loadWarning(api, key) { try { const res=await getWorkbenchCount(api); if (res.data?.code===200) warnings[key]=res.data.data?.total??0 } catch { warnings[key]=0 } }

function totalNumber(code) {
  const map = {
    djssw: { id:'znj_djs', title:'待接收', url:'/flow/order/djssw', fullpath:'首页/待接收' },
    dfksw: { id:'znj_dfk', title:'待反馈', url:'/flow/order/dfksw', fullpath:'首页/待反馈' },
    cbsw: { id:'znj_cb', title:'重办', url:'/flow/order/cbsw', fullpath:'首页/重办' },
    znjdd_ldps: { id:'znj_ldps', title:'领导批示', url:'/flow/order/znjdd_ldps', fullpath:'首页/领导批示' },
    znj_dyp: { id:'znj_dyp', title:'待研判', url:'/flow/order/znj_dyp', fullpath:'首页/待研判' },
    zskxxgl: { id:'znj_zsk', title:'部门知识点', url:'/knowledgeBase', fullpath:'首页/部门知识点' },
    znj_yyqgd: { id:'znj_yyqgd', title:'预逾期', url:'/flow/order/znj_yyqgd', fullpath:'首页/预逾期' },
    yqgd: { id:'znj_yqgd', title:'逾期', url:'/flow/order/yqgd', fullpath:'首页/逾期' },
    znj_ysbgd: { id:'znj_ysbgd', title:'已上报(今日)', url:'/flow/order/znj_ysbgd', fullpath:'首页/已上报(今日)' }
  }
  const t=map[code]; if (t) workbenchNav?.openCustomTab(t.id,t.title,t.url,t.fullpath); else workbenchNav?.openMenuByCode(code)
}

function noticeDetailClick(row) { noticeDetail.value=row; noticeDetailWin.value=true }
function noticesMore() { workbenchNav?.openMenuByCode('noticemine') }
async function loadNotices() { try { const res=await getWorkbenchNotices({ pageSize:4 }); if (res.data?.code===200) notices.value=res.data.data?.records??[] } catch { notices.value=[] } }

async function loadCharts() {
  try {
    const [rdtop10, qst, assbl, cbl, yql] = await Promise.all([
      getWorkbenchCount('orderInfo/znj_rdwttop10_order_list'),
      getWorkbenchCount('orderInfo/znj_qst_order_list'),
      getWorkbenchCount('orderInfo/znj_assbll_order_list'),
      getWorkbenchCount('orderInfo/znj_cbll_order_list'),
      getWorkbenchCount('orderInfo/znj_yqll_order_list')
    ])
    await nextTick()

    const rdInst = initChart('rdtop10')
    if (rdInst && rdtop10.data?.code===200) {
      const d = rdtop10.data.data
      const colors = ['#3aa0ff','#a5c340','#f75863','#fad337','#36cfc9','#b37feb','#ff9c6e']
      rdInst.setOption(makeDonutOption(d.series||[], d.legend||[], colors))
      chartInstances['rdtop10'] = rdInst
    }

    const qstInst = initChart('qst')
    if (qstInst && qst.data?.code===200 && Array.isArray(qst.data.data)) {
      const raw = qst.data.data
      const xData = [...new Set(raw.map(r=>r.date||r.name||''))]
      const seriesNames = [...new Set(raw.map(r=>r.seriesName||r.type||''))]
      const series = seriesNames.map((name, i) => ({
        name,
        data: xData.map(x => { const f=raw.find(r=>(r.date||r.name||'')===x&&(r.seriesName||r.type||'')===name); return f?.value??f?.count??0 }),
        color: ['#3aa0ff','#a5c340','#f75863'][i]||'#3aa0ff'
      }))
      qstInst.setOption(makeLineOption(xData, series, ''))
      chartInstances['qst'] = qstInst
    }

    const renderG = (id,color,title)=>(data)=>{ const inst=initChart(id); if(inst&&data) { inst.setOption(makeGaugeOption(Number(data?.per??data?.value??0),color,title)); chartInstances[id]=inst } }
    if (assbl.data?.code===200) renderG('jrxrzlr','#a5c340','及时上报率')(assbl.data.data)
    if (cbl.data?.code===200) renderG('xrzsj','#a5c340','重办率')(cbl.data.data)
    if (yql.data?.code===200) renderG('rzl','#a5c340','逾期率')(yql.data.data)
  } catch {}
}

function resizeAll() { Object.values(chartInstances).forEach(i=>i?.resize?.()) }

onMounted(async () => {
  loading.value=true
  await Promise.all([
    loadMetric('orderInfo/djs_order_list','djsgd'), loadMetric('orderInfo/dfk_order_list','dfkgd'),
    loadMetric('orderInfo/cb_order_list','cbgd'), loadMetric('orderInfo/znjdd_ldps_order_list','ldpsgd'),
    loadMetric('orderInfo/dyp_my_order_list','dypgd'), loadMetric('knowledgeBase/condition_list','bmzsd'),
    loadWarning('orderInfo/znj_yyqgd_order_list','znj_yyqgd'), loadWarning('orderInfo/yqgd_order_list','znj_yqgd'),
    loadWarning('orderInfo/znj_sbgd_order_list','znj_ysbgd'), loadNotices(), loadCharts()
  ])
  loading.value=false; window.addEventListener('resize',resizeAll)
})
onUnmounted(() => { window.removeEventListener('resize',resizeAll); Object.keys(chartInstances).forEach(id=>disposeChart(id)) })
</script>

<template>
  <section class="znj-index" v-loading="loading">
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
            <button @click="totalNumber('znj_yyqgd')"><span>1、预逾期</span><strong>{{ warnings.znj_yyqgd }} 件</strong></button>
            <button @click="totalNumber('yqgd')"><span>2、逾期</span><strong>{{ warnings.znj_yqgd }} 件</strong></button>
            <button @click="totalNumber('znj_ysbgd')"><span>3、已上报（今日）</span><strong>{{ warnings.znj_ysbgd }} 件</strong></button>
          </div>
        </section>
        <section class="panel" style="margin-top:14px"><header class="panel-header"><div class="panel-title"><el-icon><Bell /></el-icon><strong>通知公告</strong></div><a class="panel-more" @click="noticesMore">更多 &gt;</a></header>
          <ul v-if="notices.length>0" class="notice-list"><li v-for="(n,idx) in notices" :key="idx" @click="noticeDetailClick(n)"><span>{{ idx+1 }}、{{ n.title }}</span><span v-if="n.state===0" class="k-badge">新</span><span class="n-date">{{ formatTime(n.addTime) }}</span></li></ul>
          <el-empty v-else description="暂无数据" :image-size="48" /></section>
      </div>

      <div class="main-center">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>热点问题top10列表（最近30日）</strong></div></header>
          <div id="rdtop10" title="参照登记时间" style="height:260px;width:100%"></div>
          <h4 class="chart-subtitle">热点问题(Top3)近十日趋势图</h4>
          <div id="qst" title="参照登记时间" style="height:260px;width:100%"></div>
        </section>
      </div>

      <div class="main-right">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>当月办理情况</strong></div></header>
          <div class="gauge-grid">
            <div id="jrxrzlr" title="参照上报时间" style="height:260px"></div>
            <div id="xrzsj" title="参照上报时间" style="height:260px"></div>
            <div id="rzl" title="参照上报时间" style="height:260px"></div>
          </div>
        </section>
      </div>
    </div>

    <el-dialog v-model="noticeDetailWin" title="查看公告" width="80%" append-to-body @close="noticeDetail={}"><div><h3>{{ noticeDetail.title }}</h3><div class="nd-meta"><span>发布人：{{ noticeDetail.createUserName||'-' }}</span><span>发布时间：{{ formatTime(noticeDetail.addTime) }}</span></div><div v-html="noticeDetail.htmlContent||noticeDetail.content||'暂无内容'"></div></div></el-dialog>
  </section>
</template>

<style scoped lang="scss">
.znj-index { min-height: calc(100dvh - 300px); padding: 18px; }
.metric-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 18px; }
.metric-card { display: flex; flex-direction: column; gap: 6px; min-height: 110px; padding: 18px 14px; border-radius: 10px; color: #fff; cursor: pointer; box-shadow: 0 3px 6px rgba(9,41,65,0.16); transition: transform 0.15s; &:hover { transform: translateY(-2px); } small { font-size: 12px; opacity: 0.85; } span { font-size: 14px; } strong { font-size: 32px; font-weight: 400; padding-left: 6px; } }
.card-blue { background: linear-gradient(20deg, #208aed, #3aa0ff); }
.card-green { background: linear-gradient(30deg, #13bd85, #15d496); }
.card-orange { background: linear-gradient(20deg, #ea580c, #f97316); }
.card-red { background: linear-gradient(20deg, #f3434f, #f85b66); }
.card-yellow { background: linear-gradient(20deg, #ca8a04, #eab308); }
.card-slate { background: linear-gradient(20deg, #475569, #64748b); }

.main-layout { display: grid; grid-template-columns: 260px 1fr 260px; gap: 18px; }
.main-right { display: grid; gap: 14px; align-content: start; }

.panel { border: 1px solid #e6ecf0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(49,103,221,0.12); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f4f8; .panel-title { display: flex; align-items: center; gap: 8px; color: #1c4886; font-size: 15px; } .panel-more { color: #999; font-size: 13px; cursor: pointer; &:hover { color: #3167dd; } } }

.chart-subtitle { text-align: center; color: #1c4886; font-size: 14px; margin: 8px 0; }

.warning-list { display: grid; gap: 8px; padding: 14px;
  button { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e6ecf0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; &:hover { border-color: #3167dd; } strong { color: #3167dd; font-size: 14px; } }
}
.gauge-grid { display: grid; gap: 8px; padding: 8px; }
.notice-list { list-style: none; margin: 0; padding: 12px 16px;
  li { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 4px 8px; padding: 10px 0; border-bottom: 1px dashed #dedede; cursor: pointer; &:hover { color: #3167dd; } &:last-child { border-bottom: none; } span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: #333; } }
  .k-badge { background: #df0024; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; justify-self: start; } .n-date { grid-column: 1/-1; font-size: 12px; color: #999; }
}
.nd-meta { display: flex; gap: 16px; margin: 12px 0 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f4f8; font-size: 13px; color: #666; }
@media (max-width: 1280px) { .main-layout { grid-template-columns: 1fr; } .metric-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); } }
</style>
