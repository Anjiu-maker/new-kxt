import { ref } from 'vue'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import flowApiMapping from '@/utils/flowApiMapping'

// 对标旧项目 utils.js 的全局 mixin 方法，Vue 3 composable 风格
// 旧项目通过 Vue.mixin(utils) 将这 40+ 方法挂载在所有组件上
// 新项目按需通过 useGlobal() 引入

export function useAuthCode() {
  const authStore = useAuthStore()

  return {
    authCode: {
      optCode: {
        lookOrderInfo: 'lookOrderInfo',
        shgdxg: 'shgdxg',
        gdOrder: 'gdOrder',
        isFocusDb: 'isFocusDb',
        jointProcessing: 'jointProcessing',
        resendOpt: 'resendOpt',
        updateHandleEndTime: 'updateHandleEndTime',
        resendFreshHandleEndTime: 'resendFreshHandleEndTime'
      },
      smsCode: {
        orderTransferDept: 'orderTransferDept',
        orderTransferMasses: 'orderTransferMasses'
      },
      dictCode: {
        transferOrderSms: 'transferOrderSms'
      },
      softPhone: {
        softPhoneOpts: 'softPhoneOpts'
      },
      roleCodes: {
        xyzxCbg: 'xyzxCbg'
      }
    },
    hasPermission(code, type = 1) {
      return authStore.hasPermission(code, type)
    },
    hasRole(code, ownRoleCode) {
      if (!ownRoleCode) return false
      return code === ownRoleCode
    }
  }
}

export function useDict() {
  const dictCache = ref({})

  function getDictCache() {
    try {
      const raw = localStorage.getItem('dictData')
      if (raw) dictCache.value = JSON.parse(raw)
    } catch { dictCache.value = {} }
  }
  getDictCache()

  async function getDictByCode(isTree, code) {
    const cached = dictCache.value[code]
    const config = window.common || window.__KXT_CONFIG__ || {}
    const validity = (config.dictValidityTime || 7) * 1000 * 60 * 60 * 24
    const now = Date.now()
    if (cached && (now - cached.startTime) <= validity) {
      return cached.data
    }
    try {
      const res = await http.get('/dict/findTreeByDictCode', { params: { dictCode: code } })
      const data = res.data?.code === 200 ? res.data.data : []
      dictCache.value[code] = { startTime: now, data }
      localStorage.setItem('dictData', JSON.stringify(dictCache.value))
      return data
    } catch {
      return cached?.data || []
    }
  }

  async function getDictValueByCode(code) {
    try {
      const res = await http.get('/dict/getDictValueByCode', { params: { code } })
      return res.data?.code === 200 ? res.data.data : null
    } catch { return null }
  }

  return { getDictByCode, getDictValueByCode }
}

export function useGlobal() {
  const { hasPermission, hasRole, authCode } = useAuthCode()
  const { getDictByCode, getDictValueByCode } = useDict()

  function getCurrentDateTime() {
    return http.get('/holiday/getCurrentDateTime').then(res => {
      if (res.data?.code === 200) return res.data.data
      return new Date().toISOString().slice(0, 19).replace('T', ' ')
    }).catch(() => new Date().toISOString().slice(0, 19).replace('T', ' '))
  }

  async function isSpecialFocus(orderId) {
    try {
      const res = await http.get('/orderInfo/special_focus', { params: { isFocus: true, orderId } })
      return res.data?.code === 200
    } catch { return false }
  }

  async function smsIsDisabled(code) {
    try {
      const res = await http.get('/sms/isDisabled', { params: { code } })
      return res.data?.code === 200 ? res.data.data : true
    } catch { return true }
  }

  function getTableHeight(height) {
    const container = document.querySelector('#container')
    if (container) return height - 30 - 84 - 40
    return height
  }

  function getDateDiff(startTime, endTime, diffType = 'day') {
    const sTime = new Date(startTime.replace(/-/g, '/'))
    const eTime = new Date(endTime.replace(/-/g, '/'))
    const divMap = { second: 1000, minute: 1000 * 60, hour: 1000 * 3600, day: 1000 * 3600 * 24 }
    return parseInt((eTime.getTime() - sTime.getTime()) / (divMap[diffType] || 1))
  }

  // 根据 flowApiMapping 中的 code 查找 API 路径
  function getListApi(code) {
    return flowApiMapping.listApi[code]?.api || null
  }

  return {
    authCode,
    hasPermission,
    hasRole,
    getDictByCode,
    getDictValueByCode,
    getCurrentDateTime,
    isSpecialFocus,
    smsIsDisabled,
    getTableHeight,
    getDateDiff,
    getListApi
  }
}
