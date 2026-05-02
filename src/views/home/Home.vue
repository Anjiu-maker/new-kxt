<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  ArrowDown,
  Clock,
  Close,
  HomeFilled,
  Plus,
  Refresh,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import defaultAvatar from '@/assets/images/user.png'
import { changePassword, findUser, getUserInfo, keepTelNum, keepUserOnline, logout } from '@/services/authService'
import { findMenuBadge, readMenuBadge } from '@/services/homeService'
import { getNoticeMineList, markNoticeRead as markNoticeRowsRead } from '@/services/noticeService'
import { createNoticeSocket } from '@/services/noticeSocket'
import { useAuthStore } from '@/stores/auth'
import { useCtiStore } from '@/stores/cti'
import { encryptByAes } from '@/utils/aes'
import { decryptBySm4 } from '@/utils/sm4'
import CtiTopBar from './CtiTopBar.vue'
import CtiToolbar from './CtiToolbar.vue'
import CtiBlackDialog from './CtiBlackDialog.vue'
import CtiCallDialog from './CtiCallDialog.vue'
import CtiRestDialog from './CtiRestDialog.vue'
import { resolveInternalPageComponent } from '@/views/workbench/workbenchRegistry'

const router = useRouter()
const authStore = useAuthStore()
const ctiStore = useCtiStore()
const ctiBlackDialogVisible = ref(false)
const ctiCallDialogVisible = ref(false)

const activeMenuId = ref('')
const activeSubMenuId = ref('')
const activeSubmenu = ref(null)
const nowTime = ref('')
const noticeMessage = ref(0)
const badgeJson = ref({})
const socketStatus = ref('未连接')
const noticeDialogVisible = ref(false)
const noticeDetailVisible = ref(false)
const noticeLoading = ref(false)
const noticeRows = ref([])
const selectedNoticeRows = ref([])
const activeNotice = ref(null)
const noticePage = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
const avatarUrl = ref('')
const editPwdVisible = ref(false)
const uploadVisible = ref(false)
const resetPwdLoading = ref(false)
const resetPwdFormRef = ref()
const resetPwdModel = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})
const loadingUser = ref(false)
const tabs = ref([])
const activeTabId = ref('')
const tabContextVisible = ref('')
const menuIconModules = import.meta.glob('../../assets/images/menus/*.png', {
  eager: true,
  import: 'default'
})

let timer = null
let telNumTimer = null
let userOnlineTimer = null
let noticeSocket = null
let socketPingTimer = null
let socketReconnectTimer = null
let reconnectCount = 0
let isLogout = false

const maxReconnectCount = 5

