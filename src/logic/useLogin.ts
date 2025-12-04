import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

// 定义接口响应类型
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

// 组合式函数
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
                    const response = await fetch('/api/Auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: loginForm.username,
                            password: loginForm.password
                        })
                    })

                    const resData = (await response.json()) as LoginResponse

                    if (resData.code === 200 && resData.is_success) {
                        ElMessage.success(resData.message || '登录成功')

                        // 存储 Token 和 用户信息
                        localStorage.setItem('token', resData.data.token)
                        localStorage.setItem('username', loginForm.username)
                        localStorage.setItem('token_expire', resData.data.expire_at)

                        // 触发回调
                        emit('login-success', loginForm.username)
                    } else {
                        ElMessage.error(resData.message || '登录失败，请检查账号密码')
                    }
                } catch (error) {
                    console.error(error)
                    ElMessage.error('网络连接异常，请检查后端服务是否启动')
                } finally {
                    isLoading.value = false
                }
            }
        })
    }

    return {
        formRef,
        isLoading,
        loginForm,
        rules,
        handleLogin
    }
}