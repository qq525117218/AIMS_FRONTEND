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
          <el-step title="产品定义" icon="PriceTag" />
          <el-step title="文案解析" icon="DocumentChecked" />
          <el-step title="构建交付" icon="Files" />
        </el-steps>
      </div>

      <div class="workspace-container">
        <el-form
            v-if="activeStep < 4"
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
              <div class="panel-header"><h2>定义包装规格</h2><p>设定包装盒的物理切割尺寸与印刷出血增量。</p></div>
              <div class="panel-card">
                <div class="section-label">基础尺寸 (Dimension)</div>
                <div class="dimension-grid">
                  <div class="dim-item"><span class="dim-bg-icon">L</span><el-form-item prop="dimensions.length"><el-input-number v-model="formData.dimensions.length" :min="0" :controls="false" placeholder="0.00" /><span class="unit">cm</span></el-form-item><span class="dim-name">长度 Length</span></div>
                  <div class="dim-separator">×</div>
                  <div class="dim-item"><span class="dim-bg-icon">W</span><el-form-item prop="dimensions.width"><el-input-number v-model="formData.dimensions.width" :min="0" :controls="false" placeholder="0.00" /><span class="unit">cm</span></el-form-item><span class="dim-name">宽度 Width</span></div>
                  <div class="dim-separator">×</div>
                  <div class="dim-item"><span class="dim-bg-icon">H</span><el-form-item prop="dimensions.height"><el-input-number v-model="formData.dimensions.height" :min="0" :controls="false" placeholder="0.00" /><span class="unit">cm</span></el-form-item><span class="dim-name">高度 Height</span></div>
                </div>
                <el-divider class="custom-divider" />
                <div class="section-label">印刷工艺 (Bleed & Safety)</div>
                <div class="dimension-grid bleed-theme">
                  <div class="dim-item"><span class="dim-bg-icon">X</span><el-form-item prop="dimensions.bleedX"><el-input-number v-model="formData.dimensions.bleedX" :step="0.5" :min="0" :controls="false" placeholder="3.0" /><span class="unit">mm</span></el-form-item><span class="dim-name">左右出血 Bleed X</span></div>
                  <div class="dim-separator plus">+</div>
                  <div class="dim-item"><span class="dim-bg-icon">Y</span><el-form-item prop="dimensions.bleedY"><el-input-number v-model="formData.dimensions.bleedY" :step="0.5" :min="0" :controls="false" placeholder="3.0" /><span class="unit">mm</span></el-form-item><span class="dim-name">上下出血 Bleed Y</span></div>
                  <div class="dim-separator plus">+</div>
                  <div class="dim-item"><span class="dim-bg-icon">S</span><el-form-item prop="dimensions.bleedInner"><el-input-number v-model="formData.dimensions.bleedInner" :step="0.5" :min="0" :controls="false" placeholder="3.0" /><span class="unit">mm</span></el-form-item><span class="dim-name">安全内距 Safety</span></div>
                </div>
              </div>
            </div>

            <div v-else-if="activeStep === 1" key="step2-product" class="step-panel product-def-panel">
              <div class="panel-header">
                <h2>产品定义</h2>
                <p>请按顺序完善产品的核心身份信息与规格参数。</p>
              </div>

              <div class="vertical-stack-container">

                <el-form-item prop="marketing.brand" class="stack-item">
                  <div class="standard-input-card">
                    <div class="icon-wrapper"><el-icon><Trophy /></el-icon></div>
                    <div class="content-wrapper">
                      <label>品牌名称 Brand</label>
                      <el-select
                          v-model="formData.marketing.brand"
                          placeholder="选择或输入品牌"
                          class="seamless-input"
                          filterable
                          allow-create
                          default-first-option
                          @change="handleBrandChange"
                      >
                        <el-option
                            v-for="item in brandOptions"
                            :key="item.id"
                            :label="`${item.name} - ${item.brand_category_name || '通用'}`"
                            :value="item.name"
                        />
                      </el-select>
                    </div>
                  </div>
                </el-form-item>

                <el-form-item class="stack-item">
                  <div class="standard-input-card">
                    <div class="icon-wrapper"><el-icon><OfficeBuilding /></el-icon></div>
                    <div class="content-wrapper">
                      <label>制造商 Manufacturer</label>
                      <el-input v-model="formData.content.manufacturer" placeholder="自动关联或手动输入" class="seamless-input" />
                    </div>
                  </div>
                </el-form-item>

                <el-form-item class="stack-item">
                  <div class="standard-input-card">
                    <div class="icon-wrapper"><el-icon><Location /></el-icon></div>
                    <div class="content-wrapper">
                      <label>产地地址 Address</label>
                      <el-input v-model="formData.content.address" placeholder="自动关联或手动输入" class="seamless-input" />
                    </div>
                  </div>
                </el-form-item>

                <el-form-item prop="marketing.sku" class="stack-item">
                  <div class="standard-input-card has-drawer">
                    <div class="main-row">
                      <div class="icon-wrapper"><el-icon><Ticket /></el-icon></div>
                      <div class="content-wrapper">
                        <label>商品编码 SKU</label>
                        <el-input
                            v-model="formData.marketing.sku"
                            placeholder="例如：SKU-2024-X01"
                            class="seamless-input"
                            @change="handleFetchBarcode"
                        />
                      </div>
                      <div class="status-indicator">
                        <el-tag v-if="barcodeUrl" type="success" effect="dark" round size="small">已关联条码</el-tag>
                        <el-tag v-else-if="isFetchingBarcode" type="warning" effect="plain" round size="small">查找中...</el-tag>
                        <el-tag v-else type="info" effect="plain" round size="small">未关联</el-tag>
                      </div>
                    </div>
                    <div v-if="barcodeUrl" class="bottom-drawer">
                      <div class="file-info"><el-icon><Picture /></el-icon><span>{{ barcodeUrl.split('/').pop() }}</span></div>
                      <el-link type="primary" :underline="false" :href="barcodeUrl" target="_blank">预览 <el-icon><Link /></el-icon></el-link>
                    </div>
                  </div>
                </el-form-item>

                <el-form-item prop="marketing.capacityValue" class="stack-item">
                  <div class="standard-input-card">
                    <div class="icon-wrapper"><el-icon><Monitor /></el-icon></div>
                    <div class="content-wrapper">
                      <label>正面含量 Net Wt (Front)</label>
                      <el-input v-model="formData.marketing.capacityValue" placeholder="例如：100g / 3.5oz" class="seamless-input" />
                    </div>
                  </div>
                </el-form-item>

                <el-form-item prop="marketing.capacityValueBack" class="stack-item">
                  <div class="standard-input-card">
                    <div class="icon-wrapper"><el-icon><Document /></el-icon></div>
                    <div class="content-wrapper">
                      <label>背面含量 Net Wt (Back)</label>
                      <el-input v-model="formData.marketing.capacityValueBack" placeholder="同上或不同" class="seamless-input" />
                    </div>
                  </div>
                </el-form-item>

                <el-form-item prop="marketing.sellingPoints" class="stack-item" style="margin-top: 10px;">
                  <div class="selling-points-board">
                    <div class="board-header">
                      <el-icon><StarFilled /></el-icon> <span>核心卖点 Selling Points</span>
                    </div>
                    <div class="tags-area">
                      <el-tag
                          v-for="tag in formData.marketing.sellingPoints"
                          :key="tag"
                          closable
                          effect="light"
                          class="point-tag"
                          @close="handleCloseTag(tag)"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-input
                          v-if="formData.marketing.sellingPoints.length < 6"
                          v-model="inputValue"
                          class="ghost-input-tag"
                          placeholder="+ 输入卖点回车"
                          @keyup.enter="handleInputConfirm"
                          @blur="handleInputConfirm"
                      />
                    </div>
                    <div class="quick-pick-bar">
                      <span class="label">推荐:</span>
                      <span class="chip" @click="addQuickTag('Eco-Friendly')">🌿 Eco-Friendly</span>
                      <span class="chip" @click="addQuickTag('Organic')">🥬 Organic</span>
                      <span class="chip" @click="addQuickTag('Cruelty Free')">🐰 Cruelty Free</span>
                    </div>
                  </div>
                </el-form-item>

              </div>
            </div>

            <div v-else-if="activeStep === 2" key="step3-doc" class="step-panel">
              <div class="panel-header"><h2>文案智能解析</h2><p>上传 Word 文档，智能提取文档关键信息。</p></div>
              <div class="panel-card">
                <div v-if="!isDocParsed" class="upload-zone">
                  <el-upload class="hero-upload" drag action="#" :auto-upload="false" :on-change="handleFileUpload" :show-file-list="false">
                    <div class="upload-content"><div class="icon-circle"><el-icon><DocumentAdd /></el-icon></div><h3>点击或拖拽上传文档</h3><p>支持 .docx 格式，自动识别成分表与警告语</p></div>
                  </el-upload>
                </div>
                <div v-else class="parsed-view">
                  <div class="doc-badge"><el-icon><DocumentChecked /></el-icon><span>{{ fileName }}</span><el-button type="primary" link size="small" @click="isDocParsed = false" style="margin-left: auto">更换</el-button></div>
                  <div class="data-grid">
                    <div class="data-group full"><label>产品标准名称 (Product Name)</label><div class="data-value highlight">{{ formData.content.productName || '-' }}</div></div>
                    <div class="data-group"><label>原产国 (Origin)</label><div class="data-value">{{ formData.content.origin || '-' }}</div></div>
                    <div class="data-group"><label>保质期 (Shelf Life)</label><div class="data-value">{{ formData.content.shelfLife || '-' }}</div></div>
                    <div class="data-group"><label>制造商 (Manufacturer)</label><div class="data-value">{{ formData.content.manufacturer || '-' }}</div></div>
                    <div class="data-group"><label>地址 (Address)</label><div class="data-value">{{ formData.content.address || '-' }}</div></div>
                    <div class="data-group full"><label>成分表 (Ingredients)</label><div class="data-value text-block">{{ formData.content.ingredients || '-' }}</div></div>
                    <div class="data-group full"><label>使用方法 (Directions)</label><div class="data-value text-block">{{ formData.content.directions || '-' }}</div></div>
                    <div class="data-group full"><label>警示语 (Warnings)</label><div class="data-value text-block">{{ formData.content.warnings || '-' }}</div></div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeStep === 3" key="step4" class="step-panel centered-panel">
              <div class="success-visual"><div class="pulse-ring"></div><el-icon class="success-icon"><CircleCheckFilled /></el-icon></div>
              <h2>准备生成工程文件</h2>
              <p class="subtitle">所有数据校验通过，即将构建 PSD 刀版与图层结构。</p>
              <div class="summary-box">
                <div class="summary-item"><span>SKU</span><strong>{{ formData.marketing.sku }}</strong></div>
                <div class="summary-item"><span>品牌</span><strong>{{ formData.marketing.brand }}</strong></div>
                <div class="summary-item"><span>尺寸</span><strong>{{ formData.dimensions.length }} x {{ formData.dimensions.width }} x {{ formData.dimensions.height }}</strong></div>
              </div>
            </div>
          </transition>
        </el-form>

        <transition name="slide-fade" mode="out-in">
          <div v-if="activeStep === 4" key="step5" class="success-page">
            <div class="success-banner"><el-icon><Select /></el-icon></div>
            <h2>生成任务已完成！</h2>
            <p class="sub-msg">PSD 工程文件已自动下载到您的本地。</p>

            <div class="file-card">
              <el-icon class="file-icon"><Files /></el-icon>
              <div class="file-info">
                <span class="fname">{{ generatedFileName || formData.marketing.brand + '_' + formData.marketing.sku + '.psd' }}</span>
              </div>
              <el-button
                  class="re-download-btn"
                  type="primary"
                  plain
                  round
                  @click="triggerDownload(currentDownloadUrl)"
              >
                <el-icon style="margin-right: 4px"><Download /></el-icon>
                重新下载
              </el-button>
            </div>

            <div class="action-area">
              <el-button class="btn-lg" @click="resetWorkflow">新建项目</el-button>
              <el-button class="btn-lg" type="primary" plain @click="activeStep = 0">查看详情</el-button>
            </div>
          </div>
        </transition>
      </div>

      <footer class="workflow-footer" v-if="activeStep < 4">
        <div class="footer-inner">
          <el-button v-if="activeStep > 0" @click="prevStep" plain round class="nav-btn">上一步</el-button>
          <div class="spacer"></div>
          <el-button v-if="activeStep < 3" type="primary" @click="nextStep" round class="nav-btn primary">下一步</el-button>

          <el-button
              v-if="activeStep === 3"
              type="primary"
              @click="handleGeneratePSD"
              round
              class="nav-btn finish-btn"
              :disabled="isGenerating"
          >
            {{ isGenerating ? '生成中...' : '生成 PSD 文件' }}
          </el-button>
        </div>
      </footer>
    </div>

    <el-dialog v-model="isGenerating" :show-close="false" width="380px" align-center class="design-gen-dialog">
      <template #header><div class="dialog-header-custom"><div class="icon-pulse"><el-icon><MagicStick /></el-icon></div><span class="header-title">正在生成设计文件</span></div></template>
      <div class="progress-dialog-content">
        <div class="progress-ring-wrapper"><el-progress type="circle" :percentage="progressPercentage" :status="progressStatus as any" :width="150" :stroke-width="10" color="#2563eb" :show-text="false" stroke-linecap="round" /><div class="ring-inner-text"><span class="number">{{ progressPercentage }}</span><span class="symbol">%</span></div></div>
        <div class="status-box"><p class="status-main">{{ progressStatus === 'success' ? '生成成功' : '处理中...' }}</p><p class="status-sub">{{ progressMessage }}</p></div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { DocumentAdd, DocumentChecked, Trophy, Ticket, CircleCheckFilled, DataLine, Select, Files, MagicStick, Download, Star, OfficeBuilding, Location, Link, Loading, Medal, DataBoard, Monitor, Document, StarFilled, Picture } from '@element-plus/icons-vue'
import { usePackagingConfig } from '../logic/usePackagingConfig'

defineProps<{ username: string }>()
defineEmits(['logout'])

const {
  activeStep, formRef, formData, rules, isDocParsed, fileName, inputValue, brandOptions,
  isGenerating, progressPercentage, progressStatus, progressMessage, currentDownloadUrl, generatedFileName,
  isFetchingBarcode, barcodeUrl,
  nextStep, prevStep, handleFileUpload, handleCloseTag, handleInputConfirm, addQuickTag, handleGeneratePSD, triggerDownload, resetWorkflow, handleBrandChange, handleFetchBarcode
} = usePackagingConfig()
</script>

<style scoped lang="scss" src="../styles/PackagingConfig.scss"></style>