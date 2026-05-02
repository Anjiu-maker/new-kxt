<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import Container from '@/components/Container.vue'
import OrderQuery from '@/components/OrderQuery.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'
import { getOrderList, getOrderDetail } from '@/services/orderService'
import flowApiMapping from '@/utils/flowApiMapping'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// ── 已迁移的表单组件 ──
import SqdbForm from '@/views/workbench/SqdbForm.vue'
import EcdbForm from '@/views/workbench/EcdbForm.vue'
import DgdForm from '@/views/workbench/DgdForm.vue'
import DfpForm from '@/views/order/form/DfpForm.vue'
import DfkForm from '@/views/order/form/DfkForm.vue'
import DjsForm from '@/views/order/form/DjsForm.vue'
import DhfAndYyhfForm from '@/views/order/form/DhfAndYyhfForm.vue'
import ShswForm from '@/views/order/form/ShswForm.vue'

const props = defineProps({
  pageName: { type: String, default: '' },
  query: { type: Object, default: () => ({}) },
  md: { type: String, default: '' },
  rawPath: { type: String, default: '' }
})

const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)

const method = ref('')
const loading = ref(false)
const tableData = ref([])
const tableHeight = ref(300)
const orderInfoRef = ref()
const gdxqwin = ref(false)
const isshowPrint = ref(false)
const printData = ref({})
const printMode = ref('print')
const currentRow = ref({})
const selectRows = ref([])

// Form dialog states
const sqdbVisible = ref(false)
const ecdbVisible = ref(false)
const dgdVisible = ref(false)
const dfpVisible = ref(false)
const dfkVisible = ref(false)
const djsVisible = ref(false)
const dhfVisible = ref(false)
const shswVisible = ref(false)

const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ total: 0 })

const queryFields = [
  { code: 'createTime', label: '登记时间', type: 0 },
  { code: 'orderNo', label: '编号', type: 1 },
  { code: 'title', label: '标题', type: 1 }
]

// ── 根据 method 动态加载配置 ──
const methodConfig = computed(() => {
  const map = {
    dfp: { title: '待分派', form: 'dfp', handler: 'dfp' },
    djs: { title: '待接收', form: 'djs', handler: 'djs' },
    dfk: { title: '待反馈', form: 'dfk', handler: 'dfk' },
    shsw: { title: '审核事务', form: 'shsw', handler: 'shsw' },
    shswYn: { title: '审核疑难', form: 'shsw', handler: 'shswYn' },
    cbsw: { title: '重办事务', form: null, handler: 'cbsw' },
    xjyq: { title: '下级延期', form: null, handler: 'xjyq' },
    dhf: { title: '待回访', form: 'dhf', handler: 'dhf' },
    yyhf: { title: '预约回访', form: 'dhf', handler: 'yyhf' },
    dgd: { title: '待归档', form: 'dgd', handler: 'dgd' },
    dgdYn: { title: '待归档疑难', form: 'dgd', handler: 'dgdYn' },
    hsz: { title: '回收站', form: null, handler: 'hsz' },
    myOrder: { title: '我的历史工单', form: null, handler: 'myOrder' }
  }
  return map[method.value] || { title: method.value, form: null, handler: method.value }
})

const columns = computed(() => [
  { type: 'index', label: '序号', width: '50' },
  { type: 'selection', width: '50' },
  { prop: 'orderNo', label: '编号', width: '200' },
  { prop: 'title', label: '标题', minWidth: '180', showOverflow: true },
  { prop: 'createTime', label: '登记时间', width: '170', formatter: fmt },
  { prop: 'handleEndTime', label: '限办时间', width: '170', formatter: fmt },
  { prop: 'acceptDeptName', label: '办理部门', width: '155', showOverflow: true },
  { prop: 'orderSubStateName', label: '状态', width: '90' },
  { prop: 'handleTypeName', label: '办理方式', width: '80' },
  { prop: 'orderOriginName', label: '服务渠道', width: '110', showOverflow: true },
  { prop: 'createUser', label: '登记人员', width: '100', showOverflow: true }
])

function fmt(v) { if (!v) return '-'; const d = new Date(v); if (Number.isNaN(d.getTime())) return '-'; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }

function getApi() {
  const entry = flowApiMapping.listApi[method.value]
  return entry?.api || `/orderInfo/${method.value}_order_list`
}

async function loadData() {
  loading.value = true
  try {
    const res = await getOrderList(getApi(), params)
    if (res.data?.code === 200) {
      tableData.value = res.data.data?.records ?? []
      pageInfo.total = res.data.data?.total ?? 0
    }
  } finally { loading.value = false }
}

