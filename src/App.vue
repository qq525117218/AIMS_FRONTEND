<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PackagingConfig from './components/PackagingConfig.vue'
import LoginView from './components/LoginView.vue'

const isLoggedIn = ref(false)
const currentUser = ref('')

onMounted(() => {
  checkLoginStatus()
})

// 检查本地登录状态及有效性
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('username')
  const expireStr = localStorage.getItem('token_expire')

  if (token && savedUser) {
    // 检查是否过期
    if (expireStr) {
      const expireTime = new Date(expireStr).getTime()
      const now = new Date().getTime()

      // 如果当前时间已超过过期时间，视为会话失效
      if (now >= expireTime) {
        handleLogout(true) // true 表示被动过期
        return
      }
    }

    // 校验通过，恢复登录状态
    isLoggedIn.value = true
    currentUser.value = savedUser
  } else {
    // 数据不完整，清理残留
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('token_expire')
    isLoggedIn.value = false
  }
}

const onLoginSuccess = (username: string) => {
  currentUser.value = username
  isLoggedIn.value = true
}

/**
 * 处理登出逻辑
 * @param isSessionExpired - 是否因为会话过期/401导致的退出。
 * true: 不调后端接口，提示过期；
 * false: 调后端接口，提示安全退出。
 */
const handleLogout = async (isSessionExpired = false) => {
  const token = localStorage.getItem('token')

  // 仅在主动退出且本地有 Token 时尝试通知后端
  // 如果是过期(isSessionExpired=true)，说明 Token 大概率已失效，无需调用
  if (token && !isSessionExpired) {
    try {
      // 注意：这里没有使用 authFetch，避免 401 再次触发死循环
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.warn('后端注销接口调用失败，仅清理本地缓存', error)
    }
  }

  // 核心：清理本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('token_expire')

  // 重置状态 -> 触发 v-if 切换回 LoginView
  isLoggedIn.value = false
  currentUser.value = ''

  // 根据情况提示用户
  if (isSessionExpired) {
    ElMessage.warning('登录会话已过期，请重新登录')
  } else {
    ElMessage.success('已安全退出')
  }
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
        @logout="() => handleLogout(false)"
    />
  </transition>
</template>

<style>
/* 全局样式或保留原有的 body 样式 */
body {
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
}

/* 简单的淡入淡出过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>