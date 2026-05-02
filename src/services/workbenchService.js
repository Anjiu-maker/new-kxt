import { http } from './http'

export function getWorkbenchCount(api, params = {}) {
  return http.get(api, {
    params: {
      flag: true,
      pageNum: 1,
      pageSize: 1,
      ...params
    }
  })
}

export function getWorkbenchList(api, params = {}) {
  return http.get(api, {
    params: {
      flag: true,
      pageNum: 1,
      pageSize: 5,
      ...params
    }
  })
}

export function getWorkbenchNotices(params = {}) {
  return http.get('notice_announcement/mylist', {
    params: {
      pageNum: 1,
      pageSize: 5,
      flag: true,
      ...params
    }
  })
}

// ── 坐席首页 (ZxIndex) 专用接口 ──

export function getInteractionData() {
  return http.get('orderInfo/zx_sjlydata_order_list')
}

export function getKnowledgeList(params = {}) {
  return http.get('/klStudy/findPgae', {
    params: { pageNum: 1, pageSize: 3, flag: true, ...params }
  })
}

export function getKnowledgeDetail(id) {
  return http.get('/knowledgeBase/zsk_knowledge_one', {
    params: { id, isSave: 1 }
  })
}

export function checkKnowledgeCollected(knowledgeId) {
  return http.get('/klCollect/is_Collect', {
    params: { klKnowledgeId: knowledgeId }
  })
}

export function addKnowledgeCollect(knowledgeId) {
  return http.post('/klCollect/addKlCollect', { kowledgeId: knowledgeId })
}

export function removeKnowledgeCollect(knowledgeId) {
  return http.post('/klCollect/delete_klCollect', { kowledgeId: knowledgeId })
}

export function getMyMenuList() {
  return http.get('/sys/mymenu/list')
}

export function saveMyMenu(data) {
  return http.post('/sys/mymenu/save', { data: JSON.stringify(data) })
}

export function deleteMyMenu(myMenuIds) {
  return http.post('/sys/mymenu/delete', { myMenuIds })
}

export function getOrderDetail(orderNo, isHaveLookBaomi = false) {
  return http.get('/orderInfo/find', {
    params: { orderNo, isHaveLookBaomi }
  })
}
