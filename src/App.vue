<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h1>文档上传系统</h1>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup>
</script>

<style>
.app-container {
  height: 100vh;
}

.app-header {
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

html, body {
  margin: 0;
  padding: 0;
}
</style>