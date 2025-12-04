import { reactive, ref } from 'vue'
import { ElMessage, ElLoading, type FormInstance, type FormRules, type UploadFile } from 'element-plus'

// 前端使用的驼峰命名接口 (保持不变，方便组件调用)
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

// 后端返回的 JSON 结构定义 (用于类型提示)
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

export function usePackagingConfig() {
    const activeStep = ref(0)
    const formRef = ref<FormInstance>()
    const isDocParsed = ref(false)
    const fileName = ref('')
    const loading = ref(false)
    const inputValue = ref('')

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
        'marketing.brand': [{ required: true, message: '请输入品牌', trigger: 'blur' }],
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

            // 1. 修改接口地址: /api/Document/parse/word -> /api/document/parse/word
            const response = await fetch('/api/document/parse/word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 2. 修改请求参数 Key: 驼峰 -> 下划线
                body: JSON.stringify({
                    file_name: file.name,
                    file_content_base64: base64String
                })
            })

            const resData = (await response.json()) as ParseDocResponse

            if (response.ok && resData.code === 200 && resData.is_success && resData.data) {
                const parsed = resData.data.content

                // 3. 修改响应映射: 下划线 -> 驼峰
                Object.assign(formData.content, {
                    productName: parsed.product_name || '',
                    manufacturer: parsed.manufacturer || '',
                    origin: parsed.country_of_origin || '', // country_of_origin
                    warnings: parsed.warnings || '',
                    shelfLife: parsed.shelf_life || '',     // shelf_life
                    address: parsed.address || '',
                    directions: parsed.directions || '',
                    // 处理 ingredients 对象
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

    const handleGeneratePSD = () => {
        loading.value = true
        setTimeout(() => {
            loading.value = false
            ElMessage.success('PSD 生成成功')
        }, 2000)
    }

    return {
        activeStep,
        formRef,
        formData,
        rules,
        isDocParsed,
        fileName,
        loading,
        inputValue,
        nextStep,
        prevStep,
        handleFileUpload,
        handleCloseTag,
        handleInputConfirm,
        addQuickTag,
        handleGeneratePSD
    }
}