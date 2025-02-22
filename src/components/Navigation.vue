<template>
  <nav class="navigation">
    <router-link 
      v-for="route in routes" 
      :key="route.path" 
      :to="route.path"
      class="nav-item"
      active-class="active"
    >
      {{ route.name }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
const routes = [
  { path: '/business', name: 'Business Analysis Expert' },
  { path: '/function', name: 'Function Analysis Expert' },
  { path: '/uiux', name: 'UIUX Expert' }
]
</script>

<style scoped>
.navigation {
  background: white;
  padding: 16px;
  display: flex;
  gap: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.nav-item {
  text-decoration: none;
  color: #666;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f5f7fa;
}

.nav-item.active {
  background: #409eff;
  color: white;
}
</style> 