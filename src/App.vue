<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PackagingConfig from './components/PackagingConfig.vue'
import LoginView from './components/LoginView.vue'

const isLoggedIn = ref(false)
const currentUser = ref('')

onMounted(() => {
  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('username')
  if (token && savedUser) {
    isLoggedIn.value = true
    currentUser.value = savedUser
  }
})

const onLoginSuccess = (username: string) => {
  currentUser.value = username
  isLoggedIn.value = true
}

// --- 核心修改：处理退出登录 ---
const handleLogout = async () => {
  const token = localStorage.getItem('token')

  if (token) {
    try {
      // 1. 修改接口地址: /api/Auth/logout -> /api/auth/logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      // 可以添加 res.is_success 判断，但退出通常是强制的
    } catch (error) {
      console.warn('后端注销接口调用失败，将强制清理本地缓存', error)
    }
  }

  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('token_expire') // 顺便清理过期时间

  isLoggedIn.value = false
  currentUser.value = ''

  ElMessage.success('已安全退出')
}
</script>

<template>
  <transition name="fade" mode="out-in">
    <LoginView
        v-if="!isLoggedIn"
        @login-success="onLoginSuccess"
    />

    <PackagingConfig
        v-else
        :username="currentUser"
        @logout="handleLogout"
    />
  </transition>
</template>

<style>
/* ... 保持原有样式 ... */
body {
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>