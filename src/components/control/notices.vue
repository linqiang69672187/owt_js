<template>
</template>
<script>
import { Notice  } from 'iview';
let count=0;
let noticemod;
    export default {
        components:{
            Notice
        },
        created() {
            let that =this;
            window.vue_notice= this;
            Notice.config({
                top: 120,
              //  duration: 30
            });
        },
        destroyed(){
        
        },
        methods: {
            regmsg:function (nodesc,msg,dispatchname) {
                Notice.info({
                    title: 'Reg',
                    desc: nodesc ? '' : msg
                });
            },
            error:function(title,msg){
                Notice.error({
                    title: title,
                    desc: msg
                });
            },
            info:function (title,msg) {
                Notice.info({
                    title: title,
                    desc:  msg
                });
            },
        }
    }
</script>

<style >
.ivu-notice-notice-with-desc{
    background-color: #042657 !important;
    border-radius: 10px  !important;
    color: #fff  !important;
}
.ivu-notice-desc,.ivu-notice-title,.ivu-notice-notice-close i{
    color: #fff  !important;
}
</style>