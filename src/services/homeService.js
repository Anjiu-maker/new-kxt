import { http } from './http'

export function findMenuBadge(menuCodes) {
  return http.get('/menuBadgeInfo/findMenuBadge', {
    params: {
      menuCodes: menuCodes || null
    }
  })
}

export function readMenuBadge(menuCodes) {
  return http.get('/menuBadgeInfo/findMenuBadge', {
    params: {
      menuCodes: menuCodes || null
    }
  })
}
