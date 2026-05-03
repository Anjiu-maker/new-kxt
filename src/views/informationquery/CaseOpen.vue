<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { useGlobal } from '@/composables/useGlobal'
import Container from '@/components/Container.vue'

const { getDictByCode } = useGlobal()

const loading = ref(false)
const saveLoading = ref(false)
const addWin = ref(false)
const editWin = ref(false)
const tableHeight = ref(300)
const selectRows = ref([])
const dataList = ref([])
const addForm = ref(null)
const editForm = ref(null)
const addFirstInput = ref(null)

const params = reactive({ pageNum: 1, pageSize: 10 })
const pageInfo = reactive({ pageSize: 10, total: 0 })
const paramCreateTime = ref([])

const model = reactive({
  id: null, orderNo: null, title: '', content: '', typeId: null,
  resultState: null, createTime: '', isPublic: 1, callbackTime: '',
  handleDept: '', satisfaction: null, result: '', typeName: '',
  hotspot1: null, hotspot2: null, hotspot3: null, hotspot4: null, hotspot5: null,
  orderOrigin: '', isDisPublic: null
})

const emptyModel = JSON.parse(JSON.stringify(model))
const hotspot = ref([])
const typeOptions = ref([])
const hotspotOptions = ref([])
const hotspotProps = { expandTrigger: 'hover', label: 'dictName', value: 'dictId', children: 'children' }

const formRules = {
  orderNo: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }, { max: 500, message: '长度不超过500字符', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }, { max: 800, message: '长度不超过800字符', trigger: 'blur' }],
  typeId: [{ required: true, message: '请选择类型', trigger: 'change' }],
  resultState: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  createTime: [{ required: true, message: '请选择时间', trigger: 'change' }],
  isPublic: [{ required: true, message: '请选择是否公开', trigger: 'change' }],
  callbackTime: [{ required: true, message: '请选择联系时间', trigger: 'change' }],
  handleDept: [{ required: true, message: '请输入处理部门', trigger: 'blur' }],
  satisfaction: [{ required: true, message: '请选择满意度', trigger: 'change' }],
  result: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const dataFiled = [
  { type: 'index', label: '序号', show: true, width: '50px' },
  { type: 'selection', show: true, width: '50px' },
  { label: '编号', model: 'orderNo', width: 160, show: true },
  { label: '标题', model: 'title', show: true, 'show-overflow-tooltip': true },
  { label: '类型', model: 'typeName', width: 120, show: true },
  { label: '内容', model: 'content', show: true, 'show-overflow-tooltip': true },
  { label: '时间', model: 'createTime', width: 160, show: true },
  { label: '处理状态', model: 'resultStateName', width: 100, show: true },
  { label: '处理部门', model: 'handleDept', width: 150, show: true },
  { label: '是否公开', model: 'isPublic', width: 80, show: true },
  { label: '创建人', model: 'createUserName', width: 100, show: true }
]

const stateOptions = [
  { value: 1, label: '处理完毕' }, { value: 2, label: '正在处理' }, { value: 3, label: '未处理' }
]
const satisfactionOptions = [
  { value: 0, label: '不满意' }, { value: 1, label: '理解' }, { value: 2, label: '满意' }, { value: 3, label: '非常满意' }
]

function setStateName(v) { return stateOptions.find(o => o.value === v)?.label || '' }
function setSatisfactionName(v) { return satisfactionOptions.find(o => o.value === v)?.label || '' }

function formatDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

function refresh() {
  loading.value = true
  const p = { ...params }
  if (paramCreateTime.value?.length === 2) {
    p.createStartTime = paramCreateTime.value[0]
    p.createEndTime = paramCreateTime.value[1]
  }
  http.get('/caseopen/list', { params: p }).then(res => {
    if (res.data?.code == 200) {
      dataList.value = res.data.data.records
      pageInfo.pageSize = res.data.data.size
      pageInfo.total = res.data.data.total
    }
    loading.value = false
  })
}

function add() {
  addWin.value = true
  nextTick(() => addFirstInput.value?.focus())
}

function save() {
  addForm.value?.validate((valid) => {
    if (valid) {
      saveLoading.value = true
      const data = { ...model }
      data.typeName = typeOptions.value.find(o => o.dictId == model.typeId)?.dictName || ''
      data.resultStateName = setStateName(model.resultState)
      data.satisfactionName = setSatisfactionName(model.satisfaction)
      http.post('/caseopen/save', data).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.error(res.data.message)
        }
        saveLoading.value = false
      })
    }
  })
}

function edit(row) {
  editWin.value = true
  Object.keys(emptyModel).forEach(k => { if (row[k] != null) model[k] = row[k] })
  hotspot.value = []
  for (let i = 1; i <= 5; i++) {
    if (row['hotspot' + i]) hotspot.value.push(row['hotspot' + i])
  }
}

