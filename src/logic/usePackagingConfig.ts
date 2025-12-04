import { reactive, ref } from 'vue'
import { ElMessage, ElLoading, type FormInstance, type FormRules, type UploadFile } from 'element-plus'

// 前端使用的驼峰命名接口
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

// 后端返回的 JSON 结构定义 (用于文档解析)
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

// --- 品牌接口定义 ---
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

export function usePackagingConfig() {
    const activeStep = ref(0)
    const formRef = ref<FormInstance>()
    const isDocParsed = ref(false)
    const fileName = ref('')
    const loading = ref(false)
    const inputValue = ref('')

    // --- 品牌列表数据 ---
    const brandOptions = ref<BrandItem[]>([])

    const formData = reactive<WorkflowData>({
        dimensions: { length: 0, width: 0, height: 0, bleedX: 3, bleedY: 3, bleedInner: 3 },
        content: {
            productName: '', ingredients: '', warnings: '', manufacturer: '',
            origin: '', shelfLife: '', address: '', directions: ''
        },
        marketing: { sku: '', brand: '', capacityValue: '', capacityUnit: '', sellingPoints: [] }
    })

    const rules = reactive<FormRules>({
        'dimensions.length': [{ required: true, message: 'Required', trigger: 'blur' }],
        'dimensions.width': [{ required: true, message: 'Required', trigger: 'blur' }],
        'dimensions.height': [{ required: true, message: 'Required', trigger: 'blur' }],
        'content.productName': [{ required: true, message: '请上传文档', trigger: 'change' }],
        'marketing.sku': [{ required: true, message: '请输入 SKU', trigger: 'blur' }],
        'marketing.brand': [{ required: true, message: '请选择品牌', trigger: 'change' }],
        'marketing.capacityValue': [{ required: true, message: '请输入规格', trigger: 'blur' }]
    })

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

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve((reader.result as string).split(',')[1])
            reader.onerror = (error) => reject(error)
        })
    }

    const handleFileUpload = async (file: UploadFile) => {
        if (!file.raw) return

        const loadingInstance = ElLoading.service({
            text: 'AI 解析中 (Reading Document)...',
            background: 'rgba(255,255,255,0.8)'
        })

        try {
            const base64String = await fileToBase64(file.raw)

            const response = await fetch('/api/document/parse/word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_name: file.name,
                    file_content_base64: base64String
                })
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
                    ingredients: parsed.ingredients?.raw_text ||
                        (parsed.ingredients?.active_ingredients ? `Active: ${parsed.ingredients.active_ingredients}\n` : '') +
                        (parsed.ingredients?.inactive_ingredients ? `Inactive: ${parsed.ingredients.inactive_ingredients}` : '')
                })

                fileName.value = file.name
                isDocParsed.value = true
                ElMessage.success('解析成功：文案已自动填充')
            } else {
                throw new Error('解析失败')
            }
        } catch (error: any) {
            console.error(error)
            ElMessage.error(error.message || '解析异常')
            isDocParsed.value = false
            fileName.value = ''
        } finally {
            loadingInstance.close()
        }
    }

    const handleCloseTag = (tag: string) => {
        formData.marketing.sellingPoints.splice(formData.marketing.sellingPoints.indexOf(tag), 1)
    }

    const handleInputConfirm = () => {
        if (inputValue.value) {
            formData.marketing.sellingPoints.push(inputValue.value)
            inputValue.value = ''
        }
    }

    const addQuickTag = (tag: string) => {
        if (!formData.marketing.sellingPoints.includes(tag)) {
            formData.marketing.sellingPoints.push(tag)
        }
    }

    // --- 修改：PSD 生成与下载逻辑 ---
    const handleGeneratePSD = async () => {
        loading.value = true
        try {
            const token = localStorage.getItem('token')
            const username = localStorage.getItem('username') || 'User'

            // 1. 构造 Payload (对应后端 PsdRequestDto)
            const payload = {
                project_name: `${formData.marketing.brand}_${formData.marketing.sku}`.replace(/\s+/g, '_'),
                user_context: {
                    username: username,
                    generate_dieline: true
                },
                specifications: {
                    dimensions: {
                        length: formData.dimensions.length,
                        width: formData.dimensions.width,
                        height: formData.dimensions.height
                    },
                    print_config: {
                        bleed_x: formData.dimensions.bleedX,
                        bleed_y: formData.dimensions.bleedY,
                        bleed_inner: formData.dimensions.bleedInner,
                        resolution_dpi: 300
                    }
                },
                assets: {
                    texts: {
                        main_panel: {
                            brand_name: formData.marketing.brand,
                            product_name: formData.content.productName,
                            capacity_info: formData.marketing.capacityValue,
                            selling_points: formData.marketing.sellingPoints
                        },
                        info_panel: {
                            ingredients: formData.content.ingredients,
                            manufacturer: formData.content.manufacturer,
                            origin: formData.content.origin,
                            warnings: formData.content.warnings,
                            directions: formData.content.directions,
                            address: formData.content.address
                        }
                    },
                    dynamic_images: {
                        barcode: {
                            value: formData.marketing.sku,
                            type: 'EAN-13'
                        }
                    }
                }
            }

            // 2. 发起请求
            const response = await fetch('/api/design/generate/psd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            })

            // 3. 错误处理 (如果是 JSON 错误响应)
            const contentType = response.headers.get('content-type')
            if (!response.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json()
                    throw new Error(errorData.message || '生成请求被拒绝')
                } else {
                    throw new Error(`服务器错误: ${response.status}`)
                }
            }

            // 4. 处理 Blob 并下载
            const blob = await response.blob()
            if (blob.size === 0) throw new Error('生成的文件内容为空')

            // 创建下载链接
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // 尝试获取文件名
            const contentDisposition = response.headers.get('Content-Disposition')
            let downloadName = `${payload.project_name}.psd`
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (fileNameMatch != null && fileNameMatch[1]) {
                    downloadName = fileNameMatch[1].replace(/['"]/g, '')
                }
            }

            link.setAttribute('download', downloadName)
            document.body.appendChild(link)
            link.click()

            // 清理
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            ElMessage.success('PSD 文件生成成功，正在下载...')

        } catch (error: any) {
            console.error('Generate PSD Failed:', error)
            ElMessage.error(error.message || '生成 PSD 失败，请稍后重试')
        } finally {
            loading.value = false
        }
    }

    // --- 获取品牌列表逻辑 ---
    const fetchBrandList = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/plm/brand/list', {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            })

            if (!response.ok) return

            const text = await response.text();
            if (!text) return;

            const resData = JSON.parse(text) as BrandListResponse

            if (resData.code === 200 && resData.is_success) {
                brandOptions.value = resData.data.plm_brand_data
            }
        } catch (error) {
            console.error('Failed to fetch brand list:', error)
        }
    }

    fetchBrandList()

    return {
        activeStep,
        formRef,
        formData,
        rules,
        isDocParsed,
        fileName,
        loading,
        inputValue,
        brandOptions,
        nextStep,
        prevStep,
        handleFileUpload,
        handleCloseTag,
        handleInputConfirm,
        addQuickTag,
        handleGeneratePSD
    }
}