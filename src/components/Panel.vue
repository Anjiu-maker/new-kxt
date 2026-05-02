<script setup>
defineProps({
  title: { type: String, default: 'Title' },
  titleTip: { type: String, default: '' },
  titleBottomBorderColor: { type: String, default: '#ddd' },
  showTitle: { type: Boolean, default: true },
  showTitleLine: { type: Boolean, default: true },
  className: { type: String, default: '' }
})
</script>

<template>
  <div class="panel" :class="[className]">
    <div v-if="showTitle" class="title" :style="{ borderBottom: '1px solid ' + titleBottomBorderColor }">
      <div v-if="showTitleLine" class="title-line" />
      <div class="text" :style="{ paddingLeft: showTitleLine ? '10px' : '0px' }" :title="titleTip">
        <slot name="icon" />
        {{ title }}
      </div>
      <div class="tool-bar-right">
        <slot name="tool-bar" />
      </div>
    </div>
    <div class="body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.panel { background: #fff; height: 100%; }
.panel .title { height: 55px; line-height: 55px; padding: 0 10px; position: relative; border-bottom: 1px solid #ddd; }
.panel .title div { display: inline-block; }
.panel .tool-bar-right { position: relative; height: 100%; float: right; }
.panel .title .title-line { position: relative; width: 4px; height: 12px; background: #005293; float: left; bottom: -22px; }
.panel .title .text { position: relative; height: 100%; float: left; left: 8px; padding-left: 10px; line-height: 55px; font-size: 14px; font-family: Microsoft YaHei; font-weight: bold; color: #333; width: auto; }
.panel .body { padding: 0 20px 20px 20px; height: 100%; }
.panel .text > :deep(div) { width: 20px; height: 20px; vertical-align: middle; margin-right: 5px; }
</style>
