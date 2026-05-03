<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { useGlobal } from '@/composables/useGlobal'
import { useAuthStore } from '@/stores/auth'
import Container from '@/components/Container.vue'
import OrderQuery from '@/components/OrderQuery.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'

const authStore = useAuthStore()
const { hasPermission, authCode, isSpecialFocus } = useGlobal()
const roleCode = authStore.role?.roleCode || ''

const loading = ref(false)
const btnloading = ref(false)
const isShowLy = ref(false)
const isshowPrint = ref(false)
const gdxqwin = ref(false)
const tableHeight = ref(300)
const dataList = ref([])
const selectRows = ref([])
const row = ref({})
const printData = ref({})
const orderInfo = ref(null)
const printExport = ref(null)
const myOrderTable = ref(null)

let api = '/orderInfo/myOrder'

const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ pageSize: 10, total: 0 })

function init() {
  if (authCode.roleCodes.ddzx === roleCode) {
    api = '/orderInfo/myOrderOfFunctionalBureau'
  }
  refresh()
}

function getParams(p) {
  Object.assign(params, p)
  refresh()
}

function refresh(ifSearch) {
  dataList.value = []
  loading.value = true
  if (ifSearch) params.pageNum = 1
  http.get(api, { params }).then(res => {
    if (res.data?.code == 200) {
      dataList.value = res.data.data.records
      pageInfo.pageSize = res.data.data.size
      pageInfo.total = res.data.data.total
    }
    loading.value = false
  })
}

function isHaveByHandleType(row, handleType) {
  return row.stepsCount && row.stepsCount[handleType] != null
}

function fomatterTime(time, key) {
  if (time.stepsCount?.[key]) return time.stepsCount[key].split(',')[0]
  return ''
}

function stepsSize(row) {
  if (row.stepsCount?.['归档'] != null) return 5
  if (row.stepsCount?.['回访'] != null) return 4
  if (row.stepsCount?.['反馈'] != null) return 3
  if (row.stepsCount?.['处理'] != null) return 2
  if (row.stepsCount?.['分派'] != null) return 1
  return row.stepsSize || 0
}

function collectClick(row) {
  ElMessageBox.prompt('请输入添加特别关注的原因', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputValidator: (v) => v?.trim() ? true : '原因必填!',
    inputErrorMessage: '原因必填!'
  }).then(({ value }) => {
    http.get('/orderInfo/special_focus', { params: { isFocus: true, orderId: row.orderId, remarks: value } }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        isSpecialFocus(row.orderId)
      } else {
        ElMessage.error('已添加到特别关注，请勿重复操作')
      }
    })
  }).catch(() => ElMessage.info('取消输入'))
}

