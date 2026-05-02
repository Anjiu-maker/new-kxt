import Sm4js from 'sm4js'

const SM4_CONFIG = {
  key: 'KXT2023031611223',
  mode: 'cbc',
  iv: 'KA20230316121406',
  cipherType: 'base64'
}

function utf8ToBase64(text) {
  const utf8Bytes = new TextEncoder().encode(text)
  return btoa(String.fromCharCode.apply(null, utf8Bytes))
}

function base64ToUtf8(text) {
  const binary = window.atob(text)
  return decodeURIComponent(escape(binary))
}

export function encryptBySm4(text) {
  const sm4 = new Sm4js(SM4_CONFIG)
  return sm4.encrypt(utf8ToBase64(text))
}

export function decryptBySm4(text) {
  const sm4 = new Sm4js(SM4_CONFIG)
  const decrypted = sm4.decrypt(decodeURI(text))
  return base64ToUtf8(decrypted)
}
