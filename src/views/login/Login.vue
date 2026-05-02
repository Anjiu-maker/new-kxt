<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Iphone, Key, Lock, Picture, User } from '@element-plus/icons-vue'
import loginBg from '@/assets/login/login_bg.png'
import loginIllustration from '@/assets/login/login_img.png'
import qrcode from '@/assets/login/qrcode.png'
import qrPanel from '@/assets/login/erweima.png'
import { checkLogin, confirmLogin, getFrontEndConfig, getTelNum, sendImgCode } from '@/services/authService'
import { SOFT_PHONE_AUTH_CODE, useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const formRef = ref()
const isShowTelNumInput = ref(false)
const captchaImage = ref('')
const captchaUuid = ref('')
const loading = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
  telNum: '',
  imgCode: ''
})

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'change' }],
  imgCode: [{ required: true, message: '请输入图形验证码', trigger: 'change' }],
  telNum: [
    {
      validator: (_rule, value, callback) => {
        if (value && !/^[0-9]*$/.test(value)) {
          callback(new Error('分机号应为数字'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

function getResponseData(response) {
  return response?.data ?? {}
}

function clearAuthStorage() {
  const localKeys = [
    'accessToken',
    'accessTokenTime',
    'account',
    'menuShowType',
    'roleCode',
    'rolePageIndex',
    'telNum',
    'userId'
  ]

  localKeys.forEach((key) => localStorage.removeItem(key))
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('rotShow')
}

async function refreshCaptcha() {
  try {
    const response = await sendImgCode()
    const result = getResponseData(response)

    if (result.code === 200) {
      captchaImage.value = result.data?.img ?? ''
      captchaUuid.value = result.data?.uuid ?? ''
      return
    }

    ElMessage.error(result.data || result.message || '验证码获取失败')
  } catch {
    ElMessage.error('验证码获取失败')
  }
}

async function initTelNum() {
  try {
    const response = await getTelNum()
    const result = getResponseData(response)
    const telNum = result.code === 200 ? result.data : ''

    loginForm.telNum = telNum || ''
    isShowTelNumInput.value = !telNum
  } catch {
    localStorage.telNum = ''
    isShowTelNumInput.value = true
  }
}

async function syncRuntimeConfig() {
  try {
    const frontEndConfig = await getFrontEndConfig()
    window.__KXT_CONFIG__ = {
      ...(window.__KXT_CONFIG__ ?? {}),
      ...frontEndConfig
    }

    if (frontEndConfig.systemTitle) {
      document.title = frontEndConfig.systemTitle
    }
  } catch {
    // Runtime configuration is not required for the first login milestone.
  }
}

function buildPayload() {
  return {
    account: loginForm.account,
    password: loginForm.password,
    telNum: loginForm.telNum,
    imgUUid: captchaUuid.value,
    imgCode: loginForm.imgCode
  }
}

function persistLoginState(data, telNum) {
  clearAuthStorage()

  const user = data.user ?? {}
  const auth = data.auth ?? {}

  authStore.setUser(user)
  authStore.setAuth(auth)

  localStorage.setItem('menuShowType', data.menuShowType ?? '')
  localStorage.setItem('roleCode', user.roleCode ?? '')
  localStorage.setItem('userId', user.userId ?? '')
  localStorage.setItem('accessTokenTime', String(Date.now()))
  localStorage.setItem('rolePageIndex', user.roleIndexPage ?? '')
  localStorage.setItem('account', user.account ?? '')
  localStorage.setItem('telNum', telNum ?? '')

  if (user.roleCode === 'rxzxzx' || user.roleCode === 'ldzx') {
    sessionStorage.setItem('rotShow', user.roleCode)
  }

  const hasSoftPhonePermission = authStore.hasPermission(SOFT_PHONE_AUTH_CODE, 2)

  if (hasSoftPhonePermission && !user.workNumber && user.userId !== 1) {
    authStore.resetAuth()
    clearAuthStorage()
    throw new Error('登录失败，请联系管理员填写工号')
  }

  if (hasSoftPhonePermission) {
    sessionStorage.setItem('accessToken', data.token ?? '')
    localStorage.removeItem('accessToken')
  } else {
    localStorage.setItem('accessToken', data.token ?? '')
    sessionStorage.removeItem('accessToken')
  }
}

function showLoginFailure(result) {
  if (result.code === 444) {
    ElNotification.error({
      title: '系统授权提醒',
      message: result.message,
      position: 'bottom-right',
      duration: 10000
    })
    return
  }

  if (result.code === 501 || result.code === 502 || result.message === '账号已锁，请联系管理员！') {
    ElMessage.error(result.message || '登录失败')
    return
  }

  if (result.message === '图形验证码错误！') {
    ElMessage.error(result.message)
    return
  }

  ElMessage.error(result.message || '账号或密码错误')
}

async function finishLogin(payload) {
  const response = await confirmLogin(payload)
  const result = getResponseData(response)

  if (result.code !== 200) {
    await refreshCaptcha()
    showLoginFailure(result)
    return
  }

  persistLoginState(result.data ?? {}, payload.telNum)
  await syncRuntimeConfig()
  ElMessage.success('登录成功')
  router.replace('/home')
}

async function submitLogin() {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  loading.value = true

  try {
    const payload = buildPayload()
    const response = await checkLogin(payload)
    const result = getResponseData(response)

    if (result.code === 200) {
      if (!result.data?.isLogin) {
        await finishLogin(payload)
      } else {
        await ElMessageBox.confirm('该账号已经在别处登录，是否继续登录？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        })
        await finishLogin(payload)
      }
      return
    }

    await refreshCaptcha()
    showLoginFailure(result)
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消登录')
    } else {
      ElMessage.error(error?.message || '登录失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const message = localStorage.getItem('message')

  if (message) {
    ElMessage({
      type: 'warning',
      message,
      duration: 6000,
      showClose: true
    })
    localStorage.removeItem('message')
  }

  initTelNum()
  refreshCaptcha()
})
</script>

<template>
  <main class="login-page" :style="{ '--login-bg': `url(${loginBg})` }">
    <section class="login-stage">
      <div class="login-visual" aria-hidden="true">
        <img :src="loginIllustration" alt="" />
      </div>

      <section class="login-card" @keyup.enter="submitLogin">
        <div class="login-card__heading">
          <p>Xin Xiang 12345</p>
          <h1>新乡市政务服务热线</h1>
          <span>一号响应平台</span>
        </div>

        <el-form ref="formRef" :model="loginForm" :rules="rules" class="login-form" label-width="0">
          <el-form-item prop="account">
            <el-input v-model.trim="loginForm.account" :prefix-icon="User" placeholder="账号" size="large" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              :prefix-icon="Lock"
              placeholder="密码"
              show-password
              size="large"
              type="password"
            />
          </el-form-item>

          <el-form-item prop="imgCode">
            <div class="captcha-row">
              <el-input
                v-model.trim="loginForm.imgCode"
                :prefix-icon="Picture"
                placeholder="图形验证码"
                size="large"
              />
              <button class="captcha-button" type="button" @click="refreshCaptcha">
                <img v-if="captchaImage" :src="captchaImage" alt="图形验证码" />
                <span v-else>刷新</span>
              </button>
            </div>
          </el-form-item>

          <el-form-item v-if="isShowTelNumInput" prop="telNum">
            <el-input
              v-model.trim="loginForm.telNum"
              :prefix-icon="Iphone"
              placeholder="客服请输入分机号，其他岗位无需输入"
              size="large"
            />
          </el-form-item>

          <el-button class="login-submit" :icon="Key" :loading="loading" type="primary" @click="submitLogin">
            登录
          </el-button>
        </el-form>

        <footer class="login-card__footer">技术支持：系统版本 3.0</footer>
      </section>
    </section>

    <aside class="fixed-qrcode" aria-label="下载职能版 APP">
      <div class="fixed-qrcode__label">下载职能版 APP</div>
      <div class="fixed-qrcode__panel" :style="{ backgroundImage: `url(${qrPanel})` }">
        <img :src="qrcode" alt="APP 下载二维码" />
      </div>
    </aside>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100dvh;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(49, 103, 221, 0.1), rgba(255, 255, 255, 0.22)),
    var(--login-bg) center / cover no-repeat;
}

.login-stage {
  display: grid;
  grid-template-columns: minmax(420px, 1fr) 500px;
  align-items: center;
  width: min(1280px, calc(100% - 56px));
  min-height: 100dvh;
  margin: 0 auto;
  gap: 48px;
}

.login-visual {
  display: flex;
  justify-content: center;

  img {
    width: min(720px, 100%);
    filter: drop-shadow(0 28px 42px rgba(49, 103, 221, 0.16));
  }
}

.login-card {
  position: relative;
  padding: 44px 54px 58px;
  border: 1px solid rgba(182, 220, 249, 0.56);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow:
    0 30px 80px rgba(49, 103, 221, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.login-card__heading {
  margin-bottom: 34px;
  text-align: center;

  p {
    margin: 0 0 8px;
    color: var(--kxt-brand);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #1c4886;
    font-family: "SourceHanSansSC-Medium", "Microsoft YaHei", sans-serif;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1.2;
  }

  span {
    display: inline-block;
    margin-top: 10px;
    color: var(--kxt-muted);
    font-size: 15px;
  }
}

.login-form {
  :deep(.el-input__wrapper) {
    min-height: 46px;
    border-radius: 5px;
    background: #fbfdff;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  gap: 12px;
  width: 100%;
}

.captcha-button {
  display: grid;
  height: 46px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #d7e3ef;
  border-radius: 5px;
  background: #f4f9ff;
  color: var(--kxt-brand);
  cursor: pointer;
  transition:
    border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: rgba(49, 103, 221, 0.42);
    box-shadow: 0 8px 18px -14px rgba(49, 103, 221, 0.66);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.login-submit {
  width: 100%;
  min-height: 46px;
  margin-top: 8px;
  border: 0;
  border-radius: 5px;
  background: var(--kxt-brand-deep);
  box-shadow: 0 8px 18px rgba(0, 82, 147, 0.3);
  font-size: 18px;

  &:hover,
  &:focus {
    background: #0b63ad;
  }
}

.login-card__footer {
  position: absolute;
  right: 0;
  bottom: 20px;
  left: 0;
  color: #929597;
  font-size: 14px;
  text-align: center;
}

.fixed-qrcode {
  position: fixed;
  top: 320px;
  left: 0;
  display: flex;
  width: 34px;
  height: 293px;
  overflow: hidden;
  border-radius: 0 14px 14px 0;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.24);
  transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    width: 178px;
  }
}

.fixed-qrcode__label {
  display: grid;
  width: 34px;
  flex: 0 0 34px;
  place-items: center;
  padding: 26px 7px;
  background: var(--kxt-brand-soft);
  color: #fff;
  font-size: 16px;
  line-height: 1.25;
  text-align: center;
}

.fixed-qrcode__panel {
  position: relative;
  width: 144px;
  flex: 0 0 144px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  img {
    position: absolute;
    top: 154px;
    left: 22px;
    width: 104px;
    height: 103px;
  }
}

@media (max-width: 980px) {
  .login-stage {
    grid-template-columns: 1fr;
    width: min(560px, calc(100% - 32px));
    padding: 32px 0;
  }

  .login-visual {
    display: none;
  }

  .login-card {
    padding: 34px 24px 58px;
  }

  .fixed-qrcode {
    display: none;
  }
}
</style>
