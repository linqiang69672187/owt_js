/*!
*@file 创建单位地图显示图层
*@author cxy
*@createDate 20180729
*@params {ol.map} thismap 地图对象 
*/

function PoliceStationLayer(thismap, option) {
    var opt = option || {};
    var isVisible = opt.isVisible == null ? true : opt.isVisible;

    var currentMap = thismap;
    var view = currentMap.getView();
    var tooltipElement, tooltip;
    var currentPSAarry = new Array();
    
    var policeStationSource = new ol.source.Vector({ wrapX: false });//单位图层数据源

    var policeStationLayer = new ol.layer.Vector({//单位图层
        source: policeStationSource,
        style: null
    });
    policeStationLayer.setProperties({ 'ID': 'policeStation' });//设置单位图层id
    policeStationLayer.setVisible(isVisible);//初始化图层是否可见

    currentMap.addLayer(policeStationLayer);//添加单位图层

    //鼠标在单位图层上的交互
    var policeStationMoveInteraction = new ol.interaction.Select({
        condition: ol.events.condition.pointerMove,
        layers: [policeStationLayer],
        wrapX: false
    });
    policeStationMoveInteraction.on("select", function (event) {
        if (event.selected.length > 0) {
            currentMap.getTargetElement().style.cursor = 'pointer';
            var feature = event.selected[0];
            createPoliceStationTooltip();
            var policename = feature.get('policename');
            tooltipElement.innerHTML = '<big>' + policename + '</big>';
            tooltip.setPosition(event.mapBrowserEvent.coordinate);
            tooltipElement.classList.remove('hidden');
        } else {
            currentMap.getTargetElement().style.cursor = '';
            if (tooltipElement) {
                tooltipElement.parentNode.removeChild(tooltipElement);
            }
            tooltipElement = null;
        }
    });

    currentMap.addInteraction(policeStationMoveInteraction);

    
    //根据图片大小按比例加载图片，地图上大小为32px.
    var loadImages = function(setFeatureStyle, policeStationFeatureArray) {
        policeStationFeatureArray.forEach(function (value) {
            var imageSrc = value.get('picurl');
            if (imageSrc == "") {
                return;
            }
            var imgobj = new Image();
            defaultWidth = 32;
            var scale = 1;
            imgobj.onload = function () {
                var imageWidth = imgobj.width;
                var zoomRate = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());
                scale = defaultWidth / imageWidth * zoomRate;
                setFeatureStyle(value, scale, imageSrc);
            };
            imgobj.onerror = function () {
                setFeatureStyle(value, scale, imageSrc);
            }
            imgobj.src = imageSrc;
        });

        
    }
    //设置地图图片样式
    var setFeatureStyle = function(policeStationFeature, scale, imageSrc) {
        var defaultIcon = new ol.style.Icon({
            src: imageSrc,
            scale: scale,
        });

        policeStationFeature.setStyle(new ol.style.Style({
            image: defaultIcon
        }))
    }
    //创建tooltip
    var createPoliceStationTooltip = function() {
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

    //创建单位图层要素
    var createPoliceStationFeature = function (value) {
        var coordinates = ol.proj.transform([parseFloat(value.Lo), parseFloat(value.La)], 'EPSG:4326', 'EPSG:3857');
        //添加单位要素及属性
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(coordinates),
            id: value.ID,
            picurl: value.picurl,
            policename: value.policename,
            lo: value.Lo,
            la: value.La
        });
        feature.setId(value.ID);
        return feature;
    }

    //根据id查找位置索引
    var findPSinArray = function (id) {
        for (var i = 0; i < currentPSAarry.length; i++) {
            if (currentPSAarry[i].ID == id) {
                return i;
            }
        }
    }

    //加载基站信息
    this.loadPoliceStations = function () {
        var updateFun = this.updatePoliceStation, addFun = this.addPoliceStation, removeFun = this.removePoliceSation;
        try {
            
            jquerygetNewData_ajax("Handlers/GetAllPoliceStation.ashx", {}, function (request) {

                var policeStationArray = new Array();
                policeStationArray = eval(request);

                var indexs = Array(currentPSAarry.length + 1).join(0).split('').map(function (v, k) { return k++; });
                policeStationArray.forEach(function (val1) {
                    var isHaving = false;
                    for (var i = 0; i < currentPSAarry.length; i++) {
                        if (val1.ID == currentPSAarry[i].ID) {
                            isHaving = true;
                            if (val1.picurl != currentPSAarry[i].picurl || val1.policename != currentPSAarry[i].policename
                                || val1.Lo != currentPSAarry[i].Lo || val1.La != currentPSAarry[i].La) {
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
                    removeFun(currentPSAarry[i]);
                });
            });
            
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js GetPoliceStation，error info:" + err);
        }
    }

    //添加单个单位要素
    this.addPoliceStation = function (val) {
        try {
            currentPSAarry.push(val);
            var policeStationFeature = createPoliceStationFeature(val);
            policeStationSource.addFeature(policeStationFeature);
            var feature = policeStationSource.getFeatureById(val.ID);
            loadImages(setFeatureStyle, [feature]);
               
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js addPoliceStation，error info:" + err);
        }
    }

    //更新单个单位要素
    this.updatePoliceStation = function (val) {
        try {
            if (!policeStationSource) {
                return;
            }
            var feature = policeStationSource.getFeatureById(val.ID);
            policeStationSource.removeFeature(feature);
            var index = findPSinArray(val.ID);
            currentPSAarry.splice(index, 1);
            var object = {
                ID: val.ID,
                picurl: val.picurl,
                policename: val.policename,
                Lo: val.Lo,
                La: val.La
            }
            currentPSAarry.push(object);
            var newfeature = createPoliceStationFeature(object);
            policeStationSource.addFeature(newfeature);
            var feature = policeStationSource.getFeatureById(val.ID);
            loadImages(setFeatureStyle, [feature]);
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js updatePoliceStation，error info:" + err);
        }
    }

    //移除单个单位要素
    this.removePoliceSation = function (val) {
        try {
            if (!policeStationSource) {
                return;
            }
            var feature = policeStationSource.getFeatureById(val.ID);
            policeStationSource.removeFeature(feature);
            var index = findPSinArray(val.ID);
            currentPSAarry.splice(index, 1);
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js removePoliceSation，error info:" + err);
        }
    }

    //获取图层
    this.getLayer = function () {
        try{
            return policeStationLayer;
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js getLayer，error info:" + err);
        }
    }
    
    //设置图层是否显示
    this.setVisible = function (visible) {
        try{
            policeStationLayer.setVisible(visible);
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js setVisible，error info:" + err);
        }
    }
    
    //单位图层定位
    this.locatePoliceStation = function (coordinates) {
        try{
            var coord = ol.proj.transform([parseFloat(coordinates[0]), parseFloat(coordinates[1])], 'EPSG:4326', 'EPSG:3857');
            mapLocateEvent.locate(coord, 5000);
        } catch (err) {
            writeLog("system", "ol-PoliceStationLayer.js locatePoliceStation，error info:" + err);
        }
    }
}



