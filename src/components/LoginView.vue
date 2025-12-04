<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-header">
        <div class="logo-box">📦</div>
        <h1 class="app-name">Packaging Studio <span class="pro-tag">PRO</span></h1>
        <p class="subtitle">企业级智能包装设计工作流</p>
      </div>

      <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
          size="large"
          @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
              v-model="loginForm.username"
              placeholder="账号"
              class="custom-input"
          >
            <template #prefix><el-icon class="input-icon"><User /></el-icon></template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              show-password
              class="custom-input"
          >
            <template #prefix><el-icon class="input-icon"><Lock /></el-icon></template>
          </el-input>
        </el-form-item>

        <el-button
            type="primary"
            class="login-btn"
            :loading="isLoading"
            @click="handleLogin"
        >
          Sign In / 登录
        </el-button>
      </el-form>

      <div class="footer-text">
        &copy; 2024 Packaging Tech. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

// 定义事件：登录成功后，将用户名传给父组件
const emit = defineEmits(['login-success'])

const formRef = ref<FormInstance>()
const isLoading = ref(false)

const loginForm = reactive({
  username: '', // 默认值设为空，生产环境不建议预填
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
        // --- 核心：调用真实接口 ---
        // 注意：这里使用 /api 前缀，触发 vite.config.ts 中的代理
        const response = await fetch('/api/Auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginForm.username,
            password: loginForm.password
          })
        })

        const resData = await response.json()

        // --- 处理响应逻辑 ---
        if (resData.code === 200) {
          ElMessage.success('登录成功')

          // 1. 存储 Token (用于后续接口鉴权)
          localStorage.setItem('token', resData.data.token)
          // 2. 存储用户信息 (用于页面展示)
          localStorage.setItem('username', loginForm.username)

          // 3. 触发成功事件，并把用户名传出去
          emit('login-success', loginForm.username)
        } else {
          // 业务错误 (如密码错误)
          ElMessage.error(resData.message || '登录失败，请检查账号密码')
        }
      } catch (error) {
        // 网络错误 (如后端没启动)
        console.error(error)
        ElMessage.error('网络连接异常，请检查后端服务是否启动')
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
/* 保持原有样式不变，此处省略以节省篇幅，请保留你原来的 SCSS 样式 */
$primary-color: #2563eb;
$bg-color: #f8fafc;
$text-main: #1e293b;
$text-light: #64748b;

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  background-image:
      radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, hsla(253,16%,7%,0) 50%),
      radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, hsla(225,39%,30%,0) 50%),
      radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, hsla(339,49%,30%,0) 50%);
  background-size: 100% 50vh;
  background-repeat: no-repeat;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.brand-header {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo-box {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    margin-bottom: 16px;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
  }

  .app-name {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: $text-main;
    letter-spacing: -0.5px;

    .pro-tag {
      background: #eff6ff;
      color: $primary-color;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      vertical-align: middle;
      margin-left: 4px;
    }
  }

  .subtitle {
    margin: 8px 0 0;
    font-size: 14px;
    color: $text-light;
  }
}

.custom-input {
  :deep(.el-input__wrapper) {
    padding: 8px 16px;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    border-radius: 12px;
    background-color: #f8fafc;
    transition: all 0.3s;

    &.is-focus {
      box-shadow: 0 0 0 2px $primary-color inset !important;
      background-color: #fff;
    }
  }

  :deep(.el-input__inner) {
    height: 32px;
    font-weight: 500;
  }

  .input-icon {
    font-size: 18px;
    color: #94a3b8;
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  margin-top: 10px;
  background: linear-gradient(to right, #2563eb, #3b82f6);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);
  transition: transform 0.1s;

  &:active {
    transform: scale(0.98);
  }
}

.footer-text {
  margin-top: 30px;
  font-size: 12px;
  color: #cbd5e1;
}
</style>