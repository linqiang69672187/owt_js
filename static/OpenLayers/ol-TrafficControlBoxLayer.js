function TrafficControlBoxLayer(thismap, option) {
    var opt = option || {};
    var isVisible = opt.isVisible == null ? true : opt.isVisible;

    var currentMap = thismap;
    var view = currentMap.getView();
    var tooltipElement, tooltip;
    var currentTrafficAarry = new Array();
    //交通岗亭图层
    var trafficControlBoxSource = new ol.source.Vector();//岗亭图层数据源

    var trafficControlBoxLayer = new ol.layer.Vector({//岗亭图层
        source: trafficControlBoxSource,
        style: null
    }); 
    trafficControlBoxLayer.setProperties({ 'ID': 'trafficControlBox' });//设置岗亭图层id
    trafficControlBoxLayer.setVisible(isVisible);//初始化图层是否可见
    //交通岗亭范围图层
    var circleLayer = new ol.layer.Vector({ //范围图层
        source: new ol.source.Vector()
    });
    circleLayer.setProperties({ 'ID': 'circleLayer' });//设置范围图层id
    circleLayer.setVisible(isVisible);//初始化图层是否可见


    currentMap.addLayer(trafficControlBoxLayer);//添加岗亭图层
    currentMap.addLayer(circleLayer);//添加岗亭范围图层

    //鼠标在岗亭图层上的交互
    var trafficControlBoxMoveInteraction = new ol.interaction.Select({
        condition: ol.events.condition.pointerMove,
        layers: [trafficControlBoxLayer]
    });
    trafficControlBoxMoveInteraction.on("select", function (event) {
        if (event.selected.length > 0) {
            currentMap.getTargetElement().style.cursor = 'pointer';
            var feature = event.selected[0];
            createTrafficControlBoxTooltip();
            var trafficname = feature.get('name');
            tooltipElement.innerHTML = '<big>' + trafficname + '</big>';
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

    currentMap.addInteraction(trafficControlBoxMoveInteraction);


    //根据图片大小按比例加载图片，地图上大小为32px.
    var loadImages = function (setFeatureStyle, trafficControlBoxFeatureArray) {
        trafficControlBoxFeatureArray.forEach(function (value) {
            var imageSrc = value.get('picurl');
            var imgobj = new Image();
            defaultWidth = 40;
            var scale = 1;
            imgobj.onload = function () {
                var imageWidth = imgobj.width;
                var zoomRate = (view.getZoom() - view.getMinZoom() + 3) / (view.getMaxZoom());
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
    var setFeatureStyle = function (trafficControlBoxFeature, scale, imageSrc) {
        var defaultIcon = new ol.style.Icon({
            src: imageSrc,
            scale: scale,
        });

        trafficControlBoxFeature.setStyle(new ol.style.Style({
            image: defaultIcon
        }))
    }
    //创建tooltip
    var createTrafficControlBoxTooltip = function () {
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

    //创建岗亭图层要素
    var createTrafficControlBoxFeature = function (value) {
        var coordArr = value.Coordinates.split(/[{,}]/);
        var coordinates = ol.proj.transform([parseFloat(coordArr[1]), parseFloat(coordArr[2])], 'EPSG:4326', 'EPSG:3857');
        //地图定位到岗亭
        var listmap = trafficControlBoxManager.getTrafficMap();
        listmap.getView().animate({
            zoom: listmap.getView().getMaxZoom(),
            center: coordinates,
            duration: 200,
            easing: ol.easing.easeOut
        });
        //创建岗亭范围feature
        var trafficControlBoxRangeFeature = createTrafficControlBoxRangeFeature(coordinates, value.Radius);
        setTrafficControlBoxRangeStyle(trafficControlBoxRangeFeature);
        //添加岗亭要素及属性
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(coordinates),
            id: value.ID,
            name: value.Name,
            boxtype: value.BoxType,
            lo: coordArr[1],
            la: coordArr[2],
            radius: value.Radius,
            remark: value.Remark,
            picurl: 'lqnew/opePages/UpLoad/Uploads/Default_TrafficPic/Default_Traffic.png'
        });
        feature.setId(value.ID);
        return feature;
    }
    //创建岗亭范围feature
    var createTrafficControlBoxRangeFeature = function (coordinate, radius) {
        var feature = new ol.Feature({
            geometry: new ol.geom.Circle(coordinate, radius*1000)
        });
        circleLayer.getSource().addFeature(feature);
        return feature;
    }
    //岗亭范围样式
    var setTrafficControlBoxRangeStyle = function (trafficControlBoxRangeFeature) {
        trafficControlBoxRangeFeature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,0,0,1)',
                size: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0.2)'
            })
        }))
    }
    //根据id查找位置索引
    var findTrafficInArray = function (id) {
        for (var i = 0; i < currentTrafficAarry.length; i++) {
            if (currentTrafficAarry[i].ID == id) {
                return i;
            }
        }
    }

    //加载岗亭信息--（只加载一个岗亭）
    this.loadTrafficControlBoxs = function (trafficControlBoxId) {
        var updateFun = this.updateTrafficControlBox, addFun = this.addTrafficControlBox, removeFun = this.removeTrafficSation;
        try {

            jquerygetNewData_ajax("Handlers/GetAllTrafficControlBox.ashx", { "trafficControlBoxId": trafficControlBoxId }, function (request) {

                var trafficControlBoxArray = new Array();
                trafficControlBoxArray = eval(request);

                var indexs = Array(currentTrafficAarry.length + 1).join(0).split('').map(function (v, k) { return k++; });
                trafficControlBoxArray.forEach(function (val1) {
                    var isHaving = false;
                    for (var i = 0; i < currentTrafficAarry.length; i++) {
                        if (val1.ID == currentTrafficAarry[i].ID) {
                            isHaving = true;
                            if (val1.BoxType != currentTrafficAarry[i].BoxType || val1.Name != currentTrafficAarry[i].Name
                                || val1.Coordinates != currentTrafficAarry[i].Coordinates || val1.Radius != currentTrafficAarry[i].Radius) {
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
                    removeFun(currentTrafficAarry[i]);
                });
            });

        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js loadTrafficControlBoxs，error info:" + err);
        }
    }

    //添加单个岗亭要素
    this.addTrafficControlBox = function (val) {
        try {
            currentTrafficAarry.push(val);
            var trafficControlBoxFeature = createTrafficControlBoxFeature(val);
            trafficControlBoxSource.addFeature(trafficControlBoxFeature);
            var feature = trafficControlBoxSource.getFeatureById(val.ID);
            loadImages(setFeatureStyle, [feature]);

        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js addTrafficControlBox，error info:" + err);
        }
    }

    //更新单个岗亭要素
    this.updateTrafficControlBox = function (val) {
        try {
            if (!trafficControlBoxSource) {
                return;
            }
            var feature = trafficControlBoxSource.getFeatureById(val.ID);
            trafficControlBoxSource.removeFeature(feature);
            var index = findTrafficInArray(val.ID);
            currentTrafficAarry.splice(index, 1);
            currentTrafficAarry.push(val);
            var newfeature = createTrafficControlBoxFeature(val);
            trafficControlBoxSource.addFeature(newfeature);
            var feature = trafficControlBoxSource.getFeatureById(val.ID);
            loadImages(setFeatureStyle, [feature]);
        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js updateTrafficControlBox，error info:" + err);
        }
    }

    //移除单个岗亭要素
    this.removeTrafficSation = function (val) {
        try {
            if (!trafficControlBoxSource) {
                return;
            }
            var feature = trafficControlBoxSource.getFeatureById(val.ID);
            trafficControlBoxSource.removeFeature(feature);
            var index = findTrafficInArray(val.ID);
            currentTrafficAarry.splice(index, 1);
        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js removeTrafficSation，error info:" + err);
        }
    }

    //获取岗亭图层
    this.getLayer = function () {
        try {
            return trafficControlBoxLayer;
        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js getLayer，error info:" + err);
        }
    }

    //获取岗亭范围图层
    this.getCircleLayer = function () {
        try {
            return circleLayer;
        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js getCircleLayer，error info:" + err);
        }
    }

    //设置图层是否显示
    this.setVisible = function (visible) {
        try {
            trafficControlBoxLayer.setVisible(visible);
        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js setVisible，error info:" + err);
        }
    }

    //岗亭图层定位
    this.locateTrafficControlBox = function (coordinates) {
        try {
            var coord = ol.proj.transform([parseFloat(coordinates[0]), parseFloat(coordinates[1])], 'EPSG:4326', 'EPSG:3857');
            mapLocateEvent.locate(coord, 5000);
        } catch (err) {
            writeLog("system", "ol-trafficControlBoxLayer.js locateTrafficControlBox，error info:" + err);
        }
    }
}



