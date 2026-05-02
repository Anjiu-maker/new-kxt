import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCtiStore = defineStore('cti', () => {
  const authStore = useAuthStore()

  // ---- state ----
  const ctiState = ref('空闲')
  const ctiTelNumState = ref('')
  const ctiCurrentTel = ref('')
  const ctiCurrentTelGsd = ref('')
  const ctiCurrentWaitNum = ref(0)
  const ctiCurrentWaitNumList = ref([])
  const ctiCurrentWaitTime = ref(0)
  const ctiTopBarStateText = ref('')
  const ctiTopBarStateValue = ref('')
  const ctiLastState = ref('')
  const isCtiNormal = ref(true)
  const ctiDirection = ref('')

  const qrqcActive = ref(true)

  const toolbarBtnState = ref({
    qianru: true,
    shixian: true,
    baochi: true
  })

  // ---- constants ----
  const toolbarStateText = {
    login: '登录',
    logout: '退出',
    kongxian: '空闲',
    tonghua: '通话',
    manglu: '忙碌',
    xiaoxiu: '小休',
    shihouchuli: '事后处理',
    weidenglu: '未登录',
    yizhuce: '已注册',
    weizhuce: '未注册',
    txyc: '通讯异常',
    dxcl: '断线重连',
    tjgdz: '暂缓'
  }

  const stateColorMap = {
    shihouchuli: { state: '事后处理', color: '#1F80B8' },
    tonghua: { state: '通话', color: '#f44336' },
    zaixian: { state: '在线', color: '#8bc34a' },
    kongxian: { state: '空闲', color: '#00bcd4' },
    manglu: { state: '忙碌', color: '#ff9800' },
    lixian: { state: '离线', color: '#9e9e9e' }
  }

  // ---- computed ----
  const showTel = computed(() => {
    return authStore.hasPermission('rdh', 2)
  })

  const showZnzs = computed(() => {
    return authStore.hasPermission('znzs', 2)
  })

  const showSxbdk = computed(() => {
    return authStore.hasPermission('sxbdk', 2)
  })

  const showDlsm = computed(() => {
    return authStore.hasPermission('dlsm', 2)
  })

  const stateColor = computed(() => {
    let color = '#8bc34a'
    const entries = Object.values(stateColorMap)
    for (const entry of entries) {
      if (entry.state === ctiState.value) {
        color = entry.color
        break
      }
    }
    return color
  })

  // ---- actions ----
  function setCtiState(state) {
    ctiState.value = state
  }

  function setCtiTelNumState(state) {
    ctiTelNumState.value = state
  }

  function setCtiCurrentTel(tel) {
    ctiCurrentTel.value = tel
  }

  function setCtiCurrentTelGsd(gsd) {
    ctiCurrentTelGsd.value = gsd
  }

  function setCtiTopBarState(text, value) {
    ctiTopBarStateText.value = text
    ctiTopBarStateValue.value = value
  }

  function setCtiWaitNum(num, list) {
    ctiCurrentWaitNum.value = num ?? 0
    ctiCurrentWaitNumList.value = list ?? []
  }

  function setQrqcActive(value) {
    qrqcActive.value = value
  }

  function updateToolbarBtnState(patch) {
    Object.assign(toolbarBtnState.value, patch)
  }

  function resetCti() {
    ctiState.value = '空闲'
    ctiTelNumState.value = ''
    ctiCurrentTel.value = ''
    ctiCurrentTelGsd.value = ''
    ctiCurrentWaitNum.value = 0
    ctiCurrentWaitNumList.value = []
    ctiCurrentWaitTime.value = 0
    ctiTopBarStateText.value = ''
    ctiTopBarStateValue.value = ''
    ctiLastState.value = ''
    isCtiNormal.value = true
    ctiDirection.value = ''
    qrqcActive.value = true
    toolbarBtnState.value = { qianru: true, shixian: true, baochi: true }
  }

  return {
    // state
    ctiState,
    ctiTelNumState,
    ctiCurrentTel,
    ctiCurrentTelGsd,
    ctiCurrentWaitNum,
    ctiCurrentWaitNumList,
    ctiCurrentWaitTime,
    ctiTopBarStateText,
    ctiTopBarStateValue,
    ctiLastState,
    isCtiNormal,
    ctiDirection,
    qrqcActive,
    toolbarBtnState,

    // constants
    toolbarStateText,
    stateColorMap,

    // computed
    showTel,
    showZnzs,
    showSxbdk,
    showDlsm,
    stateColor,

    // actions
    setCtiState,
    setCtiTelNumState,
    setCtiCurrentTel,
    setCtiCurrentTelGsd,
    setCtiTopBarState,
    setCtiWaitNum,
    setQrqcActive,
    updateToolbarBtnState,
    resetCti
  }
})
