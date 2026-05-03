<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { useGlobal } from '@/composables/useGlobal'
import Container from '@/components/Container.vue'
import Orderinfo from '@/components/Orderinfo.vue'

const { getDictByCode } = useGlobal()

const loading = ref(false)
const tempLoading = ref(false)
const addCitizenWin = ref(false)
const editCitizenWin = ref(false)
const isShowOrderinfo = ref(false)
const historyWin = ref(false)
const tableHeight = ref(300)
const currentRows = ref([])
const dataList = ref([])
const lsgdList = ref([])
const portraitOptions = ref([])
const orderInfo = ref(null)
const addCitizenForm = ref(null)
const editCitizenForm = ref(null)
const addCitizenFirstInput = ref(null)
const filElem = ref(null)

const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ pageSize: 10, total: 0 })
const lsgdparams = reactive({ pageNum: 1, pageSize: 10, callTel: '' })
const lsgdPageInfo = reactive({ pageSize: 10, total: 0 })

const model = reactive({
  id: '', name: '', callTel: '', idcard: '', addr: '',
  isNameSecurity: 0, sex: 1, shotMessageNumber: '',
  isStandardMandarin: 0, isNative: 0, massesRemarks: '', portrait: []
})

const emptyModel = JSON.parse(JSON.stringify(model))

const dataFiled = [
  { type: 'index', label: '序号', show: true, width: '50px' },
  { type: 'selection', show: true, width: '50px' },
  { label: '姓名', model: 'name', show: true, width: 120, sortable: false },
  { label: '性别', model: 'sex', show: true, width: 60, sortable: false },
  { label: '电话', model: 'callTel', show: true, width: 150, sortable: false },
  { label: '群众地址', model: 'addr', show: true, sortable: false },
  { label: '身份证号', model: 'idcard', show: true, width: 200, sortable: false },
  { label: '群众备注', model: 'massesRemarks', show: true, sortable: false }
]

const citizenRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { max: 20, message: '长度不超过 20 个字符', trigger: 'blur' }
  ],
  callTel: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { max: 12, message: '长度不超过 12 位', trigger: 'blur' }
  ],
  shotMessageNumber: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  idcard: [{ pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }]
}

function sexFormatter(row, column, cellValue) { return cellValue == 1 ? '男' : '女' }

function resetCurrentPage() {
  const totalPage = Math.ceil((pageInfo.total - 1) / pageInfo.pageSize)
  params.pageNum = params.pageNum > totalPage ? (totalPage || 1) : params.pageNum
}

function refresh(ifSearch) {
  loading.value = true
  if (ifSearch) params.pageNum = 1
  http.get('/orderCitizen/list', { params }).then(res => {
    if (res.data?.code == 200) {
      dataList.value = res.data.data.records
      pageInfo.pageSize = res.data.data.size
      pageInfo.total = res.data.data.total
    }
    loading.value = false
  })
}

function getRwhx() {
  getDictByCode(true, 'rwhx').then(res => { portraitOptions.value = res || [] })
}

function openAddCitizen() {
  addCitizenWin.value = true
  nextTick(() => addCitizenFirstInput.value?.focus())
}

function saveCitizen() {
  addCitizenForm.value?.validate((valid) => {
    if (valid) {
      tempLoading.value = true
      http.post('/orderCitizen/save_batch', { citizens: JSON.stringify([{ ...model }]) }).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.error(res.data.message)
        }
        tempLoading.value = false
      })
    }
  })
}

function openEditCitizen(row) {
  editCitizenWin.value = true
  Object.keys(emptyModel).forEach(k => { if (row[k] != null) model[k] = row[k] })
  if (row.portrait?.length) model.portrait = row.portrait.map(n => Number(n))
}

function editCitizen() {
  editCitizenForm.value?.validate((valid) => {
    if (valid) {
      tempLoading.value = true
      http.post('/orderCitizen/update', { ...model }).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.error(res.data.message)
        }
        tempLoading.value = false
      })
    }
  })
}

