
/**
 * 封装后的 Fetch 工具
 * 1. 自动注入 Authorization 头
 * 2. 统一拦截 401 状态码并触发登出事件
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    // 1. 获取本地 Token
    const token = localStorage.getItem('token')

    // 2. 构造 Headers
    const headers = new Headers(options.headers)

    // 自动注入 Token (如果存在)
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    // 默认 Content-Type 为 JSON (除非是 FormData)
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }

    const config = { ...options, headers }

    try {
        const response = await fetch(url, config)

        // =========================================================
        // 核心逻辑：全局 401 拦截
        // =========================================================
        if (response.status === 401) {
            // 后端返回 401，说明 Token 无效（Redis 中 Session 已删）
            // 派发自定义事件，通知 App.vue 执行登出
            window.dispatchEvent(new CustomEvent('auth:unauthorized'))

            // 抛出错误中断后续业务逻辑
            throw new Error('Unauthorized')
        }

        return response
    } catch (error) {
        // 可以根据需要在这里处理网络错误
        throw error
    }
}