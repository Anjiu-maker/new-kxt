<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  method: { type: String, default: '' },
  fields: { type: Array, default: () => [] }
  // fields: [{ code, label, type:0=date/1=text/2=select, data/options }]
})
const emit = defineEmits(['search', 'reset'])

const params = reactive({})
const showMore = ref(false)
const moreFields = ref([])

function getItemClass(type) {
  return type === 0 ? 'oi-date' : 'oi-input'
}

function handleSearch() {
  emit('search', { ...params })
}

function handleReset() {
  Object.keys(params).forEach(k => delete params[k])
  emit('reset')
}

function addMoreField() {
  moreFields.value.push({ code: '', type: 1 })
}

function removeMoreField(idx) {
  moreFields.value.splice(idx, 1)
}

function formatDate(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}
</script>

<template>
  <div class="order-query">
    <template v-for="(item, idx) in fields" :key="idx">
      <div class="oq-item" :class="getItemClass(item.type)">
        <template v-if="item.type === 0">
          <el-date-picker
            v-model="params[item.code]"
            type="datetimerange"
            size="small"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            :default-time="[new Date(2000,1,1,0,0,0), new Date(2000,1,1,23,59,59)]"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width:330px"
          />
        </template>
        <template v-else-if="item.type === 1">
          <el-input v-model="params[item.code]" :placeholder="'请输入' + item.label" style="width:180px" clearable size="small" />
        </template>
        <template v-else-if="item.type === 2">
          <el-select v-model="params[item.code]" :placeholder="'请选择' + item.label" clearable filterable size="small" style="width:180px">
            <el-option v-for="(opt, oi) in (item.options || item.data || [])" :key="oi" :label="opt.label || opt.dictName" :value="opt.value || opt.dictId" />
          </el-select>
        </template>
      </div>
    </template>

    <template v-if="showMore">
      <div v-for="(mf, mfi) in moreFields" :key="'mf' + mfi" class="oq-item oi-input">
        <el-select v-model="mf.code" filterable size="small" placeholder="请选择字段" style="width:180px" @change="(val) => { const f = fields.find(ff => ff.code === val); if (f) mf.type = f.type }">
          <el-option v-for="item in fields" :key="item.code" :label="item.label" :value="item.code" />
        </el-select>
        <el-input v-if="mf.type === 1" v-model="params[mf.code]" :placeholder="'请输入'" style="width:180px;margin-left:6px" clearable size="small" />
      </div>
    </template>

    <el-button @click="showMore = !showMore" size="small" :icon="showMore ? 'ArrowUp' : 'ArrowDown'">更多</el-button>
    <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
    <el-button v-if="showMore" size="small" @click="addMoreField">添加</el-button>
    <el-button v-if="showMore && moreFields.length" size="small" type="danger" @click="removeMoreField(moreFields.length - 1)">删除</el-button>
    <el-button type="warning" size="small" @click="handleReset">重置</el-button>
    <slot />
  </div>
</template>

<style scoped>
.order-query { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.oq-item { display: inline-flex; align-items: center; }
</style>
