<template>
  <div class="workflow-page">

    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <div class="logo-box">📦</div>
          <span class="app-title">Packaging Studio <span class="version">PRO</span></span>
        </div>

        <div class="user-profile">
          <span class="welcome-text">Hi, {{ username }}</span>
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <el-avatar :size="32" class="user-avatar">
                {{ username ? username.charAt(0).toUpperCase() : 'U' }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="$emit('logout')">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <div class="workflow-body">
      <div class="steps-container">
        <el-steps :active="activeStep" finish-status="success" align-center class="custom-steps">
          <el-step title="定义规格" icon="Box" />
          <el-step title="文案解析" icon="DocumentChecked" />
          <el-step title="营销定义" icon="PriceTag" />
          <el-step title="构建交付" icon="Files" />
        </el-steps>
      </div>

      <div class="workspace-container">
        <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            class="workspace-form"
            size="large"
            hide-required-asterisk
        >
          <transition name="slide-fade" mode="out-in">

            <div v-if="activeStep === 0" key="step1" class="step-panel">
              <div class="panel-header">
                <h2>定义包装规格</h2>
                <p>设定包装盒的物理切割尺寸与印刷出血增量。</p>
              </div>

              <div class="panel-card">
                <div class="section-label">基础尺寸 (Dimension)</div>
                <div class="dimension-grid">
                  <div class="dim-item">
                    <span class="dim-bg-icon">L</span>
                    <el-form-item prop="dimensions.length">
                      <el-input-number v-model="formData.dimensions.length" :min="0" :controls="false" placeholder="0.00" />
                      <span class="unit">mm</span>
                    </el-form-item>
                    <span class="dim-name">长度 Length</span>
                  </div>
                  <div class="dim-separator">×</div>
                  <div class="dim-item">
                    <span class="dim-bg-icon">W</span>
                    <el-form-item prop="dimensions.width">
                      <el-input-number v-model="formData.dimensions.width" :min="0" :controls="false" placeholder="0.00" />
                      <span class="unit">mm</span>
                    </el-form-item>
                    <span class="dim-name">宽度 Width</span>
                  </div>
                  <div class="dim-separator">×</div>
                  <div class="dim-item">
                    <span class="dim-bg-icon">H</span>
                    <el-form-item prop="dimensions.height">
                      <el-input-number v-model="formData.dimensions.height" :min="0" :controls="false" placeholder="0.00" />
                      <span class="unit">mm</span>
                    </el-form-item>
                    <span class="dim-name">高度 Height</span>
                  </div>
                </div>

                <el-divider class="custom-divider" />

                <div class="section-label">印刷工艺 (Bleed & Safety)</div>
                <div class="dimension-grid bleed-theme">
                  <div class="dim-item">
                    <span class="dim-bg-icon">X</span>
                    <el-form-item prop="dimensions.bleedX">
                      <el-input-number v-model="formData.dimensions.bleedX" :step="0.5" :min="0" :controls="false" placeholder="3.0" />
                      <span class="unit">mm</span>
                    </el-form-item>
                    <span class="dim-name">左右出血 Bleed X</span>
                  </div>
                  <div class="dim-separator plus">+</div>
                  <div class="dim-item">
                    <span class="dim-bg-icon">Y</span>
                    <el-form-item prop="dimensions.bleedY">
                      <el-input-number v-model="formData.dimensions.bleedY" :step="0.5" :min="0" :controls="false" placeholder="3.0" />
                      <span class="unit">mm</span>
                    </el-form-item>
                    <span class="dim-name">上下出血 Bleed Y</span>
                  </div>
                  <div class="dim-separator plus">+</div>
                  <div class="dim-item">
                    <span class="dim-bg-icon">S</span>
                    <el-form-item prop="dimensions.bleedInner">
                      <el-input-number v-model="formData.dimensions.bleedInner" :step="0.5" :min="0" :controls="false" placeholder="3.0" />
                      <span class="unit">mm</span>
                    </el-form-item>
                    <span class="dim-name">安全内距 Safety</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeStep === 1" key="step2" class="step-panel">
              <div class="panel-header">
                <h2>文案智能解析</h2>
                <p>上传 Word 文档，AI 将自动提取关键合规信息。</p>
              </div>

              <div class="panel-card">
                <div v-if="!isDocParsed" class="upload-zone">
                  <el-upload
                      class="hero-upload"
                      drag
                      action="#"
                      :auto-upload="false"
                      :on-change="handleFileUpload"
                      :show-file-list="false"
                  >
                    <div class="upload-content">
                      <div class="icon-circle"><el-icon><DocumentAdd /></el-icon></div>
                      <h3>点击或拖拽上传文档</h3>
                      <p>支持 .docx 格式，自动识别成分表与警告语</p>
                    </div>
                  </el-upload>
                </div>

                <div v-else class="parsed-view">
                  <div class="doc-badge">
                    <el-icon><DocumentChecked /></el-icon>
                    <span>{{ fileName }}</span>
                    <el-button type="primary" link size="small" @click="isDocParsed = false" style="margin-left: auto">更换</el-button>
                  </div>

                  <div class="data-grid">
                    <div class="data-group full">
                      <label>产品标准名称 (Product Name)</label>
                      <div class="data-value highlight">{{ formData.content.productName || '-' }}</div>
                    </div>
                    <div class="data-group">
                      <label>原产国 (Origin)</label>
                      <div class="data-value">{{ formData.content.origin || '-' }}</div>
                    </div>
                    <div class="data-group">
                      <label>保质期 (Shelf Life)</label>
                      <div class="data-value">{{ formData.content.shelfLife || '-' }}</div>
                    </div>
                    <div class="data-group">
                      <label>制造商 (Manufacturer)</label>
                      <div class="data-value">{{ formData.content.manufacturer || '-' }}</div>
                    </div>
                    <div class="data-group">
                      <label>地址 (Address)</label>
                      <div class="data-value">{{ formData.content.address || '-' }}</div>
                    </div>
                    <div class="data-group full">
                      <label>成分表 (Ingredients)</label>
                      <div class="data-value text-block">{{ formData.content.ingredients || '-' }}</div>
                    </div>
                    <div class="data-group full">
                      <label>使用方法 (Directions)</label>
                      <div class="data-value text-block">{{ formData.content.directions || '-' }}</div>
                    </div>
                    <div class="data-group full">
                      <label>警示语 (Warnings)</label>
                      <div class="data-value text-block warning">{{ formData.content.warnings || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeStep === 2" key="step3" class="step-panel marketing-panel">
              <div class="panel-header">
                <h2>营销与品牌定义</h2>
                <p>确立产品的视觉基调与核心卖点。</p>
              </div>

              <div class="panel-card">
                <div class="form-section-block">
                  <el-form-item prop="marketing.sku" class="brand-item">
                    <div class="label-with-icon"><el-icon><Ticket /></el-icon> 商品编码 (SKU)</div>
                    <el-input
                        v-model="formData.marketing.sku"
                        placeholder="例如：SKU-2024-X01"
                        class="brand-input-lg"
                        clearable
                    />
                  </el-form-item>
                </div>

                <div class="form-section-block">
                  <el-form-item prop="marketing.brand" class="brand-item">
                    <div class="label-with-icon"><el-icon><Trophy /></el-icon> 品牌名称 (Brand Name)</div>
                    <el-input
                        v-model="formData.marketing.brand"
                        placeholder="例如：Nescafe, Dove..."
                        class="brand-input-lg"
                        clearable
                    />
                  </el-form-item>
                </div>

                <div class="form-section-block">
                  <el-form-item prop="marketing.capacityValue" class="brand-item">
                    <div class="label-with-icon"><el-icon><DataLine /></el-icon> 规格详情 (Spec)</div>
                    <el-input
                        v-model="formData.marketing.capacityValue"
                        placeholder="例如：500ml, 250g, 12 packs..."
                        class="brand-input-lg"
                        clearable
                    />
                  </el-form-item>
                </div>

                <div class="form-section-block">
                  <div class="section-label">核心卖点 (Selling Points)</div>
                  <el-form-item prop="marketing.sellingPoints">
                    <div class="tags-wrapper enhanced full-width-tags">
                      <div class="tags-list">
                        <el-tag
                            v-for="tag in formData.marketing.sellingPoints"
                            :key="tag"
                            closable
                            type="primary"
                            effect="light"
                            @close="handleCloseTag(tag)"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-input
                            v-if="formData.marketing.sellingPoints.length < 5"
                            v-model="inputValue"
                            class="new-tag-input"
                            placeholder="+ 输入按回车"
                            @keyup.enter="handleInputConfirm"
                            @blur="handleInputConfirm"
                        />
                      </div>
                      <div class="quick-tags">
                        <span>推荐:</span>
                        <span class="q-tag" @click="addQuickTag('Eco-Friendly')">Eco-Friendly</span>
                        <span class="q-tag" @click="addQuickTag('Organic')">Organic</span>
                        <span class="q-tag" @click="addQuickTag('Premium')">Premium</span>
                        <span class="q-tag" @click="addQuickTag('New Formula')">New Formula</span>
                      </div>
                    </div>
                  </el-form-item>
                </div>

              </div>
            </div>

            <div v-else-if="activeStep === 3" key="step4" class="step-panel centered-panel">
              <div class="success-visual">
                <div class="pulse-ring"></div>
                <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
              </div>
              <h2>准备生成工程文件</h2>
              <p class="subtitle">所有数据校验通过，即将构建 PSD 刀版与图层结构。</p>

              <div class="summary-box">
                <div class="summary-item">
                  <span>SKU</span>
                  <strong>{{ formData.marketing.sku }}</strong>
                </div>
                <div class="summary-item">
                  <span>品牌</span>
                  <strong>{{ formData.marketing.brand }}</strong>
                </div>
                <div class="summary-item">
                  <span>尺寸</span>
                  <strong>{{ formData.dimensions.length }} x {{ formData.dimensions.width }} x {{ formData.dimensions.height }}</strong>
                </div>
              </div>
            </div>

          </transition>
        </el-form>
      </div>

      <footer class="workflow-footer">
        <div class="footer-inner">
          <el-button v-if="activeStep > 0" @click="prevStep" plain round class="nav-btn">上一步</el-button>
          <div class="spacer"></div>
          <el-button v-if="activeStep < 3" type="primary" @click="nextStep" round class="nav-btn primary">下一步</el-button>
          <el-button v-if="activeStep === 3" type="primary" @click="handleGeneratePSD" round class="nav-btn finish-btn" :loading="loading">生成 PSD 文件</el-button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElLoading, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { UploadFilled, DocumentAdd, DocumentChecked, Trophy, Ticket, Box, Files, CircleCheckFilled, DataLine } from '@element-plus/icons-vue'

// --- 接收父组件(App.vue)传来的数据 ---
defineProps<{
  username: string
}>()

// --- 定义事件：退出登录 ---
defineEmits(['logout'])

// --- 接口定义 ---
interface Dimensions { length: number; width: number; height: number; bleedX: number; bleedY: number; bleedInner: number; }
interface Content {
  productName: string;
  ingredients: string;
  warnings: string;
  manufacturer: string;
  origin: string;
  shelfLife: string;
  address: string;
  directions: string;
}
// 更新：移除 designType，新增 sku
interface Marketing { sku: string; brand: string; capacityValue: string; capacityUnit: string; sellingPoints: string[]; }

interface WorkflowData {
  dimensions: Dimensions;
  content: Content;
  marketing: Marketing;
}

// --- 状态管理 ---
const activeStep = ref(0)
const formRef = ref<FormInstance>()
const isDocParsed = ref(false)
const fileName = ref('')
const loading = ref(false)
const inputValue = ref('')

// 初始化数据
const formData = reactive<WorkflowData>({
  dimensions: { length: 0, width: 0, height: 0, bleedX: 3, bleedY: 3, bleedInner: 3 },
  content: {
    productName: '',
    ingredients: '',
    warnings: '',
    manufacturer: '',
    origin: '',
    shelfLife: '',
    address: '',
    directions: ''
  },
  // 更新初始化数据
  marketing: { sku: '', brand: '', capacityValue: '', capacityUnit: '', sellingPoints: [] }
})

// 更新校验规则
const rules = reactive<FormRules>({
  'dimensions.length': [{ required: true, message: 'Required', trigger: 'blur' }],
  'dimensions.width': [{ required: true, message: 'Required', trigger: 'blur' }],
  'dimensions.height': [{ required: true, message: 'Required', trigger: 'blur' }],
  'content.productName': [{ required: true, message: '请上传文档', trigger: 'change' }],
  'marketing.sku': [{ required: true, message: '请输入 SKU', trigger: 'blur' }],
  'marketing.brand': [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  'marketing.capacityValue': [{ required: true, message: '请输入规格', trigger: 'blur' }]
})

// --- 业务逻辑 ---
const nextStep = async () => {
  if (!formRef.value) return;
  let fields: string[] = []
  if (activeStep.value === 0) fields = ['dimensions.length', 'dimensions.width', 'dimensions.height']
  else if (activeStep.value === 1) {
    if (!isDocParsed.value) { ElMessage.warning('请上传文档'); return; }
    fields = ['content.productName']
  }
  // 更新 Step 3 的校验字段
  else if (activeStep.value === 2) fields = ['marketing.sku', 'marketing.brand', 'marketing.capacityValue']

  await formRef.value.validateField(fields, (isValid) => { if (isValid) activeStep.value++ })
}

const prevStep = () => { if (activeStep.value > 0) activeStep.value-- }

// 工具：文件转 Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

// 核心业务：上传解析文档
const handleFileUpload = async (file: UploadFile) => {
  if (!file.raw) return

  const loadingInstance = ElLoading.service({
    text: 'AI 解析中 (Reading Document)...',
    background: 'rgba(255,255,255,0.8)'
  })

  try {
    const base64String = await fileToBase64(file.raw)
    const payload = {
      fileName: file.name,
      fileContentBase64: base64String
    }

    const response = await fetch('/api/Document/parse/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const resData = await response.json()

    if (response.ok && resData.code === 200 && resData.data) {
      const parsed = resData.data.content
      formData.content.productName = parsed.productName || ''
      formData.content.manufacturer = parsed.manufacturer || ''
      formData.content.origin = parsed.countryOfOrigin || ''
      formData.content.warnings = parsed.warnings || ''
      formData.content.shelfLife = parsed.shelfLife || ''
      formData.content.address = parsed.address || ''
      formData.content.directions = parsed.directions || ''

      if (parsed.ingredients) {
        formData.content.ingredients = parsed.ingredients.rawText ||
            (parsed.ingredients.activeIngredients ? `Active: ${parsed.ingredients.activeIngredients}\n` : '') +
            (parsed.ingredients.inactiveIngredients ? `Inactive: ${parsed.ingredients.inactiveIngredients}` : '')
      }

      fileName.value = file.name
      isDocParsed.value = true
      ElMessage.success('解析成功：文案已自动填充')
    } else {
      throw new Error(resData.message || '解析失败，请检查文件格式')
    }

  } catch (error: any) {
    console.error('Parse Error:', error)
    ElMessage.error(error.message || '网络请求失败')
    isDocParsed.value = false
    fileName.value = ''
  } finally {
    loadingInstance.close()
  }
}

// 标签管理
const handleCloseTag = (tag: string) => { formData.marketing.sellingPoints.splice(formData.marketing.sellingPoints.indexOf(tag), 1) }
const handleInputConfirm = () => { if (inputValue.value) { formData.marketing.sellingPoints.push(inputValue.value); inputValue.value = '' } }

// 快捷添加标签
const addQuickTag = (tag: string) => {
  if (!formData.marketing.sellingPoints.includes(tag)) {
    formData.marketing.sellingPoints.push(tag)
  }
}

const handleGeneratePSD = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('PSD 生成成功')
  }, 2000)
}
</script>

<style scoped lang="scss">
/* --- 全局变量 --- */
$primary-color: #2563eb;
$bg-color: #f8fafc;
$card-bg: #ffffff;
$text-main: #1e293b;
$text-sec: #64748b;
$border-color: #e2e8f0;

.workflow-page {
  background-color: $bg-color;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  color: $text-main;
}

/* --- Header --- */
.app-header {
  height: 60px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: 50;

  .header-inner {
    max-width: 1000px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;

  .logo-box {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
  }

  .app-title {
    font-weight: 700;
    font-size: 16px;
    color: $text-main;
    .version { background: #eff6ff; color: $primary-color; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 4px; }
  }
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  .welcome-text { font-size: 14px; font-weight: 500; color: #475569; }
  .avatar-wrapper { outline: none; }
  .user-avatar { background: #2563eb; color: white; font-weight: 600; font-size: 14px; transition: transform 0.2s; &:hover { transform: scale(1.05); } }
}

/* --- Body --- */
.workflow-body {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 40px 20px 100px 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.steps-container {
  margin-bottom: 20px;
  :deep(.el-step__title) { font-size: 13px; font-weight: 500; }
  :deep(.el-step__head.is-success) { color: $primary-color; border-color: $primary-color; }
  :deep(.el-step__title.is-success) { color: $text-main; }
}

.panel-header {
  text-align: center;
  margin-bottom: 30px;
  h2 { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; }
  p { color: $text-sec; font-size: 14px; margin: 0; }
}

.panel-card {
  background: $card-bg;
  border-radius: 16px;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
  border: 1px solid rgba(255,255,255,0.5);
  padding: 32px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: $text-sec;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

/* --- STEP 1: Dimensions --- */
.dimension-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1f5f9;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;

  &.bleed-theme {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
  }
}

.dim-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;

  .dim-bg-icon {
    font-weight: 800;
    color: #cbd5e1;
    font-size: 24px;
    margin-bottom: 8px;
    font-family: monospace;
  }
  :deep(.el-input-number) { width: 100%; max-width: 120px; }
  :deep(.el-input__wrapper) { background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.03); border-radius: 8px; padding: 0 10px; }
  :deep(.el-input__inner) { text-align: center; font-weight: 600; font-size: 18px; }
  .unit { position: absolute; right: 20px; bottom: 28px; font-size: 12px; color: #94a3b8; pointer-events: none; }
  .dim-name { margin-top: 8px; font-size: 12px; color: $text-sec; }
}

.dim-separator {
  font-size: 24px; color: #cbd5e1; margin: 0 10px; padding-bottom: 20px;
  &.plus { font-size: 20px; color: #94a3b8; }
}

.custom-divider { margin: 32px 0; border-top: 1px dashed $border-color; }

/* --- STEP 2: Document --- */
.hero-upload {
  :deep(.el-upload-dragger) {
    width: 100%; height: 200px; border: 2px dashed $border-color; border-radius: 12px;
    background: #f8fafc; transition: all 0.3s; display: flex; align-items: center; justify-content: center;
    &:hover { border-color: $primary-color; background: #eff6ff; }
  }
}
.upload-content {
  .icon-circle { width: 50px; height: 50px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); color: $primary-color; font-size: 24px; }
  h3 { margin: 0; font-size: 16px; font-weight: 600; color: $text-main; }
  p { margin: 8px 0 0; font-size: 13px; color: $text-sec; }
}
.parsed-view {
  .doc-badge { background: #ecfdf5; color: #059669; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 10px; font-weight: 600; margin-bottom: 24px; border: 1px solid #a7f3d0; }
  .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    .data-group {
      &.full { grid-column: span 2; }
      label { display: block; font-size: 12px; color: $text-sec; margin-bottom: 6px; }
      .data-value { padding: 10px 12px; background: #f8fafc; border-radius: 6px; font-size: 14px; color: $text-main; border: 1px solid #f1f5f9; min-height: 42px;
        &.highlight { font-weight: 600; color: $primary-color; background: #eff6ff; border-color: #dbeafe; }
        &.text-block { min-height: 60px; line-height: 1.5; font-size: 13px; }
        &.warning { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
      }
    }
  }
}

/* --- STEP 3: Marketing Optimization --- */
.form-section-block {
  margin-bottom: 30px; /* 模块间距 */
  width: 100%;
}

.brand-item {
  margin-bottom: 0; /* 清除默认 margin */
  .label-with-icon { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; .el-icon { color: #d97706; } }
  .brand-input-lg :deep(.el-input__wrapper) { padding: 8px 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 0 0 1px #e2e8f0 inset; background: #fff; font-size: 18px; font-weight: 700; }
}

/* 卖点标签 (强制100%宽) */
.tags-wrapper.enhanced.full-width-tags {
  width: 100%;
  box-sizing: border-box; /* 确保 padding 包含在宽度内 */
  background: #fff; border: 1px solid $border-color; border-radius: 8px; padding: 12px; min-height: 120px; display: flex; flex-direction: column; transition: all 0.3s;
  &:focus-within { border-color: $primary-color; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); }
  .tags-list { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; align-content: flex-start; }
  .new-tag-input { width: 120px; :deep(.el-input__wrapper) { box-shadow: none; padding: 0; background: transparent; } }
  .quick-tags {
    margin-top: 10px; padding-top: 10px; border-top: 1px dashed $border-color; font-size: 12px; color: #94a3b8; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    .q-tag { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s; &:hover { background: #e2e8f0; color: #475569; } }
  }
}

/* --- STEP 4: Success --- */
.centered-panel { text-align: center; .panel-card { border: none; box-shadow: none; background: transparent; } }
.success-visual { position: relative; width: 80px; height: 80px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;
  .success-icon { font-size: 64px; color: #10b981; position: relative; z-index: 2; }
  .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(16, 185, 129, 0.2); animation: pulse 2s infinite; }
}
.summary-box { background: white; border-radius: 12px; padding: 24px; margin-top: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: inline-flex; gap: 40px; text-align: left;
  .summary-item { display: flex; flex-direction: column; span { font-size: 12px; color: $text-sec; margin-bottom: 4px; } strong { font-size: 16px; color: $text-main; } }
}

/* --- Footer --- */
.workflow-footer { position: fixed; bottom: 0; left: 0; width: 100%; background: #fff; border-top: 1px solid $border-color; padding: 16px 0; z-index: 100;
  .footer-inner { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; padding: 0 20px; align-items: center; }
  .nav-btn { min-width: 120px; height: 44px; font-weight: 600;
    &.primary { box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }
    &.finish-btn { background: #10b981; border-color: #10b981; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
  }
}

/* --- Animation --- */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1); }
.slide-fade-enter-from { opacity: 0; transform: translateY(10px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-10px); }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
</style>