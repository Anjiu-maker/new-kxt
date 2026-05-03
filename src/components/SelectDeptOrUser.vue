<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: null },
  width: { type: [Number, String], default: 320 },
  clearable: { type: Boolean, default: false },
  isFilter: { type: Boolean, default: false },
  showTabs: { type: Array, default: () => ['dept', 'user'] },
  lhbl: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'deptClick'])

const activeName = ref(props.showTabs[0] || 'dept')
const labels = ref('')
const ids = ref(null)
const visible = ref(false)
const popoverWidth = ref(props.width)
const filterText = ref('')
const filterText1 = ref('')
const selectRef = ref()
const deptTreeRef = ref()
const deptUserTreeRef = ref()

const ywdw = ref({
  deptOptions: [],
  props: { value: 'deptId', label: 'deptName', children: 'children' },
  defaultExpandedKeys: [],
  defaultCheckedKeys: []
})
const deptAndUser = ref({
  userData: [],
  props: { value: 'id', label: 'label', children: 'children' },
  defaultExpandedKeys: []
})

const showDeptTab = () => props.showTabs.length === 2 || props.showTabs.includes('dept')
const showUserTab = () => props.showTabs.length === 2 || props.showTabs.includes('user')

watch(() => props.modelValue, (val) => { ids.value = val })

function filterNode(value, data) { return data?.deptName?.includes(value) || false }
function filterNode1(value, data) { return data?.label?.includes(value) || false }

watch(filterText, (val) => deptTreeRef.value?.filter(val))
watch(filterText1, (val) => deptUserTreeRef.value?.filter(val))

function handleNodeClick(data) {
  if (props.lhbl) return // checkbox mode handled by check event
  if (activeName.value === 'dept') {
    labels.value = data.deptName
    ids.value = data.deptId
  } else {
    labels.value = data.label
    ids.value = data.id
  }
  visible.value = false
  emit('update:modelValue', ids.value)
  emit('deptClick', data)
}

function handleCheck(data, state) {
  if (state.checkedKeys && state.checkedKeys.length > 0) {
    const checkedNodes = deptTreeRef.value?.getCheckedNodes() || []
    labels.value = checkedNodes.map(n => n.deptName)
    ids.value = checkedNodes.map(n => n.deptId)
  } else {
    labels.value = ''
    ids.value = null
  }
  emit('update:modelValue', ids.value)
}

function removeTag(name) {
  const idx = labels.value.indexOf(name)
  if (idx > -1) { labels.value.splice(idx, 1); ids.value.splice(idx, 1) }
  if (deptTreeRef.value) deptTreeRef.value.setCheckedKeys(ids.value)
  emit('update:modelValue', ids.value)
}

function handleTabClick(tab) { activeName.value = tab.name }

// ── 公开方法 ──
function setDeptData(dept) {
  ywdw.value.deptOptions = dept.deptOptions || dept || []
  if (dept.props) ywdw.value.props = dept.props
  if (dept.defaultExpandedKeys) ywdw.value.defaultExpandedKeys = dept.defaultExpandedKeys
}

function setUserData(user) {
  deptAndUser.value.userData = user || []
  if (user && user.length > 0 && user[0].id) {
    deptAndUser.value.defaultExpandedKeys = [user[0].id]
  }
}

function empty() {
  labels.value = ''
  ids.value = null
  filterText.value = ''
  filterText1.value = ''
  if (deptTreeRef.value) deptTreeRef.value.setCheckedKeys([])
  emit('update:modelValue', null)
}

function setCurrentDept(deptId, deptName) {
  labels.value = deptName
  ids.value = deptId
  nextTick(() => {
    if (deptTreeRef.value) deptTreeRef.value.setCurrentKey(deptId)
    emit('update:modelValue', deptId)
  })
}

function getCheckedNodes() { return deptTreeRef.value?.getCheckedNodes() || [] }
function getNode(key) { return deptTreeRef.value?.getNode(key) }

defineExpose({ setDeptData, setUserData, empty, setCurrentDept, getCheckedNodes, getNode })
</script>

<template>
  <div class="kxt-select-dept-user">
    <el-select
      ref="selectRef"
      v-model="labels"
      :multiple="lhbl"
      :clearable="clearable"
      style="width:100%"
      popper-class="select-option"
      @remove-tag="removeTag"
      @click="visible = !visible"
    />
    <el-popover
      v-model:visible="visible"
      placement="bottom"
      :width="popoverWidth"
      trigger="click"
      popper-class="kxt-select-dept-user-el-popover"
      :show-arrow="false"
    >
      <el-tabs type="border-card" v-model="activeName" @tab-click="handleTabClick">
        <el-tab-pane v-if="showDeptTab()" label="部门信息" name="dept">
          <el-scrollbar max-height="300">
            <el-input v-if="isFilter" v-model="filterText" placeholder="输入关键字筛选"  clearable style="margin-bottom:8px" />
            <el-tree
              ref="deptTreeRef"
              :data="ywdw.deptOptions"
              :props="ywdw.props"
              node-key="deptId"
              :show-checkbox="lhbl"
              :filter-node-method="filterNode"
              :default-expanded-keys="ywdw.defaultExpandedKeys"
              :default-checked-keys="ywdw.defaultCheckedKeys"
              @node-click="handleNodeClick"
              @check="handleCheck"
            />
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane v-if="showUserTab()" label="人员信息" name="user">
          <el-scrollbar max-height="300">
            <el-input v-if="isFilter" v-model="filterText1" placeholder="输入关键字筛选"  clearable style="margin-bottom:8px" />
            <el-tree
              ref="deptUserTreeRef"
              :data="deptAndUser.userData"
              :props="deptAndUser.props"
              :node-key="deptAndUser.props.value"
              :filter-node-method="filterNode1"
              :default-expanded-keys="deptAndUser.defaultExpandedKeys"
              @node-click="handleNodeClick"
            >
              <template #default="{ data }">
                <span class="custom-tree-node"><i :class="data.icon" />{{ data.label || data.deptName }}</span>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </el-popover>
  </div>
</template>

<style>
.select-option { display: none !important; }
.kxt-select-dept-user-el-popover { padding: 0 !important; width: 100%; }
.kxt-select-dept-user-el-popover .el-tree .el-tree-node__content .el-tree-node__expand-icon { right: 5px !important; }
.kxt-select-dept-user-el-popover .el-tabs--border-card > .el-tabs__content { padding: 0 15px 15px !important; }
</style>

<style scoped>
.kxt-select-dept-user { height: 100%; width: 100%; position: relative; }
</style>
