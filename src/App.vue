<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PackagingConfig from './components/PackagingConfig.vue'
import LoginView from './components/LoginView.vue'

const isLoggedIn = ref(false)
const currentUser = ref('')

// 页面加载时恢复登录状态
onMounted(() => {
  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('username')
  if (token && savedUser) {
    isLoggedIn.value = true
    currentUser.value = savedUser
  }
})

// 处理登录成功
const onLoginSuccess = (username: string) => {
  currentUser.value = username
  isLoggedIn.value = true
}

// --- 核心修改：处理退出登录 ---
const handleLogout = async () => {
  const token = localStorage.getItem('token')

  // 1. 如果有 Token，先通知后端注销
  if (token) {
    try {
      // 这里的 /api 会触发 vite.config.ts 中的代理，转发到 localhost:5000
      await fetch('/api/Auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 重要：必须带上 Bearer 前缀，后端代码逻辑里处理了前缀截取
          'Authorization': `Bearer ${token}`
        }
      })
      // 注意：这里我们可以不判断后端是否返回 200，
      // 因为无论后端注销是否成功（例如Token已过期），前端都必须执行登出操作。
    } catch (error) {
      console.warn('后端注销接口调用失败，将强制清理本地缓存', error)
    }
  }

  // 2. 无论接口结果如何，强制清除前端缓存
  localStorage.removeItem('token')
  localStorage.removeItem('username')

  // 3. 更新状态，触发页面切换动画回到登录页
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
body {
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
}

/* 页面切换淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>