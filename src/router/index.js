import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import heatmap from '@/components/panel/Heatmap.vue'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: heatmap,
      meta: {
        keepAlive: true // 需要被缓存
      }
    },
  ]
})
