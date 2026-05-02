import { http } from './http'
import flowApiMapping from '@/utils/flowApiMapping'

// ── 通用列表查询 ──
// 根据 flowApiMapping 的 code 查找对应 API
export function getOrderListByCode(code, params = {}) {
  const api = flowApiMapping.listApi[code]?.api
  if (!api) return Promise.reject(new Error(`Unknown order code: ${code}`))
  return getOrderList(api, params)
}

export function getOrderList(api, params = {}) {
  return http.get(api, {
    params: {
      flag: true,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
      ...params
    }
  })
}

// ── 工单详情 ──
export function getOrderDetail(orderNo, isHaveLookBaomi = false) {
  return http.get('/orderInfo/find', {
    params: { orderNo, isHaveLookBaomi }
  })
}

// ── 工单保存/暂存 ──
export function saveOrder(data) {
  return http.post('/orderInfo/save', data)
}

// ── 表单操作 ──
export function applyForSupervision(data) {
  return http.post('/orderInfo/applyForSupervision', data)
}

export function ercidb(data) {
  return http.post('/orderInfo/ercidb', data)
}

export function archiveOrder(data) {
  return http.post('/orderInfo/zx_archived', data)
}

export function applyHandle(data) {
  return http.post('/orderInfo/applyHandle', data)
}

export function revisitOrder(data) {
  return http.post('/orderInfo/revisit', data)
}

export function resendOrder(data) {
  return http.post('/orderInfo/resend', data)
}

// ── 特别关注 ──
export function specialFocus(isFocus, orderId, remarks = '') {
  return http.get('/orderInfo/special_focus', {
    params: { isFocus, orderId, remarks }
  })
}

// ── 工单处理流程历史 ──
export function getHiTaskList(businessKey) {
  return http.get('/hi_task/list', {
    params: { businessKey }
  })
}

// ── 打印导出 ──
export function downWord(orderIds, fileName) {
  return http.post('/wordPrint/downWord', { orderIds, fileName, isHaveLookBaomi: false }, { responseType: 'blob' })
}

// ── 综合查询 / 工单列表通用 ──
export function queryOrderList(params = {}) {
  return http.get('/orderInfo/integrated_query_order', { params: { flag: true, ...params } })
}

// ── 部门树 ──
export function getDeptList(isUser = false, isZnj = true) {
  return http.get('/dept/list/current_user', {
    params: { isUser, isZnj }
  })
}

export function getDeptTree(isHeader = false) {
  return http.get('/dept/tree_nodetype', {
    params: { isHeader }
  })
}

// ── 收藏/关注 ──
export function getIsSpecialFocus(orderId) {
  return http.get('/orderInfo/special_focus', {
    params: { isFocus: true, orderId }
  })
}

// ── 延期相关 ──
export function applyDelay(data) {
  return http.post('/orderInfo/applyDelay', data)
}

// ── 获取工单处理时间 ──
export function getHandleEndTime(startTime, orderLevelValue, orderLevel) {
  return http.get('/orderInfo/getHandleEndTime', {
    params: { startTime, orderLevelValue, orderLevel }
  })
}

// ── 服务时间 ──
export function getCurrentDateTime() {
  return http.get('/holiday/getCurrentDateTime')
}
