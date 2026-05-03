<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { http } from '@/services/http'
import { useGlobal } from '@/composables/useGlobal'
import queryData from '@/utils/integratedQuery'

const props = defineProps({ method: { type: String, default: '' } })
const emit = defineEmits(['search', 'reset'])

const { getDictByCode } = useGlobal()

// ── 状态 ──
const showMore = ref(false)
const itemList = ref([])         // 所有可选字段
const defaultItemList = ref([])  // 默认显示的字段
const userGroupList = ref([])    // dfp 方法的小组列表
const params = reactive({})

const moreItemList = ref([{ code: '', label: '', orderby: 1, type: 1, typeName: '输入框' }])

// Tree/cascader props
const deptProps = { value: 'deptId', label: 'deptName', children: 'children', expandTrigger: 'hover', checkStrictly: true }
const dictProps = { value: 'dictId', label: 'dictName', children: 'children', expandTrigger: 'hover' }
const dictProps1 = { value: 'dictId', label: 'dictName', children: 'children', expandTrigger: 'hover', checkStrictly: true }
const originDictProps = { value: 'dictId', label: 'dictName', children: 'children', expandTrigger: 'hover', checkStrictly: false, multiple: true }

// ── 默认时间范围 ──
function getMonthStartEnd(offset = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  return [start, end]
}

function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── 字段 class ──
function getItemClass(type) {
  const map = { 0: 'item-datetimerange', 1: 'item-input', 2: 'item-select', 3: 'item-cascader' }
  return map[type] || 'item-radio'
}

// ── 查询触发 ──
function handleSearch() {
  emit('search', handleParams(JSON.parse(JSON.stringify(params))))
}

function handleReset() {
  Object.keys(params).forEach(k => delete params[k])
  moreItemList.value = [{ code: '', label: '', orderby: 1, type: 1, typeName: '输入框' }]
  emit('reset')
}

// ── 参数转换（date range → start/end, cascader → comma string） ──
function handleParams(data) {
  if (!data) return {}

  // 日期范围 → Start/End
  const dateFields = ['createTime', 'handleEndTime', 'transferTime', 'upReportTime', 'callbackTime', 'placeOnFileTime', 'incidentTime', 'sptHandleEndTime']
  dateFields.forEach(f => {
    if (data[f] && Array.isArray(data[f]) && data[f].length === 2) {
      const key = f === 'sptHandleEndTime' ? 'spt' : f
      data[key + 'StartTime'] = data[f][0]
      data[key + 'EndTime'] = data[f][1]
      delete data[f]
    }
  })

  // Cascader → last value or comma join
  if (data.handlerDeptId && Array.isArray(data.handlerDeptId)) data.handlerDeptId = data.handlerDeptId[data.handlerDeptId.length - 1]
  if (data.acceptDeptId && Array.isArray(data.acceptDeptId)) data.acceptDeptId = data.acceptDeptId[data.acceptDeptId.length - 1]

  if (data.orderOrigin && Array.isArray(data.orderOrigin)) {
    const origins = []; const origins2 = []
    data.orderOrigin.forEach(item => { origins.push(item[0]); if (item[1]) origins2.push(item[1]) })
    data.orderOrigin = [...new Set(origins)].join(',')
    data.orderOrigin2 = [...new Set(origins2)].join(',')
  }

  // All remaining arrays → comma string
  Object.keys(data).forEach(k => {
    if (Array.isArray(data[k])) data[k] = data[k].join(',')
  })

  return data
}

// ── 更多字段操作 ──
function toggleMore() { showMore.value = !showMore.value }

function addMoreItem() {
  moreItemList.value.push({ code: '', label: '', orderby: 1, type: 1, typeName: '输入框' })
}

function delMoreItem() {
  if (moreItemList.value.length > 1) {
    const last = moreItemList.value[moreItemList.value.length - 1]
    delete params[last.code]
    moreItemList.value.pop()
  }
}

// ── 字段切换时加载数据 ──
function changeField(val) {
  delete params[val]
  const found = itemList.value.find(i => i.code === val)
  if (!found) return
  // 更新 moreItemList 中对应项
  const target = moreItemList.value.find(i => i.code === val)
  if (target) target.type = found.type
  // 加载字段数据
  setFieldData(val)
}

const dictFieldCodes = ['orderOrigin', 'handlerDeptId', 'deptId', 'acceptDeptId', 'orderType', 'hotspot', 'orderLevel', 'callbackFailReason', 'qualityTester']
const staticDictCodes = ['handleType', 'orderSubState', 'orderSubStateE', 'transferInfo', 'handleInfo', 'satisfactionss', 'zxAppraise', 'qualityLabelId', 'deptSatisfactionss']

