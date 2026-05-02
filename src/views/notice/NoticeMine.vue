<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, View } from '@element-plus/icons-vue'
import {
  formatNoticeTime,
  getNoticeDetails,
  getNoticeMineList,
  getNoticeTypes,
  markNoticeRead,
  normalizeNoticeTypes,
  noticeReadOptions
} from '@/services/noticeService'

const props = defineProps({
  query: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['notice-read'])

const loading = ref(false)
const detailLoading = ref(false)
const typeLoading = ref(false)
const detailVisible = ref(false)
const selectedRows = ref([])
const noticeRows = ref([])
const noticeTypes = ref([])
const activeNotice = ref(null)

const searchTime = ref([])
const filters = reactive({
  title: '',
  typeId: '',
  state: '',
  startTime: 0,
  endTime: 0,
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const hasUnreadSelection = computed(() => selectedRows.value.some((row) => row.state !== 1))

function applyQuery(query = props.query) {
  if (query.state !== undefined && query.state !== null && query.state !== '') {
    filters.state = Number(query.state)
  }

  if (query.typeId !== undefined && query.typeId !== null && query.typeId !== '') {
    filters.typeId = Number(query.typeId)
  }
}

function buildParams() {
  return {
    title: filters.title,
    typeId: filters.typeId,
    state: filters.state,
    startTime: filters.startTime,
    endTime: filters.endTime,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize
  }
}

async function loadTypes() {
  typeLoading.value = true

  try {
    const response = await getNoticeTypes()
    if (response.data?.code === 200) {
      noticeTypes.value = normalizeNoticeTypes(response.data.data)
      return
    }
  } catch {
    // The legacy page also keeps a local fallback when the dictionary endpoint is unavailable.
  } finally {
    typeLoading.value = false
  }

  noticeTypes.value = normalizeNoticeTypes()
}

async function loadNotices(options = {}) {
  if (options.pageNum) {
    filters.pageNum = options.pageNum
  }

  if (options.pageSize) {
    filters.pageSize = options.pageSize
  }

  loading.value = true

  try {
    const response = await getNoticeMineList(buildParams())

    if (response.data?.code === 200) {
      const data = response.data.data ?? {}
      noticeRows.value = data.records ?? []
      filters.pageSize = data.size ?? filters.pageSize
      filters.total = data.total ?? 0
      return
    }

    ElMessage.error(response.data?.message || '公告列表加载失败')
  } catch {
    ElMessage.error('公告列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadNotices({ pageNum: 1 })
}

function resetFilters() {
  filters.title = ''
  filters.typeId = ''
  filters.state = ''
  filters.startTime = 0
  filters.endTime = 0
  searchTime.value = []
  loadNotices({ pageNum: 1 })
}

function handleDateRangeChange(value) {
  if (!Array.isArray(value) || value.length !== 2) {
    filters.startTime = 0
    filters.endTime = 0
    return
  }

  filters.startTime = Math.floor(value[0].getTime() / 1000)
  filters.endTime = Math.floor(value[1].getTime() / 1000)
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function openDetails(row) {
  activeNotice.value = row
  detailVisible.value = true
  detailLoading.value = true

  try {
    const response = await getNoticeDetails(row.id)

    if (response.data?.code === 200) {
      const data = response.data.data ?? {}
      activeNotice.value = {
        ...row,
        ...(data.noticeAnnouncement ?? {}),
        addFiles: data.addFiles ?? []
      }
      return
    }

    ElMessage.error(response.data?.message || '公告详情加载失败')
  } catch {
    ElMessage.error('公告详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function markRowsRead(rows) {
  const ids = rows.map((row) => row.id).filter(Boolean)

  if (ids.length === 0) {
    ElMessage.warning('请至少选择一条公告')
    return
  }

  const response = await markNoticeRead(ids)

  if (response.data?.code === 200) {
    ElMessage.success(response.data.message || '已标记为已读')
    emit('notice-read')

    if (activeNotice.value && ids.includes(activeNotice.value.id)) {
      activeNotice.value = {
        ...activeNotice.value,
        state: 1
      }
    }

    await loadNotices()
    return
  }

  ElMessage.error(response.data?.message || '标记已读失败')
}

async function batchRead() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条公告')
    return
  }

  const confirmed = await ElMessageBox.confirm(`确认把这 ${selectedRows.value.length} 条公告标记为已读吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => false)

  if (!confirmed) {
    return
  }

  await markRowsRead(selectedRows.value)
}

watch(
  () => props.query,
  (query) => {
    applyQuery(query)
    loadNotices({ pageNum: 1 })
  },
  { deep: true }
)

onMounted(() => {
  applyQuery()
  loadTypes()
  loadNotices()
})
</script>

<template>
  <section class="notice-mine-page">
    <div class="notice-filter">
      <el-form :model="filters" inline>
        <el-form-item label="标题">
          <el-input
            v-model="filters.title"
            clearable
            placeholder="请输入标题"
            style="width: 210px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="类型">
          <el-select
            v-model="filters.typeId"
            clearable
            filterable
            :loading="typeLoading"
            placeholder="请选择类型"
            style="width: 180px"
          >
            <el-option v-for="item in noticeTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="阅读状态">
          <el-select v-model="filters.state" clearable placeholder="请选择状态" style="width: 150px">
            <el-option v-for="item in noticeReadOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="添加时间">
          <el-date-picker
            v-model="searchTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
            @change="handleDateRangeChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-button type="primary" :disabled="!hasUnreadSelection" @click="batchRead">批量已读</el-button>
    </div>

    <el-table
      border
      stripe
      v-loading="loading"
      :data="noticeRows"
      class="notice-table"
      height="calc(100dvh - 390px)"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="52" />
      <el-table-column type="index" label="序号" width="58" />
      <el-table-column label="标题" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          <button class="notice-title" type="button" @click="openDetails(row)">
            <span v-if="row.state !== 1" class="notice-title__dot"></span>
            {{ row.title || '-' }}
          </button>
        </template>
      </el-table-column>
      <el-table-column prop="typeName" label="类型" width="150" show-overflow-tooltip />
      <el-table-column prop="operatorName" label="发布人" width="140" show-overflow-tooltip />
      <el-table-column label="添加时间" width="170">
        <template #default="{ row }">{{ formatNoticeTime(row.addTime) }}</template>
      </el-table-column>
      <el-table-column label="到期时间" width="130">
        <template #default="{ row }">{{ formatNoticeTime(row.dueTime, false) }}</template>
      </el-table-column>
      <el-table-column label="阅读状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.state === 1 ? 'success' : 'warning'" effect="plain">
            {{ row.state === 1 ? '已读' : '未读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" :icon="View" @click="openDetails(row)">查看</el-button>
          <el-button v-if="row.state !== 1" link type="success" @click="markRowsRead([row])">已读</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="notice-pagination">
      <el-pagination
        v-model:current-page="filters.pageNum"
        v-model:page-size="filters.pageSize"
        background
        :page-sizes="[10, 50, 100, 500]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filters.total"
        @size-change="(pageSize) => loadNotices({ pageSize, pageNum: 1 })"
        @current-change="(pageNum) => loadNotices({ pageNum })"
      />
    </div>

    <el-dialog v-model="detailVisible" title="查看公告" width="72%" :close-on-click-modal="false">
      <article v-if="activeNotice" v-loading="detailLoading" class="notice-detail">
        <header>
          <h2>{{ activeNotice.title }}</h2>
          <p>
            <span>{{ activeNotice.typeName || '通知公告' }}</span>
            <span>{{ activeNotice.operatorName || '-' }}</span>
            <span>{{ formatNoticeTime(activeNotice.addTime) }}</span>
            <span>到期：{{ formatNoticeTime(activeNotice.dueTime, false) }}</span>
          </p>
        </header>

        <section v-if="activeNotice.content" class="notice-detail__content" v-html="activeNotice.content"></section>
        <el-empty v-else description="暂无公告正文" />

        <div v-if="activeNotice.addFiles?.length" class="notice-files">
          <strong>附件</strong>
          <ul>
            <li v-for="file in activeNotice.addFiles" :key="file.id || file.fileId || file.fileName">
              {{ file.fileName || file.name || file.originalName || '附件' }}
            </li>
          </ul>
        </div>
      </article>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="activeNotice?.state !== 1" type="primary" @click="markRowsRead([activeNotice])">
          标记为已读
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.notice-mine-page {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background: var(--kxt-panel);
  box-shadow: 0 24px 60px -44px rgba(49, 103, 221, 0.52);
}

.notice-filter {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 14px 16px 0;
  border: 1px solid var(--kxt-line);
  border-radius: 6px;
  background: #f4f9ff;

  :deep(.el-form) {
    min-width: 0;
    flex: 1;
  }
}

.notice-table {
  --el-table-header-bg-color: #f4f9ff;
  --el-table-row-hover-bg-color: #f4f9ff;
}

.notice-title {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--kxt-brand-deep);
  cursor: pointer;
  text-align: left;

  &:hover {
    color: var(--kxt-brand);
  }
}

.notice-title__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--kxt-danger);
}

.notice-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.notice-detail {
  min-height: 240px;

  header {
    padding-bottom: 14px;
    border-bottom: 1px solid var(--kxt-line);

    h2 {
      margin: 0;
      color: var(--kxt-ink-strong);
      font-size: 22px;
      line-height: 1.35;
    }

    p {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 10px 0 0;
      color: var(--kxt-muted);
      font-size: 13px;
    }
  }
}

.notice-detail__content {
  max-height: 48vh;
  overflow: auto;
  padding: 18px 4px 0;
  color: var(--kxt-ink);
  line-height: 1.8;

  :deep(img) {
    max-width: 100%;
  }
}

.notice-files {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  background: #f4f9ff;

  strong {
    display: block;
    margin-bottom: 8px;
  }

  li {
    line-height: 1.8;
  }
}

@media (max-width: 980px) {
  .notice-filter {
    flex-direction: column;
  }
}
</style>
