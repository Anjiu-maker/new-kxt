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
