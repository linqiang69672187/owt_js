/*!
*@file 创建基站地图显示图层
*@author cxy
*@createDate 20180727
@params {ol.map} thismap 地图对象 
@option params {number} [distance] 聚合距离,{number} [radius] 圆形半径,{boolean} [isCluster] 是否聚合
*/

var BaseStationLayer = function (thismap, option) {
    var opt = option || {};
    var distance = opt.distance || 100;//聚合距离
    var radius = opt.radius || 20;//聚合半径
    distance = !opt.isCluster ? 0 : distance;//是否聚合，是：聚合距离为distance，否：聚合距离为0
    var isVisible = opt.isVisible == null ? true : opt.isVisible;//图层是否可见

    var currentMap = thismap;//当前地图
    var baseStationMoveInteraction;//鼠标地图移动的基站交互
    var currentBSAarry = new Array();//当前地图上的基站数组
    var tooltipElement, tooltip;

    var baseStationSource = new ol.source.Vector({ wrapX: false });//基站数据源

    var clusterSource = new ol.source.Cluster({//基站聚合
        distance: distance,
        wrapX: false,
        source: baseStationSource
    });

    var baseStationLayer = new ol.layer.Vector({//基站图层
        source: clusterSource,
        style: styleFunction
    });
    baseStationLayer.setProperties({ 'ID': 'baseStation' });
    baseStationLayer.setVisible(isVisible);
    currentMap.addLayer(baseStationLayer);

    //默认样式
    function styleFunction(feature) {
        return createClusterStyle('#41CC3B', feature);
    }

    //鼠标选中样式
    function selectStyleFunction(feature) {
        return createClusterStyle('#FA9B74', feature);
    }

    //基站聚合样式
    function createClusterStyle(fillColor,feature) {
        var size = feature.get('features').length;
        var currentZoom = currentMap.getView().getZoom();
        var maxZoom = currentMap.getView().getMaxZoom();
        if (size > 1) {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: radius,
                    stroke: new ol.style.Stroke({
                        color: '#fff'
                    }),
                    fill: new ol.style.Fill({
                        color: fillColor
                    })
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    }),
                    font: '15px sans-serif'
                })
            });
        } else {
            var originalFeature = feature.get('features')[0];
            var view = currentMap.getView();
            var currentZoom = view.getZoom();
            var middleZoom = (view.getMaxZoom() - view.getMinZoom()) / 2;
            style = createBaseStationStyle(originalFeature, currentZoom, middleZoom);
        }

        return style;
    }
    
    //获取当前设置聚合距离
    function getDistance() {
        var iscluster = eval(useprameters.IsBaseStationLayerCluster.toLowerCase());
        if (iscluster) {
            return useprameters.BaseStationClusterDistance
        } else {
            return 0;
        }
    }

    //基站样式
    function createBaseStationStyle(feature,zoomLevel, middleZoom) {
        var name = feature.get('bsname');
        var deviceCount = feature.get('devicecount');
        var firstUser = feature.get('firstUser');
        var textStyle = null;
        if (zoomLevel > middleZoom) {
            textStyle = new ol.style.Text({
                text: firstUser + "\n" + GetTextByName('terminal_device')+':' + deviceCount,
                offsetX: -30,
                offsetY: -36,
                font:'15px 宋体',
                textAlign:'left',
                fill: new ol.style.Fill({
                    color: '#ff0000'
                })
            })
        }

        return new ol.style.Style({
            image: new ol.style.Icon({
                src:'Images/BaseStation.png'
            }),
            text: textStyle
        });
    }

    //创建基站tooltip
    function createBaseStationTooltip() {
        if (tooltipElement) {
            tooltipElement.parentNode.removeChild(tooltipElement);
        }
        tooltipElement = document.createElement('div');
        tooltipElement.style.cssText = "position: relative;background: #F7F5B9;border-radius: 4px;padding: 4px 8px;";
        tooltipElement.style.cssText += "white-space: nowrap;font-size:10px;box-shadow: 0px 2px 1px #888888;";
        tooltipElement.className = 'hidden';
        tooltip = new ol.Overlay({
            element: tooltipElement,
            offset: [15, 0]
        });
        currentMap.addOverlay(tooltip);
    }
    //移除基站tooltip
    this.removeBaseSationTooltip = function() {
        currentMap.getTargetElement().style.cursor = '';
        if (tooltipElement) {
            tooltipElement.parentNode.removeChild(tooltipElement);
        }
        tooltipElement = null;
    }
    //添加基站要素及属性
    function createBaseStationFeature(bsInfo) {
        var coordinates = ol.proj.transform([parseFloat(bsInfo.Lo), parseFloat(bsInfo.La)], 'EPSG:4326', 'EPSG:3857');
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(coordinates),
            ID: bsInfo.ID,
            bsissi: bsInfo.StationISSI,
            bsname: bsInfo.StationName,
            devicecount: bsInfo.DeviceCount,
            lo: bsInfo.Lo,
            la: bsInfo.La,
            firstUser: bsInfo.FirstUser || '',
            switchID:bsInfo.SwitchID//xzj--20181217--添加交换ID
        });
        feature.setId(bsInfo.ID);
        return feature;
    }

    function findBSinArray(id) {
        for (var i = 0; i < currentBSAarry.length; i++) {
            if (currentBSAarry[i].ID == id) {
                return i;
            }
        }
    }

    //添加鼠标地图移动的基站交互
    function addBaseStationMoveInteraction(removeBaseSationTooltip) {
        //鼠标移动选择交互
        baseStationMoveInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            layers: [baseStationLayer],
            wrapX: false,
            style: selectStyleFunction
        });

        baseStationMoveInteraction.on('select', function (event) {
            if (event.selected.length > 0) {
                currentMap.getTargetElement().style.cursor = 'pointer';
                var originalFeatures = event.selected[0].get('features');
                if (originalFeatures.length == 1) {//当只有一个基站时显示基站信息
                    createBaseStationTooltip();
                    var baname = originalFeatures[0].get('bsname');
                    var lat = originalFeatures[0].get('la');
                    var lon = originalFeatures[0].get('lo');
                    tooltipElement.innerHTML = '<big>' + GetTextByName('StationName') + ':' + baname + '</big>' + '<br>'
                        + GetTextByName('jzjd') + ':' + lon + '<br>' + GetTextByName('jzwd') + ':' + lat;
                    tooltip.setPosition(event.mapBrowserEvent.coordinate);
                    tooltipElement.classList.remove('hidden');
                }

            } else {
                removeBaseSationTooltip();
            }

        });
        currentMap.addInteraction(baseStationMoveInteraction);
    }

    //添加基站要素
    this.addBaseStationFeature = function (val) {
        try{
            if (!baseStationSource) {
                return;
            }
            currentBSAarry.push(val);
            var bsinfo = createBaseStationFeature(val)
            baseStationSource.addFeature(bsinfo);
        } catch (err) {
            writeLog("system", "ol-BaseStationLayer.js addBaseStationFeature，error info:" + err);
        }
    }

    //更新基站要素
    this.updateBaseStationFeature = function (val) {
        try{
            if (!baseStationSource) {
                return;
            }
            var feature = baseStationSource.getFeatureById(val.ID);
            baseStationSource.removeFeature(feature);
            var index = findBSinArray(val.ID);
            currentBSAarry.splice(index, 1);
            currentBSAarry.push(val);
            var bsFeature = createBaseStationFeature(val);
            baseStationSource.addFeature(bsFeature);
        } catch (err) {
            writeLog("system", "ol-BaseStationLayer.js updateBaseStationFeature，error info:" + err);
        }
    }

    //移除地图要素
    this.removeBaseStaionFeature = function (val) {
        try{
            if (!baseStationSource) {
                return;
            }
            var feature = baseStationSource.getFeatureById(val.ID);
            baseStationSource.removeFeature(feature);
            var index = findBSinArray(val.ID);
            currentBSAarry.splice(index, 1);
        } catch (err) {
            writeLog("system", "ol-BaseStationLayer.js removeBaseStaionFeature，error info:" + err);
        }
    }

    //加载基站
    this.loadBaseStations = function () {
        var addFun = this.addBaseStationFeature, updateFun = this.updateBaseStationFeature, removeFun = this.removeBaseStaionFeature;
        //请求基站数据
        try {
            jquerygetNewData_ajax("Handlers/GetAllBaseStation.ashx", "", function (request) {//xzj--20190919--getNewData_ajaxStock改为jquerygetNewData_ajax，否则同时请求只能有一个返回
                if (request) {
                    var allBaseStationArray = new Array();
                    allBaseStationArray = eval(request);
                    var indexs = Array(currentBSAarry.length + 1).join(0).split('').map(function (v, k) { return k++; });
                    allBaseStationArray.forEach(function (val1) {
                        var isHaving = false;
                        for (var i = 0; i < currentBSAarry.length; i++) {
                            if (val1.ID == currentBSAarry[i].ID) {
                                isHaving = true;
                                if (val1.StationISSI != currentBSAarry[i].StationISSI || val1.DeviceCount != currentBSAarry[i].DeviceCount
                                    || val1.StationName != currentBSAarry[i].StationName
                                    || val1.Lo != currentBSAarry[i].Lo || val1.La != currentBSAarry[i].La || val1.FirstUser != currentBSAarry[i].FirstUser
                                    || val1.SwitchID != currentBSAarry[i].SwitchID) {//xzj--20181217--添加交换ID
                                    updateFun(val1);
                                }
                                var index = indexs.indexOf(i);
                                indexs.splice(index, 1);
                                break;
                            }
                        }
                        if (!isHaving) {
                            addFun(val1);
                        }
                    });
                    indexs.forEach(function (i) {
                        removeFun(currentBSAarry[i]);
                    });
                }
            });
        } catch (err) {
            writeLog("system", "ol-BaseStationLayer.js LoadBaseStations，error info:" + err);
        }
    }

    //获取图层
    this.getLayer = function () {
        return baseStationLayer;
    }

    //获取聚合距离
    this.getDistance = function () {
        return distance;
    }

    //设置图层显示隐藏
    this.setVisible = function (visible) {
        baseStationLayer.setVisible(visible);
    }
    
    //刷新基站图层
    this.refreshBaseStationLayer = function (d, isCluster) {
        var istrue = eval(isCluster.toLowerCase());
        var ds = d;
        if (!istrue) {
            ds = 0;
            useprameters.IsBaseStationLayerCluster = "False";
        } else {
            useprameters.IsBaseStationLayerCluster = "True";
        }
        clusterSource.setDistance(ds);
        currentMap.render();
    }
    
    //基站定位
    this.locateBaseStation = function (coordinates) {
        var coord = ol.proj.transform([parseFloat(coordinates[0]), parseFloat(coordinates[1])], 'EPSG:4326', 'EPSG:3857');
        mapLocateEvent.locate(coord, 5000);
    }
    
    //打开基站下终端列表
    this.openBaseStationById = function (switchID, bsid) {//xzj--20181217--添加交换ID
        mycallfunction('manager_BaseStationDivice', 650, 570, "&bsid=" + bsid + "&switchID=" + switchID, 2000);
    }

    //移除移动交互选择的Features
    this.removeMoveSelectedFeatures = function () {
        baseStationMoveInteraction.getFeatures().clear();
    }
        
    //当图层为最大zoom时，基站可能还处于聚合状态，所以实时设置聚合距离，当图层缩放到最大，设置聚合距离为0，表示不聚合
    this.setDistanceByZoom = function () {
        if (!clusterSource) {
            return;
        }
        var currentZoom = currentMap.getView().getZoom();
        var maxZoom = currentMap.getView().getMaxZoom();
        var setDistance = useprameters.BaseStationClusterDistance;
        var iscluster = eval(useprameters.IsBaseStationLayerCluster.toLowerCase());
        if (!iscluster) {
            setDistance = 0;
        }
        if (currentZoom >= maxZoom) {
            setDistance = 0;
            clusterSource.setDistance(setDistance);
        } else {
            if (clusterSource.getDistance() == 0 && setDistance != 0) {
                clusterSource.setDistance(setDistance);
            }
        }
    }
    
    //初始化部分方法与参数
    var removeBaseSationTooltip = this.removeBaseSationTooltip;
    addBaseStationMoveInteraction(removeBaseSationTooltip);
}