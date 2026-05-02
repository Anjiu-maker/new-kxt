import CryptoJS from 'crypto-js'

const DEFAULT_KEY = '6b617862746373646f65667432303130'

export function encryptByAes(word, key = DEFAULT_KEY) {
  const parsedKey = CryptoJS.enc.Hex.parse(key)
  const encrypted = CryptoJS.AES.encrypt(word, parsedKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })

  return encrypted.ciphertext.toString()
}

export function decryptByAes(word, key = DEFAULT_KEY) {
  const parsedKey = CryptoJS.enc.Hex.parse(key)
  const decrypted = CryptoJS.AES.decrypt(CryptoJS.format.Hex.parse(word), parsedKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })

  return CryptoJS.enc.Utf8.stringify(decrypted).toString()
}