const runtimeTitle = computed(() => window.common?.systemTitle || window.__KXT_CONFIG__?.systemTitle || 'Xin Xiang')
const userInfo = computed(() => authStore.userInfo ?? {})
const menus = computed(() => authStore.menus ?? [])
const activeMenu = computed(() => menus.value.find((item) => item.id === activeMenuId.value) ?? menus.value[0])
const submenus = computed(() => activeMenu.value?.submenu ?? [])
const activeTab = computed(() => tabs.value.find((item) => item.id === activeTabId.value) ?? tabs.value[0])
const rolePageIndex = computed(() => localStorage.getItem('rolePageIndex') || 'BlankPage')
const activeInternalPage = computed(() => resolveInternalPageComponent(activeTab.value?.url || rolePageIndex.value, activeTab.value?.query ?? {}))
const currentPage = computed(() => activeTab.value?.fullpath || activeSubmenu.value?.fullpath || activeSubmenu.value?.text || '欢迎首页')
const footerTitle = computed(() => window.common?.bottomName || window.__KXT_CONFIG__?.bottomName || '')
const telNum = computed(() => localStorage.getItem('telNum') || '')
const menuShowType = computed(() => localStorage.getItem('menuShowType') || '')
const leftMenuRoleCodes = computed(() => {
  const source = window.common?.leftMenuRoleCodes ?? window.__KXT_CONFIG__?.leftMenuRoleCodes ?? ''
  return String(source)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
})
const showSubmenuLeft = computed(() => {
  const value = window.common?.showSubmenuLeft ?? window.__KXT_CONFIG__?.showSubmenuLeft
  return value === true || value === 'true'
})
const isLeftMenu = computed(() => {
  const roleCode = localStorage.getItem('roleCode') || userInfo.value.roleCode || ''
  return menuShowType.value === '3' || showSubmenuLeft.value || leftMenuRoleCodes.value.includes(String(roleCode))
})
const uploadAction = computed(() => {
  const baseApi = window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
  return `${baseApi}/api/v1/uploadFile/uploadImg`
})
const uploadHeaders = computed(() => {
  const token = getToken()
  return token ? { token } : {}
})
const uploadData = computed(() => ({
  userId: userInfo.value.userId
}))
const resetPwdRules = {
  oldPwd: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPwd: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        const pwdCheck = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^&*()_+`\-={}:";'<>,./])(?=.*\d).{6,15}$/

        if (!value) {
          callback(new Error('请输入新密码'))
          return
        }

        if (value === resetPwdModel.oldPwd) {
          callback(new Error('新密码与原密码不能相同'))
          return
        }

        if (!pwdCheck.test(value)) {
          callback(new Error('请输入6-15位大小写字母加数字加特殊字符组合'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ],
  confirmPwd: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入密码'))
          return
        }

        if (value !== resetPwdModel.newPwd) {
          callback(new Error('两次输入密码不一致'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ]
}

function getToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || ''
}

function getMenuIcon(icon, active = false) {
  if (!icon) {
    return ''
  }

  const suffix = active ? '-blue' : ''
  const match = Object.entries(menuIconModules).find(([path]) => path.endsWith(`/${icon}${suffix}.png`))

  if (match) {
    return match[1]
  }

  const fallback = Object.entries(menuIconModules).find(([path]) => path.endsWith(`/${icon}.png`))
  return fallback?.[1] ?? ''
}

function getLeftMenuIcon(icon) {
  if (!icon) {
    return ''
  }

  const activeMatch = Object.entries(menuIconModules).find(([path]) => path.endsWith(`/${icon}-blue.png`))
  

  if (activeMatch) {
    return activeMatch[1]
  }

  return getMenuIcon(icon)
}

function getDirectBadge(menu) {
  if (!menu?.code) {
    return 0
  }

  const matched = Object.entries(badgeJson.value).find(([key]) => key.split('@')[1] === menu.code)
  return Number(matched?.[1] || 0)
}

function getMenuBadge(menu) {
  if (!menu) {
    return 0
  }

  let badgeNum = 0

  for (const [key, value] of Object.entries(badgeJson.value)) {
    const [parentCode, childCode] = key.split('@')

    if (parentCode === String(menu.pid) || childCode === menu.code) {
      badgeNum += Number(value) || 0
    }
  }

  return badgeNum
}

function clearSocketPing() {
  if (socketPingTimer) {
    window.clearInterval(socketPingTimer)
    socketPingTimer = null
  }
}

function clearSocketReconnect() {
  if (socketReconnectTimer) {
    window.clearInterval(socketReconnectTimer)
    socketReconnectTimer = null
  }
}

function updateTime() {
  const date = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  nowTime.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function normalizeMenuUrl(url = '') {
  if (!url) {
    return ''
  }

  if (url.startsWith('http')) {
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

function parseUrlQuery(url = '') {
  const [path, queryString = ''] = String(url || '').split('?')
  const query = {}

  new URLSearchParams(queryString).forEach((value, key) => {
    query[key] = value
  })

  return { path, query }
}

function stringifyQuery(query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function buildTabRealPath(url, query) {
  if (!url) {
    return ''
  }

  if (url.startsWith('http')) {
    return `${url}${stringifyQuery(query)}`
  }

  return `${normalizeMenuUrl(url)}${stringifyQuery(query)}`
}

function getMenuTabId(menu) {
  return `${menu?.isShowHz ?? 0}_${menu?.id ?? 'index'}_${menu?.pid ?? 0}`
}

function makeTabFromMenu(menu, options = {}) {
  const parsed = parseUrlQuery(menu?.url || options.url || '')
  const mergedQuery = {
    ...parsed.query,
    ...(options.query ?? {})
  }

  if (menu?.tmp_url) {
    Object.assign(mergedQuery, parseUrlQuery(menu.tmp_url).query)
    menu.tmp_url = ''
  }

  if (!options.skipLegacyQuery) {
    mergedQuery.t = Date.now()
    mergedQuery.selectRange = Number(menu?.selectRange) > 0 ? menu.selectRange : 99
  }

  const url = normalizeMenuUrl(parsed.path)
  const id = options.id || getMenuTabId(menu)

  if (id.startsWith('1_')) {
    mergedQuery.fullid = id
  }

  return {
    id,
    title: options.title || menu?.text || '欢迎首页',
    url,
    realPath: buildTabRealPath(url, mergedQuery),
    fullpath: options.fullpath || menu?.fullpath || menu?.text || '欢迎首页',
    closable: options.closable ?? true,
    external: url.startsWith('http'),
    query: mergedQuery,
    refreshKey: Date.now()
  }
}

function openTab(tab) {
  const existing = tabs.value.find((item) => item.id === tab.id)

  if (existing) {
    existing.query = tab.query
    existing.realPath = tab.realPath
    existing.url = tab.url
    existing.fullpath = tab.fullpath
  } else {
    tabs.value.push(tab)
  }

  activeTabId.value = tab.id
}

function activateTab(tab) {
  activeTabId.value = tab.id

  const matchedSubmenu = menus.value
    .flatMap((menu) => menu.submenu ?? [])
    .find((submenu) => getMenuTabId(submenu) === tab.id)

  if (matchedSubmenu) {
    activeSubmenu.value = matchedSubmenu
    activeSubMenuId.value = matchedSubmenu.id
    const parent = menus.value.find((menu) => menu.id === matchedSubmenu.pid || menu.submenu?.some((item) => item.id === matchedSubmenu.id))
    if (parent) {
      activeMenuId.value = parent.id
    }
  }
}

function closeTab(tab) {
  if (!tab.closable) {
    return
  }

  const index = tabs.value.findIndex((item) => item.id === tab.id)
  tabs.value.splice(index, 1)

  if (activeTabId.value === tab.id) {
    const nextTab = tabs.value[index] ?? tabs.value[index - 1] ?? tabs.value[0]
    if (nextTab) {
      activateTab(nextTab)
    }
  }

  tabContextVisible.value = ''
}

function closeOtherTabs(tab) {
  tabs.value = tabs.value.filter((item) => !item.closable || item.id === tab.id)
  activateTab(tab)
  tabContextVisible.value = ''
}

function closeRightTabs(tab) {
  const index = tabs.value.findIndex((item) => item.id === tab.id)

  if (index < 0) {
    return
  }

  tabs.value = tabs.value.filter((item, itemIndex) => itemIndex <= index || !item.closable)
  activateTab(tab)
  tabContextVisible.value = ''
}

function handleTabCommand(command, tab) {
  if (command === 'refresh') {
    activateTab(tab)
    refreshActiveTab()
  }

  if (command === 'close') {
    closeTab(tab)
  }

  if (command === 'closeOther') {
    closeOtherTabs(tab)
  }

  if (command === 'closeRight') {
    closeRightTabs(tab)
  }
}

function refreshActiveTab() {
  if (!activeTab.value) {
    return
  }

  const refreshed = { ...activeTab.value, refreshKey: Date.now() }
  tabs.value = tabs.value.map((item) => (item.id === refreshed.id ? refreshed : item))
  ElMessage.success('页面已刷新')
}

function resetPwdModelFields() {
  resetPwdModel.oldPwd = ''
  resetPwdModel.newPwd = ''
  resetPwdModel.confirmPwd = ''
  resetPwdFormRef.value?.clearValidate()
}

async function submitResetPwd() {
  const valid = await resetPwdFormRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  resetPwdLoading.value = true

  try {
    const response = await changePassword({
      oldPwd: encryptByAes(resetPwdModel.oldPwd),
      newPwd: encryptByAes(resetPwdModel.newPwd),
      confirmPwd: encryptByAes(resetPwdModel.confirmPwd)
    })

    if (response.data?.code === 200) {
      ElMessage.success(response.data.message || '密码修改成功')
      editPwdVisible.value = false
      resetPwdModelFields()
    } else {
      ElMessage.info(response.data?.message || '密码修改失败')
    }
  } finally {
    resetPwdLoading.value = false
  }
}

function beforeAvatarUpload(file) {
  if (/alert/i.test(file.name)) {
    ElMessage.error('上传图片的文件名禁止包含 alert 字段')
    return false
  }

  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式')
  }

  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB')
  }

  return isImage && isLt2M
}

function parseUploadResponse(response) {
  if (typeof response !== 'string') {
    return response
  }

  try {
    return JSON.parse(decryptBySm4(response))
  } catch {
    return response
  }
}

function handleAvatarSuccess(response, uploadFile) {
  const result = parseUploadResponse(response)

  avatarUrl.value = URL.createObjectURL(uploadFile.raw)

  if (result?.data?.status === true || result?.code === 200) {
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(result?.message || '上传失败')
  }

  uploadVisible.value = false
}

async function loadUserAvatar(userId) {
  if (!userId) {
    return
  }

  try {
    const response = await findUser(userId)
    const img = response.data?.data?.img

    if (img) {
      const baseApi = window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
      avatarUrl.value = `${baseApi}${img}`
    }
  } catch {
    avatarUrl.value = ''
  }
}

function formatTimestamp(value, withTime = true) {
  if (!value) {
    return '-'
  }

  const date = new Date(Number(value) * 1000)
  const pad = (item) => String(item).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  if (!withTime) {
    return day
  }

  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function selectMenu(menu) {
  activeMenuId.value = menu.id
  const firstSubmenu = menu.submenu?.[0]

  if (firstSubmenu) {
    selectSubmenu(firstSubmenu)
  }
}

function selectSubmenu(submenu) {
  activeSubMenuId.value = submenu.id
  activeSubmenu.value = submenu

  if (submenu.is_new_open && submenu.url?.startsWith('http')) {
    window.open(submenu.url, '_blank', 'noopener,noreferrer')
    return
  }

  openTab(makeTabFromMenu(submenu))
}

function openMenuByCode(code, beforeOpen) {
  const parent = menus.value.find((menu) => menu.submenu?.some((submenu) => submenu.code === code))
  const submenu = parent?.submenu?.find((item) => item.code === code)

  if (!submenu) {
    ElMessage.warning('未找到对应菜单')
    return false
  }

  beforeOpen?.(submenu)
  activeMenuId.value = parent.id
  selectSubmenu(submenu)
  return true
}

function addHomeTab() {
  openTab(
    makeTabFromMenu(null, {
      id: 'index',
      title: '欢迎首页',
      url: rolePageIndex.value === 'BlankPage' ? '/BlankPage' : `/${rolePageIndex.value}`,
      fullpath: '欢迎首页',
      closable: false,
      query: {},
      skipLegacyQuery: true
    })
  )
}

function selectNoticeMenu() {
  if (!openMenuByCode('noticemine', (menu) => {
    menu.tmp_url = 'state=0'
  })) {
    openNoticeDialog()
  }
}

async function loadNoticeList(options = {}) {
  if (options.pageNum) {
    noticePage.pageNum = options.pageNum
  }

  if (options.pageSize) {
    noticePage.pageSize = options.pageSize
  }

  noticeLoading.value = true

  try {
    const response = await getNoticeMineList({
      pageNum: noticePage.pageNum,
      pageSize: noticePage.pageSize,
      state: 0
    })

    if (response.data?.code === 200) {
      const data = response.data.data ?? {}
      noticeRows.value = data.records ?? []
      noticePage.pageSize = data.size ?? noticePage.pageSize
      noticePage.total = data.total ?? 0
      noticeMessage.value = data.total ?? 0
    }
  } catch {
    noticeRows.value = []
    noticePage.total = 0
    noticeMessage.value = 0
  } finally {
    noticeLoading.value = false
  }
}

async function loadNoticeCount() {
  try {
    const response = await getNoticeMineList({
      pageNum: 1,
      pageSize: 1,
      state: 0
    })

    if (response.data?.code === 200) {
      noticeMessage.value = response.data.data?.total ?? 0
    }
  } catch {
    noticeMessage.value = 0
  }
}

async function refreshBadge(menuCodes) {
  try {
    const response = await findMenuBadge(menuCodes)

    if (response.data?.code === 200) {
      const nextBadge = response.data.data ?? {}
      badgeJson.value = menuCodes ? { ...badgeJson.value, ...nextBadge } : nextBadge
    }
  } catch {
    // Badge refresh is non-blocking; the WebSocket reconnect path will try again.
  }
}

async function syncReadBadge(menuCodes) {
  try {
    const response = await readMenuBadge(menuCodes)

    if (response.data?.code === 200) {
      badgeJson.value = response.data.data ?? {}
    }
  } catch {
    // Keep the last badge snapshot when the read sync endpoint is unavailable.
  }
}

function startSocketPing() {
  clearSocketPing()
  socketPingTimer = window.setInterval(() => {
    noticeSocket?.send(`ping ${Date.now()}`)
  }, 20000)
}

function scheduleSocketReconnect() {
  if (isLogout || socketReconnectTimer) {
    return
  }

  reconnectCount += 1

  if (reconnectCount > maxReconnectCount) {
    socketStatus.value = '连接失败'
    ElMessage.error('网络连接失败，已超出最大重连次数，请刷新页面重试')
    return
  }

  socketStatus.value = '重连中'
  socketReconnectTimer = window.setInterval(() => {
    connectNoticeSocket()
  }, 60000)
}

function handleSocketOpen() {
  reconnectCount = 0
  socketStatus.value = '已连接'
  clearSocketReconnect()
  startSocketPing()
  refreshBadge()
}

function handleSocketClose() {
  clearSocketPing()
  scheduleSocketReconnect()
}

function handleSocketError() {
  socketStatus.value = '连接异常'
}

function notifyNewNotice() {
  ElNotification({
    title: '通知公告',
    message: '您有一条新的公告信息，请注意查收！',
    position: 'bottom-right',
    duration: 6000,
    onClick: () => {
      openNoticeDialog()
    }
  })
}

async function handleSocketMessage(messageEvent) {
  let data

  try {
    data = JSON.parse(messageEvent.data)
  } catch {
    return
  }

  if (data.messageType === 0) {
    console.log('kxt socket', data.message)
    return
  }

  if (data.messageType === 1) {
    refreshBadge(data.message)
    return
  }

  if (data.messageType === 3) {
    syncReadBadge(data.message)
    return
  }

  if (data.messageType === 2) {
    await refreshBadge(data.message)

    if (noticeDialogVisible.value) {
      await loadNoticeList()
    } else {
      await loadNoticeCount()
    }

    if (noticeMessage.value > 0) {
      notifyNewNotice()
    }
  }
}

function connectNoticeSocket() {
  const account = localStorage.getItem('account') || userInfo.value.account

  if (!account) {
    socketStatus.value = '缺少账号'
    return
  }

  if (typeof WebSocket === 'undefined') {
    socketStatus.value = '不支持'
    ElMessage.error('您的浏览器不支持 WebSocket')
    return
  }

  clearSocketReconnect()
  noticeSocket?.close()
  noticeSocket = createNoticeSocket({
    account,
    onOpen: handleSocketOpen,
    onMessage: handleSocketMessage,
    onClose: handleSocketClose,
    onError: handleSocketError
  })

  const socket = noticeSocket.connect()
  socketStatus.value = socket ? '连接中' : '未配置'
}

function closeNoticeSocket() {
  clearSocketPing()
  clearSocketReconnect()
  noticeSocket?.close()
  noticeSocket = null
  socketStatus.value = '已关闭'
}

function openNoticeDialog() {
  noticeDialogVisible.value = true
  loadNoticeList({ pageNum: 1 })
}

function beforeNoticeClose(done) {
  if (noticeRows.value.length > 0) {
    ElMessage.warning('请阅读新的通知公告')
    return
  }

  done()
}

function handleNoticeSelectionChange(rows) {
  selectedNoticeRows.value = rows
}

async function markNoticeRead(rows) {
  const ids = rows.map((item) => item.id).filter(Boolean).join(',')

  if (!ids) {
    ElMessage.warning('请至少选择一条公告')
    return
  }

  const response = await markNoticeRowsRead(ids)

  if (response.data?.code === 200) {
    ElMessage.success(response.data.message || '已标记为已读')
    await loadNoticeList()
    await refreshBadge()
    if (activeNotice.value && rows.some((item) => item.id === activeNotice.value.id)) {
      noticeDetailVisible.value = false
      activeNotice.value = null
    }
    return
  }

  ElMessage.error(response.data?.message || '标记已读失败')
}

async function batchReadNotices() {
  if (selectedNoticeRows.value.length === 0) {
    ElMessage.warning('请至少选择一条公告')
    return
  }

  await ElMessageBox.confirm(`确认把这 ${selectedNoticeRows.value.length} 条公告标记为已读吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await markNoticeRead(selectedNoticeRows.value)
}

