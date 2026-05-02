<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import Orderinfo from '@/components/Orderinfo.vue'
import { useGlobal } from '@/composables/useGlobal'

const props = defineProps({ visible: Boolean, row: Object, page: { type: String, default: '' } })
const emit = defineEmits(['update:visible', 'success'])
const { getDictByCode } = useGlobal()
const innerVisible = ref(false)
const loading = ref(false)
const orderInfoRef = ref()
const dbTypeOptions = ref([])
const formModel = ref({ remarks: '', dbType: null, dbTypeName: '' })

watch(() => props.visible, val => {
  innerVisible.value = val
  if (val && props.row) {
    setTimeout(() => orderInfoRef.value?.reloadDataByOrderId(props.row.orderId), 100)
    loadDbTypes()
  }
})
watch(innerVisible, val => { if (!val) emit('update:visible', false) })

async function loadDbTypes() {
  try { dbTypeOptions.value = await getDictByCode(false, 'dbType') || [] } catch { dbTypeOptions.value = [] }
}

function handleDbTypeChange(val) {
  const found = dbTypeOptions.value.find(d => d.dictId === val)
  formModel.value.dbTypeName = found?.dictName || ''
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确认提交吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const res = await http.post('/orderInfo/addDbqk', { ...formModel.value, orderId: props.row?.orderId, taskId: props.row?.taskId })
    if (res.data?.code === 200) { ElMessage.success('操作成功'); innerVisible.value = false; emit('success') }
    else { ElMessage.error(res.data?.message || '操作失败') }
  } catch { /* cancelled */ } finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="innerVisible" title="督办情况" width="800px" :close-on-click-modal="false" append-to-body @closed="formModel = { remarks:'', dbType:null, dbTypeName:'' }">
    <Orderinfo ref="orderInfoRef" />
    <el-form label-width="90px" size="small" style="margin-top:12px">
      <el-form-item label="督办类型"><el-select v-model="formModel.dbType" placeholder="请选择" filterable style="width:100%" @change="handleDbTypeChange"><el-option v-for="d in dbTypeOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" /></el-select></el-form-item>
      <el-form-item label="督办意见"><el-input v-model="formModel.remarks" type="textarea" :autosize="{ minRows:3 }" placeholder="督办意见" maxlength="500" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="innerVisible = false">关闭</el-button><el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button></template>
  </el-dialog>
</template>
