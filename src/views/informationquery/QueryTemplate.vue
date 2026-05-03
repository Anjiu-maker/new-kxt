<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Container from '@/components/Container.vue'

const loading = ref(false)
const tempLoading = ref(false)
const addTemplateWin = ref(false)
const editTemplateWin = ref(false)
const templateJoinItemWin = ref(false)
const tableHeight = ref(300)
const currentRows = ref([])
const currentRow = ref({})
const dataList = ref([])
const allItemList = ref([])
const currentItemList = ref([])
const addTemplateForm = ref(null)
const editTemplateForm = ref(null)
const addTemplateFirstInput = ref(null)
const editTemplateFirstInput = ref(null)

const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ pageSize: 10, total: 0 })

const model = reactive({
  tempId: '', tempName: '', tempCode: '', isDefault: 0, remarks: ''
})

const templateRules = {
  tempName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ],
  tempCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ]
}

const emptyModel = {
  tempId: '', tempName: '', tempCode: '', isDefault: 0, remarks: ''
}

function resetCurrentPage() {
  const totalPage = Math.ceil((pageInfo.total - 1) / pageInfo.pageSize)
  params.pageNum = params.pageNum > totalPage ? (totalPage || 1) : params.pageNum
}

function refresh(ifSearch) {
  currentRows.value = []
  currentRow.value = {}
  loading.value = true
  if (ifSearch) params.pageNum = 1
  http.get('/queryTemplate/list', { params }).then(res => {
    if (res.data?.code == 200) {
      dataList.value = res.data.data.records
      pageInfo.pageSize = res.data.data.size
      pageInfo.total = res.data.data.total
    }
    loading.value = false
  })
}

function openAddTemplate() {
  addTemplateWin.value = true
  nextTick(() => addTemplateFirstInput.value?.focus())
}

function saveTemplate() {
  addTemplateForm.value?.validate((valid) => {
    if (valid) {
      tempLoading.value = true
      http.post('/queryTemplate/save', { ...model }).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.warning(res.data.message)
        }
        tempLoading.value = false
      })
    }
  })
}

function openEditTemplateWin(row) {
  editTemplateWin.value = true
  Object.keys(emptyModel).forEach(k => { if (row[k] != null) model[k] = row[k] })
  nextTick(() => editTemplateFirstInput.value?.focus())
}

function editTemplate() {
  editTemplateForm.value?.validate((valid) => {
    if (valid) {
      tempLoading.value = true
      http.post('/queryTemplate/update', { ...model }).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.warning(res.data.message)
        }
        tempLoading.value = false
      })
    }
  })
}

function setDefaultTemplate() {
  if (currentRows.value.length > 1 || !currentRow.value.tempId) {
    ElMessage.info('请选中一行数据！')
    return
  }
  ElMessageBox.confirm('您确认把' + currentRow.value.tempName + '设为默认模板吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    currentRow.value.isDefault = 1
    http.post('/queryTemplate/update', { ...currentRow.value }).then(res => {
      if (res.data?.code == 200) {
        refresh()
        ElMessage.success('设置成功')
      } else {
        ElMessage.warning('设置失败')
      }
    })
  }).catch(() => ElMessage.info('已取消'))
}