function viewNotice(row) {
  activeNotice.value = row
  noticeDetailVisible.value = true
}

async function handleNoticeRead() {
  await loadNoticeCount()
  await refreshBadge()
}

async function loadUserFromServer() {
  const token = getToken()

  if (!token) {
    router.replace('/login')
    return
  }

  if (authStore.menus.length > 0 && authStore.userInfo?.userId) {
    return
  }

  loadingUser.value = true

  try {
    const response = await getUserInfo(token)
    const result = response.data

    if (result?.code === 200) {
      authStore.setLoginSnapshot(result.data ?? {})
      localStorage.setItem('userId', result.data?.user?.userId ?? '')
      localStorage.setItem('roleCode', result.data?.user?.roleCode ?? '')
      localStorage.setItem('account', result.data?.user?.account ?? '')
    } else {
      ElMessage.error(result?.message || '用户信息获取失败')
      router.replace('/login')
    }
  } catch {
    ElMessage.error('用户信息获取失败')
    router.replace('/login')
  } finally {
    loadingUser.value = false
  }
}

function hydrateInitialMenu() {
  const firstMenu = menus.value[0]
  if (!firstMenu) {
    addHomeTab()
    return
  }

  activeMenuId.value = firstMenu.id
  addHomeTab()

  const allSubmenus = menus.value.flatMap((menu) => menu.submenu ?? [])
  const matchedSubmenu = allSubmenus.find((item) => normalizeMenuUrl(item.url).replace(/^\//, '') === rolePageIndex.value)

  if (matchedSubmenu) {
    nextTick(() => selectSubmenu(matchedSubmenu))
  } else if (firstMenu.submenu?.[0]) {
    activeSubmenu.value = firstMenu.submenu[0]
    activeSubMenuId.value = firstMenu.submenu[0].id
  }
}

async function doLogout() {
  await ElMessageBox.confirm('确定要退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  })

  const token = getToken()
  isLogout = true
  closeNoticeSocket()

  if (ctiStore.showTel) {
    await new Promise((resolve) => {
      ctiStore.ctiLogout(() => resolve())
    })
  }

  try {
    if (token) {
      await logout(token)
    }
  } finally {
    localStorage.clear()
    sessionStorage.clear()
    authStore.resetAuth()
    ctiStore.resetCti()
    router.replace('/login')
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    doLogout().catch(() => {})
    return
  }

  if (command === 'updatePwd') {
    editPwdVisible.value = true
    return
  }

  if (command === 'uploadImg') {
    uploadVisible.value = true
    return
  }
}

function startHeartbeatTimers() {
  const currentTelNum = localStorage.getItem('telNum')

  if (currentTelNum) {
    telNumTimer = window.setInterval(() => {
      keepTelNum(localStorage.getItem('telNum')).catch(() => {})
    }, 5000)
  }

  userOnlineTimer = window.setInterval(() => {
    keepUserOnline().catch(() => {})
  }, 180000)
}

onMounted(async () => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
  await loadUserFromServer()
  loadUserAvatar(authStore.userInfo?.userId)
  hydrateInitialMenu()
  loadNoticeCount()
  startHeartbeatTimers()
  connectNoticeSocket()

  if (ctiStore.showTel && authStore.userInfo?.deptId !== -1 && telNum.value) {
    const flag = sessionStorage.getItem('isQianRuCTI') || 'true'
    if (flag === 'true') {
      nextTick(() => {
        ctiStore.ctiLogin(
          {
            telNum: telNum.value,
            user: authStore.userInfo,
            dlsm: ctiStore.showDlsm
          },
          () => {},
          (data) => {
            if (data?.data === 404) {
              ctiStore.setCtiState(ctiStore.toolbarStateText.weidenglu)
            } else {
              ctiStore.setCtiState(ctiStore.toolbarStateText.txyc)
            }
          }
        )
      })
    }
  }
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
  }

  if (telNumTimer) {
    window.clearInterval(telNumTimer)
  }

  if (userOnlineTimer) {
    window.clearInterval(userOnlineTimer)
  }

  closeNoticeSocket()
  ctiStore.resetCti()
})
</script>

<template>
  <div class="home-shell" v-loading="loadingUser">
    <header class="home-header" :class="{ 'home-header--left-menu': isLeftMenu }">
      <div class="home-brand">
        <strong>{{ runtimeTitle }}</strong>
        <span>一号响应平台</span>
      </div>

      <nav v-if="!isLeftMenu" class="home-menu" aria-label="主菜单">
        <button
          v-for="menu in menus"
          :key="menu.id"
          class="home-menu__item"
          :class="{ active: activeMenuId === menu.id }"
          type="button"
          @click="selectMenu(menu)"
        >
          <img v-if="getMenuIcon(menu.icon, activeMenuId === menu.id)" :src="getMenuIcon(menu.icon, activeMenuId === menu.id)" alt="" />
          <HomeFilled v-else />
          <span>{{ menu.text }}</span>
          <el-badge v-if="getMenuBadge(menu) > 0" :max="99" :value="getMenuBadge(menu)" class="menu-badge" />
        </button>
      </nav>

      <div class="home-actions">
        <el-badge :hidden="noticeMessage <= 0" is-dot class="notice-badge">
          <button class="notice-button" type="button" aria-label="通知公告" @click="selectNoticeMenu">
            <el-icon><Bell /></el-icon>
          </button>
        </el-badge>

        <el-dropdown trigger="click" @command="handleCommand">
          <button class="user-entry" type="button">
            <el-avatar :size="40" :src="avatarUrl || defaultAvatar" />
            <span class="user-entry__name">{{ userInfo.userName || userInfo.account || '用户' }}</span>
            <el-icon class="user-entry__arrow"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="updatePwd">修改密码</el-dropdown-item>
              <el-dropdown-item command="uploadImg">上传头像</el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                安全退出
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <section v-if="!isLeftMenu" class="submenu-bar">
      <button
        v-for="submenu in submenus"
        :key="submenu.id"
        class="submenu-bar__item"
        :class="{ active: activeSubMenuId === submenu.id }"
        type="button"
        @click="selectSubmenu(submenu)"
      >
        <span>{{ submenu.text }}</span>
        <el-badge v-if="getDirectBadge(submenu) > 0" :max="99" :value="getDirectBadge(submenu)" class="menu-badge" />
      </button>
      <time>
        <el-icon><Clock /></el-icon>
        {{ nowTime }}
      </time>
    </section>

    <CtiTopBar />

    <section class="home-body" :class="{ 'with-left-menu': isLeftMenu }">
      <aside v-if="isLeftMenu" class="left-submenu">
        <header class="left-submenu__header">
          <time>
            <el-icon><Clock /></el-icon>
            {{ nowTime }}
          </time>
        </header>

        <el-scrollbar class="left-submenu__scroll">
          <el-menu
            class="left-menu"
            :default-active="String(activeSubMenuId)"
            :default-openeds="[String(activeMenuId)]"
            unique-opened
          >
            <el-sub-menu v-for="menu in menus" :key="menu.id" :index="String(menu.id)">
              <template #title>
                <span class="left-menu__title">
                  <span class="left-menu__icon-wrap">
                    <img v-if="getLeftMenuIcon(menu.icon)" class="left-menu__icon" :src="getLeftMenuIcon(menu.icon)" alt="" />
                    <HomeFilled v-else class="left-menu__fallback-icon" />
                  </span>
                  <span>{{ menu.text }}</span>
                  <el-badge v-if="getMenuBadge(menu) > 0" :max="99" :value="getMenuBadge(menu)" class="menu-badge" />
                </span>
              </template>
              <el-menu-item
                v-for="submenu in menu.submenu"
                :key="submenu.id"
                :index="String(submenu.id)"
                @click="selectSubmenu(submenu)"
              >
                <span class="left-menu__item-text">{{ submenu.text }}</span>
                <el-badge v-if="getDirectBadge(submenu) > 0" :max="99" :value="getDirectBadge(submenu)" class="menu-badge" />
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-scrollbar>
      </aside>

      <div class="home-main-region">
        <section class="workspace-bar">
          <div class="location-bar">
            <span>当前位置：</span>
            <strong>{{ currentPage }}</strong>
          </div>

          <el-button :icon="Refresh" @click="refreshActiveTab">刷新</el-button>
        </section>

        <section class="tabs-strip" aria-label="打开的页面">
          <el-dropdown
            v-for="tab in tabs"
            :key="tab.id"
            trigger="contextmenu"
            @command="(command) => handleTabCommand(command, tab)"
          >
            <button
              class="tab-chip"
              :class="{ active: activeTabId === tab.id }"
              type="button"
              @click="activateTab(tab)"
              @contextmenu="tabContextVisible = tab.id"
            >
              <span>{{ tab.title }}</span>
              <el-icon v-if="tab.closable" @click.stop="closeTab(tab)"><Close /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh">刷新</el-dropdown-item>
                <el-dropdown-item v-if="tab.closable" command="close">关闭标签页</el-dropdown-item>
                <el-dropdown-item command="closeOther">关闭其他标签页</el-dropdown-item>
                <el-dropdown-item command="closeRight">关闭右侧标签页</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </section>

        <main class="home-content">
          <iframe
            v-if="activeTab?.external"
            :key="activeTab.id + activeTab.refreshKey"
            class="content-frame"
            :src="activeTab.realPath || activeTab.url"
            :title="activeTab.title"
          ></iframe>

          <component
            :is="activeInternalPage.component"
            v-else-if="activeInternalPage.component"
            :key="`${activeTab?.id || rolePageIndex}_${activeTab?.refreshKey || 0}`"
            v-bind="activeInternalPage.props"
            @notice-read="handleNoticeRead"
          />

          <section v-else class="welcome-panel">
            <div>
              <p class="eyebrow">Home Migration</p>
              <h1>{{ activeTab?.title || activeSubmenu?.text || '欢迎首页' }}</h1>
              <p>
                首页已同步旧项目的菜单、当前位置、页签和外链承载方式。业务页面会继续按模块迁移；
                在对应页面迁移前，页签会先保留菜单上下文，方便验证权限和导航。
              </p>
            </div>

            <dl class="home-facts">
              <div>
                <dt>账号</dt>
                <dd>{{ userInfo.account || '-' }}</dd>
              </div>
              <div>
                <dt>角色</dt>
                <dd>{{ userInfo.roleName || userInfo.roleCode || '-' }}</dd>
              </div>
              <div>
                <dt>当前地址</dt>
                <dd>{{ activeTab?.realPath || activeTab?.url || rolePageIndex }}</dd>
              </div>
            </dl>
          </section>
        </main>
      </div>
    </section>

    <CtiToolbar
      @show-black-dialog="ctiBlackDialogVisible = true"
      @show-call-dialog="ctiCallDialogVisible = true"
    />

    <footer class="home-footer">
      <span>{{ footerTitle }}</span>
      <span v-if="telNum">分机号：{{ telNum }}</span>
      <span v-if="telNum && ctiStore.showTel">话机状态：{{ ctiStore.ctiTelNumState || '未接入 CTI' }}</span>
      <span v-if="!ctiStore.showTel && telNum">话机状态：无 CTI 权限</span>
      <span>通知连接：{{ socketStatus }}</span>
    </footer>

    <el-dialog
      v-model="noticeDialogVisible"
      title="通知公告信息"
      width="80%"
      :close-on-click-modal="false"
      :before-close="beforeNoticeClose"
    >
      <div class="notice-toolbar">
        <el-button type="primary" @click="batchReadNotices">批量阅读</el-button>
      </div>

      <el-table
        border
        stripe
        v-loading="noticeLoading"
        :data="noticeRows"
        max-height="520"
        @selection-change="handleNoticeSelectionChange"
      >
        <el-table-column type="selection" width="52" />
        <el-table-column type="index" label="序号" width="58" />
        <el-table-column label="添加时间" width="170">
          <template #default="{ row }">{{ formatTimestamp(row.addTime) }}</template>
        </el-table-column>
        <el-table-column prop="typeName" label="通知类型" width="150" show-overflow-tooltip />
        <el-table-column prop="title" label="通知标题" min-width="260" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="添加人员" width="140" show-overflow-tooltip />
        <el-table-column label="阅读状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.state === 1 ? 'success' : 'warning'" effect="plain">
              {{ row.state === 1 ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="到期时间" width="130">
          <template #default="{ row }">{{ formatTimestamp(row.dueTime, false) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewNotice(row)">查看</el-button>
            <el-button v-if="row.state !== 1" link type="success" @click="markNoticeRead([row])">已读</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="notice-pagination">
        <el-pagination
          v-model:current-page="noticePage.pageNum"
          v-model:page-size="noticePage.pageSize"
          background
          :page-sizes="[10, 50, 100, 500]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="noticePage.total"
          @size-change="(pageSize) => loadNoticeList({ pageSize, pageNum: 1 })"
          @current-change="(pageNum) => loadNoticeList({ pageNum })"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="noticeDetailVisible" title="查看公告" width="72%" :close-on-click-modal="false">
      <article v-if="activeNotice" class="notice-detail">
        <header>
          <h2>{{ activeNotice.title }}</h2>
          <p>
            <span>{{ activeNotice.typeName || '通知公告' }}</span>
            <span>{{ activeNotice.operatorName || '-' }}</span>
            <span>{{ formatTimestamp(activeNotice.addTime) }}</span>
          </p>
        </header>
        <section v-if="activeNotice.content" class="notice-detail__content" v-html="activeNotice.content"></section>
        <el-empty v-else description="暂无公告正文，后续将继续迁移完整公告详情组件" />
      </article>
      <template #footer>
        <el-button @click="noticeDetailVisible = false">关闭</el-button>
        <el-button v-if="activeNotice?.state !== 1" type="primary" @click="markNoticeRead([activeNotice])">
          标记为已读
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editPwdVisible" title="修改密码" width="420px" @closed="resetPwdModelFields">
      <el-form
        ref="resetPwdFormRef"
        :model="resetPwdModel"
        :rules="resetPwdRules"
        label-width="90px"
        label-suffix=":"
      >
        <el-form-item label="原密码" prop="oldPwd">
          <el-input v-model="resetPwdModel.oldPwd" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input v-model="resetPwdModel.newPwd" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPwd">
          <el-input v-model="resetPwdModel.confirmPwd" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdLoading" @click="submitResetPwd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadVisible" title="上传头像" width="420px">
      <div class="avatar-upload-panel">
        <el-upload
          class="avatar-uploader"
          :action="uploadAction"
          :data="uploadData"
          :headers="uploadHeaders"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :on-success="handleAvatarSuccess"
        >
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar-preview" alt="当前头像" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <p>只允许上传 jpg、png 类型的图片，大小不能超过 2MB。</p>
      </div>
      <template #footer>
        <el-button @click="uploadVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <CtiBlackDialog v-model:visible="ctiBlackDialogVisible" />
    <CtiCallDialog v-model:visible="ctiCallDialogVisible" />
    <CtiRestDialog />
  </div>
</template>

<style scoped lang="scss">
.home-shell {
  min-height: 100dvh;
  background: var(--kxt-bg);
}

.home-header {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 60px;
  padding: 0 22px;
  background:
    linear-gradient(90deg, rgba(31, 80, 182, 0.94), rgba(49, 103, 221, 0.98) 42%, rgba(70, 130, 239, 0.96)),
    var(--kxt-brand);
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.14),
    0 6px 18px rgba(23, 73, 184, 0.12);
  color: #fff;
}

.home-header--left-menu {
  grid-template-columns: 160px minmax(0, 1fr) auto;

  .home-actions {
    grid-column: 3;
  }
}

.home-brand {
  min-width: 0;

  strong,
  span {
    display: block;
  }

  strong {
    font-family: "SourceHanSansSC-Medium", "Microsoft YaHei", sans-serif;
    overflow: hidden;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    display: none;
  }
}

.home-menu {
  display: flex;
  align-items: stretch;
  min-width: 0;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.home-menu__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 17px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;

  &::before {
    position: absolute;
    top: 14px;
    right: 0;
    bottom: 14px;
    width: 1px;
    background: rgba(255, 255, 255, 0.18);
    content: "";
  }

  &::after {
    position: absolute;
    right: 16px;
    bottom: 0;
    left: 16px;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: transparent;
    content: "";
  }

  img,
  svg {
    width: 18px;
    height: 18px;
  }

  &.active,
  &:hover {
    background: rgba(27, 75, 178, 0.5);
    color: #fff;
  }

  &.active {
    font-weight: 700;
  }

  &.active::after {
    background: #fff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.55);
  }
}

.menu-badge {
  :deep(.el-badge__content) {
    border: 0;
    box-shadow: 0 4px 12px rgba(208, 48, 80, 0.24);
  }
}

.home-actions,
.user-entry {
  display: flex;
  align-items: center;
}

.home-actions {
  gap: 16px;
  justify-content: flex-end;
  min-width: 198px;
  padding-left: 18px;
}

.notice-button {
  display: grid;
  width: 28px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: rgba(255, 255, 255, 0.86);
  }
}

.notice-badge {
  :deep(.el-badge__content.is-dot) {
    top: 8px;
    right: 5px;
    width: 7px;
    height: 7px;
    border: 1px solid #fff;
    background: #ff333e;
  }
}

.user-entry {
  gap: 7px;
  min-height: 38px;
  max-width: 176px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-family: "Microsoft YaHei", sans-serif;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
}

.user-entry__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.user-entry__arrow {
  flex: 0 0 auto;
  font-size: 16px;
}

.submenu-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 39px;
  padding: 0 38px;
  border-bottom: 1px solid var(--kxt-line);
  background: linear-gradient(90deg, rgba(72, 132, 240, 0.98), rgba(78, 139, 244, 0.96));
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.15);

  time {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    color: rgba(255, 255, 255, 0.86);
    font-size: 13px;
    white-space: nowrap;
  }
}

