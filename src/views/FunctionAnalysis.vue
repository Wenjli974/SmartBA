<template>
  <div class="function-analysis">
    <div class="sub-nav">
      <router-link 
        to="/function-analysis" 
        class="sub-nav-item"
        active-class="active"
        :exact="true"
      >
        用户故事
      </router-link>
      <router-link 
        to="/function-analysis/requirements" 
        class="sub-nav-item"
        active-class="active"
      >
        需求文档
      </router-link>
    </div>
    <div class="container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.function-analysis {
  padding: 20px;
}

.sub-nav {
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
}

.sub-nav-item {
  text-decoration: none;
  color: #666;
  padding: 8px 16px;
  border-radius: 4px;
  background: white;
  transition: all 0.3s;
}

.sub-nav-item:hover {
  background: #f5f7fa;
}

.sub-nav-item.active {
  background: #409eff;
  color: white;
}

.container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}
</style> 