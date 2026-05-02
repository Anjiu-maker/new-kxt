<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Container from '@/components/Container.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import Audio from '@/components/Audio.vue'
import { saveOrder, getOrderDetail, getOrderList, getDeptList } from '@/services/orderService'
import { useAuthStore } from '@/stores/auth'
import { useGlobal } from '@/composables/useGlobal'

const route = useRoute()
const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)
const { getDictByCode } = useGlobal()

const loading = ref(false)
const isEdit = ref(false)
const orderId = ref('')
const audioWinMaster = ref(false)
const audioUrlMaster = ref('')
const gdxqwin = ref(false)
const orderInfoRef = ref()
const lsgdList = ref([])

const model = reactive({
  name: '', callTel: '', sex: '', addr: '', orderAddr: '',
  title: '', callerContent: '',
  orderOrigin: '', orderOrigin2: '', orderType: '', orderLevel: '',
  handlerDeptId: '', handlerDeptName: '', acceptDeptId: '', acceptDeptName: '', deptId: '',
  isNameSecurity: 0, haveSound: 0, haveSoundName: '',
  handleType: 0
})

const dicts = reactive({
  orderOrigin: [], orderType: [], orderLevel: [], deptOptions: []
})

const sexOptions = [{ label: '男', value: '1' }, { label: '女', value: '0' }]
const userInfo = computed(() => authStore.userInfo ?? {})

function formatTime(v) { if (!v) return '-'; const d = new Date(v); if (Number.isNaN(d.getTime())) return '-'; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }

async function loadDicts() {
  try {
    const [origins, types, levels, depts] = await Promise.all([
      getDictByCode(true, 'orderOrigin'), getDictByCode(true, 'orderType'),
      getDictByCode(false, 'orderLevel'), getDeptList(false, true)
    ])
    dicts.orderOrigin = origins || []
    dicts.orderType = types || []
    dicts.orderLevel = levels || []
    dicts.deptOptions = depts?.data?.data || []
  } catch {}
}

async function loadOrderData() {
  const oid = route.query.orderId
  if (!oid) return
  isEdit.value = true; orderId.value = oid
  try {
    const res = await getOrderDetail(route.query.orderNo || '', authStore.hasPermission('lookOrderInfo', 1))
    if (res.data?.code === 200) {
      const d = res.data.data
      Object.assign(model, {
        name: d.name || '', callTel: d.callTel || '', sex: d.sex || '',
        addr: d.addr || '', orderAddr: d.orderAddr || '',
        title: d.title || '', callerContent: d.callerContent || '',
        orderOrigin: d.orderOrigin || '', orderType: d.orderType || '', orderLevel: d.orderLevel || '',
        handlerDeptId: d.handlerDeptId || '', acceptDeptId: d.acceptDeptId || '', deptId: d.deptId || '',
        isNameSecurity: d.isNameSecurity || 0, haveSound: d.haveSound || 0, haveSoundName: d.haveSoundName || ''
      })
      if (model.callTel) getlsgdList()
    }
  } catch {}
}

async function getlsgdList() {
  if (!model.callTel) return
  try {
    const res = await getOrderList('/orderInfo/historyOrder', { callTel: model.callTel, pageSize: 10 })
    if (res.data?.code === 200) lsgdList.value = res.data.data?.records ?? []
  } catch { lsgdList.value = [] }
}

async function handleSubmit(continueAccept = false) {
  if (!model.title) { ElMessage.warning('请输入标题'); return }
  if (!model.callerContent) { ElMessage.warning('请输入内容'); return }
  try {
    loading.value = true
    const payload = { ...model }
    if (isEdit.value) payload.orderId = orderId.value
    payload.jxsl = continueAccept ? 1 : 0
    const res = await saveOrder(payload)
    if (res.data?.code === 200) {
      ElMessage.success(continueAccept ? '保存成功' : '提交成功')
      if (!continueAccept) workbenchNav?.openMenuByCode('zcsw')
    } else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { ElMessage.error('操作失败') } finally { loading.value = false }
}

function ckDispose(row) { gdxqwin.value = true; setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(row.orderId), 100) }

onMounted(() => { loadDicts(); loadOrderData() })
</script>

