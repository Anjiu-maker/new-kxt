<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '@/services/http'
import { useGlobal } from '@/composables/useGlobal'
import Container from '@/components/Container.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import PrintExport from '@/components/PrintExport.vue'

const { hasPermission, authCode } = useGlobal()

const tableHeight = ref(500)
const isshowPrint = ref(false)
const isShowOrderinfo = ref(false)
const month = ref(new Date())
const handlerShow = ref(false)

const queryInfo = reactive({
  handlerDeptId: '', countyLevelId: '', townsLevelId: '',
  state: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1
})

const pageInfo = reactive({ current: 1, pages: 1, total: 0, size: 10 })
const tableData = ref([])
const selectList1 = ref([])
const selectList2 = ref([])
const selectList3 = ref([])
const orderInfo = ref(null)
const printExport = ref(null)

const btnText = [
  '转办', '及时响应', '未及时响应', '本月应办结', '累计应办结',
  '本月已办结', '累计已办结', '应办结逾期', '满意工单', '不满意工单', '表扬工单'
]

function getUnitData() {
  http.get('/dept/comprehensiveQueryDepartmentTree').then(res => {
    if (res.data?.code == 200) selectList1.value = res.data.data
  })
}

function getData() {
  const params = { ...queryInfo }
  params.month = String(params.month).length == 1 ? '0' + params.month : params.month
  http.get('/orderInfo/getFrozenOrderList', { params }).then(res => {
    if (res.data?.code == 200) {
      ElMessage.success('查询成功')
      tableData.value = res.data.data.records
      Object.assign(pageInfo, {
        current: res.data.data.current, pages: res.data.pages,
        size: res.data.size, total: res.data.data.total
      })
    } else {
      ElMessage.success('暂无数据')
    }
  }).catch(() => {})
}

function monthChange() {
  queryInfo.year = new Date(month.value).getFullYear()
  queryInfo.month = new Date(month.value).getMonth() + 1
}

function change1(e) {
  const arr = selectList1.value.filter(item => item.deptId === e)
  queryInfo.countyLevelId = ''
  queryInfo.townsLevelId = ''
  selectList2.value = arr[0]?.children || []
  selectList3.value = []
}

function change2(e) {
  const arr = selectList2.value.filter(item => item.deptId === e)
  queryInfo.townsLevelId = ''
  selectList3.value = arr[0]?.children || []
}

function handleState(index) {
  queryInfo.state = index
  getData()
}

function handleCurrentChange(e) {
  queryInfo.pageNum = e
  getData()
}

function look(row) {
  isShowOrderinfo.value = true
  nextTick(() => orderInfo.value?.reloadDataByOrderId(row.orderId))
}

function printD(row, printType) {
  isshowPrint.value = true
  const isHaveLookBaomi = hasPermission(authCode.optCode.lookOrderInfo, 1)
  http.get('/orderInfo/find', { params: { isHaveLookBaomi, orderNo: row.orderNo } }).then(res => {
    if (res.data?.code == 200) {
      nextTick(() => printExport.value?.setPrintDataPrint(res.data.data, isshowPrint.value, printType))
    }
  })
}

function formatDate(v) { if (!v) return ''; const d = new Date(v); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

import { nextTick } from 'vue'

onMounted(() => {
  getUnitData()
  getData()
})
</script>

<template>
  <Container type="box" @resize="(h) => tableHeight = h - 30 - 84 - 40">
    <el-card>
      <el-row type="flex" class="querys">
        <el-col :span="5">
          <span style="padding-right:6px">时间选择</span>
          <el-date-picker v-model="month" type="month" placeholder="选择年月" @change="monthChange" style="margin-left:10px" />
        </el-col>
        <el-col :span="5">
          <span style="padding-right:6px">二级承办单位</span>
          <el-select v-model="queryInfo.handlerDeptId" placeholder="请选择" @change="change1">
            <el-option :label="item.deptName" :value="item.deptId" v-for="item in selectList1" :key="item.deptId" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <span style="padding-right:6px">三级承办单位</span>
          <el-select v-model="queryInfo.countyLevelId" placeholder="请选择" @change="change2">
            <el-option :label="item.deptName" :value="item.deptId" v-for="item in selectList2" :key="item.deptId" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <span style="padding-right:6px">关联承办单位</span>
          <el-select v-model="queryInfo.townsLevelId" placeholder="请选择">
            <el-option :label="item.deptName" :value="item.deptId" v-for="item in selectList3" :key="item.deptId" />
          </el-select>
        </el-col>
        <el-col :span="2">
          <el-button type="primary" size="small" @click="getData">查询</el-button>
        </el-col>
      </el-row>
      <div class="btn_grop" style="margin-top:16px">
        <el-button type="primary" v-for="(item, index) in btnText" :key="index" @click="handleState(index + 1)">{{ item }}</el-button>
        <el-button type="primary">导出Excel</el-button>
      </div>
      <div>共有<span style="color:#e03131">{{ pageInfo.total }}</span> 条记录</div>
      <el-table ref="multipleTable" :data="tableData" tooltip-effect="dark" style="width:100%;margin-top:20px" :max-height="tableHeight">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderId" label="事务编号" width="120" />
        <el-table-column label="登记时间" width="120">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="title" label="事务标题" width="200" />
        <el-table-column prop="callerContent" label="事务内容" show-overflow-tooltip width="200" />
        <el-table-column prop="acceptDeptName" label="办理单位" show-overflow-tooltip />
        <el-table-column prop="orderSubStateName" label="实时状态" show-overflow-tooltip />
        <el-table-column prop="handleTypeName" label="办理流程" show-overflow-tooltip />
        <el-table-column prop="orderOrigin2Name" label="事务来源" show-overflow-tooltip />
        <el-table-column label="限办时间" show-overflow-tooltip>
          <template #default="{ row }">{{ formatDate(row.handleEndTime) }}</template>
        </el-table-column>
        <el-table-column label="是否保密" show-overflow-tooltip>
          <template #default="{ row }">
            <el-switch :model-value="row.isNameSecurity" active-color="#13ce66" inactive-color="#ff4949" :active-value="1" :inactive-value="0" disabled />
          </template>
        </el-table-column>
        <el-table-column label="有无附件" show-overflow-tooltip>
          <template #default="{ row }">
            <el-switch :model-value="row.fujianCount" active-color="#13ce66" inactive-color="#ff4949" :active-value="row.fujianCount" :inactive-value="0" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="transferHandlerName" label="转办人员" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="look(row)">查看</el-button>
            <el-button type="primary" link @click="printD(row, 'print')">打印</el-button>
            <el-button type="primary" link @click="printD(row, 'zprint')">转办打印</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination @size-change="() => {}" @current-change="handleCurrentChange"
        :current-page="pageInfo.current" :page-size="pageInfo.size"
        layout="total, prev, pager, next, jumper" :total="pageInfo.total" background style="margin:20px auto;text-align:right" />
    </el-card>
    <Orderinfo ref="orderInfo" v-model:isShow="isShowOrderinfo" :isShowHandle="handlerShow" />
    <PrintExport ref="printExport" v-model:isshowPrint="isshowPrint" />
  </Container>
</template>
