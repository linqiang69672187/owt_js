<template>
<div class="local">
  <video playsinline muted controls autoplay style="width:320px;height:240"></video>
   <button onclick="nomix()">click</button>
    <button onclick="nomix2()">click2</button>
  
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
