<template>
    <div>

       <div id="control">
           <ul>
               <li>  
                   <Select v-model="ssri" @on-change="selectChange" style="width:100px" >
                      <Option v-for="item in cityList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                   </Select>
           </li>
               <li>选择起始时间：</li>
               <li>
                  <DatePicker :value="sdate" format="yyyy-MM-dd" type="daterange" @on-change="loadHeatmapData" placement="bottom-end" placeholder="Select date" style="width: 200px"></DatePicker>
               </li>
                <li>
                 <Button  icon="ios-map" @click="changemap">主地图</Button>
                </li>
           </ul>
          
       </div>
       <div id="legend">

       </div>
<!--        
      <div id="valuetable">
          <Table border :columns="columns5" :data="rssiData"></Table>
          <Page :total="100" />
       </div>
       -->
           <notice ref="notice"></notice>
          <Spin fix  v-if="spinShow">
                <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>
                <div>Loading</div>
          </Spin>
       
    </div>
</template>
<script>
import Vue from 'vue';
import { Select,DatePicker,Page,Spin,Icon,Button } from 'iview';
import notice from "@/components/control/notices";

export default {
    data(){
        return{
                lockitems:[],//锁定的设备
                backgroundDiv: {
                  //  backgroundImage: 'url(' + require('@/assets/images/tabs_table_bg2.png') + ')'
                },
                map:null,
                htmap:null,
                 cityList: [
                    {
                        value: 'MS',
                        label: '手台场强'
                    },
                    {
                        value: 'UI',
                        label: '上行场强'
                    }
                ],
                ssri: 'MS',
                legendLabel:'图例',
                sdate:[],
                columns5: [
                    {
                        title: 'ISSI',
                        key: 'issi',
                        sortable: true
                    },
                    {
                        title: '位置',
                        key: 'co'
                    },
                    {
                        title: '手台场强',
                        key: 'MS',
                        sortable: true
                    },
                    {
                        title: '下行场强',
                        key: 'UI'
                    }
                ],
                rssiData:[],
         
                spinShow: false, 
           
        }
    },
    created(){
         
    },
    components:{
        notice,
    },
    mounted(){
      this.initMap();
    },
    methods:{  
        
            loadHeatmapData(date1){
               this.sdate =date1; 
               let sdate=date1[0]+'_'+date1[1];
         
                this.spinShow=true;
                let _this =this;
                 Vue.axios.get('/Handlers/getHeatmapRssidata.ashx', { // ，/app/data/json/OnlineTerminalCountGroupByBS.json，/Handlers/MVCEasy.ashx，
                            params: {
                                type:this.ssri,
                                sdate:sdate,                              
                            }
                          }).then((res) => {
                                 _this.createFeature(res.data);  
                                 _this.rssiData =  res.data;
                            _this.spinShow=false;
                          }).catch((err) => {
                          console.log(err)
                           _this.spinShow=false;
                      
                   })   
            },
            createLegend(){
                let params = {
                            krigingModel: 'exponential',//model还可选'gaussian','spherical'
                            krigingSigma2: 0,
                            krigingAlpha: 100,
                            canvasAlpha: 0.5,//canvas图层透明度
                            colors: ['#E3FFC6', '#0f0', '#00f', '#ff0', '#f00']
                        }
                let drawLabel = function (x, y, color, type, text, textSize) {
                            var side = 3;
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(x + side, y - side);
                            ctx.lineTo(x + side, y + side);
                            ctx[type + 'Style'] = color;
                            ctx.closePath();
                            ctx[type]();
                            ctx.font = textSize + "px Arial";
                            ctx.fillStyle = "#000";
                            ctx.fillText(text, x + side + 2, y + textSize / 2 - 2);
                        }
                
                            
                        var textOffsetHeight = 25,textHeight = 16;//文字与上部偏离，文字大小
                        var offsetY = 15, offsetX = 10;//渐变矩阵偏离度
                        var rectHeight = 70, rectWidth = 30;//渐变矩阵高和宽

                        var canvas = document.createElement('canvas');
                        canvas.style.marginBottom = "-5px";
                        var ctx = canvas.getContext("2d");
                        canvas.height = 140;
                        canvas.width = 100;
                        ctx.fillStyle = "#fff";
                        ctx.fillRect(0, 0, canvas.width, canvas.height); //绘制底图
                        ctx.font = "bold "+ textHeight + "px Arial";
                        ctx.fillStyle = "#000";
                        ctx.fillText(this.legendLabel, canvas.width / 2.6, textOffsetHeight);

                        //绘制渐变矩形
                        var lg = ctx.createLinearGradient(offsetX, textOffsetHeight + offsetY, offsetX, textHeight + textOffsetHeight + offsetY + rectHeight);
                        var colorArray = params.colors;
                        colorArray.forEach(function (v,n) {
                            lg.addColorStop(n / colorArray.length, v);
                        });
                        ctx.fillStyle = lg;
                        ctx.beginPath();
                        ctx.fillRect(offsetX, textOffsetHeight + offsetY, rectWidth, rectHeight);
                        ctx.fillStyle = "black";
                        ctx.beginPath();
                        ctx.fillRect(offsetX, textOffsetHeight + offsetY + rectHeight, rectWidth, rectHeight / 4);

                        //绘制标签
                        drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY, "#000", "fill", 0 + " dB", "12");
                        drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight / 4, "#000", "fill", "-80 dB", "12");
                        drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight / 2, "#000", "fill", "-90 dB", "12");
                        drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight * 3 / 4, "#000", "fill", "-100 dB", "12");
                        drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight, "#000", "fill", "-110 dB", "12");
                        drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight * 5 / 4, "#000", "fill", "-150 dB", "12");
                     let content = document.getElementById("legend");
                     content.appendChild(canvas);

            },
            
            createFeature (data) {
                       let source = this.htmap.getSource();
                           source.clear();
                         data.forEach(element=>{
                               let geom = new ol.geom.Point(ol.proj.fromLonLat(element.co));
                               let feature = new ol.Feature({
                                   geometry: geom,
                                   MS : element.MS,
                                   UI : element.UI,
                                  issi : element.issi,
                               });
                               
                               let Rssi = this.ssri=="MS"?parseInt(element.MS):parseInt(element.UI);
                               let color=this.fillColor(Rssi)
                               feature.setStyle(
                                    new ol.style.Style({
                                        image: new ol.style.Circle({
                                            radius: 5,
                                            fill: new ol.style.Fill({
                                                color: color
                                            }),
                                        })
                                    })
                                );
                             source.addFeature(feature);
                         })                             
                }, 
            fillColor(Rssi){
                let r=255,g=255,b=255;
                if(0<=Rssi && Rssi<=80){
                     r = parseInt(255-Rssi/80*255);
                     g = 255;
                     b = parseInt(255-Rssi/80*255);
               
                };
                if(80<Rssi&&Rssi<=90){
                     r = 0;
                     g =  parseInt(255-(Rssi-80)/10*255);
                     b = parseInt((Rssi-80)/10*255);
                       
                };
               if(90<Rssi&&Rssi<=100){
                     r =  parseInt((Rssi-90)/10*255);
                     g =  parseInt((Rssi-90)/10*255);
                     b =  parseInt(255-(Rssi-90)/100*255);
                       
                };
               if(100<Rssi&&Rssi<=110){
                     r =  255;
                     g =  parseInt(255-(Rssi-100)/10*255);
                     b = 0;
                       
                };
                if(110<Rssi&&Rssi<=150){
                     r =  parseInt(255-(Rssi-110)/40*255);
                     g =  0;
                     b =  0;
                       
                };

                return 'rgb('+r+','+g+','+b+')';
              

            },
            selectChange(){
                debugger;
                console.info(this.sdate);
               //this.createFeature(this.rssiData);
              
                this.loadHeatmapData(this.sdate);
              // this.$Spin.show();
            //    this.spinShow=true;
            //    let features = this.htmap.getSource().getFeatures();
          
            //     features.forEach(element=>{
            //                    let Rssi = this.ssri=="MS"?parseInt(element.get('MS')):parseInt(element.get('UI')); 
            //                    let color= this.fillColor(Rssi)
            //                    element.setStyle(
            //                         new ol.style.Style({
            //                             image: new ol.style.Circle({
            //                                 radius: 5,
            //                                 fill: new ol.style.Fill({
            //                                     color: color
            //                                 }),
            //                             })
            //                         })
            //                     );
                             
            //              })  
     
            //   //  this.$Spin.hide();
            //  this.spinShow=false;

            },
            changemap(){
               this.$router.push({name:'index'}) 
            },
         
            initMap() {
          
                this.createLegend();
                var GISTYPE = useprameters.GISTYPE.toLowerCase();
                var viewParam = {
                    "lo": useprameters.PGIS_Center_lo,//中心点
                    "la": useprameters.PGIS_Center_la,//中心点
                    "maxLevel": useprameters.maxLevel,//最大层级
                    "minLevel": useprameters.minLevel,//最小层级
                    "currentLevel": useprameters.maxLevel-2//显示层级
                }
                var view = createView(GISTYPE, viewParam);//创建视图
                this.map = new ol.Map({
                    target:  this.$el,
                    // 设置地图控件，默认的三个控件都不显示
                    controls: ol.control.defaults({
                        attribution: false,
                        rotate: false,
                        zoom: false
                    }),
                    view: view,
                   
                }); 
            
                var offlineMapLayerParams = createBaseMapParameter(GISTYPE);
                var streetMapLayer = createStreetMapLayer(this.map, "offlineMapLayer", offlineMapLayerParams);//创建街景图
                var source = new ol.source.Vector({}) ;
                this.htmap = new ol.layer.Vector({
                            source: source,
                        
                        });   
                this.map.addLayer(this.htmap);  
                let _this=this;
            
                const dblClickInteraction = this.map
                            .getInteractions()
                            .getArray()
                            .find(interaction => {
                            return interaction instanceof ol.interaction.DoubleClickZoom;
                            });
                this.map.removeInteraction(dblClickInteraction);
                this.map.on('dblclick', function (evt) {
                  //  point_overlay.setPosition([0, 0]);
                   // $(".zq1").hide();
                  //  $(".table .localtd").removeClass("localtd"); //移出定位
                     var feature = _this.map.forEachFeatureAtPixel(evt.pixel,
                        function (feature) {
                            return feature;
                        });
                    if (feature) {
                     //   var coordinates = feature.getGeometry().getCoordinates();
                      //  var pixel = map.getPixelFromCoordinate(coordinates);


                        let MS = feature.get('MS');
                        let UI = feature.get("UI");
                        let issi = feature.get("issi");  
    
                        _this.$refs.notice.info("场强信息","终端号码："+issi+"<br/>手台场强："+MS+"<br/>上行场强："+UI);
                    }
                });
                
            },
        },

    }