.submenu-bar__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 39px;
  padding: 0 20px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 700;
  transition: color 0.18s ease;

  &.active,
  &:hover {
    background: transparent;
    color: #fff;
    font-weight: 700;
  }

  &.active::after,
  &:hover::after {
    position: absolute;
    right: 20px;
    bottom: 0;
    left: 20px;
    display: block;
    width: 40px;
    height: 4px;
    margin: 0 auto;
    border-radius: 2px;
    background: #fff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    content: "";
  }
}

.home-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.home-body.with-left-menu {
  grid-template-columns: 230px minmax(0, 1fr);
  min-height: calc(100dvh - 186px);
}

.home-main-region {
  min-width: 0;
}

.left-submenu {
  min-width: 0;
  min-height: calc(100dvh - 186px);
  border-right: 1px solid var(--kxt-line);
  background: var(--kxt-panel);
  box-shadow: 8px 0 24px -28px rgba(49, 103, 221, 0.5);
}

.left-submenu__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--kxt-line);
  color: var(--kxt-ink-strong);
  font-weight: 700;

  time {
    grid-column: 1 / -1;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--kxt-muted);
    font-size: 12px;
    font-weight: 400;
    white-space: nowrap;
  }
}

.left-submenu__scroll {
  height: calc(100dvh - 244px);
}