function update() {
  editForm.value?.validate((valid) => {
    if (valid) {
      saveLoading.value = true
      const data = { ...model }
      data.typeName = typeOptions.value.find(o => o.dictId == model.typeId)?.dictName || ''
      data.resultStateName = setStateName(model.resultState)
      data.satisfactionName = setSatisfactionName(model.satisfaction)
      http.post('/caseopen/save', data).then(res => {
        if (res.data?.code == 200) {
          refresh()
          empty()
          ElMessage.success(res.data.message)
        } else {
          ElMessage.error(res.data.message)
        }
        saveLoading.value = false
      })
    }
  })
}

function del(row) {
  if (row.id) selectRows.value.push(row)
  if (!selectRows.value.length) { ElMessage.warning('请至少选择一条数据!'); return }
  ElMessageBox.confirm('您确认删除该案例吗?', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const ids = selectRows.value.map(e => e.id)
    http.post('/caseopen/delete', { ids }).then(res => {
      if (res.data?.code == 200) {
        refresh()
        empty()
        ElMessage.success('删除成功!')
      } else {
        ElMessage.error(res.data.message)
      }
    })
  }).catch(() => ElMessage.info('已取消'))
}

function findOrderByNo() {
  if (!model.orderNo) return
  http.get('/orderInfo/find', { params: { orderNo: model.orderNo } }).then(res => {
    if (res.data?.code == 200) {
      const d = res.data.data
      model.typeId = d.orderType
      model.title = d.title || ''
      model.content = d.callerContent || ''
      model.handleDept = d.handlerDeptName || ''
      model.orderOrigin = d.orderOriginName || ''
      if (d.releaseContent) model.result = d.releaseContent
      model.isDisPublic = d.isPublic ? 1 : 0
      ElMessage.success('查询成功')
    } else {
      ElMessage.error('未找到对应工单')
    }
  })
}

function changeHotspot(value) {
  for (let i = 1; i <= 5; i++) {
    model['hotspot' + i] = value[i - 1] || null
  }
}

function select(selection) { selectRows.value = selection }

function beforeClose(done) { done(); empty() }

function empty() {
  addWin.value = false
  editWin.value = false
  selectRows.value = []
  hotspot.value = []
  Object.assign(model, JSON.parse(JSON.stringify(emptyModel)))
  addForm.value?.clearValidate()
  editForm.value?.clearValidate()
}

function sizeChange(size) { params.pageSize = size; refresh() }
function currentChange(page) { params.pageNum = page; refresh() }
function getTableHeight(h) { tableHeight.value = h - 30 - 84 - 40 }

function isPublicFormatter(r, c, v) { return v == 1 ? '是' : '否' }

onMounted(() => {
  const now = new Date()
  paramCreateTime.value = [
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`,
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} 23:59:59`
  ]
  refresh()
  getDictByCode(true, 'rdfl').then(res => { hotspotOptions.value = res || [] })
  getDictByCode(false, 'swlx').then(res => { typeOptions.value = res || [] })
})
</script>

