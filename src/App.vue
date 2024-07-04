<template>
  <el-config-provider namespace="ep">
    <div class="flex main-container">
      <!--
      <BaseSide />
      -->
      <div class="full-screen">
        <BMap class="BMap-container"/>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import BMap from "./components/BMap.vue";
import BaseHeader from "./components/layouts/BaseHeader.vue";
</script>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.main-container {
  height: 100vh; 
  display: flex;
}

.full-screen {
  width: 100%;
  height: 100%;
}

.BMap-container {
  width: 100%;
  height: 100%;
}
</style>
