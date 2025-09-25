<template>
  <AnimatedGradientBackground>
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Management /></el-icon>
            项目管理大师
          </h1>
          <nav class="app-nav">
            <router-link to="/" class="nav-link">
              <el-icon><House /></el-icon>
              仪表盘
            </router-link>
            <router-link to="/projects" class="nav-link">
              <el-icon><List /></el-icon>
              项目列表
            </router-link>
            <router-link to="/calendar" class="nav-link">
              <el-icon><Calendar /></el-icon>
              项目日历
            </router-link>
          </nav>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </AnimatedGradientBackground>
</template>

<script setup lang="ts">
import { House, List, Calendar, Management } from '@element-plus/icons-vue'
import AnimatedGradientBackground from './components/AnimatedGradientBackground.vue'
</script>

<style scoped>
.app-container {
  height: 100vh;
  background: transparent;
}

.app-header {
  background-color: rgba(64, 158, 255, 0.95);
  color: white;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-title {
  margin: 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: black;
}

.app-nav {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.3);
}

.app-main {
  background-color: rgba(245, 247, 250, 0.95);
  padding: 20px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}
</style>