function setFieldData(code) {
  if (!dictFieldCodes.includes(code) && !staticDictCodes.includes(code)) return

  const setData = (c, d) => {
    moreItemList.value.forEach(o => { if (o.code === c) o.data = d })
    defaultItemList.value.forEach(o => { if (o.code === c) o.data = d })
  }

  switch (code) {
    case 'orderOrigin':
      getDictByCode(true, 'swly').then(r => setData('orderOrigin', r)); break
    case 'handlerDeptId':
    case 'deptId':
    case 'acceptDeptId':
      http.get('/dept/comprehensiveQueryDepartmentTree').then(res => {
        if (res.data?.code === 200) { setData('handlerDeptId', res.data.data); setData('deptId', res.data.data); setData('acceptDeptId', res.data.data) }
      }); break
    case 'orderType':
      getDictByCode(false, 'swlx').then(r => setData('orderType', r)); break
    case 'hotspot':
      getDictByCode(true, 'rdfl').then(r => setData('hotspot', r)); break
    case 'orderLevel':
      http.get('/order_level/list?flag=false').then(res => {
        if (res.data?.code === 200) setData('orderLevel', res.data.data)
      }); break
    case 'callbackFailReason':
      getDictByCode(false, 'hfsbyy').then(r => setData('callbackFailReason', r)); break
    case 'qualityTester':
      http.get('/group/findGroupSonUser').then(res => {
        if (res.data?.code === 200) {
          const list = (res.data.data?.ZHIJIANZU || []).map(u => ({ dictId: u.userId, dictName: u.userName }))
          setData('qualityTester', list)
        }
      }); break
    default:
      if (queryData[code]) setData(code, queryData[code])
      break
  }
}

// ── 小组列表（dfp） ──
async function loadUserGroups() {
  try { const r = await http.get('/group/list', { params: { deptId: 15, flag: false } }); if (r.data?.code === 200) userGroupList.value = r.data.data || [] } catch { userGroupList.value = [] }
}

// ── 初始化 ──
async function init() {
  loadUserGroups()
  // 清除上次的参数和更多条件
  Object.keys(params).forEach(k => delete params[k])
  moreItemList.value = [{ code: '', label: '', orderby: 1, type: 1, typeName: '输入框' }]
  showMore.value = false

  try {
    const res = await http.get('/queryItem/query_list')
    if (res.data?.code === 200) {
      const allFields = res.data.data || []
      itemList.value = allFields

      // 综合查询方法：限制可选字段
      if (['orderSearch', 'orderSearchCy'].includes(props.method)) {
        itemList.value = allFields.filter(o =>
          ['登记时间', '工单级别', '热点分类', '来电内容', '问题属地', '承办单位', '办理部门', '办理结果评价', '专项工作'].includes(o.label)
        )
      }

      const defaultCodes = ['orderNo', 'callTel', 'name', 'title']
      const withTime = [...defaultCodes, 'createTime']

      // method 特定预设（带日期默认值 + 自动查询）
      if (['dgd', 'remindersRed', 'gdsw', 'dfp', 'znjth'].includes(props.method)) {
        const codes = props.method === 'dfp' ? ['orderNo', 'callTel', 'title', 'createTime'] : withTime
        defaultItemList.value = allFields.filter(o => codes.includes(o.code))
        itemList.value = allFields.filter(o => !codes.includes(o.code))
        params.createTime = [formatDate(getMonthStartEnd(0)[0]) + ' 00:00:00', formatDate(getMonthStartEnd(0)[1]) + ' 23:59:59']
        handleSearch()
      } else if (['reBack', 'reAssign', 'emphasis'].includes(props.method)) {
        defaultItemList.value = allFields.filter(o => withTime.includes(o.code))
        itemList.value = allFields.filter(o => !withTime.includes(o.code))
        const d = new Date()
        params.createTime = [formatDate(new Date(d.getTime() - 7 * 86400000)) + ' 00:00:00', formatDate(d) + ' 23:59:59']
        handleSearch()
      } else {
        defaultItemList.value = allFields.filter(o => defaultCodes.includes(o.code))
        itemList.value = allFields.filter(o => !defaultCodes.includes(o.code))
      }
    }
  } catch {}
}

onMounted(() => init())
watch(() => props.method, () => init())
</script>

