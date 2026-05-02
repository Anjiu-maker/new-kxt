import axios from 'axios'
import { decryptBySm4, encryptBySm4 } from '@/utils/sm4'

const DEFAULT_TIMEOUT = 60 * 1000
const API_VERSION = '/api/v1'

const noApiUrl = ['/login', '/islogin', '/logout', '/isvalid', '/getUserInfo', '/getDockingAccount', '/singleLogin', '/sendImgCode']
const noQsUrl = ['/upload']
const noEncryptApiUrl = ['/uploadFile/download', '/static']

function getRuntimeConfig() {
  return {
    ...(window.common ?? {}),
    ...(window.__KXT_CONFIG__ ?? {})
  }
}

function normalizeApiPath(url = '') {
  return url.split('?')[0].replace(/^\//, '')
}

function includesUrl(url, urlList) {
  return urlList.some((item) => url.includes(item))
}

function shouldUseReadApi(url, runtimeConfig) {
  const apiPath = normalizeApiPath(url)
  return (runtimeConfig.isReadArr ?? []).includes(apiPath) || (runtimeConfig.isReadArr ?? []).includes(`/${apiPath}`)
}

function getBaseURL(config) {
  const runtimeConfig = getRuntimeConfig()
  const url = config.url ?? ''

  if (includesUrl(url, noApiUrl)) {
    return runtimeConfig.baseApi ?? config.baseURL ?? ''
  }

  if (url.startsWith('/yw')) {
    return `${runtimeConfig.ywBaseApi ?? runtimeConfig.baseApi ?? ''}${API_VERSION}`
  }

  if (shouldUseReadApi(url, runtimeConfig)) {
    return `${runtimeConfig.readApi ?? runtimeConfig.baseApi ?? ''}${API_VERSION}`
  }

  return `${runtimeConfig.baseApi ?? config.baseURL ?? ''}${API_VERSION}`
}

function parseQuery(url = '') {
  if (!url.includes('?')) {
    return {}
  }

  return url
    .split('?')[1]
    .split('&')
    .filter(Boolean)
    .reduce((params, item) => {
      const [key, value = ''] = item.split('=')
      params[key] = value
      return params
    }, {})
}

function stringifyFormData(data) {
  const params = new URLSearchParams()

  Object.entries(data ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }

    if (value !== undefined && value !== null) {
      params.append(key, value)
    }
  })

  return params.toString()
}

function encryptRequest(config) {
  const url = config.url ?? ''

  if (includesUrl(url, noEncryptApiUrl)) {
    return config
  }

  const queryParams = parseQuery(url)

  if (config.method === 'post' && config.data) {
    config.data = {
      info: encryptBySm4(JSON.stringify({ ...config.data, ...queryParams }))
    }
    return config
  }

  if (config.method === 'post' && config.params) {
    config.data = {
      info: encryptBySm4(JSON.stringify(config.params))
    }
    config.params = null
    return config
  }

  if (config.method === 'post' && Object.keys(queryParams).length > 0) {
    config.data = {
      info: encryptBySm4(JSON.stringify(queryParams))
    }
    config.params = null
    config.url = url.split('?')[0]
    return config
  }

  if (config.method === 'get' && (config.params || Object.keys(queryParams).length > 0)) {
    config.method = 'post'
    config.data = {
      info: encryptBySm4(JSON.stringify({ ...(config.params ?? {}), ...queryParams }))
    }
    config.params = null
    config.url = url.split('?')[0]
    return config
  }

  if (config.method === 'get') {
    config.method = 'post'
  }

  return config
}

export const http = axios.create({
  timeout: DEFAULT_TIMEOUT
})

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  const ywToken = localStorage.getItem('ywxtToken')
  const url = config.url ?? ''

  config.baseURL = getBaseURL(config)

  if (url.startsWith('/yw') && ywToken) {
    config.headers.yw_token = ywToken
  }

  if (token) {
    config.headers.token = token
  }

  // encryptRequest(config)

  if (!includesUrl(url, noQsUrl) && config.data && typeof config.data !== 'string') {
    config.data = stringifyFormData(config.data)
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  return config
})

http.interceptors.response.use((response) => {
  if (typeof response.data !== 'string') {
    return response
  }

  try {
    response.data = JSON.parse(decryptBySm4(response.data))
  } catch {
    // Some endpoints may already return plain JSON during local development.
  }

  return response
})
