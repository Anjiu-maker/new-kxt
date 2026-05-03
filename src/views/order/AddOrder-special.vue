<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Container from '@/components/Container.vue'
import Orderinfo from '@/components/Orderinfo.vue'
import { saveOrder, getOrderDetail, getDeptList } from '@/services/orderService'
import { useAuthStore } from '@/stores/auth'
import { useGlobal } from '@/composables/useGlobal'

const route = useRoute()
const authStore = useAuthStore()
const workbenchNav = inject('workbenchNav', null)
const { getDictByCode } = useGlobal()

const loading = ref(false)
const gdxqwin = ref(false)
const orderInfoRef = ref()

const model = reactive({
  name: '', callTel: '', sex: '', addr: '', orderAddr: '',
  title: '', callerContent: '',
  orderOrigin: '', orderType: '', orderLevel: '',
  handlerDeptId: '', acceptDeptId: '', specialWork: ''
})

const dicts = reactive({ orderOrigin: [], orderType: [], orderLevel: [], deptOptions: [], specialWorkOptions: [] })
const sexOptions = [{ label: '男', value: '1' }, { label: '女', value: '0' }]

async function loadDicts() {
  try {
    const [origins, types, levels, depts, specWorks] = await Promise.all([
      getDictByCode(true, 'orderOrigin'), getDictByCode(true, 'orderType'),
      getDictByCode(false, 'orderLevel'), getDeptList(false, true),
      getDictByCode(false, 'specialWork')
    ])
    dicts.orderOrigin = origins || []; dicts.orderType = types || []
    dicts.orderLevel = levels || []; dicts.deptOptions = depts?.data?.data || []
    dicts.specialWorkOptions = specWorks || []
  } catch {}
}

async function handleSubmit(continueAccept = false) {
  if (!model.title) { ElMessage.warning('请输入标题'); return }
  if (!model.callerContent) { ElMessage.warning('请输入内容'); return }
  try {
    loading.value = true
    const res = await saveOrder({ ...model, jxsl: continueAccept ? 1 : 0, orderType: 'special' })
    if (res.data?.code === 200) { ElMessage.success(continueAccept ? '保存成功' : '提交成功'); if (!continueAccept) workbenchNav?.openMenuByCode('zcswSpecial') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { ElMessage.error('操作失败') } finally { loading.value = false }
}

function ckDispose(row) { gdxqwin.value = true; setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(row.orderId), 100) }

onMounted(() => loadDicts())
</script>

<template>
  <Container type="scroll">
    <div class="addOrder">
      <div class="form-panel">
        <div class="panel-head"><span>专项诉求新增</span></div>

        <div class="info-section">
          <div class="section-head"><span>市民信息</span></div>
          <el-form label-width="80px" >
            <el-row :gutter="12">
              <el-col :span="8"><el-form-item label="市民姓名"><el-input v-model="model.name" placeholder="请输入" clearable /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="呼叫号码"><el-input v-model="model.callTel" placeholder="呼叫号码" maxlength="12" show-word-limit clearable /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="性别"><el-select v-model="model.sex" placeholder="选择" clearable><el-option v-for="s in sexOptions" :key="s.value" :label="s.label" :value="s.value" /></el-select></el-form-item></el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12"><el-form-item label="群众地址"><el-input v-model="model.addr" placeholder="请输入地址" clearable /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="事发地址"><el-input v-model="model.orderAddr" placeholder="请输入事发地址" clearable /></el-form-item></el-col>
            </el-row>
          </el-form>
        </div>

        <div class="info-section">
          <div class="section-head"><span>工单信息</span></div>
          <el-form label-width="80px" >
            <el-row :gutter="12">
              <el-col :span="8"><el-form-item label="专项工作"><el-select v-model="model.specialWork" placeholder="请选择" clearable filterable style="width:100%"><el-option v-for="o in dicts.specialWorkOptions" :key="o.dictId" :label="o.dictName" :value="o.dictId" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="工单来源"><el-cascader v-model="model.orderOrigin" :options="dicts.orderOrigin" :props="{ value:'dictId', label:'dictName', children:'children' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="工单级别"><el-select v-model="model.orderLevel" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in dicts.orderLevel" :key="o.dictId" :label="o.dictName" :value="o.dictId" /></el-select></el-form-item></el-col>
            </el-row>
            <el-form-item label="标题"><el-input v-model="model.title" placeholder="请输入工单标题" maxlength="200" show-word-limit /></el-form-item>
            <el-form-item label="内容"><el-input v-model="model.callerContent" type="textarea" :autosize="{ minRows:4, maxRows:12 }" placeholder="请输入工单内容" maxlength="2000" show-word-limit /></el-form-item>
          </el-form>
        </div>

        <div class="info-section">
          <div class="section-head"><span>办理单位</span></div>
          <el-form label-width="80px" >
            <el-row :gutter="12">
              <el-col :span="12"><el-form-item label="处理部门"><el-cascader v-model="model.handlerDeptId" :options="dicts.deptOptions" :props="{ value:'deptId', label:'deptName', children:'children' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="办理部门"><el-cascader v-model="model.acceptDeptId" :options="dicts.deptOptions" :props="{ value:'deptId', label:'deptName', children:'children' }" placeholder="请选择" clearable filterable style="width:100%" /></el-form-item></el-col>
            </el-row>
          </el-form>
        </div>

        <div class="form-actions">
          <el-button type="primary" :loading="loading" @click="handleSubmit(false)">提交</el-button>
          <el-button type="success" :loading="loading" @click="handleSubmit(true)">继续受理</el-button>
          <el-button @click="workbenchNav?.openMenuByCode('zcswSpecial')">返回列表</el-button>
        </div>
      </div>
    </div>
    <Orderinfo ref="orderInfoRef" />
  </Container>
</template>

<style scoped>
.addOrder { min-height: 600px; max-width: 960px; margin: 0 auto; }
.form-panel { border: 1px solid #e6eaf0; border-radius: 8px; background: #fff; }
.panel-head { padding: 12px 16px; border-bottom: 1px solid #f0f4f8; font-weight: 700; font-size: 15px; color: #1c4886; }
.info-section { padding: 14px 16px; border-bottom: 1px solid #f5f7fa; }
.section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 700; font-size: 14px; color: #333; }
.form-actions { display: flex; gap: 10px; padding: 16px; justify-content: center; }
</style>
