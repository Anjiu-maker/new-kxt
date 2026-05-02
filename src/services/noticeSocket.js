function getBaseApi() {
  return window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || ''
}

export function getNoticeSocketUrl(account) {
  const baseApi = getBaseApi()

  if (!baseApi || !account) {
    return ''
  }

  return `${baseApi.replace(/^http/i, 'ws')}/websocket/notice/${encodeURIComponent(account)}`
}

export function createNoticeSocket({ account, onOpen, onMessage, onClose, onError }) {
  let socket = null

  function connect() {
    const url = getNoticeSocketUrl(account)

    if (!url || typeof WebSocket === 'undefined') {
      return null
    }

    socket = new WebSocket(url)
    socket.onopen = onOpen
    socket.onmessage = onMessage
    socket.onclose = onClose
    socket.onerror = onError

    return socket
  }

  function close() {
    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onclose = null
      socket.onerror = null
      socket.close()
      socket = null
    }
  }

  function send(message) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(message)
    }
  }

  return {
    connect,
    close,
    send,
    getSocket: () => socket
  }
}
