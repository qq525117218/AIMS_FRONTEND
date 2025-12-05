import { reactive, ref } from 'vue'
import { ElMessage, ElLoading, type FormInstance, type FormRules, type UploadFile } from 'element-plus'

// --- 接口定义 ---
export interface Dimensions { length: number; width: number; height: number; bleedX: number; bleedY: number; bleedInner: number; }
export interface Content {
    productName: string;
    ingredients: string;
    warnings: string;
    manufacturer: string;
    origin: string;
    shelfLife: string;
    address: string;
    directions: string;
}
export interface Marketing { sku: string; brand: string; capacityValue: string; capacityUnit: string; sellingPoints: string[]; }

export interface WorkflowData {
    dimensions: Dimensions;
    content: Content;
    marketing: Marketing;
}

// 文档解析响应
interface ParseDocResponse {
    code: number
    is_success: boolean
    data: {
        content: {
            product_name: string
            manufacturer: string
            country_of_origin: string
            warnings: string
            shelf_life: string
            address: string
            directions: string
            ingredients: {
                active_ingredients: string
                inactive_ingredients: string
                raw_text: string
            }
        }
    }
}

// 品牌信息
export interface BrandItem {
    id: number
    code: string
    name: string
    abbr: string
    brand_category_name: string
    department_name: string
    status: number
    is_deleted: number
}

interface BrandListResponse {
    code: number
    is_success: boolean
    message: string
    request_id: string
    data: {
        plm_brand_data: BrandItem[]
    }
}

// 任务状态
interface PsdTaskStatus {
    task_id: string
    progress: number
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
    message: string
    download_url?: string
}

interface AsyncSubmitResponse {
    code: number
    is_success: boolean
    message: string
    data: string // taskId
}

interface ProgressResponse {
    code: number
    is_success: boolean
    data: PsdTaskStatus
}