.left-menu {
  border-right: 0;

  :deep(.el-sub-menu__title),
  :deep(.el-menu-item) {
    height: 44px;
    line-height: 44px;
    font-weight: 700;
    .el-sub-menu__icon-arrow {
      font-weight: 700;
      font-size: 14px;
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title),
  :deep(.el-menu-item.is-active) {
    color: var(--kxt-brand);
    font-weight: 700;
  }

  :deep(.el-menu-item.is-active) {
    background: #f4f9ff;
    box-shadow: inset 3px 0 0 var(--kxt-brand);
  }
}

.left-menu__title,
.left-menu__item-text {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  font-weight: 700;
}

.left-menu__title {
  gap: 8px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.left-menu__icon-wrap {
  display: inline-grid;
  width: 25px;
  height: 44px;
  flex: 0 0 25px;
  place-items: center start;
  overflow: visible;
}

.left-menu__icon {
  width: 30px;
  height: 30px;
  margin-left: -3px;
  object-fit: contain;
}

.left-menu__fallback-icon {
  width: 18px;
  height: 18px;
  color: var(--kxt-brand);
}

.left-menu__item-text {
  max-width: 128px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-body.with-left-menu {
  .workspace-bar,
  .tabs-strip,
  .home-content {
    padding-right: 24px;
    padding-left: 24px;
  }
}

.workspace-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  padding: 0 38px;
  border-bottom: 1px solid var(--kxt-line);
  background: #f5f9fc;
}

.location-bar {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 8px;
  align-items: center;
  color: #999999;
  font-size: 12px;

  strong {
    min-width: 0;
    overflow: hidden;
    color: #666666;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.tabs-strip {
  display: flex;
  gap: 0;
  min-height: 40px;
  padding: 0 38px;
  overflow-x: auto;
  border-bottom: 1px solid var(--kxt-line);
  background: var(--kxt-panel);
  box-shadow: 0 2px 8px rgba(219, 227, 237, 0.72);
}

.tab-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  min-height: 40px;
  padding: 6px 20px 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #4d4d4d;
  cursor: pointer;
  white-space: nowrap;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.active {
    background: transparent;
    color: var(--kxt-brand);
    font-weight: 700;
  }

  &.active::after {
    position: absolute;
    right: 20px;
    bottom: 3px;
    left: 0;
    height: 4px;
    border-radius: 2px;
    background: var(--kxt-brand);
    content: "";
  }
}

.home-content {
  padding: 18px 50px 32px;
}

.content-frame {
  width: 100%;
  min-height: calc(100dvh - 263px);
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background: var(--kxt-panel);
  box-shadow: 0 24px 60px -44px rgba(49, 103, 221, 0.52);
}

.home-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 36px;
  border-top: 1px solid var(--kxt-line);
  background: var(--kxt-panel);
  color: var(--kxt-muted);
  font-size: 13px;
}

.welcome-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 32px;
  padding: 32px;
  border: 1px solid var(--kxt-line);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(244, 249, 255, 0.96), rgba(255, 255, 255, 0.96)),
    var(--kxt-panel);
  box-shadow: 0 24px 60px -44px rgba(49, 103, 221, 0.62);

  h1 {
    margin: 4px 0 12px;
    color: #1c4886;
    font-size: 30px;
  }

  p {
    max-width: 680px;
    margin: 0;
    color: var(--kxt-muted);
    line-height: 1.8;
  }
}