function handleSearch(p) { Object.assign(params, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(params).forEach(k => { if (!['pageNum', 'pageSize'].includes(k)) delete params[k] }); loadData() }
function sizeChange(size) { params.pageSize = size; loadData() }
function currentChange(page) { params.pageNum = page; loadData() }
function handleSelectionChange(rows) { selectRows.value = rows }

function ckDispose(row) { gdxqwin.value = true; setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(row.orderId), 100) }

function forwordAddOrder(row) {
  const isQuick = row.channelHandleType === 0
  workbenchNav?.openCustomTab('flow_cl_' + row.orderId, '事务处理(' + row.orderNo + ')', isQuick ? '/order/quickAddOrder' : '/order/editOrder', '事务处理', { orderId: row.orderId, taskId: row.taskId })
}

async function printD(row, mode) {
  try {
    const res = await getOrderDetail(row.orderNo, authStore.hasPermission('lookOrderInfo', 1))
    if (res.data?.code === 200) { printData.value = res.data.data; printMode.value = mode; isshowPrint.value = true }
  } catch { ElMessage.error('获取失败') }
}

// ── 表单操作 ──
function openForm(row, formType) {
  currentRow.value = row
  const formMap = {
    dfp: dfpVisible, dfk: dfkVisible, djs: djsVisible,
    dhf: dhfVisible, shsw: shswVisible,
    sqdb: sqdbVisible, ecdb: ecdbVisible, dgd: dgdVisible
  }
  const target = formMap[formType]
  if (target) { target.value = true; return }
  forwordAddOrder(row)
}

function onFormSuccess() { loadData() }

function getTableHeight(h) { tableHeight.value = h - 154 }

onMounted(() => {
  // md 来源优先级：props.md > props.query.md > rawPath 解析 > 默认
  const fromPath = props.rawPath?.startsWith('flow/order/') ? props.rawPath.replace('flow/order/', '') : ''
  method.value = props.md || props.query?.md || fromPath || 'dfp'
  loadData()
})
</script>

<template>
  <Container type="box" @resize="getTableHeight">
    <div class="list">
      <div class="search">
        <OrderQuery :fields="queryFields" :method="method" @search="handleSearch" @reset="handleReset" />
      </div>
      <div class="list-wrap">
        <el-table ref="tableRef" border v-loading="loading" :max-height="tableHeight" :data="tableData" @selection-change="handleSelectionChange">
          <el-table-column v-for="(col, ci) in columns" :key="ci" v-bind="col" :show-overflow-tooltip="col.showOverflow">
            <template v-if="col.formatter" #default="{ row }">{{ col.formatter(row[col.prop]) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="printD(row, 'print')">打印</el-link>
              <el-link type="primary" :underline="false" style="margin-left:5px" @click="printD(row, 'zprint')">交办打印</el-link>
              <el-link type="primary" :underline="false" style="margin-left:5px" @click="ckDispose(row)">查看</el-link>
              <el-link type="primary" :underline="false" style="margin-left:5px" @click="openForm(row, methodConfig.form || 'default')">处理</el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination background @size-change="sizeChange" @current-change="currentChange" :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="params.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" style="float:right;padding-top:10px" />
    </div>

    <Orderinfo ref="orderInfoRef" />
    <PrintExport :visible="isshowPrint" :print-data="printData" :mode="printMode" @update:visible="isshowPrint = $event" />

    <!-- 表单弹窗 -->
    <SqdbForm :visible="sqdbVisible" :row="currentRow" @update:visible="sqdbVisible = $event" @success="onFormSuccess" />
    <EcdbForm :visible="ecdbVisible" :row="currentRow" @update:visible="ecdbVisible = $event" @success="onFormSuccess" />
    <DgdForm :visible="dgdVisible" :row="currentRow" @update:visible="dgdVisible = $event" @success="onFormSuccess" />
    <DfpForm :visible="dfpVisible" :row="currentRow" @update:visible="dfpVisible = $event" @success="onFormSuccess" />
    <DfkForm :visible="dfkVisible" :row="currentRow" @update:visible="dfkVisible = $event" @success="onFormSuccess" />
    <DjsForm :visible="djsVisible" :row="currentRow" @update:visible="djsVisible = $event" @success="onFormSuccess" />
    <DhfAndYyhfForm :visible="dhfVisible" :row="currentRow" @update:visible="dhfVisible = $event" @success="onFormSuccess" />
    <ShswForm :visible="shswVisible" :row="currentRow" @update:visible="shswVisible = $event" @success="onFormSuccess" />
  </Container>
</template>

<style scoped>
.search { border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.list-wrap { margin-top: 20px; }
</style>
