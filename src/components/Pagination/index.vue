<template>
  <div :class="{ hidden }" class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="total"
      v-bind="$attrs"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { scrollTo } from "@/utils/scroll-to";

defineOptions({
  name: "BasePagination",
});

const props = defineProps({
  total: { required: true, type: Number },
  page: { type: Number, default: 1 },
  limit: { type: Number, default: 20 },
  pageSizes: { type: Array, default: () => [5, 10, 20, 30, 50] },
  pagerCount: { type: Number, default: document.body.clientWidth < 992 ? 5 : 7 },
  layout: { type: String, default: "total, sizes, prev, pager, next, jumper" },
  background: { type: Boolean, default: true },
  autoScroll: { type: Boolean, default: true },
  hidden: { type: Boolean, default: false },
});

const emit = defineEmits(["update:page", "update:limit", "pagination"]);

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit("update:page", val),
});

const pageSize = computed({
  get: () => props.limit,
  set: (val) => emit("update:limit", val),
});

function handleSizeChange(val) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1;
  }
  emit("pagination", { page: currentPage.value, limit: val });
  if (props.autoScroll) scrollTo(0, 800);
}

function handleCurrentChange(val) {
  emit("pagination", { page: val, limit: pageSize.value });
  if (props.autoScroll) scrollTo(0, 800);
}
</script>

<style lang="scss" scoped>
.pagination-container {
  padding: 10px 16px;
  background: #fff;

  :deep(.el-pagination) {
    justify-content: flex-end;
  }
}

.pagination-container.hidden {
  display: none;
}
</style>
