import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const SOFT_PHONE_AUTH_CODE = 'rdh'

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref({})
  const role = ref({})
  const menus = ref([])
  const options = ref([])
  const datas = ref([])

  const isLoggedIn = computed(() => {
    return Boolean(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))
  })

  function setUser(user = {}) {
    userInfo.value = user
    role.value = {
      roleName: user.roleName,
      roleId: user.roleId,
      roleCode: user.roleCode
    }
  }

  function setAuth(auth = {}) {
    menus.value = auth.menus ?? []
    options.value = auth.options ?? []
    datas.value = auth.datas ?? []
  }

  function setLoginSnapshot(data = {}) {
    setUser(data.user ?? {})
    setAuth(data.auth ?? {})
  }

  function hasPermission(code, type) {
    let permissionItems = []

    if (type === 1 && options.value.length > 0) {
      permissionItems = options.value[0]?.submenu ?? []
    }

    if (type === 0 && datas.value.length > 0) {
      permissionItems = datas.value[0]?.submenu ?? []
    }

    if (type === 2 && options.value.length > 0) {
      const softPhone = options.value.find((item) => item.code === 'softPhoneAuth')
      permissionItems = softPhone?.submenu ?? []
    }

    if (type === 3 && datas.value.length > 1) {
      permissionItems = datas.value[1]?.submenu ?? []
    }

    return permissionItems.some((item) => item.code === code)
  }

  function resetAuth() {
    userInfo.value = {}
    role.value = {}
    menus.value = []
    options.value = []
    datas.value = []
  }

  return {
    userInfo,
    role,
    menus,
    options,
    datas,
    isLoggedIn,
    setUser,
    setAuth,
    setLoginSnapshot,
    hasPermission,
    resetAuth
  }
})
