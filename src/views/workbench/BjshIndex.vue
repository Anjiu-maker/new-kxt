<script setup>
import { inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Bell, DataLine } from '@element-plus/icons-vue'
import { getWorkbenchCount, getWorkbenchNotices } from '@/services/workbenchService'
import flowApiMapping from '@/utils/flowApiMapping'
import { initChart, disposeChart, makeDonutOption, makeLineOption, makeGaugeOption } from '@/utils/echarts'

defineProps({ pageName: { type: String, default: 'BjshIndex' } })
const workbenchNav = inject('workbenchNav', null)
const loading = ref(false)

const metrics = reactive({ dhf: 0, dgd: 0, dyp: 0, dypz: 0 })
const warnings = reactive({ yyhf: 0, hf_csdhfgd: 0, hf_yhfgd: 0, hf_yhfcs: 0 })
const jrhfjd = ref(0)
const notices = ref([])
const noticeDetail = ref({})
const noticeDetailWin = ref(false)
const chartInstances = {}

function formatTime(v) { if (!v) return '-'; const d = new Date(Number(v) * 1000); if (Number.isNaN(d.getTime())) return '-'; const p=(n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }

async function loadMetric(api, key) { try { const res=await getWorkbenchCount(api); if (res.data?.code===200) { const d=res.data.data; metrics[key]=typeof d?.total==='number'?d.total:(Array.isArray(d?.records)?d.records.length:0) } } catch { metrics[key]=0 } }
async function loadWarning(api, key) { try { const res=await getWorkbenchCount(api); if (res.data?.code===200) warnings[key]=res.data.data?.total??0 } catch { warnings[key]=0 } }

function totalNumber(code) {
  const map = {
    dhfsw: { id:'bjsh_dhf',title:'待回访',url:'/flow/order/dhfsw',fullpath:'首页/待回访' },
    dgdsw: { id:'bjsh_dgd',title:'待审核',url:'/flow/order/dgdsw',fullpath:'首页/待审核' },
    dypgd: { id:'bjsh_dyp',title:'待研判',url:'/flow/order/dypgd',fullpath:'首页/待研判' },
    dypzsw: { id:'bjsh_dypz',title:'待研判总',url:'/flow/order/dypzsw',fullpath:'首页/待研判总' },
    yyhf: { id:'bjsh_yyhf',title:'预约回访',url:'/flow/order/yyhf',fullpath:'首页/预约回访' },
    hf_csdhfgd: { id:'bjsh_csdhf',title:'超时待回访',url:'/flow/order/hf_csdhfgd',fullpath:'首页/超时待回访' },
    hf_yhfgd: { id:'bjsh_yhf',title:'已回访',url:'/flow/order/hf_yhfgd',fullpath:'首页/已回访' },
    hf_yhfcs: { id:'bjsh_yhfcs',title:'已回访次数',url:'/flow/order/hf_yhfcs',fullpath:'首页/已回访次数' }
  }
  const t=map[code]; if (t) workbenchNav?.openCustomTab(t.id,t.title,t.url,t.fullpath); else workbenchNav?.openMenuByCode(code)
}

function noticeDetailClick(row) { noticeDetail.value=row; noticeDetailWin.value=true }
function noticesMore() { workbenchNav?.openMenuByCode('noticemine') }
async function loadNotices() { try { const res=await getWorkbenchNotices({ pageSize:4 }); if (res.data?.code===200) notices.value=res.data.data?.records??[] } catch { notices.value=[] } }

async function loadCharts() {
  try {
    const [gdhfjg, hfaslqr, hfaslpie, cxhflpie, jrhfjdRes] = await Promise.all([
      getWorkbenchCount('orderInfo/hf_gdhfjg_order_list'),
      getWorkbenchCount('orderInfo/hf_jqrhfaslqrt_order_list'),
      getWorkbenchCount('orderInfo/hf_jqrhfaslpie_order_list'),
      getWorkbenchCount('orderInfo/hf_jqrcxhfl_order_list'),
      getWorkbenchCount('orderInfo/hf_jrhfjd_order_list')
    ])
    if (jrhfjdRes.data?.code===200) jrhfjd.value = jrhfjdRes.data.data?.jrhfjd ?? jrhfjdRes.data.data ?? 0
    await nextTick()

    const pieInst = initChart('bjsh_gdqxzb')
    if (pieInst && gdhfjg.data?.code===200) {
      const d = gdhfjg.data.data
      pieInst.setOption(makeDonutOption(d.series||[], d.legend||[], ['#3aa0ff','#a5c340','#f75863','#999']))
      chartInstances['bjsh_gdqxzb'] = pieInst
    }
    const lineInst = initChart('bjsh_fpzqlzs')
    if (lineInst && hfaslqr.data?.code===200 && Array.isArray(hfaslqr.data.data)) {
      const raw = hfaslqr.data.data
      const xData = [...new Set(raw.map(r=>r.date||r.name||''))]
      const personal = xData.map(x=>{ const f=raw.find(r=>(r.date||r.name||'')===x&&(r.type||r.key)==='personal'); return f?.value??f?.count??0 })
      const overall = xData.map(x=>{ const f=raw.find(r=>(r.date||r.name||'')===x&&(r.type||r.key)==='overall'); return f?.value??f?.count??0 })
      lineInst.setOption(makeLineOption(xData, [{ name:'个人',data:personal,color:'#3aa0ff' },{ name:'整体',data:overall,color:'#a5c340' }]))
      chartInstances['bjsh_fpzqlzs'] = lineInst
    }
    const renderG = (id,color)=>(data)=>{ const inst=initChart(id); if(inst&&data){ inst.setOption(makeGaugeOption(Number(data?.per??data?.value??0),color)); chartInstances[id]=inst } }
    if (hfaslpie.data?.code===200) renderG('bjsh_asfpl','#a5c340')(hfaslpie.data.data)
    if (cxhflpie.data?.code===200) renderG('bjsh_fpzql','#ff606c')(cxhflpie.data.data)
  } catch {}
}

function resizeAll() { Object.values(chartInstances).forEach(i=>i?.resize?.()) }

onMounted(async () => {
  loading.value=true
  await Promise.all([
    loadMetric('orderInfo/my_dhf_order_list','dhf'), loadMetric('orderInfo/dgd_order_list','dgd'),
    loadMetric('orderInfo/dyp_order_list','dyp'), loadMetric('orderInfo/dyp_all_order_list','dypz'),
    loadWarning(flowApiMapping.listApi.yyhf?.api,'yyhf'), loadWarning(flowApiMapping.listApi.hf_csdhfgd?.api,'hf_csdhfgd'),
    loadWarning(flowApiMapping.listApi.hf_yhfgd?.api,'hf_yhfgd'), loadWarning(flowApiMapping.listApi.hf_yhfcs?.api,'hf_yhfcs'),
    loadNotices(), loadCharts()
  ])
  loading.value=false; window.addEventListener('resize',resizeAll)
})
onUnmounted(() => { window.removeEventListener('resize',resizeAll); Object.keys(chartInstances).forEach(id=>disposeChart(id)) })
</script>

<template>
  <section class="bjsh-index" v-loading="loading">
    <div class="top-row">
      <div class="progress-panel"><p class="jrhf-title">今日审核进度</p><el-progress :percentage="Number(jrhfjd)" :stroke-width="15" :text-inside="true" class="jdt-style" /></div>
      <div class="metric-card card-blue" @click="totalNumber('dhfsw')"><span>待回访 <small>(个)</small></span><strong>{{ metrics.dhf }}</strong></div>
    </div>

    <div class="main-layout">
      <div class="main-left">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>预警类信息</strong></div></header>
          <div class="warning-list">
            <button @click="totalNumber('yyhf')"><span>1、预约回访</span><strong>{{ warnings.yyhf }} 件</strong></button>
            <button @click="totalNumber('hf_csdhfgd')"><span>2、超时待回访</span><strong>{{ warnings.hf_csdhfgd }} 件</strong></button>
            <button @click="totalNumber('hf_yhfgd')"><span>3、已回访</span><strong>{{ warnings.hf_yhfgd }} 件</strong></button>
            <button @click="totalNumber('hf_yhfcs')"><span>4、已回访次数</span><strong>{{ warnings.hf_yhfcs }} 件</strong></button>
          </div>
        </section>
        <section class="panel" style="margin-top:14px"><header class="panel-header"><div class="panel-title"><el-icon><Bell /></el-icon><strong>通知公告</strong></div><a class="panel-more" @click="noticesMore">更多 &gt;</a></header>
          <ul v-if="notices.length>0" class="notice-list"><li v-for="(n,idx) in notices" :key="idx" @click="noticeDetailClick(n)"><span>{{ idx+1 }}、{{ n.title }}</span><span v-if="n.state===0" class="k-badge">新</span><span class="n-date">{{ formatTime(n.addTime) }}</span></li></ul>
          <el-empty v-else description="暂无数据" :image-size="48" /></section>
      </div>

      <div class="main-center">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>审核结果（本账号当日结果）</strong></div></header>
          <div id="bjsh_gdqxzb" style="height:200px;width:100%"></div>
          <h4 class="chart-subtitle">最近7日审核按时率（本账号）</h4>
          <div id="bjsh_fpzqlzs" style="height:280px"></div>
        </section>
      </div>

      <div class="main-right">
        <section class="panel"><header class="panel-header"><div class="panel-title"><el-icon><DataLine /></el-icon><strong>最近7日办理情况</strong></div></header>
          <div class="gauge-grid">
            <div id="bjsh_asfpl" style="height:280px"></div>
            <div id="bjsh_fpzql" style="height:280px"></div>
          </div>
        </section>
      </div>
    </div>

    <el-dialog v-model="noticeDetailWin" title="查看公告" width="80%" append-to-body @close="noticeDetail={}"><div><h3>{{ noticeDetail.title }}</h3><div class="nd-meta"><span>发布人：{{ noticeDetail.createUserName||'-' }}</span><span>发布时间：{{ formatTime(noticeDetail.addTime) }}</span></div><div v-html="noticeDetail.htmlContent||noticeDetail.content||'暂无内容'"></div></div></el-dialog>
  </section>
</template>

<style scoped lang="scss">
.bjsh-index { min-height: calc(100dvh - 300px); padding: 18px; }
.top-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
.progress-panel { padding: 24px; border: 1px solid #e6ecf0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(49,103,221,0.12); .jrhf-title { margin: 0 0 12px; color: #1c4886; font-weight: 600; } }
.metric-card { display: flex; flex-direction: column; gap: 8px; min-height: 116px; padding: 20px 16px; border-radius: 10px; color: #fff; cursor: pointer; box-shadow: 0 3px 6px rgba(9,41,65,0.16); transition: transform 0.15s; &:hover { transform: translateY(-2px); } small { font-size: 13px; opacity: 0.85; } span { font-size: 15px; } strong { font-size: 36px; font-weight: 400; padding-left: 8px; } }
.card-blue { background: linear-gradient(20deg, #208aed, #3aa0ff); }
.main-layout { display: grid; grid-template-columns: 260px 1fr 260px; gap: 18px; }
.panel { border: 1px solid #e6ecf0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(49,103,221,0.12); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f4f8; .panel-title { display: flex; align-items: center; gap: 8px; color: #1c4886; font-size: 15px; } .panel-more { color: #999; font-size: 13px; cursor: pointer; &:hover { color: #3167dd; } } }
.chart-subtitle { text-align: center; color: #1c4886; font-size: 14px; margin: 8px 0; }
.warning-list { display: grid; gap: 8px; padding: 14px; button { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e6ecf0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; &:hover { border-color: #3167dd; } strong { color: #3167dd; font-size: 14px; } } }
.gauge-grid { display: grid; gap: 8px; padding: 8px; }
.notice-list { list-style: none; margin: 0; padding: 12px 16px; li { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 4px 8px; padding: 10px 0; border-bottom: 1px dashed #dedede; cursor: pointer; &:hover { color: #3167dd; } &:last-child { border-bottom: none; } span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: #333; } } .k-badge { background: #df0024; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; justify-self: start; } .n-date { grid-column: 1/-1; font-size: 12px; color: #999; } }
.nd-meta { display: flex; gap: 16px; margin: 12px 0 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f4f8; font-size: 13px; color: #666; }
.jdt-style :deep(.el-progress-bar__inner) { background: linear-gradient(90deg, #13bd85, #a5c340); }
@media (max-width: 1280px) { .main-layout, .top-row { grid-template-columns: 1fr; } }
</style>