function timeFormatter(row, column, cellValue) {
  if (!cellValue) return ''
  const d = new Date(cellValue)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

function findById(row) {
  gdxqwin.value = true
  nextTick(() => orderInfo.value?.reloadDataByOrderId(row.orderId))
}

function showLy(r) {
  isShowLy.value = true
  row.value = r
}

function printD(r, print) {
  isshowPrint.value = true
  const isHaveLookBaomi = hasPermission(authCode.optCode.lookOrderInfo, 1)
  http.get('/orderInfo/find', { params: { orderNo: r.orderNo, isHaveLookBaomi } }).then(res => {
    if (res.data?.code == 200) {
      printData.value = res.data.data
      nextTick(() => printExport.value?.setPrintDataPrint(printData.value, isshowPrint.value, print))
    }
  })
}

function selectTable(selection) { selectRows.value = selection }

function removeOrder() {
  if (!selectRows.value.length) {
    ElMessage.info('请至少选择一条数据！')
    return
  }
  const ids = selectRows.value.map(v => v.orderId).join(',')
  ElMessageBox.confirm('您确认删除吗？删除后可在回收站查看。', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    http.get('/orderInfo/delete', { params: { isDel: 0, ids } }).then(res => {
      if (res.data?.code == 200) {
        ElMessage.success(res.data.message)
        refresh()
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消删除'))
}

function sizeChange(size) { params.pageSize = size; refresh() }
function currentChange(page) { params.pageNum = page; refresh() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

onMounted(init)
</script>

<template>
  <Container type="box" class="myOrder" @resize="getTableHeight">
    <div class="list">
      <div class="search">
        <div class="pull-left">
          <OrderQuery @getParams="getParams" />
          <div class="delete" v-if="hasPermission(authCode.optCode.deleteOrder, 1)">
            <el-button type="danger" @click="removeOrder" >删除</el-button>
          </div>
        </div>
      </div>
      <div class="list-wrap">
        <el-table ref="myOrderTable" border stripe v-loading="loading" :max-height="tableHeight" :data="dataList" @select="selectTable" @select-all="selectTable">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="orderNo" label="事务编号" width="120" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="title" label="标题" align="center" width="120" :show-overflow-tooltip="true" />
          <el-table-column label="实时状态" header-align="center" prop="orderId">
            <template #default="{ row: r }">
              <el-steps :active="stepsSize(r)" process-status="finish">
                <template v-if="fomatterTime(r, '退回')">
                  <el-step title="退回" status="finish" :description="fomatterTime(r, '退回')" />
                </template>
                <template v-else>
                  <el-step title="暂存" v-if="!fomatterTime(r, '登记')" status="finish" :description="fomatterTime(r, '暂存')" />
                  <el-step title="新事务" v-else :description="fomatterTime(r, '登记')" />
                </template>
                <el-step title="职能局退回" :description="fomatterTime(r, '职能局退回')" v-if="isHaveByHandleType(r, '职能局退回')" />
                <el-step title="待接收" :description="fomatterTime(r, '分派')" v-else />
                <el-step title="逾期" :description="fomatterTime(r, '逾期')" status="error" v-if="isHaveByHandleType(r, '逾期')" />
                <el-step title="待处理" :description="fomatterTime(r, '处理')" v-else />
                <el-step title="待回访" :description="fomatterTime(r, '反馈')" />
                <el-step title="待归档" :description="fomatterTime(r, '回访')" />
                <el-step title="已归档" :description="isHaveByHandleType(r, '归档') ? fomatterTime(r, '归档') : '-----事务还未归档-----'" />
              </el-steps>
            </template>
          </el-table-column>
          <el-table-column prop="createUser" label="登记人员" width="80" align="center" />
          <el-table-column prop="handleTypeName" label="办理方式" width="80" align="center" />
          <el-table-column prop="createTime" label="登记时间" width="160" align="center" :formatter="timeFormatter" />
          <el-table-column label="操作" header-align="center" width="140" align="center">
            <template #default="{ row: r }">
              <el-link type="danger" :underline="false" @click="collectClick(r)" style="margin:0 5px">特别关注</el-link>
              <el-link type="info" :underline="false" @click="showLy(r)">录音</el-link>
              <el-link :underline="false" @click="printD(r, 'print')" style="margin:0 5px">打印</el-link>
              <el-link type="primary" :underline="false" @click="findById(r)">查看</el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="pageInfo.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </div>

    <!-- Audio Dialog -->
    <el-dialog v-model="isShowLy" title="查看录音" :close-on-click-modal="false" top="30vh" width="30%">
      录音信息：{{ row.haveSound ? row.haveSoundName : '无录音信息' }}
      <template #footer>
        <el-button @click="isShowLy = false">取消</el-button>
        <el-button type="primary" @click="isShowLy = false">确定</el-button>
      </template>
    </el-dialog>

    <Orderinfo ref="orderInfo" v-model:isShow="gdxqwin" :isNameAndTelSecrecy="false" :isShowHandle="false" />
    <PrintExport ref="printExport" v-model:isshowPrint="isshowPrint" />
  </Container>
</template>

<style scoped>
.myOrder .search { height: auto; position: relative; border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.myOrder .search .pull-left { float: none !important; }
.myOrder .list { height: 100%; overflow-y: auto; }
.myOrder .list .list-wrap { margin-top: 20px; }
.myOrder .list .el-pagination { float: right; padding: 10px 0 0; }
.myOrder .delete { text-align: right; display: inline-block; width: 20%; vertical-align: top; }
</style>
