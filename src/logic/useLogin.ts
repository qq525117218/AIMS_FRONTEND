// src/logic/useLogin.ts
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// [架构师注] 移除 authFetch，避免登录失败触发全局 Token 过期拦截
// import { authFetch } from '../utils/request'

export interface LoginResponse {
    code: number
    is_success: boolean
    message: string
    request_id: string
    data: {
        token: string
        expire_at: string
    }
}

export function useLogin(emit: (event: 'login-success', username: string) => void) {
    const formRef = ref<FormInstance>()
    const isLoading = ref(false)

    const loginForm = reactive({
        username: '',
        password: ''
    })

    const rules = reactive<FormRules>({
        username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    })

    const handleLogin = async () => {
        if (!formRef.value) return

        await formRef.value.validate(async (valid) => {
            if (valid) {
                isLoading.value = true
                try {
                    // [架构师注] 使用原生 fetch 进行登录
                    // 原因：登录接口不应该携带 Token，也不应该被全局的 401 (Token失效) 拦截器捕获
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: loginForm.username,
                            password: loginForm.password
                        })
                    })

                    // [核心修复] 单独处理 401 状态码，视为“账号密码错误”
                    if (response.status === 401) {
                        ElMessage.error('账号或密码错误，请检查后重试')
                        return // 终止后续逻辑，避免抛出异常
                    }

                    // 处理其他非 200-299 的 HTTP 错误（如 500 服务器错误）
                    if (!response.ok) {
                        ElMessage.error(`登录服务异常: ${response.status} ${response.statusText}`)
                        return
                    }

                    // 解析响应数据
                    const resData = (await response.json()) as LoginResponse

                    // 业务层面的成功判断
                    if (resData.code === 200 && resData.is_success) {
                        ElMessage.success(resData.message || '登录成功')

                        // 存储会话信息
                        localStorage.setItem('token', resData.data.token)
                        localStorage.setItem('username', loginForm.username)
                        localStorage.setItem('token_expire', resData.data.expire_at)

                        // 通知父组件跳转
                        emit('login-success', loginForm.username)
                    } else {
                        // 业务层面的失败（如 HTTP 200 但 code != 200）
                        ElMessage.error(resData.message || '登录失败')
                    }
                } catch (error: any) {
                    console.error('Login Error:', error)
                    ElMessage.error('网络连接异常或服务不可用')
                } finally {
                    isLoading.value = false
                }
            }
        })
    }

    return { formRef, isLoading, loginForm, rules, handleLogin }
}