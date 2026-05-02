<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  theUrl: { type: String, required: true },
  callID: { type: String, default: '' },
  isHaveDownLoad: { type: Boolean, default: false },
  autoRun: { type: Boolean, default: false }
})
const emit = defineEmits(['soundError'])

const audioRef = ref(null)
const playing = ref(false)
const muted = ref(false)
const volume = ref(100)
const speed = ref(1)
const currentTime = ref(0)
const maxTime = ref(0)
const waiting = ref(true)
const sliderTime = ref(0)
const isSliderChange = ref(false)
const speeds = [1, 1.5, 2]

function formatSecond(second) {
  if (typeof second !== 'number' && typeof second !== 'string') return '0:00:00'
  second = parseInt(second)
  const hours = Math.floor(second / 3600)
  second = second - hours * 3600
  const minute = Math.floor(second / 60)
  second = second - minute * 60
  return hours + ':' + ('0' + minute).slice(-2) + ':' + ('0' + second).slice(-2)
}

function startPlayOrPause() { playing.value ? audioRef.value?.pause() : audioRef.value?.play() }
function changeSpeed() {
  const idx = speeds.indexOf(speed.value) + 1
  speed.value = speeds[idx % speeds.length]
  if (audioRef.value) audioRef.value.playbackRate = speed.value
}
function startMutedOrNot() {
  if (audioRef.value) { audioRef.value.muted = !audioRef.value.muted; muted.value = audioRef.value.muted; volume.value = muted.value ? 0 : 100 }
}
function changeVolume(idx) { if (audioRef.value) { audioRef.value.volume = idx / 100; volume.value = idx } }
function changeCurrentTime(newValue) {
  const temp = parseInt(newValue / 100 * maxTime.value)
  if (audioRef.value) { audioRef.value.currentTime = temp; currentTime.value = temp }
  sliderTime.value = newValue; isSliderChange.value = false
}
function onTimeupdate(e) {
  if (!isSliderChange.value) { currentTime.value = e.target.currentTime; sliderTime.value = parseInt(currentTime.value / maxTime.value * 100) }
}
function onLoadedmetadata(e) { waiting.value = false; maxTime.value = parseInt(e.target.duration) }
function onPlay() { playing.value = true; waiting.value = false }
function onPause() { playing.value = false }
function onError() { waiting.value = false; emit('soundError') }
function downloadSount() {
  const baseApi = window.common?.ctiBaseAPi || window.__KXT_CONFIG__?.ctiBaseAPi || ''
  if (props.callID && baseApi) { window.open(`${baseApi}/Oms/FileDownServlet?callid=${props.callID}`) }
}

watch(() => props.theUrl, () => { if (props.autoRun) { setTimeout(() => audioRef.value?.play(), 200) } })
</script>

<template>
  <div class="my-audio" v-loading="waiting">
    <audio ref="audioRef" class="dn" :src="theUrl" preload="auto"
      @play="onPlay" @error="onError" @waiting="() => {}" @pause="onPause"
      @timeupdate="onTimeupdate" @loadedmetadata="onLoadedmetadata" />
    <el-button text @click="startPlayOrPause">{{ playing ? '暂停' : '播放' }}</el-button>
    <el-button text @click="changeSpeed">快进: x{{ speed }}</el-button>
    <el-tag type="info">{{ formatSecond(currentTime) }}</el-tag>
    <div class="slider-wrap" @mousedown="isSliderChange = true">
      <el-slider v-model="sliderTime" class="slider" :format-tooltip="(i) => '进度: ' + formatSecond(parseInt(maxTime / 100 * i))" @change="changeCurrentTime" />
    </div>
    <el-tag type="info">{{ formatSecond(maxTime) }}</el-tag>
    <el-button text @click="startMutedOrNot">{{ muted ? '放音' : '静音' }}</el-button>
    <el-slider v-model="volume" class="slider" :format-tooltip="(i) => '音量: ' + i" @change="changeVolume" />
    <el-link v-if="isHaveDownLoad" type="primary" style="margin-left:12px" @click="downloadSount">下载</el-link>
  </div>
</template>

<style scoped>
.my-audio { display: inline-flex; align-items: center; gap: 4px; }
.slider { display: inline-block; width: 100px; position: relative; top: 2px; margin: 0 5px; }
.slider-wrap { display: inline-block; }
.dn { display: none; }
</style>
