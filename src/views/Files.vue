<template>
  <div class="files-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>文件清单</h2>
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :headers="uploadHeaders"
          >
            <el-button type="primary">上传文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                仅支持PDF文件，且不超过800KB
              </div>
            </template>
          </el-upload>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="fileList"
        style="width: 100%"
      >
        <el-table-column prop="fileName" label="文件名" />
        <el-table-column prop="fileSize" label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="downloadFile(row)"
            >
              下载
            </el-button>
            <el-button
              type="danger"
              link
              @click="deleteFile(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const fileList = ref([])

const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 上传前验证
const beforeUpload = (file) => {
  const isPDF = file.type === 'application/pdf'
  const isLt800K = file.size / 1024 < 800

  if (!isPDF) {
    ElMessage.error('只能上传PDF文件！')
    return false
  }
  if (!isLt800K) {
    ElMessage.error('文件大小不能超过800KB！')
    return false
  }
  return true
}

// 上传成功处理
const handleUploadSuccess = (response) => {
  ElMessage.success('上传成功')
  fetchFileList()
}

// 上传失败处理
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

// 获取文件列表
const fetchFileList = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/files', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (response.ok) {
      fileList.value = await response.json()
    } else {
      throw new Error('获取文件列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 下载文件
const downloadFile = async (file) => {
  try {
    const response = await fetch(`/api/files/${file.id}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      throw new Error('下载失败')
    }
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 删除文件
const deleteFile = async (file) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个文件吗？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await fetch(`/api/files/${file.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      ElMessage.success('删除成功')
      fetchFileList()
    } else {
      throw new Error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchFileList()
})
</script>

<style scoped>
.files-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}

.el-upload__tip {
  margin-top: 8px;
  color: #909399;
}
</style>