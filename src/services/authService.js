import { http } from './http'
import { encryptByAes } from '@/utils/aes'

export function getTelNum() {
  return http.get('/cti/getTelNum')
}

export function sendImgCode() {
  return http.post('/sendImgCode', {})
}

export function login(payload) {
  return http.post('/login', payload)
}

export function checkLogin(payload) {
  return login({
    ...payload,
    password: encryptByAes(payload.password),
    check: '1'
  })
}

export function confirmLogin(payload) {
  return login({
    ...payload,
    password: encryptByAes(payload.password),
    check: 0
  })
}

export async function getFrontEndConfig() {
  const response = await http.get('/sys/params/list?flag=false&type=0,1')
  const list = response.data?.data ?? []

  return list.reduce((config, item) => {
    if (item?.code) {
      config[item.code] = item.value
    }
    return config
  }, {})
}

export function getUserInfo(token) {
  return http.post('/getUserInfo', { token })
}

export function logout(token) {
  return http.post('/logout', { token })
}

export function findUser(userId) {
  return http.get(`/user/find?userId=${userId}`)
}

export function changePassword(payload) {
  return http.post('user/change_pwd', payload)
}

export function keepTelNum(telNum) {
  return http.post('/cti/keepTelNum', { telNum })
}

export function keepUserOnline() {
  return http.get('/user/keepOnline')
}
