import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/services/http'
import { createCtiSocket } from '@/services/ctiSocket'
import { useAuthStore } from './auth'

let socketManager = null

function secondsFormat(result) {
  const h = String(Math.floor(result / 3600)).padStart(2, '0')
  const m = String(Math.floor((result / 60) % 60)).padStart(2, '0')
  const s = String(Math.floor(result % 60)).padStart(2, '0')
  if (h === '00') {
    return `${m}:${s}`
  }
  return `${h}:${m}:${s}`
}

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
  const ctiDlsm = ref(false)
  const ctiCaller = ref('')
  const ctiCallee = ref('')
  const ctiCallId = ref('')

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
  const showTel = computed(() => authStore.hasPermission('rdh', 2))
  const showZnzs = computed(() => authStore.hasPermission('znzs', 2))
  const showSxbdk = computed(() => authStore.hasPermission('sxbdk', 2))
  const showDlsm = computed(() => authStore.hasPermission('dlsm', 2))

  const stateColor = computed(() => {
    for (const entry of Object.values(stateColorMap)) {
      if (entry.state === ctiState.value) {
        return entry.color
      }
    }
    return '#8bc34a'
  })

  // ---- simple setters ----
  function setCtiState(state) { ctiState.value = state }
  function setCtiTelNumState(state) { ctiTelNumState.value = state }
  function setCtiCurrentTel(tel) { ctiCurrentTel.value = tel }
  function setCtiCurrentTelGsd(gsd) { ctiCurrentTelGsd.value = gsd }
  function setCtiTopBarState(text, value) { ctiTopBarStateText.value = text; ctiTopBarStateValue.value = value }
  function setCtiWaitNum(num, list) { ctiCurrentWaitNum.value = num ?? 0; ctiCurrentWaitNumList.value = list ?? [] }
  function setQrqcActive(value) { qrqcActive.value = value }
  function updateToolbarBtnState(patch) { Object.assign(toolbarBtnState.value, patch) }

  // ---- CTI log ----
  function ctiLog({ state, subState, ignore_state, contain_state, is_login_log } = {}) {
    const telNum = localStorage.getItem('telNum')
    http.post('/cti/log', {
      jsonStr: JSON.stringify({
        num: telNum,
        opt_state: state ?? '',
        opt_sub_state: subState ?? '',
        ignore_state: ignore_state ?? '',
        contain_state: contain_state ?? '',
        is_login_log: is_login_log ?? '0'
      })
    }).catch(() => {})
  }

  // ---- sync user CTI state to backend ----
  function updateUserCtiState(state) {
    http.post('/user/updateUserCitState', { state }).catch(() => {})
  }

  // ---- CTI API proxy call ----
  function ctiCall(payload) {
    return http.post('/cti/call', { jsonStr: JSON.stringify(payload) })
  }

  // ---- show busy ----
  function ctiShimang(msg, callback) {
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      extnum: telNum,
      state: 'busy',
      msg: msg ?? '示忙',
      opt: 'SET_EXT_PRESENCE_STATE'
    }).then((res) => {
      if (res.data?.code === 200) {
        if (callback) callback()
      } else {
        console.log('CTI 示忙失败')
      }
    }).catch(() => {})
  }

  // ---- show idle ----
  function ctiShixian(msg, callback) {
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      extnum: telNum,
      state: 'online',
      msg: msg ?? '示闲',
      opt: 'SET_EXT_PRESENCE_STATE'
    }).then((res) => {
      if (res.data?.data === '200') {
        if (callback) callback()
      }
    }).catch(() => {})
  }

  // ---- hold call ----
  function ctiBaochi() {
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      extnum: telNum,
      toneid: window.common?.thbcyyId || '',
      mixside: 'none',
      msg: '保持',
      opt: 'PLAY_VOICE_IN_CALL'
    }).then((res) => {
      if (res.data?.data === '200') {
        ElMessage.success('操作成功')
      } else if (res.data?.data === '404') {
        ElMessage.info('没有可以操作的电话')
      } else if (res.data?.data === '400') {
        ElMessage.info('参数错误')
      }
    }).catch(() => {})
  }

  // ---- unhold call ----
  function ctiUnbaochi() {
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      extnum: telNum,
      msg: '去保持',
      opt: 'STOP_VOICE_IN_CALL'
    }).then((res) => {
      if (res.data?.data === '200') {
        ElMessage.success('操作成功')
      } else if (res.data?.data === '404') {
        ElMessage.info('没有可以操作的电话')
      } else if (res.data?.data === '400') {
        ElMessage.info('参数错误')
      }
    }).catch(() => {})
  }

  // ---- WebSocket message handler ----
  function handleCtiSocketMessage(json) {
    const showType = json.sceenShowType

    if (showType === 'presence') {
      // Forced busy notification — clear top bar timer display
      setCtiTopBarState('', '')
      return
    }

    if (showType === 'queue') {
      // Queue notification
      if (!json.content || json.content.length === 0) {
        setCtiWaitNum(0, [])
        return
      }
      let totalNum = 0
      const queueArr = []
      for (const item of json.content) {
        totalNum += item.count ?? 0
        const queue = item.queue ?? []
        for (const qItem of queue) {
          const callee = qItem.callee ?? ''
          const num = callee.length === 9 ? callee.substring(4) : callee
          const existing = queueArr.find((x) => x.num === num)
          if (existing) {
            existing.count += 1
          } else {
            queueArr.push({ num, count: 1 })
          }
        }
      }
      setCtiWaitNum(totalNum, queueArr)
      return
    }

    // Incoming/outgoing calls
    const direction = json.direction
    const state = json.state
    ctiDirection.value = direction

    if (direction === 'incoming') {
      const caller = json.caller || ''
      const callee = json.callee || ''
      const id = json.id || ''

      if (state === 'ringing') {
        // Ringing → show call info
        clearPostCallTimer()
        setCtiTopBarState('', '')
        ctiShimang('呼入示忙')
        setCtiState(toolbarStateText.tonghua)
        ctiCurrentTel.value = caller
        ctiCaller.value = caller
        ctiCallee.value = callee
        ctiCallId.value = id
        ctiLog({ state: toolbarStateText.tonghua, subState: toolbarStateText.tonghua })
      } else if (state === 'talking') {
        setCtiState(toolbarStateText.tonghua)
      } else if (state === 'hungup') {
        handleCallHungup()
      }
    } else if (direction === 'outgoing') {
      const callee = json.callee || ''

      if (state === 'ringing') {
        clearPostCallTimer()
      }
      if (state === 'talking') {
        setCtiState(toolbarStateText.tonghua)
        ctiCurrentTel.value = callee
        ctiLog({ state: toolbarStateText.tonghua, subState: toolbarStateText.tonghua })
      } else if (state === 'hungup') {
        handleCallHungup()
      }
    }
  }

  let postCallTimer = null
  let restTimer = null

  function clearPostCallTimer() {
    if (postCallTimer) {
      clearInterval(postCallTimer)
      postCallTimer = null
    }
  }

  function clearRestTimer() {
    if (restTimer) {
      clearInterval(restTimer)
      restTimer = null
    }
  }

  function restLabel(type, time) {
    const totalSec = time * 60
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    let label = type
    if (h > 0) label += `-${h}小时`
    if (m > 0) label += `-${m}分钟`
    if (s > 0) label += `-${s}秒`
    return label
  }

  function getRestOptions() {
    try {
      const config = window.common?.rest_type_time || window.__KXT_CONFIG__?.rest_type_time
      if (config) {
        return JSON.parse(config).option ?? []
      }
    } catch {}
    return []
  }

  function startRestTimer(restMinutes, restTypeTitle) {
    let restSeconds = restMinutes * 60 - 1
    clearRestTimer()
    clearPostCallTimer()

    ctiShimang(restTypeTitle ? `${restTypeTitle}-${restMinutes}分钟` : '小休', () => {
      updateToolbarBtnState({ shixian: false })
      setCtiState(toolbarStateText.xiaoxiu)
      ctiLog({ state: toolbarStateText.xiaoxiu, subState: restTypeTitle || toolbarStateText.xiaoxiu })
    })

    setCtiTopBarState('距空闲还有', secondsFormat(restSeconds))

    restTimer = setInterval(() => {
      restSeconds--
      if (restSeconds <= 0) {
        clearRestTimer()
        setCtiTopBarState('', '')
        // Don't go idle if currently on a call
        if (ctiState.value !== toolbarStateText.tonghua) {
          ctiShixian('小休结束空闲', () => {
            updateToolbarBtnState({ shixian: true })
            setCtiState(toolbarStateText.kongxian)
            ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.kongxian })
          })
        }
        return
      }
      setCtiTopBarState('距空闲还有', secondsFormat(restSeconds))
    }, 1000)
  }

  function handleCallHungup() {
    if (ctiDlsm.value) {
      clearPostCallTimer()
      setCtiTopBarState('', '')
      ctiShimang('挂机示忙', () => {
        updateToolbarBtnState({ shixian: false })
        setCtiState(toolbarStateText.manglu)
        ctiLog({ state: toolbarStateText.manglu, subState: toolbarStateText.manglu })
      })
      return
    }

    // Enter post-call processing
    ctiCurrentTel.value = ''
    setCtiState(toolbarStateText.shihouchuli)
    updateToolbarBtnState({ shixian: false })
    ctiDirection.value = ''
    ctiLog({ state: toolbarStateText.shihouchuli, subState: toolbarStateText.shihouchuli })

    let seconds = Number(window.common?.telKongXianSeconds) || 60
    setCtiTopBarState('距空闲还有', secondsFormat(seconds))
    clearPostCallTimer()

    postCallTimer = setInterval(() => {
      seconds--
      if (seconds <= 0) {
        clearPostCallTimer()
        setCtiTopBarState('', '')
        ctiShixian('事后空闲', () => {
          updateToolbarBtnState({ shixian: true })
          setCtiState(toolbarStateText.kongxian)
          ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.kongxian })
        })
        return
      }
      setCtiTopBarState('距空闲还有', secondsFormat(seconds))
    }, 1000)
  }

  // ---- WebSocket lifecycle ----
  function handleSocketOpen() {
    isCtiNormal.value = true
    ctiTelNumState.value = toolbarStateText.yizhuce
    doCtiSubscribe()
  }

  function handleSocketClose() {
    ctiTelNumState.value = toolbarStateText.weizhuce
    updateUserCtiState(toolbarStateText.weidenglu)
    isCtiNormal.value = false
    if (!ctiLastState.value) {
      ctiLastState.value = ctiState.value
      ctiState.value = toolbarStateText.txyc
      updateUserCtiState(toolbarStateText.txyc)
    }
  }

  function handleSocketError() {
    console.log('CTI socket connection error')
  }

  // ---- CTI login ----
  function ctiLogin(param, success, error) {
    ctiDlsm.value = param.dlsm ?? false
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`

    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      extnum: telNum,
      workerid: param.user?.workNumber ?? '',
      department: param.user?.deptName ?? '',
      uname: param.user?.userName ?? '',
      msg: toolbarStateText.login,
      opt: 'SET_WORKER_ID'
    }).then((res) => {
      if (res.data?.data === '200') {
        const ctiLoginFlag = sessionStorage.getItem('cti_login')
        if (!ctiLoginFlag) {
          ctiLog({
            state: toolbarStateText.login,
            subState: toolbarStateText.login,
            is_login_log: '1'
          })
          sessionStorage.setItem('cti_login', '1')
        }

        // Create socket if not exists
        if (!socketManager) {
          socketManager = createCtiSocket({
            onOpen: handleSocketOpen,
            onMessage: handleCtiSocketMessage,
            onClose: handleSocketClose,
            onError: handleSocketError
          })
        }
        socketManager.connect()

        if (success) success(res.data)
      } else if (res.data?.data === '404') {
        ctiTelNumState.value = toolbarStateText.weizhuce
        ElMessage.error('分机号码不存在，请重新登录！')
        updateUserCtiState(toolbarStateText.weidenglu)
        isCtiNormal.value = false
        if (error) error(res.data)
      } else {
        updateUserCtiState(toolbarStateText.txyc)
        isCtiNormal.value = false
        ctiTelNumState.value = toolbarStateText.weizhuce
        if (error) error(res.data)
      }
    }).catch(() => {
      updateUserCtiState(toolbarStateText.txyc)
      isCtiNormal.value = false
      ctiTelNumState.value = toolbarStateText.weizhuce
      if (error) error({ data: 'error' })
    })
  }

  // ---- CTI subscribe (send busy/idle based on dlsm, or reconnect recovery) ----
  function doCtiSubscribe() {
    setCtiTopBarState('', '')

    if (ctiLastState.value) {
      // Reconnect recovery
      if (ctiLastState.value === toolbarStateText.kongxian) {
        clearPostCallTimer()
        ctiShixian('重连示闲', () => {
          updateToolbarBtnState({ shixian: true })
          setCtiState(toolbarStateText.kongxian)
          ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.dxcl })
        })
      } else if (ctiLastState.value === toolbarStateText.shihouchuli) {
        if (postCallTimer) {
          ctiShimang('重连示忙(事后处理)', () => {
            updateToolbarBtnState({ shixian: false })
            setCtiState(toolbarStateText.shihouchuli)
            ctiLog({ state: toolbarStateText.manglu, subState: toolbarStateText.dxcl })
          })
        } else {
          clearPostCallTimer()
          ctiShixian('重连示闲(事后结束)', () => {
            updateToolbarBtnState({ shixian: true })
            setCtiState(toolbarStateText.kongxian)
            ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.dxcl })
          })
        }
      } else if (ctiLastState.value === toolbarStateText.tonghua) {
        ctiShimang('重连示忙(通话中)', () => {
          updateToolbarBtnState({ shixian: false })
          setCtiState(toolbarStateText.tonghua)
          ctiLog({ state: toolbarStateText.manglu, subState: toolbarStateText.dxcl })
        })
      } else {
        // 忙碌/小休 etc.
        ctiShimang('重连示忙', () => {
          updateToolbarBtnState({ shixian: false })
          setCtiState(toolbarStateText.manglu)
          ctiLog({ state: toolbarStateText.manglu, subState: toolbarStateText.dxcl })
        })
      }
    } else {
      // Fresh login
      if (ctiDlsm.value) {
        ctiShimang('登录示忙', () => {
          updateToolbarBtnState({ shixian: false })
          setCtiState(toolbarStateText.manglu)
          ctiLog({ state: toolbarStateText.manglu, subState: toolbarStateText.manglu })
        })
      } else {
        ctiShixian('登陆示闲', () => {
          updateToolbarBtnState({ shixian: true })
          setCtiState(toolbarStateText.kongxian)
          ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.kongxian })
        })
      }
    }
    ctiLastState.value = ''
  }

  // ---- CTI logout ----
  function ctiLogout(callback) {
    if (socketManager) {
      socketManager.disconnect(() => {
        if (callback) callback()
      })
      socketManager = null
    }

    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      extnum: telNum,
      workerid: '8888',
      department: '8888',
      uname: '8888',
      msg: toolbarStateText.logout,
      opt: 'SET_WORKER_ID'
    }).catch(() => {})
  }

  // ---- toolbar operations (wired to real API now) ----
  const showRestDialog = ref(false)

  function toggleShimangShixian() {
    if (ctiState.value === toolbarStateText.tonghua) {
      ElMessage.warning('通话中不能改变示忙示闲状态')
      return
    }

    if (ctiState.value === toolbarStateText.kongxian) {
      const restOptions = getRestOptions()
      if (restOptions.length > 0) {
        showRestDialog.value = true
        return
      }
      ctiShimang('主动示忙', () => {
        updateToolbarBtnState({ shixian: false })
        setCtiState(toolbarStateText.manglu)
        ctiLog({ state: toolbarStateText.manglu, subState: toolbarStateText.manglu })
      })
      return
    }

    if (ctiState.value === toolbarStateText.shihouchuli) {
      ElMessageBox.confirm('请选择 小休 或是 空闲', '提示', {
        distinguishCancelAndClose: true,
        confirmButtonText: '空闲',
        cancelButtonText: '小休',
        center: true,
        type: 'success'
      }).then(() => {
        // Go idle
        setCtiTopBarState('', '')
        clearPostCallTimer()
        ctiShixian('主动空闲', () => {
          updateToolbarBtnState({ shixian: true })
          setCtiState(toolbarStateText.kongxian)
          ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.kongxian })
        })
      }).catch((action) => {
        if (action === 'cancel') {
          // Show rest dialog
          const restOptions = getRestOptions()
          if (restOptions.length > 0) {
            showRestDialog.value = true
          }
        }
      })
      return
    }

    // Currently busy → go idle
    clearPostCallTimer()
    clearRestTimer()
    setCtiTopBarState('', '')
    ctiShixian('主动空闲', () => {
      updateToolbarBtnState({ shixian: true })
      setCtiState(toolbarStateText.kongxian)
      ctiLog({ state: toolbarStateText.kongxian, subState: toolbarStateText.kongxian })
    })
  }

  function toggleBaochi() {
    if (ctiState.value !== toolbarStateText.tonghua) {
      ElMessage.warning('当前没有通话')
      return
    }
    if (toolbarBtnState.value.baochi) {
      ctiBaochi()
      updateToolbarBtnState({ baochi: false })
    } else {
      ctiUnbaochi()
      updateToolbarBtnState({ baochi: true })
    }
  }

  // ---- outbound call ----
  function ctiHujiao(param, callback) {
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCaller.value = telNum
    ctiCallee.value = param.tel
    const payload = {
      api: `${httpBaseUrl}/bridge/callctrl`,
      caller: telNum,
      callee: param.tel,
      authtype: 'no',
      backid: true,
      opt: 'CLICK_TO_DIAL',
      msg: '呼叫'
    }
    if (param.outType) {
      payload.clicktoken = param.outType
    }
    ctiCall(payload).then((res) => {
      if (res.data?.code === '200') {
        ElMessage.success('呼叫成功...')
        if (param.orderId) {
          http.post('/hi_task/addHiTask', {
            orderId: param.orderId,
            callId: res.data.data,
            tel: param.tel,
            pageType: param.pageType,
            taskName: param.taskName || null,
            remarks: param.remarks || null,
            missedCallId: param.missedCallId || null
          }).catch(() => {})
        }
        if (callback) callback()
      } else if (res.data?.code === '486') {
        ElMessage.info('对方正在忙碌中')
      } else if (res.data?.code === '403') {
        ElMessage.info('黑名单号码，禁止拨打')
      }
    }).catch(() => {})
  }

  // ---- hangup ----
  function ctiGuaduan(param) {
    const telNum = localStorage.getItem('telNum')
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    ctiCall({
      api: `${httpBaseUrl}/bridge/callctrl`,
      caller: telNum,
      callee: param?.tel ?? '',
      opt: 'CLICK_TO_HUNGUP',
      msg: '挂断'
    }).then((res) => {
      if (res.data?.data === '500') {
        ElMessage.info('挂断失败')
      }
    }).catch(() => {})
  }

  // ---- blacklist ----
  function ctiHeimingdan(param) {
    const isAdd = param.opt !== 'DEL'
    const httpBaseUrl = socketManager?.getHttpBaseUrl() || `http://${window.common?.ctiBaseAPi || 'webrtc.call12345.com'}:12121`
    let opt, msg, message, json

    if (param.type === 1) {
      // VIP list
      opt = isAdd ? 'VIP_LIST_ADD' : 'VIP_LIST_RMV'
      msg = isAdd ? '加入VIP名单' : '移出VIP名单'
      const tel = param.tel || ctiCurrentTel.value
      message = isAdd
        ? `您已成功将【${tel}】加入VIP名单！`
        : `您已成功将【${tel}】移除VIP名单！`

      if (isAdd) {
        const remark = param.remarks || ''
        const createtime = new Date().toISOString().replace('T', ' ').slice(0, 19)
        json = `%7B'telnum':'${tel}','viplevel':1,'des':'${remark}','createtime':'${createtime}'%7D`
      } else {
        json = param.tel || ctiCurrentTel.value
      }
    } else {
      // Blacklist
      opt = isAdd ? 'BLACK_LIST_ADD' : 'BLACK_LIST_RMV'
      msg = isAdd ? '加入黑名单' : '移出黑名单'
      const tel = param.tel || ctiCurrentTel.value
      message = isAdd
        ? `您已成功将【${tel}】加入黑名单！`
        : `您已成功将【${tel}】移除黑名单！`
      json = tel
    }

    ctiCall({
      api: `${httpBaseUrl}/bridge/jsoncfg`,
      json,
      msg,
      opt
    }).then((res) => {
      if (res.data?.data === '200') {
        const remark = param.remarks || ''
        if (!param.isFromList && isAdd) {
          addBlackList(param, param.tel || ctiCurrentTel.value, remark)
        }
        ElMessage.success(message)
      }
    }).catch(() => {})
  }

  function addBlackList(params, tel, remark) {
    http.post('/playwithtel/option', {
      opt: params.opt || 'ADD',
      tel: tel || ctiCurrentTel.value,
      callTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: params.type || 0,
      remarks: remark || ''
    }).catch(() => {})
  }

  // ---- quick dial (110/119/120/122) ----
  function quickDial(tel) {
    if (ctiState.value === toolbarStateText.tonghua) {
      ElMessage.warning('当前正在通话中，无法发起新呼叫')
      return
    }
    ctiHujiao({ tel })
  }

  // ---- reset ----
  function resetCti() {
    // Close socket
    if (socketManager) {
      socketManager.disconnect()
      socketManager = null
    }

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
    ctiDlsm.value = false
    ctiCaller.value = ''
    ctiCallee.value = ''
    ctiCallId.value = ''
    qrqcActive.value = true
    clearPostCallTimer()
    clearRestTimer()
    toolbarBtnState.value = { qianru: true, shixian: true, baochi: true }
    sessionStorage.removeItem('cti_login')
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
    ctiDlsm,
    ctiCaller,
    ctiCallee,
    ctiCallId,
    qrqcActive,
    toolbarBtnState,
    showRestDialog,

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
    resetCti,

    // CTI operations
    ctiLogin,
    ctiLogout,
    doCtiSubscribe,
    ctiShimang,
    ctiShixian,
    ctiBaochi,
    ctiUnbaochi,
    ctiLog,
    updateUserCtiState,
    toggleShimangShixian,
    toggleBaochi,
    ctiHujiao,
    ctiGuaduan,
    ctiHeimingdan,
    addBlackList,
    quickDial,
    handleCtiSocketMessage,
    clearPostCallTimer,
    clearRestTimer,
    restLabel,
    getRestOptions,
    startRestTimer,

    // helpers
    secondsFormat
  }
})