export function usePackagingConfig() {
    const activeStep = ref(0)
    const formRef = ref<FormInstance>()
    const isDocParsed = ref(false)
    const fileName = ref('')
    const inputValue = ref('')

    // --- 状态管理 ---
    const isGenerating = ref(false)
    const progressPercentage = ref(0)
    const progressStatus = ref('')
    const progressMessage = ref('准备提交任务...')

    // 下载链接状态
    const currentDownloadUrl = ref('')
    const currentTaskId = ref('')

    const brandOptions = ref<BrandItem[]>([])


    const getInitialData = (): WorkflowData => ({
        dimensions: { length: 6, width: 12, height: 6, bleedX: 0.5, bleedY: 2, bleedInner: 0.15 },
        content: {
            productName: '', ingredients: '', warnings: '', manufacturer: '',
            origin: '', shelfLife: '', address: '', directions: ''
        },
        marketing: {
            sku: 'SKU00001636',
            brand: 'WestMoon',
            capacityValue: 'NET：100G/3.53 FL.OZ',
            capacityUnit: '',
            sellingPoints: [
                'Professional-grade anti-fog solution.',
                'Effective long-lasting anti-fog.',
                'Versatile for multiple surfaces.',
                'Safe reef-friendly ingredients.'
            ]
        }
    })

    const formData = reactive<WorkflowData>(getInitialData())

    const rules = reactive<FormRules>({
        'dimensions.length': [{ required: true, message: 'Required', trigger: 'blur' }],
        'dimensions.width': [{ required: true, message: 'Required', trigger: 'blur' }],
        'dimensions.height': [{ required: true, message: 'Required', trigger: 'blur' }],
        'content.productName': [{ required: true, message: '请上传文档', trigger: 'change' }],
        'marketing.sku': [{ required: true, message: '请输入 SKU', trigger: 'blur' }],
        'marketing.brand': [{ required: true, message: '请选择品牌', trigger: 'change' }],
        'marketing.capacityValue': [{ required: true, message: '请输入规格', trigger: 'blur' }]
    })

    // --- 流程控制 ---
    const nextStep = async () => {
        if (!formRef.value) return;
        let fields: string[] = []

        if (activeStep.value === 0) fields = ['dimensions.length', 'dimensions.width', 'dimensions.height']
        else if (activeStep.value === 1) {
            if (!isDocParsed.value) { ElMessage.warning('请上传文档'); return; }
            fields = ['content.productName']
        }
        else if (activeStep.value === 2) fields = ['marketing.sku', 'marketing.brand', 'marketing.capacityValue']

        await formRef.value.validateField(fields, (isValid) => { if (isValid) activeStep.value++ })
    }

    const prevStep = () => { if (activeStep.value > 0) activeStep.value-- }

    // 重置工作流
    const resetWorkflow = () => {
        Object.assign(formData, getInitialData())
        isDocParsed.value = false
        fileName.value = ''
        activeStep.value = 0
        currentDownloadUrl.value = ''
        currentTaskId.value = ''
    }

    // --- 文件处理 ---
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                // 1. 显式类型断言
                const result = reader.result as string
                // 2. 尝试提取 Base64 部分
                const base64Content = result.split(',')[1]

                // 3. 严谨判断：如果有值则 resolve，否则 reject
                if (base64Content) {
                    resolve(base64Content)
                } else {
                    reject(new Error('Failed to parse base64 content'))
                }
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleFileUpload = async (file: UploadFile) => {
        if (!file.raw) return
        const loadingInstance = ElLoading.service({ text: 'AI 解析中...', background: 'rgba(255,255,255,0.8)' })
        try {
            const base64String = await fileToBase64(file.raw)
            const response = await fetch('/api/document/parse/word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_name: file.name, file_content_base64: base64String })
            })
            const resData = (await response.json()) as ParseDocResponse
            if (response.ok && resData.code === 200 && resData.is_success && resData.data) {
                const parsed = resData.data.content
                Object.assign(formData.content, {
                    productName: parsed.product_name || '',
                    manufacturer: parsed.manufacturer || '',
                    origin: parsed.country_of_origin || '',
                    warnings: parsed.warnings || '',
                    shelfLife: parsed.shelf_life || '',
                    address: parsed.address || '',
                    directions: parsed.directions || '',
                    ingredients: parsed.ingredients?.raw_text || (parsed.ingredients?.active_ingredients ? `Active: ${parsed.ingredients.active_ingredients}\n` : '') + (parsed.ingredients?.inactive_ingredients ? `Inactive: ${parsed.ingredients.inactive_ingredients}` : '')
                })
                fileName.value = file.name
                isDocParsed.value = true
                ElMessage.success('解析成功')
            } else { throw new Error('解析失败') }
        } catch (error: any) {
            ElMessage.error(error.message || '解析异常')
            isDocParsed.value = false
        } finally { loadingInstance.close() }
    }

    // --- 标签处理 ---
    const handleCloseTag = (tag: string) => {
        formData.marketing.sellingPoints.splice(formData.marketing.sellingPoints.indexOf(tag), 1)
    }
    const handleInputConfirm = () => {
        if (inputValue.value) {
            formData.marketing.sellingPoints.push(inputValue.value); inputValue.value = ''
        }
    }
    const addQuickTag = (tag: string) => {
        if (!formData.marketing.sellingPoints.includes(tag)) formData.marketing.sellingPoints.push(tag)
    }

    // --- PSD 生成逻辑 ---
    const handleGeneratePSD = async () => {
        isGenerating.value = true
        progressPercentage.value = 0
        progressStatus.value = ''
        progressMessage.value = '正在提交生成任务...'

        try {
            const token = localStorage.getItem('token')
            const username = localStorage.getItem('username') || 'User'
            const payload = {
                project_name: `${formData.marketing.brand}_${formData.marketing.sku}`.replace(/\s+/g, '_'),
                user_context: { username: username, generate_dieline: true },
                specifications: {
                    dimensions: formData.dimensions,
                    print_config: { bleed_x: formData.dimensions.bleedX, bleed_y: formData.dimensions.bleedY, bleed_inner: formData.dimensions.bleedInner, resolution_dpi: 300 }
                },
                assets: {
                    texts: {
                        main_panel: { brand_name: formData.marketing.brand, product_name: formData.content.productName, capacity_info: formData.marketing.capacityValue, selling_points: formData.marketing.sellingPoints },
                        info_panel: { ingredients: formData.content.ingredients, manufacturer: formData.content.manufacturer, origin: formData.content.origin, warnings: formData.content.warnings, directions: formData.content.directions, address: formData.content.address }
                    },
                    dynamic_images: { barcode: { value: formData.marketing.sku, type: 'EAN-13' } }
                }
            }

            const submitRes = await fetch('/api/design/generate/psd/async', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                body: JSON.stringify(payload)
            })

            if (!submitRes.ok) throw new Error(`提交失败: ${submitRes.status}`)
            const submitData = (await submitRes.json()) as AsyncSubmitResponse
            if (!submitData.is_success) throw new Error(submitData.message)

            const taskId = submitData.data
            currentTaskId.value = taskId

            await pollProgress(taskId, token, payload.project_name)

        } catch (error: any) {
            console.error('Task Failed:', error)
            progressStatus.value = 'exception'
            progressMessage.value = `错误: ${error.message || '未知错误'}`
            ElMessage.error('生成失败')
            setTimeout(() => { isGenerating.value = false }, 3000)
        }
    }

    const pollProgress = async (taskId: string, token: string | null, fileName: string) => {
        return new Promise<void>((resolve, reject) => {
            const timer = setInterval(async () => {
                try {
                    const res = await fetch(`/api/design/progress/${taskId}`, {
                        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                    })
                    if (!res.ok) throw new Error('无法获取任务进度')
                    const resData = (await res.json()) as ProgressResponse
                    const task = resData.data

                    progressPercentage.value = task.progress
                    progressMessage.value = task.message || '正在处理...'

                    if (task.status === 'Completed') {
                        clearInterval(timer)
                        progressStatus.value = 'success'
                        progressMessage.value = '生成完成，即将下载...'

                        const downloadUrl = `/api/design/download/${taskId}?fileName=${fileName}.psd`
                        currentDownloadUrl.value = downloadUrl

                        await triggerDownload(downloadUrl)

                        setTimeout(() => {
                            isGenerating.value = false
                            activeStep.value = 4
                            resolve()
                        }, 1000)
                    }
                    else if (task.status === 'Failed') {
                        clearInterval(timer)
                        throw new Error(task.message || '生成失败')
                    }
                } catch (err) {
                    clearInterval(timer)
                    reject(err)
                }
            }, 1000)
        })
    }

    const triggerDownload = async (url: string) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(url, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } })
            if(!res.ok) throw new Error('Download Failed')
            const blob = await res.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            const fileName = url.split('fileName=')[1] || 'design.psd'
            link.download = decodeURIComponent(fileName)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
            ElMessage.success('下载已开始')
        } catch (e) {
            console.error(e)
            ElMessage.error('自动下载失败，请点击按钮手动下载')
        }
    }

    const fetchBrandList = async () => {
        const token = localStorage.getItem('token')
        if(!token) return
        try {
            const response = await fetch('/api/plm/brand/list', { headers: { 'Authorization': `Bearer ${token}` } })
            const resData = await response.json() as BrandListResponse
            if (resData.is_success) brandOptions.value = resData.data.plm_brand_data
        } catch (e) { console.error(e) }
    }
    fetchBrandList()

    return {
        activeStep, formRef, formData, rules, isDocParsed, fileName, inputValue, brandOptions,
        isGenerating, progressPercentage, progressStatus, progressMessage, currentDownloadUrl,
        nextStep, prevStep, resetWorkflow, handleFileUpload, handleCloseTag, handleInputConfirm, addQuickTag, handleGeneratePSD, triggerDownload
    }
}