import { reactive, ref } from 'vue'
import { ElMessage, ElLoading, type FormInstance, type FormRules, type UploadFile } from 'element-plus'

// --- 类型定义 ---
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

// --- 组合式函数 ---
export function usePackagingConfig() {
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
            productName: '', ingredients: '', warnings: '', manufacturer: '',
            origin: '', shelfLife: '', address: '', directions: ''
        },
        marketing: { sku: '', brand: '', capacityValue: '', capacityUnit: '', sellingPoints: [] }
    })

    // 校验规则
    const rules = reactive<FormRules>({
        'dimensions.length': [{ required: true, message: 'Required', trigger: 'blur' }],
        'dimensions.width': [{ required: true, message: 'Required', trigger: 'blur' }],
        'dimensions.height': [{ required: true, message: 'Required', trigger: 'blur' }],
        'content.productName': [{ required: true, message: '请上传文档', trigger: 'change' }],
        'marketing.sku': [{ required: true, message: '请输入 SKU', trigger: 'blur' }],
        'marketing.brand': [{ required: true, message: '请输入品牌', trigger: 'blur' }],
        'marketing.capacityValue': [{ required: true, message: '请输入规格', trigger: 'blur' }]
    })

    // --- 步骤控制 ---
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

    // --- 核心业务：上传解析文档 ---
    const handleFileUpload = async (file: UploadFile) => {
        if (!file.raw) return

        const loadingInstance = ElLoading.service({
            text: 'AI 解析中 (Reading Document)...',
            background: 'rgba(255,255,255,0.8)'
        })

        try {
            const base64String = await fileToBase64(file.raw)
            const response = await fetch('/api/Document/parse/word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, fileContentBase64: base64String })
            })

            const resData = await response.json()

            if (response.ok && resData.code === 200 && resData.data) {
                const parsed = resData.data.content
                Object.assign(formData.content, {
                    productName: parsed.productName || '',
                    manufacturer: parsed.manufacturer || '',
                    origin: parsed.countryOfOrigin || '',
                    warnings: parsed.warnings || '',
                    shelfLife: parsed.shelfLife || '',
                    address: parsed.address || '',
                    directions: parsed.directions || '',
                    ingredients: parsed.ingredients?.rawText ||
                        (parsed.ingredients?.activeIngredients ? `Active: ${parsed.ingredients.activeIngredients}\n` : '') +
                        (parsed.ingredients?.inactiveIngredients ? `Inactive: ${parsed.ingredients.inactiveIngredients}` : '')
                })

                fileName.value = file.name
                isDocParsed.value = true
                ElMessage.success('解析成功：文案已自动填充')
            } else {
                throw new Error(resData.message || '解析失败')
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

    // --- 标签管理 ---
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