<template>
  <div class="main-container">
    <n-card style="height: calc(100vh - 140px)">
      <iframe src="https://aaden-vue3-tool.vercel.app/" width="100%" height="100%"></iframe>
    </n-card>
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="scss" scoped>
  .avatar-container {
    position: relative;
    width: 30px;
    height: 30px;
    margin: 0 auto;
    vertical-align: middle;
    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }
    .avatar-vip {
      border: 2px solid #cece1e;
    }
    .vip {
      position: absolute;
      top: 0;
      right: -9px;
      width: 15px;
      transform: rotate(60deg);
    }
  }
  .gender-container {
    .gender-icon {
      width: 20px;
    }
  }
</style>
