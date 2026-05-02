<script setup>
defineProps({
  type: { type: String, default: 'box' },
  showLeftPadding: { type: Boolean, default: true },
  showTopPadding: { type: Boolean, default: true },
  showBottomPadding: { type: Boolean, default: true },
  showRightPadding: { type: Boolean, default: true },
  exteriorHeight: { type: Number, default: 0 }
})
defineEmits(['resize'])
</script>

<template>
  <div
    :class="type === 'scroll' ? 'kxt-container-scroll' : 'kxt-container-box'"
    :style="exteriorHeight ? { height: exteriorHeight + 'px' } : {}"
  >
    <template v-if="type === 'box'">
      <div
        class="wrap"
        :style="{
          paddingLeft: showLeftPadding ? '10px' : '0px',
          paddingTop: showTopPadding ? '10px' : '0px',
          paddingBottom: showBottomPadding ? '10px' : '0px',
          paddingRight: showRightPadding ? '10px' : '0px'
        }"
      >
        <slot />
      </div>
    </template>
    <template v-else>
      <el-scrollbar style="height:100%">
        <slot />
      </el-scrollbar>
    </template>
  </div>
</template>

<style scoped>
.kxt-container-scroll { position: relative; top: 10px; bottom: 40px; height: 100%; overflow: hidden; }
.kxt-container-box { position: relative; top: 10px; bottom: 10px; }
.kxt-container-box .wrap { border: 1px solid #e6eaf0; background: #fff; padding: 10px; height: 100%; overflow: hidden; }
.kxt-container-scroll :deep(.el-scrollbar__wrap) { overflow-x: hidden !important; }
</style>
