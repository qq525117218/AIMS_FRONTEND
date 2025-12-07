// src/logic/useLogin.ts
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { authFetch } from '../utils/request' // ✅ 引入

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
                    // ✅ 使用 authFetch (它会自动处理 Headers，虽然登录接口不需要 Token，但用了也无妨)
                    const response = await authFetch('/api/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({
                            username: loginForm.username,
                            password: loginForm.password
                        })
                    })

                    const resData = (await response.json()) as LoginResponse

                    if (resData.code === 200 && resData.is_success) {
                        ElMessage.success(resData.message || '登录成功')
                        localStorage.setItem('token', resData.data.token)
                        localStorage.setItem('username', loginForm.username)
                        localStorage.setItem('token_expire', resData.data.expire_at)
                        emit('login-success', loginForm.username)
                    } else {
                        ElMessage.error(resData.message || '登录失败')
                    }
                } catch (error: any) {
                    console.error(error)
                    // authFetch 会抛出 'Unauthorized' 错误，这里可以忽略或特殊处理
                    if (error.message !== 'Unauthorized') {
                        ElMessage.error('网络连接异常或服务不可用')
                    }
                } finally {
                    isLoading.value = false
                }
            }
        })
    }

    return { formRef, isLoading, loginForm, rules, handleLogin }
}