</script>
<style scoped>

#control{
    height:40px;
    width: 545px;
    position: absolute;
    z-index: 999;
    right: 20px;
    top: 10px;
    background-color: #fff;
    white-space: nowrap;
    text-align: center;
    border-radius: 5px;
}
#control>ul{
    margin-left: 5px;
   text-align: center;
   list-style: none;
}
#control>ul>li{
    float: left;
    padding-top: 5px;
    margin-right: 10px;;
}
#control>ul>li:nth-child(2){
padding-top: 10px;
width: 100px;
text-align: right;
}
#legend{
    z-index: 998;
    bottom: 10px;
    right: 20px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    position: absolute;
}
#valuetable{
    z-index: 999;
    left: 10px;
    top: 60px;
    width: 435px;
    height: 500px;
    position: absolute;
    background-color: #fff;
}
.demo-spin-icon-load{
        animation: ani-demo-spin 1s linear infinite;
    }
    @keyframes ani-demo-spin {
        from { transform: rotate(0deg);}
        50%  { transform: rotate(180deg);}
        to   { transform: rotate(360deg);}
    }
    .demo-spin-col{
        height: 100px;
        position: relative;
        border: 1px solid #eee;
    }
    #backMainMap{
        height: 40px;
        width: 40px;
        background-color: red;
        border-radius: 20px;
        z-index: 998;
        bottom: 20px;
        right: 20px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        position: absolute;
    }

     
</style>
<style >
  
</style>