.home-facts {
  display: grid;
  gap: 12px;
  margin: 0;

  div {
    padding: 14px;
    border-radius: 6px;
    background: #f4f9ff;
    box-shadow: inset 3px 0 0 rgba(49, 103, 221, 0.32);
  }

  dt {
    color: #64748b;
    font-size: 12px;
  }

  dd {
    margin: 6px 0 0;
    overflow-wrap: anywhere;
    color: var(--kxt-ink-strong);
    font-weight: 700;
  }
}

.notice-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.notice-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.notice-detail {
  header {
    padding-bottom: 14px;
    border-bottom: 1px solid var(--kxt-line);

    h2 {
      margin: 0;
      color: var(--kxt-ink-strong);
      font-size: 22px;
    }

    p {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 10px 0 0;
      color: var(--kxt-muted);
      font-size: 13px;
    }
  }
}

.notice-detail__content {
  max-height: 58vh;
  overflow: auto;
  padding: 18px 4px 0;
  color: var(--kxt-ink);
  line-height: 1.8;

  :deep(img) {
    max-width: 100%;
  }
}

.avatar-upload-panel {
  text-align: center;

  p {
    margin: 14px 0 0;
    color: #d03050;
    font-size: 13px;
    line-height: 1.7;
  }
}

.avatar-uploader {
  :deep(.el-upload) {
    display: grid;
    width: 178px;
    height: 178px;
    margin: 0 auto;
    place-items: center;
    overflow: hidden;
    border: 1px dashed #c9d5e3;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      border-color: var(--kxt-brand);
    }
  }
}

.avatar-preview {
  width: 178px;
  height: 178px;
  object-fit: cover;
}

.avatar-uploader-icon {
  color: #8c939d;
  font-size: 30px;
}

@media (max-width: 980px) {
  .home-header {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 16px;
  }

  .home-actions {
    justify-content: flex-start;
    min-width: 0;
    padding-left: 0;
  }

  .submenu-bar {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 16px;

    time {
      margin-left: 0;
    }
  }

  .home-body.with-left-menu {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;

    .workspace-bar,
    .tabs-strip,
    .home-content {
      padding-right: 16px;
      padding-left: 16px;
    }
  }

  .left-submenu {
    min-height: 0;
    border-right: 0;
    border-bottom: 1px solid var(--kxt-line);
  }

  .left-submenu__header {
    grid-template-columns: auto minmax(0, 1fr) auto;

    time {
      grid-column: auto;
      padding-bottom: 0;
    }
  }

  .left-submenu__scroll {
    height: auto;
    max-height: 320px;
  }

  .workspace-bar,
  .tabs-strip,
  .home-content {
    padding-right: 16px;
    padding-left: 16px;
  }

  .welcome-panel {
    grid-template-columns: 1fr;
    padding: 20px;
  }
}
</style>