function deleteCitizen(row) {
  if (row.id) currentRows.value.push(row)
  if (!currentRows.value.length) { ElMessage.warning('请至少选择一条数据!'); return }
  ElMessageBox.confirm('您确认删除该群众信息吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const ids = currentRows.value.map(e => e.id)
    http.post('/orderCitizen/delete', { ids }).then(res => {
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

function showHiOrder(row) {
  historyWin.value = true
  lsgdparams.callTel = row.callTel
  getlsgdList()
}

function getlsgdList() {
  http.get('/orderInfo/findHistoryOrderByCallTel', { params: { ...lsgdparams, isAll: true } }).then(res => {
    if (res.data?.code == 200) {
      lsgdList.value = res.data.data.records || []
      lsgdPageInfo.total = res.data.data.total || 0
    }
  })
}

function findOrderByNo(row) {
  historyWin.value = false
  isShowOrderinfo.value = true
  nextTick(() => orderInfo.value?.reloadDataByOrderId(row.orderId))
}

function selectTable(selection) { currentRows.value = selection }

function beforeClose(done) { done(); empty() }

function empty() {
  addCitizenWin.value = false
  editCitizenWin.value = false
  currentRows.value = []
  Object.assign(model, JSON.parse(JSON.stringify(emptyModel)))
  addCitizenForm.value?.clearValidate()
  editCitizenForm.value?.clearValidate()
}

function sizeChange(size) { params.pageSize = size; refresh() }
function currentChange(page) { params.pageNum = page; refresh() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

function formatDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

const config = window.common || window.__KXT_CONFIG__ || {}
const citizenUploadAction = (config.baseApi || '') + (config.apiVersion || '/api/v1') + '/orderCitizen/parsingExcel'
const importHeaders = { token: sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') }

function handleChange(file) {
  const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
  if (!['xls', 'xlsx'].includes(ext)) {
    ElMessage.warning('只支持xls/xlsx格式文件')
    return false
  }
  if (file.size > 30 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过30M')
    return false
  }
}

function onSuccess(response) {
  if (response?.code == 200) {
    ElMessage.success('导入成功')
    refresh()
  } else {
    ElMessage.error(response?.message || '导入失败')
  }
}

function downloadCitizenTemplate() {
  http.get('/orderCitizen/downLoadCitizenTemplate', { responseType: 'arraybuffer' }).then(res => {
    const link = document.createElement('a')
    const blob = new Blob([res.data])
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = '群众信息导入模板.xlsx'
    link.click()
    URL.revokeObjectURL(objectUrl)
  })
}

onMounted(() => {
  refresh()
  getRwhx()
})
</script>

<template>
  <Container class="citizen" @resize="getTableHeight" :showLeftPadding="false">
    <div class="list">
      <div class="search">
        <div class="pull-left">
          <el-input v-model="params.name" clearable placeholder="输入群众姓名查询"  class="list-simple-search-input" />
          <el-input v-model="params.callTel" clearable placeholder="输入电话号码查询"  class="list-simple-search-input" />
          <el-input v-model="params.idcard" clearable placeholder="输入身份证号查询"  class="list-simple-search-input" />
          <el-input v-model="params.addr" clearable placeholder="输入地址查询"  class="list-simple-search-input" />
          <el-select v-model="params.sex" placeholder="请选择性别"  style="width:150px" clearable @change="refresh(true)">
            <el-option :key="1" label="男" :value="1" />
            <el-option :key="0" label="女" :value="0" />
          </el-select>
          <el-button type="primary" @click="refresh(true)"  style="margin-left:10px">查询</el-button>
        </div>
        <div class="pull-right">
          <el-button @click="refresh()" >刷新</el-button>
          <el-button type="info" @click="downloadCitizenTemplate" >下载模板</el-button>
          <el-upload
            class="citizen-upload" :action="citizenUploadAction" :headers="importHeaders"
            :on-success="onSuccess" :on-change="handleChange" :show-file-list="false"
            multiple :limit="10" :on-exceed="() => ElMessage.warning('最多上传10个文件')">
            <el-button  type="info">导入信息</el-button>
          </el-upload>
          <el-button type="primary" @click="openAddCitizen" >添加</el-button>
          <el-button type="danger" @click="deleteCitizen({})" >批量删除</el-button>
        </div>
      </div>
      <div class="list-wrap">
        <el-table border stripe :max-height="tableHeight" v-loading="loading" :data="dataList" @select="selectTable" @select-all="selectTable">
          <template v-for="col in dataFiled" :key="col.model || col.type">
            <el-table-column v-if="col.show" align="center" header-align="center"
              :type="col.type" :fixed="col.fixed || false" :prop="col.model"
              :label="col.label" :width="col.width" :sortable="col.sortable || false"
              :formatter="col.model === 'sex' ? sexFormatter : null" />
          </template>
          <el-table-column label="人物画像" header-align="center" width="100">
            <template #default="{ row: r }">
              <el-popover placement="top" trigger="hover" v-if="r.portrait?.length">
                <template #default><el-tag v-for="(p, i) in r.portrait" :key="i"  style="margin:2px">{{ portraitOptions.find(o => o.dictId == p)?.dictName || p }}</el-tag></template>
                <template #reference><el-button type="primary" link>查看</el-button></template>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column label="操作" header-align="center" width="200" align="center">
            <template #default="{ row: r }">
              <el-button @click="openEditCitizen(r)" >编辑</el-button>
              <el-button @click="deleteCitizen(r)" type="danger" >删除</el-button>
              <el-button @click="showHiOrder(r)" >历史事务</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="pageInfo.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </div>

    <!-- Add Citizen Dialog -->
    <el-dialog title="添加群众信息" v-model="addCitizenWin" width="50%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="10vh">
      <el-form ref="addCitizenForm" :rules="citizenRules" :model="model" label-width="120px"  label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="姓名" prop="name"><el-input ref="addCitizenFirstInput" v-model.trim="model.name" placeholder="请输入姓名" /></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="电话" prop="callTel"><el-input v-model.trim="model.callTel" placeholder="请输入电话号码" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="身份证号" prop="idcard"><el-input v-model.trim="model.idcard" placeholder="请输入身份证号" /></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="性别"><el-radio-group v-model="model.sex"><el-radio :value="1">男</el-radio><el-radio :value="0">女</el-radio></el-radio-group></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="接收短信号码" prop="shotMessageNumber"><el-input v-model.trim="model.shotMessageNumber" placeholder="请输入接收短信号码" /></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="普通话"><el-radio-group v-model="model.isStandardMandarin"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="本地人"><el-radio-group v-model="model.isNative"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="信息保密"><el-switch v-model="model.isNameSecurity" :active-value="1" :inactive-value="0" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="地址"><el-input v-model.trim="model.addr" placeholder="请输入群众地址" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="人物画像">
              <el-select v-model="model.portrait" multiple placeholder="请选择人物画像" style="width:100%">
                <el-option v-for="item in portraitOptions" :key="item.dictId" :label="item.dictName" :value="Number(item.dictId)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="备注"><el-input v-model.trim="model.massesRemarks" type="textarea" :autosize="{ minRows: 3 }" maxlength="500" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveCitizen" :loading="tempLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- Edit Citizen Dialog -->
    <el-dialog title="编辑群众信息" v-model="editCitizenWin" width="50%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="10vh">
      <el-form ref="editCitizenForm" :rules="citizenRules" :model="model" label-width="120px"  label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="姓名" prop="name"><el-input v-model.trim="model.name" /></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="电话" prop="callTel"><el-input v-model.trim="model.callTel" disabled /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="身份证号" prop="idcard"><el-input v-model.trim="model.idcard" /></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="性别"><el-radio-group v-model="model.sex"><el-radio :value="1">男</el-radio><el-radio :value="0">女</el-radio></el-radio-group></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="接收短信号码" prop="shotMessageNumber"><el-input v-model.trim="model.shotMessageNumber" /></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="普通话"><el-radio-group v-model="model.isStandardMandarin"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="本地人"><el-radio-group v-model="model.isNative"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="信息保密"><el-switch v-model="model.isNameSecurity" :active-value="1" :inactive-value="0" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="地址"><el-input v-model.trim="model.addr" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="人物画像">
              <el-select v-model="model.portrait" multiple placeholder="请选择人物画像" style="width:100%">
                <el-option v-for="item in portraitOptions" :key="item.dictId" :label="item.dictName" :value="Number(item.dictId)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="备注"><el-input v-model.trim="model.massesRemarks" type="textarea" :autosize="{ minRows: 3 }" maxlength="500" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="editCitizen" :loading="tempLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- History Orders Dialog -->
    <el-dialog title="历史事务" v-model="historyWin" width="70%" :append-to-body="true" top="10vh">
      <el-table :data="lsgdList" border max-height="500">
        <el-table-column label="登记时间" width="160" align="center">
          <template #default="{ row: r }">{{ formatDate(r.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="orderNo" label="事务编号" width="140" align="center" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip align="center" />
        <el-table-column prop="orderSubStateName" label="状态" width="100" align="center" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row: r }"><el-button type="primary" link @click="findOrderByNo(r)">查看详情</el-button></template>
        </el-table-column>
      </el-table>
      <el-pagination :background="true" @current-change="(p) => { lsgdparams.pageNum = p; getlsgdList() }"
        :current-page="lsgdparams.pageNum" :page-size="lsgdparams.pageSize"
        layout="total, prev, pager, next" :total="lsgdPageInfo.total" style="margin-top:10px;text-align:right" />
    </el-dialog>

    <Orderinfo ref="orderInfo" v-model:isShow="isShowOrderinfo" />
  </Container>
</template>

<style scoped>
.citizen .list { padding-left: 15px; height: 100%; overflow-y: auto; }
.citizen .search { height: 64px; border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.citizen .list-simple-search-input { width: 180px; margin-right: 10px; }
.citizen .list .list-wrap { margin-top: 20px; }
.citizen .list .el-pagination { float: right; padding: 10px 0 0; }
.citizen .citizen-upload { display: inline-block; margin: 0 15px; }
</style>