<template>
  <Container type="box" class="case-open" @resize="getTableHeight">
    <div class="list">
      <div class="search">
        <div class="pull-left">
          <el-date-picker v-model="paramCreateTime" clearable type="datetimerange"
            size="small" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-" :default-time="['00:00:00', '23:59:59']"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width:330px" />&nbsp;
          <el-input v-model="params.orderNo" clearable placeholder="请输入编号" size="small" style="width:170px" />&nbsp;
          <el-input v-model="params.createUserName" clearable placeholder="请输入创建人" size="small" style="width:170px" />&nbsp;
          <el-input v-model="params.title" clearable placeholder="请输入标题" size="small" style="width:170px" />&nbsp;
          <el-radio-group v-model="params.isPublic" @change="refresh">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </div>
        <el-button type="primary" @click="refresh" size="small">查询</el-button>
        <div class="pull-right">
          <el-button @click="refresh" size="small">刷新</el-button>
          <el-button type="primary" @click="add" size="small">添加</el-button>
          <el-button type="danger" @click="del({})" size="small">批量删除</el-button>
        </div>
      </div>
      <div class="list-wrap">
        <el-table ref="defTable" border stripe v-loading="loading" :max-height="tableHeight" :data="dataList" @select="select" @select-all="select">
          <template v-for="col in dataFiled" :key="col.model || col.type">
            <el-table-column v-if="col.show" align="center" header-align="center"
              :type="col.type" :fixed="col.fixed || false" :prop="col.model"
              :label="col.label" :width="col.width"
              :formatter="col.model === 'isPublic' ? isPublicFormatter : null"
              :show-overflow-tooltip="col['show-overflow-tooltip'] || false" />
          </template>
          <el-table-column label="操作" header-align="center" width="120" align="center">
            <template #default="{ row }">
              <el-button @click="edit(row)" size="small">编辑</el-button>
              <el-button @click="del(row)" type="danger" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination :background="true" @size-change="sizeChange" @current-change="currentChange"
        :current-page="params.pageNum" :page-sizes="[10, 50, 100, 500]" :page-size="pageInfo.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.total" />
    </div>

    <!-- Add Dialog -->
    <el-dialog title="添加案例公开" v-model="addWin" width="60%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="5vh">
      <el-form ref="addForm" :rules="formRules" :model="model" label-width="120px" size="small" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="编号" prop="orderNo">
              <el-input ref="addFirstInput" v-model.trim="model.orderNo" placeholder="请输入编号" />
              <el-button @click="findOrderByNo" size="small" style="margin-left:8px">查询</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="标题" prop="title"><el-input v-model.trim="model.title" placeholder="请输入标题" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="类型" prop="typeId">
              <el-select v-model="model.typeId" placeholder="请选择类型" style="width:100%">
                <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="处理状态" prop="resultState">
              <el-select v-model="model.resultState" placeholder="请选择处理状态" style="width:100%">
                <el-option v-for="item in stateOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="时间" prop="createTime">
              <el-date-picker v-model="model.createTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择时间" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="是否公开" prop="isPublic">
              <el-radio-group v-model="model.isPublic" :disabled="!!model.isDisPublic">
                <el-radio :value="1">是</el-radio>
                <el-radio :value="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="联系时间" prop="callbackTime">
              <el-date-picker v-model="model.callbackTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择联系时间" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="处理部门" prop="handleDept"><el-input v-model.trim="model.handleDept" placeholder="请输入处理部门" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="满意度" prop="satisfaction">
              <el-select v-model="model.satisfaction" placeholder="请选择满意度" style="width:100%">
                <el-option v-for="item in satisfactionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="热点分类">
              <el-cascader v-model="hotspot" :options="hotspotOptions" :props="hotspotProps" filterable style="width:100%" @change="changeHotspot" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="内容" prop="content">
              <el-input v-model.trim="model.content" type="textarea" :rows="4" maxlength="800" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="处理结果" prop="result">
              <el-input v-model.trim="model.result" type="textarea" :rows="4" maxlength="3000" show-word-limit placeholder="请输入处理结果（可使用富文本）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="save" :loading="saveLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog title="编辑案例公开" v-model="editWin" width="60%" :append-to-body="true" :close-on-click-modal="false" :before-close="beforeClose" top="5vh">
      <el-form ref="editForm" :rules="formRules" :model="model" label-width="120px" size="small" label-suffix=":">
        <el-row>
          <el-col :span="11">
            <el-form-item label="编号" prop="orderNo">
              <el-input v-model.trim="model.orderNo" placeholder="请输入编号" />
              <el-button @click="findOrderByNo" size="small" style="margin-left:8px">查询</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="标题" prop="title"><el-input v-model.trim="model.title" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="类型" prop="typeId">
              <el-select v-model="model.typeId" style="width:100%">
                <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="处理状态" prop="resultState">
              <el-select v-model="model.resultState" style="width:100%">
                <el-option v-for="item in stateOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="时间" prop="createTime">
              <el-date-picker v-model="model.createTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="是否公开" prop="isPublic">
              <el-radio-group v-model="model.isPublic" :disabled="!!model.isDisPublic">
                <el-radio :value="1">是</el-radio>
                <el-radio :value="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="联系时间" prop="callbackTime">
              <el-date-picker v-model="model.callbackTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="处理部门" prop="handleDept"><el-input v-model.trim="model.handleDept" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">
            <el-form-item label="满意度" prop="satisfaction">
              <el-select v-model="model.satisfaction" style="width:100%">
                <el-option v-for="item in satisfactionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="热点分类">
              <el-cascader v-model="hotspot" :options="hotspotOptions" :props="hotspotProps" filterable style="width:100%" @change="changeHotspot" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="内容" prop="content">
              <el-input v-model.trim="model.content" type="textarea" :rows="4" maxlength="800" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="22">
            <el-form-item label="处理结果" prop="result">
              <el-input v-model.trim="model.result" type="textarea" :rows="4" maxlength="3000" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="update" :loading="saveLoading">确认</el-button>
        <el-button @click="empty">取消</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<style scoped>
.case-open .search { height: auto; min-height: 64px; border: 1px solid #e6eaf0; background: #f2f5fc; padding: 16px; }
.case-open .list { height: 100%; overflow-y: auto; }
.case-open .list .list-wrap { margin-top: 20px; }
.case-open .list .el-pagination { float: right; padding: 10px 0 0; }
</style>
