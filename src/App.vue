<template>
  <div id="app">
    <el-menu :default-active="activeIndex" mode="horizontal" router>
      <el-menu-item index="/">WIKI</el-menu-item>
      <el-menu-item index="/">ABOUT</el-menu-item>
    </el-menu>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeIndex: '/'
    }
  },
  methods: {
  }
}
</script>