function deleteTemplate(data) {
  if (data.tempId) currentRows.value.push(data)
  if (currentRows.value.length === 0) {
    ElMessage.error('请选中一行数据！')
    return
  }
  ElMessageBox.confirm('您确认删除该模板吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const ids = currentRows.value.map(o => o.tempId)
    http.post('/queryTemplate/delete', { ids }).then(res => {
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

function deployTemplate(row) {
  templateJoinItemWin.value = true
  currentRow.value = row
  http.get('/queryTemplateItem/listTempAndItem', { params: { tempId: row.tempId } }).then(res => {
    if (res.data?.code == 200) {
      allItemList.value = res.data.data.listAll || []
      currentItemList.value = res.data.data.currentTempList || []
    }
  })
}

function templateJoinItem() {
  ElMessageBox.confirm('您确认配置模板吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    tempLoading.value = true
    http.post('/queryTemplateItem/templateJoinItem', {
      tempId: currentRow.value.tempId,
      itemIds: currentItemList.value
    }).then(res => {
      tempLoading.value = false
      if (res.data?.code == 200) {
        empty()
        ElMessage.success(res.data.message)
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消'))
}

function selectTable(selection, row) {
  currentRows.value = selection
  currentRow.value = row
}

function beforeClose(done) {
  done()
  empty()
}

function empty() {
  addTemplateWin.value = false
  editTemplateWin.value = false
  templateJoinItemWin.value = false
  allItemList.value = []
  currentRows.value = []
  currentItemList.value = []
  Object.assign(model, JSON.parse(JSON.stringify(emptyModel)))
  addTemplateForm.value?.clearValidate()
  editTemplateForm.value?.clearValidate()
}

function sizeChange(size) { params.pageSize = size; refresh() }
function currentChange(page) { params.pageNum = page; refresh() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

onMounted(() => refresh())
</script>

<template>
  <Container class="queryTemplate" @resize="getTableHeight" :showLeftPadding="false">
    <div class="list">
      <div class="search">
        <div class="pull-left">
          <el-input v-model="params.tempName" clearable placeholder="输入模板名称查询" size="small" class="list-simple-search-input" />
          <el-button type="primary" @click="refresh(true)" size="small">查询</el-button>
        </div>
        <div class="pull-right">
          <el-button @click="refresh()" size="small">刷新</el-button>
          <el-button type="primary" @click="openAddTemplate" size="small">添加</el-button>
          <el-button type="danger" @click="deleteTemplate({})" size="small">批量删除</el-button>
          <el-button type="info" @click="setDefaultTemplate" size="small">设置默认模板</el-button>
        </div>
      </div>
      <div class="list-wrap">
        <el-table border stripe :max-height="tableHeight" v-loading="loading" :data="dataList" @select="selectTable" @select-all="selectTable">
          <el-table-column type="index" label="序号" align="center" width="50" />
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="模板名称" header-align="center" width="300" align="center">
            <template #default="{ row }">
              {{ row.tempName }}
              <el-tag v-if="row.isDefault == 1" size="small" type="success" effect="dark" style="margin-left:6px">默认模板</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="模板编码" prop="tempCode" header-align="center" width="200" align="center" />
          <el-table-column label="创建人" prop="createUserName" header-align="center" width="200" align="center" />
          <el-table-column label="创建时间" prop="createTime" header-align="center" width="200" align="center" />
          <el-table-column label="备注" prop="remarks" header-align="center" align="center" />
          <el-table-column label="操作" header-align="center" width="200" align="center">
            <template #default="{ row }">
              <el-button @click="openEditTemplateWin(row)" size="small">编辑</el-button>
              <el-button @click="deleteTemplate(row)" type="danger" size="small">删除</el-button>
              <el-button @click="deployTemplate(row)" type="success" size="small">配置模板</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]"
        :page-size="pageInfo.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </div>

    <!-- Add Dialog -->
    <el-dialog title="添加综合查询模板" v-model="addTemplateWin" width="37%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="16vh">
      <el-form ref="addTemplateForm" :rules="templateRules" size="small" :model="model" label-width="120px" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="模板名称" prop="tempName">
              <el-input ref="addTemplateFirstInput" v-model.trim="model.tempName" clearable placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="模板编码" prop="tempCode">
              <el-input v-model.trim="model.tempCode" clearable placeholder="请输入模板名称首字母" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="模板备注" prop="remarks">
              <el-input v-model.trim="model.remarks" type="textarea" :autosize="{ minRows: 4, maxRows: 16 }" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveTemplate" :loading="tempLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog title="编辑综合查询模板" v-model="editTemplateWin" width="37%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="16vh">
      <el-form ref="editTemplateForm" :rules="templateRules" size="small" :model="model" label-width="120px" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="模板名称" prop="tempName">
              <el-input ref="editTemplateFirstInput" v-model.trim="model.tempName" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="模板编码" prop="tempCode">
              <el-input v-model.trim="model.tempCode" clearable disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="模板备注" prop="remarks">
              <el-input v-model.trim="model.remarks" type="textarea" :autosize="{ minRows: 4, maxRows: 16 }" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="editTemplate" :loading="tempLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- Config Items Dialog -->
    <el-dialog title="配置模板中的条件项" v-model="templateJoinItemWin" width="50%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="16vh">
      <el-row>
        <el-checkbox-group v-model="currentItemList">
          <el-col :span="4" v-for="item in allItemList" :key="item.queryItemId" style="padding:10px 0;">
            <el-checkbox :label="item.queryItemId">{{ item.queryItemName }}</el-checkbox>
          </el-col>
        </el-checkbox-group>
      </el-row>
      <template #footer>
        <el-button type="primary" @click="templateJoinItem" :loading="tempLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<style scoped>
.queryTemplate .list { padding-left: 15px; height: 100%; overflow-y: auto; }
.queryTemplate .search { height: 64px; border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.queryTemplate .list-simple-search-input { width: 180px; margin-right: 10px; }
.queryTemplate .list .list-wrap { margin-top: 20px; }
.queryTemplate .list .el-pagination { float: right; padding: 10px 0 0; }
.queryTemplate .list .el-button--small { padding: 7px 12px; }
.queryTemplate .list .el-button + .el-button { margin-left: 6px; }
.queryTemplate .el-select { width: 100%; }
</style>