<template>
  <Container type="scroll">
    <div class="addOrder">
      <el-row :gutter="16">
        <el-col :span="14">
          <div class="form-panel">
            <div class="panel-head"><span>{{ isEdit ? '编辑工单' : '新增工单' }}</span></div>

            <div v-if="audioWinMaster" style="margin:8px">
              <Audio :the-url="audioUrlMaster" @soundError="audioWinMaster = false" />
              <el-button size="small" @click="audioWinMaster = false">关闭</el-button>
            </div>

            <!-- 市民信息 -->
            <div class="info-section">
              <div class="section-head"><span>市民信息</span></div>
              <el-form label-width="80px" size="small">
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="市民姓名"><el-input v-model="model.name" placeholder="请输入" clearable /></el-form-item></el-col>
                  <el-col :span="10"><el-form-item label="呼叫号码"><el-input v-model="model.callTel" placeholder="呼叫号码" maxlength="12" show-word-limit clearable @keyup.enter="getlsgdList" /><el-button size="small" style="margin-left:6px" @click="getlsgdList">查询</el-button></el-form-item></el-col>
                  <el-col :span="6"><el-form-item label="性别"><el-select v-model="model.sex" placeholder="选择" clearable><el-option v-for="s in sexOptions" :key="s.value" :label="s.label" :value="s.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="群众地址"><el-input v-model="model.addr" placeholder="请输入地址" clearable /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="事发地址"><el-input v-model="model.orderAddr" placeholder="请输入事发地址" clearable /></el-form-item></el-col>
                </el-row>
              </el-form>
            </div>

            <!-- 工单信息 -->
            <div class="info-section">
              <div class="section-head"><span>工单信息</span></div>
              <el-form label-width="80px" size="small">
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="工单来源"><el-cascader v-model="model.orderOrigin" :options="dicts.orderOrigin" :props="{ value:'dictId', label:'dictName', children:'children', expandTrigger:'hover' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="工单类型"><el-select v-model="model.orderType" placeholder="请选择" clearable filterable style="width:100%"><el-option v-for="o in dicts.orderType" :key="o.dictId" :label="o.dictName" :value="o.dictId" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="工单级别"><el-select v-model="model.orderLevel" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in dicts.orderLevel" :key="o.dictId" :label="o.dictName" :value="o.dictId" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item label="标题"><el-input v-model="model.title" placeholder="请输入工单标题" maxlength="200" show-word-limit /></el-form-item>
                <el-form-item label="内容"><el-input v-model="model.callerContent" type="textarea" :autosize="{ minRows:4, maxRows:12 }" placeholder="请输入工单内容" maxlength="2000" show-word-limit /></el-form-item>
              </el-form>
            </div>

            <!-- 办理单位 -->
            <div class="info-section">
              <div class="section-head"><span>办理单位</span></div>
              <el-form label-width="80px" size="small">
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="处理部门"><el-cascader v-model="model.handlerDeptId" :options="dicts.deptOptions" :props="{ value:'deptId', label:'deptName', children:'children' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="办理部门"><el-cascader v-model="model.acceptDeptId" :options="dicts.deptOptions" :props="{ value:'deptId', label:'deptName', children:'children' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
                </el-row>
              </el-form>
            </div>

            <div class="form-actions">
              <el-button type="primary" :loading="loading" @click="handleSubmit(false)">提交</el-button>
              <el-button type="success" :loading="loading" @click="handleSubmit(true)">继续受理</el-button>
              <el-button @click="workbenchNav?.openMenuByCode('zcsw')">返回列表</el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="10">
          <div class="form-panel">
            <div class="panel-head"><span>历史工单</span></div>
            <el-table :data="lsgdList" border size="small" max-height="600">
              <el-table-column type="index" label="序号" width="50" align="center" />
              <el-table-column prop="orderNo" label="编号" width="180" show-overflow-tooltip />
              <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
              <el-table-column label="登记时间" width="155" align="center"><template #default="{ row }">{{ formatTime(row.createTime) }}</template></el-table-column>
              <el-table-column label="操作" width="60" align="center"><template #default="{ row }"><el-button link type="primary" @click="ckDispose(row)">查看</el-button></template></el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </div>
    <Orderinfo ref="orderInfoRef" />
  </Container>
</template>

<style scoped>
.addOrder { min-height: 600px; }
.form-panel { border: 1px solid #e6eaf0; border-radius: 8px; background: #fff; margin-bottom: 14px; }
.panel-head { padding: 12px 16px; border-bottom: 1px solid #f0f4f8; font-weight: 700; font-size: 15px; color: #1c4886; }
.info-section { padding: 14px 16px; border-bottom: 1px solid #f5f7fa; }
.section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 700; font-size: 14px; color: #333; }
.form-actions { display: flex; gap: 10px; padding: 16px; justify-content: center; }
</style>
