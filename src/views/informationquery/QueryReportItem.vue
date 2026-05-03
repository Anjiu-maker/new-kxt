<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Container from '@/components/Container.vue'

const loading = ref(false)
const labelLoading = ref(false)
const addQueryItemWin = ref(false)
const editQueryItemWin = ref(false)
const tableHeight = ref(300)
const currentRows = ref([])
const dataList = ref([])
const addQueryItemForm = ref(null)
const editQueryItemForm = ref(null)
const addQueryItemFirstInput = ref(null)

const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ pageSize: 10, total: 0 })

const model = reactive({
  id: '', name: '', fieldName: '', type: '', remark: ''
})

const queryItemRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ],
  fieldName: [
    { required: true, message: '请输入字段名称', trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ]
}

const emptyModel = JSON.parse(JSON.stringify(model))

const dataFiled = [
  { type: 'index', label: '序号', show: true, width: '50px' },
  { type: 'selection', show: true, width: '50px' },
  { label: '名称', model: 'name', width: 300, show: true, sortable: false },
  { label: '字段编码', model: 'fieldName', 'show-overflow-tooltip': true, show: true, width: 300, sortable: false },
  { label: '备注', model: 'remark', show: true, 'show-overflow-tooltip': true, sortable: false }
]

function resetCurrentPage() {
  const totalPage = Math.ceil((pageInfo.total - 1) / pageInfo.pageSize)
  params.pageNum = params.pageNum > totalPage ? (totalPage || 1) : params.pageNum
}

function refresh(ifSearch) {
  loading.value = true
  if (ifSearch) params.pageNum = 1
  // Using reportItem API — same path as old project
  http.get('/reportItem/list', { params: { ...params, isPage: 'true' } }).then(res => {
    if (res.data?.code == 200) {
      const d = res.data.data
      dataList.value = d.records || []
      pageInfo.pageSize = d.size || params.pageSize
      pageInfo.total = d.total || 0
    }
    loading.value = false
  })
}

function openAddQueryItem() {
  addQueryItemWin.value = true
  nextTick(() => addQueryItemFirstInput.value?.focus())
}

function saveLabel() {
  addQueryItemForm.value?.validate((valid) => {
    if (valid) {
      labelLoading.value = true
      http.post('/reportItem/save', { ...model }).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.error(res.data.message)
        }
        labelLoading.value = false
      })
    }
  })
}

function openEditQueryItem(row) {
  editQueryItemWin.value = true
  Object.keys(emptyModel).forEach(k => { if (row[k] != null) model[k] = row[k] })
}

function updateTemplate() {
  editQueryItemForm.value?.validate((valid) => {
    if (valid) {
      labelLoading.value = true
      http.post('/reportItem/update', { ...model }).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.error(res.data.message)
        }
        labelLoading.value = false
      })
    }
  })
}

function deleteQueryItem(row) {
  if (row.id) currentRows.value.push(row)
  if (currentRows.value.length === 0) { ElMessage.warning('请至少选择一条数据!'); return }
  ElMessageBox.confirm('您确认删除该字段吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const ids = currentRows.value.map(e => e.id)
    http.post('/reportItem/delete', { ids }).then(res => {
      if (res.data?.code == 200) {
        resetCurrentPage()
        refresh()
        empty()
        ElMessage.success('删除成功!')
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消'))
}

function selectTable(selection) { currentRows.value = selection }

function beforeClose(done) { done(); empty() }

function empty() {
  addQueryItemWin.value = false
  editQueryItemWin.value = false
  currentRows.value = []
  Object.assign(model, JSON.parse(JSON.stringify(emptyModel)))
  addQueryItemForm.value?.clearValidate()
  editQueryItemForm.value?.clearValidate()
}

function sizeChange(size) { params.pageSize = size; refresh() }
function currentChange(page) { params.pageNum = page; refresh() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

onMounted(() => refresh())
</script>

<template>
  <Container class="query-report-item" @resize="getTableHeight" :showLeftPadding="false">
    <div class="list">
      <div class="search">
        <div class="pull-left">
          <el-input v-model="params.name" clearable placeholder="输入名称查询" size="small" class="list-simple-search-input" />
          <el-button type="primary" @click="refresh(true)" size="small">查询</el-button>
        </div>
        <div class="pull-right">
          <el-button @click="refresh()" size="small">刷新</el-button>
          <el-button type="primary" @click="openAddQueryItem" size="small">添加</el-button>
          <el-button type="danger" @click="deleteQueryItem({})" size="small">批量删除</el-button>
        </div>
      </div>
      <div class="list-wrap">
        <el-table border stripe :max-height="tableHeight" v-loading="loading" :data="dataList" @select="selectTable" @select-all="selectTable">
          <template v-for="col in dataFiled" :key="col.model || col.type">
            <el-table-column v-if="col.show" align="center" header-align="center"
              :type="col.type" :fixed="col.fixed || false" :prop="col.model"
              :label="col.label" :width="col.width" :sortable="col.sortable || false"
              :show-overflow-tooltip="col['show-overflow-tooltip'] || false" />
          </template>
          <el-table-column label="操作" header-align="center" width="110" align="center">
            <template #default="{ row }">
              <el-button @click="openEditQueryItem(row)" size="small">编辑</el-button>
              <el-button @click="deleteQueryItem(row)" type="danger" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="pageInfo.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </div>

    <!-- Add Dialog -->
    <el-dialog title="添加字段" v-model="addQueryItemWin" width="40%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="7vh">
      <el-form ref="addQueryItemForm" :rules="queryItemRules" size="medium" :model="model" label-width="120px" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="名称" prop="name">
              <el-input ref="addQueryItemFirstInput" v-model.trim="model.name" placeholder="请输入字段名称" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="字段编码" prop="fieldName">
              <el-input v-model.trim="model.fieldName" placeholder="请输入字段编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="备注" prop="remark">
              <el-input v-model.trim="model.remark" type="textarea" :autosize="{ minRows: 4, maxRows: 16 }" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveLabel" :loading="labelLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog title="编辑字段" v-model="editQueryItemWin" width="40%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="7vh">
      <el-form ref="editQueryItemForm" :rules="queryItemRules" :model="model" label-width="120px" size="small" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="名称" prop="name">
              <el-input v-model.trim="model.name" placeholder="请输入字段名称" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="字段编码" prop="fieldName">
              <el-input v-model.trim="model.fieldName" disabled placeholder="请输入字段编码" title="编码无法修改" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="备注" prop="remark">
              <el-input v-model.trim="model.remark" type="textarea" :autosize="{ minRows: 4, maxRows: 16 }" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="updateTemplate" :loading="labelLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<style scoped>
.query-report-item .list { padding-left: 15px; height: 100%; overflow-y: auto; }
.query-report-item .search { height: 64px; border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.query-report-item .list-simple-search-input { width: 180px; margin-right: 10px; }
.query-report-item .list .list-wrap { margin-top: 20px; }
.query-report-item .list .el-pagination { float: right; padding: 10px 0 0; }
.query-report-item .list .el-button--small { padding: 7px 12px; }
.query-report-item .list .el-button + .el-button { margin-left: 6px; }
.query-report-item .el-select { width: 100%; }
</style>
