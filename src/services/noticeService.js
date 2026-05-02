import { http } from './http'

export const NOTICE_READ_STATE = {
  unread: 0,
  read: 1
}

export const fallbackNoticeTypes = [
  { label: '政策', value: 0 },
  { label: '会议', value: 1 },
  { label: '最新', value: 2 },
  { label: '紧急', value: 3 },
  { label: '共享', value: 4 }
]

export const noticeReadOptions = [
  { label: '未读', value: NOTICE_READ_STATE.unread },
  { label: '已读', value: NOTICE_READ_STATE.read }
]

export function getNoticeMineList(params = {}) {
  return http.get('/notice_announcement/mylist', {
    params: {
      flag: true,
      pageNum: 1,
      pageSize: 10,
      ...params
    }
  })
}

export function getNoticeDetails(id) {
  return http.post('/notice_announcement/details', {
    id
  })
}

export function markNoticeRead(ids) {
  const noticeAnnounceIds = Array.isArray(ids) ? ids.filter(Boolean).join(',') : String(ids || '')

  return http.post('/notice_announcement_o2m_userinfo/batch/read', {
    noticeAnnounceIds
  })
}

export function getNoticeTypes() {
  return http.get('/dict/findTreeByDictCode', {
    params: {
      dictCode: 'notice'
    }
  })
}

export function normalizeNoticeTypes(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallbackNoticeTypes
  }

  return items.map((item) => ({
    label: item.dictName ?? item.label ?? item.typeName ?? item.name,
    value: item.dictId ?? item.value ?? item.typeId ?? item.id
  }))
}

export function formatNoticeTime(value, withTime = true) {
  if (!value) {
    return '-'
  }

  const timestamp = Number(value)
  const date = new Date(timestamp > 100000000000 ? timestamp : timestamp * 1000)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const pad = (item) => String(item).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  if (!withTime) {
    return day
  }

  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
