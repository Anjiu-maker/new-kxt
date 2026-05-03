<script setup>
import BasePagination from "@/components/Pagination/index.vue";

const props = defineProps({
  list: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  keyword: { type: String, default: "" },
  recommendedDeptActive: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:keyword",
  "update:recommendedDeptActive",
  "search",
  "view-detail",
  "pagination",
]);

function stripHtmlText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function titleHtml(item) {
  return item.highLineTitle || item.title || "未命名知识点";
}

function summaryHtml(item) {
  return item.highLineContent || item.content || "暂无内容摘要";
}

function summaryTitle(item) {
  return stripHtmlText(item.content || item.highLineContent);
}

function dept(item) {
  return item.sub_dept_name || "知识库";
}

function date(item) {
  return item.on_line_time || "";
}

function views(item) {
  return item.read_time || 0;
}
</script>

<template>
  <div class="knowledge-browser">
    <div class="knowledge-search">
      <el-input
        :model-value="props.keyword"
        clearable
        placeholder="请输入关键字"
        @update:model-value="emit('update:keyword', $event)"
        @keyup.enter="emit('search')"
      />
      <el-button type="primary" @click="emit('search')">检索</el-button>
    </div>
    <div class="knowledge-summary">
      <span>共找到 <strong>{{ props.total || props.list.length }}</strong> 条相关知识点</span>
    </div>
    <div v-if="props.list.length" class="knowledge-card-list">
      <article
        v-for="(item, idx) in props.list"
        :key="item.knowledge_id || item.id || item.klKnowledgeId || idx"
        class="knowledge-card"
        @click="emit('view-detail', item)"
      >
        <div class="knowledge-icon" aria-hidden="true"></div>
        <div class="knowledge-main">
          <h3 class="knowledge-title" v-html="titleHtml(item)"></h3>
          <p class="knowledge-excerpt" :title="summaryTitle(item)">
            <span>内容摘要：</span><span v-html="summaryHtml(item)"></span>
          </p>
          <div class="knowledge-meta">
            <span class="knowledge-dept">{{ item.sub_dept_name || "知识库" }}</span>
            <span v-if="date(item)" class="knowledge-date">创建时间：{{ item.on_line_time || "" }}</span>
          </div>
        </div>
        <div class="knowledge-views">
          <el-icon><View /></el-icon>
          <strong>{{ item.read_time || 0 }}人次</strong>
          <span>浏览量</span>
        </div>
      </article>
    </div>
    <el-empty v-else description="暂无知识库信息" :image-size="56" />
    <BasePagination
      :page="props.page"
      :limit="props.pageSize"
      :total="props.total"
      :page-sizes="[5, 10, 20, 30]"
      layout="total, sizes, prev, pager, next"
      :auto-scroll="false"
      class="knowledge-pagination"
      @pagination="emit('pagination', $event)"
    />
  </div>
</template>

<style scoped lang="scss">
$line: #d8e5f0;

.knowledge-browser {
  min-height: 492px;
  background: #fbfdff;
}

.knowledge-search {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 88px;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid $line;
  background: #fff;
}

.knowledge-search :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px #c7d6ea;
}

.knowledge-search :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px #2867d8,
    0 0 0 3px rgba(40, 103, 216, 0.12);
}

.knowledge-search :deep(.el-button) {
  height: 42px;
  min-width: 88px;
  border-radius: 5px;
  font-weight: 700;
}

.knowledge-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px 10px;
  background: #fbfdff;
  color: #1f2b3d;
  line-height: 30px;
}

.knowledge-summary strong {
  color: #2867d8;
  font-size: 18px;
}

.knowledge-summary :deep(.el-radio-button__inner) {
  height: 30px;
  padding: 0 12px;
  border-color: #c7d6ea;
  line-height: 28px;
}

.knowledge-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 18px 16px;
}

.knowledge-card {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
  min-height: 108px;
  padding: 18px 18px 15px;
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(25, 60, 110, 0.035);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.knowledge-card:hover {
  border-color: #aac3ea;
  box-shadow: 0 10px 26px rgba(25, 60, 110, 0.075);
  transform: translateY(-1px);
}

.knowledge-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #cfe0ff;
  border-radius: 8px;
  background: linear-gradient(180deg, #f0f6ff, #e7f0ff);
  color: #2867d8;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.72);
}

.knowledge-icon::before {
  width: 18px;
  height: 22px;
  border: 2px solid currentColor;
  border-radius: 3px;
  background:
    linear-gradient(currentColor, currentColor) 4px 6px / 8px 2px no-repeat,
    linear-gradient(currentColor, currentColor) 4px 12px / 12px 2px no-repeat;
  content: "";
}

.knowledge-main {
  min-width: 0;
  padding-right: 112px;
}

.knowledge-title {
  margin: 0 0 8px;
  overflow: hidden;
  color: #0864f7;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-excerpt {
  margin: 0;
  overflow: hidden;
  color: #25364d;
  line-height: 1.65;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-excerpt span:first-child {
  color: #0f1d2f;
  font-weight: 700;
}

.knowledge-title :deep(.red-font),
.knowledge-excerpt :deep(.red-font) {
  color: #cc0000;
  font-style: normal;
}

.knowledge-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
  color: #7b8aa0;
}

.knowledge-dept {
  display: inline-flex;
  align-items: center;
  max-width: 170px;
  height: 24px;
  padding: 0 10px;
  overflow: hidden;
  border: 1px solid #bfe8d8;
  border-radius: 5px;
  background: #e8f7f1;
  color: #149a6d;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-date {
  color: #8b98a9;
}

.knowledge-views {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7b8aa0;
  white-space: nowrap;
}


.knowledge-views strong {
  order: 2;
  color: #66758a;
  font-weight: 500;
}

.knowledge-views span {
  order: 1;
}

.knowledge-pagination {
  padding: 0 18px 14px;
}
</style>
