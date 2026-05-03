<script setup>
import { ref, reactive, onMounted } from 'vue'
import { http } from '@/services/http'
import Container from '@/components/Container.vue'
import SelectDeptOrUser from '@/components/SelectDeptOrUser.vue'

const loading = ref(false)
const tableHeight = ref(300)
const defTable = ref(null)
const roleOptions = ref([])
const dataList = ref([])
const dataFiled = ref([])

const params = reactive({
  pageNum: 1, pageSize: 10, type: 0,
  deptId: '', roleId: '', account: '', userName: '', mobileTel: '', tel: '',
  nodeType: '', publicPhoneName: '', publicPhone: ''
})

const pageInfo = reactive({ pageSize: 10, total: 0 })

const dataUserFiled = [
  { type: 'index', label: '序号', show: true, width: '50px' },
  { type: 'selection', show: false, width: '50px' },
  { label: '部门名称', model: 'deptName', show: true, width: 200, disabled: true, sortable: false },
  { label: '账号', model: 'account', show: true, width: '220px', disabled: true, sortable: false },
  { label: '姓名', model: 'userName', show: true, disabled: true, sortable: false },
  { label: '角色名称', model: 'roleName', show: true, disabled: true, sortable: false },
  { label: '手机号码', model: 'mobileTel', show: true, width: '220px', disabled: true, sortable: false },
  { label: '固定电话', model: 'tel', show: true, width: '220px', disabled: true, sortable: false }
]

const dataDeptFiled = [
  { type: 'index', label: '序号', show: true, width: '50px' },
  { type: 'selection', show: false, width: '50px' },
  { label: '电话名称', model: 'publicPhoneName', show: true, width: '220px', disabled: true, sortable: false },
  { label: '电话号码', model: 'publicPhone', show: true, disabled: true, sortable: false },
  { label: '部门名称', model: 'deptName', show: true, width: 150, disabled: true, sortable: false },
  { label: '部门类型', model: 'nodeType', show: true, width: 150, disabled: true, sortable: false },
  { label: '电话备注', model: 'remarks', show: true, disabled: true, sortable: false },
  { label: '创建时间', model: 'createTime', show: true, disabled: true, sortable: false }
]

function refresh(ifSearch) {
  if (ifSearch) params.pageNum = 1
  loading.value = true
  if (params.type) {
    dataFiled.value = dataUserFiled
    http.get('/user/listAllUserTell', { params }).then(res => {
      if (res.data?.code == 200) {
        dataList.value = res.data.data.records
        pageInfo.pageSize = res.data.data.size
        pageInfo.total = res.data.data.total
      }
      loading.value = false
    })
  } else {
    dataFiled.value = dataDeptFiled
    http.get('/deptTel/listAllTell', { params }).then(res => {
      if (res.data?.code == 200) {
        dataList.value = res.data.data.records
        pageInfo.pageSize = res.data.data.size
        pageInfo.total = res.data.data.total
      }
      loading.value = false
    })
  }
}

function getRoleOptions() {
  http.get('/role/list', { params: { flag: false } }).then(res => {
    if (res.data?.code == 200) roleOptions.value = res.data.data
  })
}

function typeChange() { refresh(true) }

function sizeChange(size) { params.pageSize = size; refresh() }
function currentChange(page) { params.pageNum = page; refresh() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function formatNodeType(val) { return val ? '问题属地' : '业务单位' }

onMounted(() => {
  dataFiled.value = dataDeptFiled
  refresh()
  getRoleOptions()
})
</script>

<template>
  <Container type="box" class="address-book" @resize="getTableHeight">
    <div class="list">
      <div class="search">
        <div class="pull-left">
          <div v-if="params.type" class="inline-block">
            <SelectDeptOrUser v-model="params.deptId" :clearable="true" :isFilter="true" :showTabs="['dept']" style="width:180px;display:inline-block;margin-right:10px" placeholder="请选择部门" />
            <el-select v-model="params.roleId" clearable size="small" placeholder="请选择角色" style="width:180px;margin-right:10px">
              <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" />
            </el-select>
            <el-input v-model="params.account" clearable placeholder="请输入账号查询" size="small" style="width:180px;margin-right:10px" />
            <el-input v-model="params.userName" clearable placeholder="请输入姓名查询" size="small" style="width:180px;margin-right:10px" />
            <el-input v-model="params.mobileTel" clearable placeholder="请输入手机号码查询" size="small" style="width:180px;margin-right:10px" />
            <el-input v-model="params.tel" clearable placeholder="请输入固定电话查询" size="small" style="width:180px;margin-right:10px" />
          </div>
          <div v-else class="inline-block">
            <SelectDeptOrUser v-model="params.deptId" :clearable="true" :isFilter="true" :showTabs="['dept']" style="width:180px;display:inline-block;margin-right:10px" placeholder="请选择部门查询" />
            <el-select v-model="params.nodeType" @change="refresh(true)" clearable size="small" placeholder="请选择部门类型查询" style="width:180px;margin-right:10px">
              <el-option :value="1" label="问题属地" />
              <el-option :value="0" label="业务单位" />
            </el-select>
            <el-input v-model="params.publicPhoneName" clearable placeholder="请输入电话名称查询" size="small" style="width:180px;margin-right:10px" />
            <el-input v-model="params.publicPhone" clearable placeholder="请输入电话号码查询" size="small" style="width:180px;margin-right:10px" />
          </div>
          <el-radio-group v-model="params.type" size="small" @change="typeChange">
            <el-radio :value="1" border>人员</el-radio>
            <el-radio :value="0" border>部门</el-radio>
          </el-radio-group>
          <el-button type="primary" @click="refresh(true)" size="small">查询</el-button>
        </div>
        <div class="pull-right">
          <el-button @click="refresh()" size="small">刷新</el-button>
        </div>
      </div>
      <div class="list-wrap">
        <el-table ref="defTable" border stripe v-loading="loading" :max-height="tableHeight" :data="dataList">
          <template v-for="col in dataFiled" :key="col.model || col.type">
            <el-table-column v-if="col.show" align="center" header-align="center"
              :type="col.type" :fixed="col.fixed || false" :prop="col.model"
              :label="col.label" :width="col.width" :sortable="col.sortable || false"
              :formatter="col.model === 'createTime' ? (r, c, v) => formatDate(v) : col.model === 'nodeType' ? (r, c, v) => formatNodeType(v) : null" />
          </template>
        </el-table>
      </div>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]"
        :page-size="pageInfo.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </div>
  </Container>
</template>

<style scoped>
.address-book .search { height: auto; min-height: 64px; border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.address-book .list { height: 100%; overflow-y: auto; }
.address-book .list .list-wrap { margin-top: 20px; }
.address-book .list .el-pagination { float: right; padding: 10px 0 0; }
.address-book .list .el-button--small { padding: 7px 12px; }
.address-book .list .el-button + .el-button { margin-left: 6px; }
.address-book .el-select { width: 100%; }
.address-book .inline-block { display: inline; }
.address-book .el-radio { margin-right: 0; }
.address-book .el-radio:last-child { margin-right: 10px; }
</style>
