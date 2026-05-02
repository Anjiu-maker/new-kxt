<script setup>
import { inject, onActivated, reactive, ref } from 'vue'
import Container from '@/components/Container.vue'
import OrderQuery from '@/components/OrderQuery.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'
import { getOrderList } from '@/services/orderService'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)
const loading = ref(false)
const tableData = ref([])
const tableHeight = ref(300)
const orderInfoRef = ref()
const printRef = ref()
const gdxqwin = ref(false)
const isshowPrint = ref(false)
const printData = ref({})
const printMode = ref('print')
const tableRef = ref()

const params = reactive({ pageNum: 1, pageSize: 10, search: '', processName: '' })
const pageInfo = reactive({ total: 0, pageSize: 10 })

const queryFields = [
  { code: 'createTime', label: '登记时间', type: 0 },
  { code: 'orderNo', label: '编号', type: 1 },
  { code: 'title', label: '标题', type: 1 }
]

const columns = [
  { type: 'index', label: '序号', width: '50' },
  { type: 'selection', width: '50' },
  { prop: 'orderNo', label: '编号', width: '200' },
  { prop: 'title', label: '标题', minWidth: '180', showOverflow: true },
  { prop: 'createTime', label: '登记时间', width: '170', formatter: formatTime },
  { prop: 'handleEndTime', label: '限办时间', width: '170', formatter: formatTime },
  { prop: 'acceptDeptName', label: '办理部门', width: '155', showOverflow: true },
  { prop: 'orderSubStateName', label: '状态', width: '90', showOverflow: true },
  { prop: 'handleTypeName', label: '办理方式', width: '80' },
  { prop: 'orderOriginName', label: '服务渠道', width: '110', showOverflow: true },
  { prop: 'createUser', label: '登记人员', width: '100', showOverflow: true },
  { prop: 'isRepeatOrderName', label: '重复事务', width: '80' }
]

function formatTime(v) { if (!v) return '-'; const d = new Date(v); if (Number.isNaN(d.getTime())) return '-'; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }

async function loadData() {
  loading.value = true
  try {
    const res = await getOrderList('/orderInfo/fzgth_order_list', params)
    if (res.data?.code === 200) {
      tableData.value = res.data.data?.records ?? []
      pageInfo.total = res.data.data?.total ?? 0
    }
  } finally { loading.value = false }
}

function handleSearch(p) {
  Object.assign(params, p, { pageNum: 1 })
  loadData()
}

function handleReset() { Object.keys(params).forEach(k => { if (!['pageNum', 'pageSize'].includes(k)) delete params[k] }); loadData() }

function sizeChange(size) { params.pageSize = size; loadData() }
function currentChange(page) { params.pageNum = page; loadData() }

function ckDispose(row) { gdxqwin.value = true; setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(row.orderId), 100) }

function forwordAddOrder(row) {
  const isQuick = row.channelHandleType === 0
  const route = isQuick ? '/order/quickAddOrder' : '/order/editOrder'
  workbenchNav?.openCustomTab('fzgth_cl_' + row.orderId, '退回事务处理(' + row.orderNo + ')', route, '退回事务处理', { orderId: row.orderId, taskId: row.taskId })
}

async function printD(row, mode) {
  const isHaveLookBaomi = authStore.hasPermission('lookOrderInfo', 1)
  try {
    const res = await getOrderList('/orderInfo/find', { orderNo: row.orderNo, isHaveLookBaomi })
    if (res.data?.code === 200) { printData.value = res.data.data; printMode.value = mode; isshowPrint.value = true }
  } catch { ElMessage.error('获取失败') }
}

function getTableHeight(h) { tableHeight.value = h - 154 }

onActivated(() => loadData())
</script>

<template>
  <Container type="box" @resize="getTableHeight">
    <div class="list">
      <div class="search"><OrderQuery :fields="queryFields" @search="handleSearch" @reset="handleReset" /></div>
      <div class="list-wrap">
        <el-table ref="tableRef" border v-loading="loading" :max-height="tableHeight" :data="tableData">
          <el-table-column v-for="(col, ci) in columns" :key="ci" v-bind="col" :show-overflow-tooltip="col.showOverflow">
            <template v-if="col.formatter" #default="{ row }">{{ col.formatter(row[col.prop]) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="printD(row, 'print')">打印</el-link>
              <el-link type="primary" :underline="false" style="margin-left:5px" @click="printD(row, 'zprint')">交办打印</el-link>
              <el-link type="primary" :underline="false" style="margin-left:5px" @click="ckDispose(row)">查看</el-link>
              <el-link type="primary" :underline="false" style="margin-left:5px" @click="forwordAddOrder(row)">处理</el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination background @size-change="sizeChange" @current-change="currentChange" :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="pageInfo.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" style="float:right;padding-top:10px" />
    </div>
    <Orderinfo ref="orderInfoRef" />
    <PrintExport :visible="isshowPrint" :print-data="printData" :mode="printMode" @update:visible="isshowPrint = $event" />
  </Container>
</template>

<style scoped>
.search { border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.list-wrap { margin-top: 20px; }
</style>
