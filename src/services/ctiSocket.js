function getCtiConfig() {
  const config = window.common ?? window.__KXT_CONFIG__ ?? {}
  return {
    baseApi: config.ctiBaseAPi || 'webrtc.call12345.com',
    wsBaseApi: config.cti_webSocketBaseApi || 'webrtc.call12345',
    httpBaseUrl: `http://${config.ctiBaseAPi || 'webrtc.call12345.com'}:12121`,
    wsUrl: `ws://${config.cti_webSocketBaseApi || 'webrtc.call12345.com'}:7397/websocket`
  }
}

export function createCtiSocket(options = {}) {
  const {
    onOpen,
    onMessage,
    onClose,
    onError
  } = options

  let socket = null
  let heartbeatTimer = null
  let isManualClose = false

  function getTelNum() {
    return localStorage.getItem('telNum') || ''
  }

  function send(msg) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false
    }
    socket.send(msg)
    return true
  }

  function sendJson(data) {
    return send(JSON.stringify(data))
  }

  function subscribe() {
    const extNum = getTelNum()
    if (!extNum) return

    const payload = JSON.stringify({
      method: 'SUBSCRIBE',
      from: extNum,
      to: extNum,
      expires: 360000
    })
    send(payload)
  }

  function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      subscribe()
    }, 30000)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function handleOpen() {
    console.log('CTI WebSocket connected')
    startHeartbeat()
    if (onOpen) onOpen()
  }

  function handleMessage(event) {
    let json
    try {
      json = JSON.parse(event.data)
    } catch {
      return
    }
    console.log('CTI message:', json.sceenShowType, json.direction, json.state)
    if (onMessage) onMessage(json)
  }

  function handleClose() {
    console.log('CTI WebSocket closed')
    stopHeartbeat()
    socket = null
    if (!isManualClose && onClose) onClose()
    isManualClose = false
  }

  function handleError() {
    console.log('CTI WebSocket error')
    if (onError) onError()
  }

  function connect() {
    if (socket) {
      console.warn('CTI WebSocket already exists, skip connect')
      return socket
    }

    if (typeof WebSocket === 'undefined') {
      console.error('WebSocket not supported')
      return null
    }

    const { wsUrl } = getCtiConfig()
    isManualClose = false
    socket = new WebSocket(wsUrl)
    socket.onopen = handleOpen
    socket.onmessage = handleMessage
    socket.onclose = handleClose
    socket.onerror = handleError
    return socket
  }

  function disconnect(callback) {
    isManualClose = true
    stopHeartbeat()

    const extNum = getTelNum()
    if (extNum) {
      const payload = JSON.stringify({
        method: 'SUBSCRIBE',
        from: extNum,
        to: extNum,
        expires: 0
      })
      send(payload)
    }

    if (socket) {
      socket.close()
      socket = null
    }

    if (callback) callback()
  }

  function isConnected() {
    return socket && socket.readyState === WebSocket.OPEN
  }

  return {
    connect,
    disconnect,
    send,
    sendJson,
    subscribe,
    isConnected,
    getHttpBaseUrl() {
      return getCtiConfig().httpBaseUrl
    }
  }
}