<template>
  <div class="order-query">
    <!-- 默认字段 -->
    <template v-for="(item, idx) in defaultItemList" :key="'d' + idx">
      <div :class="[getItemClass(item.type), method === 'dfp' ? 'current' : '']">
        <!-- 日期范围 -->
        <template v-if="item.type === 0">
          <el-date-picker
            v-model="params[item.code]"
            type="datetimerange"
            
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width:330px"
          />
          <!-- dfp 方法：日期后附加小组选择 -->
          <el-select
            v-if="method === 'dfp'"
            v-model="params['userGroupId']"
            style="width:180px;margin-left:10px"
            clearable  multiple collapse-tags placeholder="请选择小组"
          >
            <el-option v-for="g in userGroupList" :key="g.groupId" :label="g.groupName" :value="g.groupId" />
          </el-select>
        </template>

        <!-- 文本输入 -->
        <template v-else-if="item.type === 1">
          <el-input v-model="params[item.code]" :placeholder="'请输入' + item.label" style="width:180px" clearable  />
        </template>

        <!-- 下拉选择 -->
        <template v-else-if="item.type === 2">
          <el-select
            v-if="item.code === 'orderLevel'"
            v-model="params[item.code]"  clearable filterable placeholder="请选择级别" style="width:180px"
          >
            <el-option v-for="l in (item.data || [])" :key="l.levelId" :label="l.levelName + ' (' + l.handleDays + '日)'" :value="l.levelId" />
          </el-select>
          <el-select v-else v-model="params[item.code]" :placeholder="'请选择' + item.label" clearable filterable  style="width:180px">
            <el-option v-for="o in (item.data || [])" :key="o.dictId || o.value" :label="o.dictName || o.label" :value="o.dictId || o.value" />
          </el-select>
        </template>

        <!-- 级联选择 -->
        <template v-else-if="item.type === 3">
          <el-cascader
            v-if="item.code === 'orderOrigin'"
            v-model="params[item.code]" collapse-tags clearable filterable
            :placeholder="'请选择' + item.label" :options="item.data || []" :props="originDictProps"
            style="width:270px" 
          />
          <el-cascader
            v-else
            v-model="params[item.code]" clearable filterable
            :placeholder="'请选择' + item.label" :options="item.data || []"
            :props="['handlerDeptId', 'acceptDeptId', 'deptId'].includes(item.code) ? deptProps : dictProps1"
            style="width:180px" 
          />
        </template>

        <!-- 单选 -->
        <template v-else>
          <el-select v-model="params[item.code]" filterable :placeholder="'请选择' + item.label" clearable  style="width:180px">
            <el-option
              v-for="o in (item.code === 'sex' ? [{ label: '男', value: '1' }, { label: '女', value: '0' }] : [{ label: '是', value: '1' }, { label: '否', value: '0' }])"
              :key="o.value" :label="o.label" :value="o.value"
            />
          </el-select>
        </template>
      </div>
    </template>

    <!-- 更多字段 -->
    <slot />

    <!-- 操作按钮 -->
    <el-button @click="toggleMore"  :icon="showMore ? 'ArrowUp' : 'ArrowDown'" />
    <el-button type="primary"  @click="handleSearch">查询</el-button>
    <el-button v-if="['orderSearch', 'orderSearchCy'].includes(method)" type="warning"  @click="handleReset">重置</el-button>
    <template v-if="showMore">
      <el-button type="danger"  @click="delMoreItem">删除</el-button>
      <el-button type="primary"  @click="addMoreItem">添加</el-button>
      <el-button type="warning"  @click="handleReset">重置</el-button>
    </template>

    <!-- 更多字段列表 -->
    <div v-if="showMore" class="more-item">
      <template v-for="(item, idx) in moreItemList" :key="'m' + idx">
        <div class="item-wrapper">
          <el-select
            v-model="item.code" @change="changeField"
            filterable  placeholder="请选择字段" style="width:180px"
          >
            <el-option v-for="f in itemList" :key="f.id || f.code" :label="f.label" :value="f.code" />
          </el-select>

          <template v-if="item.type === 0">
            <el-date-picker v-model="params[item.code]" type="datetimerange" 
              value-format="YYYY-MM-DD HH:mm:ss" range-separator="-"
              :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              start-placeholder="开始日期" end-placeholder="结束日期" style="width:330px"
            />
          </template>
          <template v-else-if="item.type === 1">
            <el-input v-model="params[item.code]" :placeholder="'请输入'" style="width:180px" clearable  />
          </template>
          <template v-else-if="item.type === 2">
            <el-select v-if="item.code === 'orderLevel'" v-model="params[item.code]"  clearable filterable placeholder="请选择级别" style="width:180px">
              <el-option v-for="l in (item.data || [])" :key="l.levelId" :label="l.levelName + ' (' + l.handleDays + '日)'" :value="l.levelId" />
            </el-select>
            <el-select v-else v-model="params[item.code]" :placeholder="'请选择'" clearable filterable  style="width:180px">
              <el-option v-for="o in (item.data || [])" :key="o.dictId || o.value" :label="o.dictName || o.label" :value="o.dictId || o.value" />
            </el-select>
          </template>
          <template v-else-if="item.type === 3">
            <el-cascader v-if="item.code === 'orderOrigin'" v-model="params[item.code]" collapse-tags clearable filterable
              :placeholder="'请选择'" :options="item.data || []" :props="originDictProps" style="width:270px" 
            />
            <el-cascader v-else v-model="params[item.code]" clearable filterable
              :placeholder="'请选择'" :options="item.data || []"
              :props="['handlerDeptId', 'acceptDeptId', 'deptId'].includes(item.code) ? deptProps : dictProps1"
              style="width:180px" 
            />
          </template>
          <template v-else>
            <el-select v-model="params[item.code]" filterable :placeholder="'请选择'" clearable  style="width:180px">
              <el-option v-for="o in [{ label: '是', value: '1' }, { label: '否', value: '0' }]" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.order-query { width: 80%; display: inline-block; }
.order-query .item-datetimerange { width: 330px; display: inline-block; margin: 0 5px; }
.order-query .current { width: 530px; }
.order-query .item-input, .order-query .item-radio, .order-query .item-select, .order-query .item-cascader {
  width: 180px; display: inline-block; margin: 0 5px;
}
.more-item { margin-top: 8px; }
.more-item .item-wrapper { margin: 5px 10px 5px 0; display: inline-block; }
</style>
