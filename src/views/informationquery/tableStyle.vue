<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { http } from '@/services/http'

const route = useRoute()

const props = defineProps({
  headList: { type: [Array, Object], required: true }
})

const emit = defineEmits(['saveTabStyle'])

const tabStyleCompShow = ref(false)
const dialogVisible = ref(false)
const defaultLoad = ref(false)
const saveLoad = ref(false)
const tableId = ref(null)
const pagePath = ref('')

function changeTabStyleShow() {
  tabStyleCompShow.value = !tabStyleCompShow.value
}

function change() {}

function start() {}

function end(evt) {
  const data = JSON.parse(JSON.stringify(props.headList[evt.oldIndex]))
  props.headList.splice(evt.oldIndex, 1)
  props.headList.splice(evt.newIndex, 0, data)
}

function move() {}

function saveClick() {
  saveLoad.value = true
  const data = {
    useListType: pagePath.value,
    useListJson: JSON.stringify(props.headList)
  }
  http.post('autoSelfList/save', data).then(res => {
    if (res.data?.code == 200) {
      ElMessage.success(res.data.message)
      tableId.value = res.data.data.id
      emit('saveTabStyle', { normal: false, data: props.headList })
    }
    saveLoad.value = false
  })
}

function getInitTable() {
  const urlArr = route.path.split('/')
  const urlStr = urlArr[urlArr.length - 1]
  pagePath.value = urlStr
  http.get('/autoSelfList/list', { params: { useListType: urlStr } }).then(res => {
    if (res.data?.code == 200) {
      tableId.value = res.data.data.id
      const data = res.data.useListJson ? JSON.parse(res.data.useListJson) : null
      if (!res.data.useListType) {
        emit('saveTabStyle', { normal: true, data })
      } else {
        emit('saveTabStyle', { normal: false, data })
      }
    }
  })
}

function recoverTable() {
  defaultLoad.value = true
  http.post('/autoSelfList/del', { id: tableId.value, useListType: pagePath.value }).then(res => {
    if (res.data?.code == 200) {
      tableId.value = 0
      emit('saveTabStyle', { normal: true, data: null })
      dialogVisible.value = false
      ElMessage.success('恢复默认设置成功,请刷新页面')
    } else {
      ElMessage.error(res.data.message)
    }
    defaultLoad.value = false
  })
}

onMounted(() => {
  getInitTable()
})

defineExpose({ changeTabStyleShow })
</script>

<template>
  <div id="tabStyle">
    <div class="tabStyle" v-if="tabStyleCompShow">
      <div mark></div>
      <div class="listPop">
        <div class="list_title_">
          <div class="list_t">
            <div>
              <span>自定义列&emsp;</span>
              <span>勾选需要显示的列，拖动列名进行排序。</span>
            </div>
            <i class="el-icon-close" @click="changeTabStyleShow"></i>
          </div>
          <div class="list_body_wrap">
            <div class="list_body">
              <draggable
                :options="{ group: 'title', animation: 150 }"
                :value="headList"
                @change="change"
                @start="start"
                @end="end"
                @move="move"
              >
                <div v-for="(item, index) in headList" :key="index" :class="{ l_b_item: true, isHide: !item.show }">
                  <div class="clickWrap" @click="item.show = !item.show">
                    <div class="chexWrap">
                      <el-checkbox v-model="item.show"></el-checkbox>
                      <div class="chexMark"></div>
                    </div>
                    <div class="item_labe">
                      <div class="i_l_name">{{ item.label }}
                        <span class="el-icon-rank"></span>
                      </div>
                      <div class="i_l_plan" :style="{ width: item.width + 'px' }"></div>
                    </div>
                  </div>
                  <div class="item_setting">
                    <span>宽度</span>
                    <input type="text" v-model="item.width">
                    <span>px</span>
                  </div>
                </div>
              </draggable>
            </div>
          </div>
          <div class="btn_list">
            <div class="btn save" @click="saveClick"><i class="el-icon-loading" v-if="saveLoad"></i> 保存</div>
            <div class="btn" @click="changeTabStyleShow">取消</div>
            <div class="btn" @click="dialogVisible = true">恢复设置</div>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      title="提示"
      v-model="dialogVisible"
      :modal-append-to-body="true"
      :append-to-body="true"
      width="30%"
    >
      <span>是否恢复默认设置？</span>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button :loading="defaultLoad" type="primary" @click="recoverTable">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
#tabStyle {
  color: #333;
  position: relative;
}
.listPop {
  width: 800px;
  height: 860px;
  background: #fff;
  position: fixed;
  top: calc(50% - 450px);
  left: calc(50% - 400px);
  z-index: 400;
}
.list_title_ {
  padding: 20px 20px 0;
  font-size: 16px;
}
.list_t {
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.list_t span:last-child { color: #838a9d; font-size: 12px; }
.list_t i { float: right; font-size: 20px; cursor: pointer; }

.list_body_wrap { margin-top: 20px; }
.list_body { border: 1px solid #e5e5e5; width: 100%; height: 700px; }
.l_b_item { border-bottom: 1px solid #ddd; display: flex; align-items: center; }
.clickWrap { display: flex; cursor: pointer; }
.chexWrap { border-right: 1px solid #ddd; width: 26px; height: 26px; display: flex; justify-content: center; align-items: center; position: relative; }
.chexMark { width: 100%; height: 100%; background: rgba(0,0,0,.075); position: absolute; top: 0; left: 0; z-index: 99; opacity: 0; }
.item_labe { width: 560px; height: 26px; padding-left: 10px; font-size: 14px; position: relative; }
.i_l_name { font-weight: 700; height: 100%; display: flex; align-items: center; position: relative; z-index: 6; padding-top: 2px; }
.i_l_name span { font-size: 16px; margin-left: 20px; cursor: move; opacity: 0; }
.i_l_plan { position: absolute; height: 100%; width: 100%; background: #eee; top: 0; left: 0; z-index: 4; border-right: 1px solid #ddd; }
.item_setting { font-size: 13px; margin-left: 60px; }
.item_setting span:first-child { color: #838a9d; }
.item_setting input { border: none; padding: 0 5px; width: 40px; border-radius: 2px; margin: 0 5px; }
.item_setting input:focus { outline: 0; box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(12,100,235,.6); border: 1px solid #dcdcdc; }
.isHide .clickWrap .item_labe .i_l_name { color: #9ea1a9; font-weight: 400; }
.isHide .clickWrap .item_labe .i_l_plan { background: #f8f8f8; }
.l_b_item:hover { background: #E9F2FB; }
.l_b_item:hover .clickWrap .item_labe .i_l_name span { opacity: 1; }

.btn_list { display: flex; margin-top: 10px; }
.btn { text-align: center; line-height: 30px; width: 120px; height: 32px; border: 1px solid #d6dae3; border-radius: 4px; color: #333; margin-right: 10px; font-size: 14px; font-weight: 400; cursor: pointer; }
.save { background: #0c64eb; color: #fff; }

[mark] { width: 100%; height: 100%; position: fixed; top: 0; left: 0; background: rgba(0,0,0,.5); z-index: 399; }
</style>
