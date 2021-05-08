function TrafficPoliceLayer(thismap, option) {
    var opt = option || {};
    var isVisible = opt.isVisible == null ? true : opt.isVisible;

    var currentMap = thismap;
    var view = currentMap.getView();
    var tooltipElement, tooltip;
    var currentTrafficAarry = new Array();
    //交通人员图层
    var trafficPoliceSource = new ol.source.Vector();//人员图层数据源
    var trafficPoliceLayer = new ol.layer.Vector({//人员图层
        source: trafficPoliceSource,
        style: null
    });
    trafficPoliceLayer.setProperties({ 'ID': 'trafficPolice' });//设置人员图层id
    trafficPoliceLayer.setVisible(isVisible);//初始化图层是否可见

    currentMap.addLayer(trafficPoliceLayer);//添加人员图层

    //鼠标在人员图层上的交互
    var trafficPoliceMoveInteraction = new ol.interaction.Select({
        condition: ol.events.condition.pointerMove,
        layers: [trafficPoliceLayer]
    });
    trafficPoliceMoveInteraction.on("select", function (event) {
        if (event.selected.length > 0) {
            currentMap.getTargetElement().style.cursor = 'pointer';
            var feature = event.selected[0];
            createTrafficPoliceTooltip();
            var nam = feature.get('nam');
            var issi = feature.get('issi')
            tooltipElement.innerHTML = '<big>' + nam + "(" + issi + ")" + '</big>';
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

    currentMap.addInteraction(trafficPoliceMoveInteraction);


    //根据图片大小按比例加载图片，地图上大小为32px.
    var loadImages = function (setFeatureStyle, trafficPoliceFeatureArray) {
        trafficPoliceFeatureArray.forEach(function (value) {
            var imageSrc = value.get('picurl');
            var imgobj = new Image();
            defaultWidth = 64;
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
    var setFeatureStyle = function (trafficPoliceFeature, scale, imageSrc) {
        var defaultIcon = new ol.style.Icon({
            src: imageSrc,
            scale: scale,
        });

        trafficPoliceFeature.setStyle(new ol.style.Style({
            image: defaultIcon
        }))
    }
    //创建tooltip
    var createTrafficPoliceTooltip = function () {
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

    //创建人员图层要素
    var createTrafficPoliceFeature = function (value) {
        var coordinates = ol.proj.transform([parseFloat(value.Longitude), parseFloat(value.Latitude)], 'EPSG:4326', 'EPSG:3857');
        //添加人员要素及属性
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(coordinates),
            id: value.id,
            nam: value.Nam,
            num: value.Num,
            issi: value.ISSI,
            name: value.Name,
            type: value.type,
            telephone: value.Telephone,
            longitude: value.Longitude,
            latitude: value.Latitude,
            msRssi: value.MsRssi,
            ulRssi: value.UlRssi,
            battery: value.Battery,
            picurl: 'lqnew/opePages/UpLoad/Uploads/Default_TrafficPolicePic/Default_TrafficPolice.png'
        });
        feature.setId(value.id);//测试 人员id没有值，使用issi
        return feature;
    }
    //根据id查找位置索引
    var findTrafficInArray = function (id) {
        for (var i = 0; i < currentTrafficAarry.length; i++) {
            if (currentTrafficAarry[i].ID == id) {
                return i;
            }
        }
    }

    //加载人员信息--（只加载岗亭范围人员）
    this.loadTrafficPolices = function (ISSIAndName) {
        var updateFun = this.updateTrafficPolice, addFun = this.addTrafficPolice, removeFun = this.removeTrafficSation;
        try {

            jquerygetNewData_ajax_post("Handlers/GetAllTrafficPolice.ashx", { "ISSIAndName": ISSIAndName }, function (request) {

                var trafficPoliceArray = new Array();
                trafficPoliceArray = eval(request);

                var indexs = Array(currentTrafficAarry.length + 1).join(0).split('').map(function (v, k) { return k++; });
                trafficPoliceArray.forEach(function (val1) {
                    var isHaving = false;
                    for (var i = 0; i < currentTrafficAarry.length; i++) {
                        if (val1.id == currentTrafficAarry[i].id) {//暂时修改为issi,id没有值无法测试
                            isHaving = true;
                            if (val1.Nam != currentTrafficAarry[i].Nam || val1.Num != currentTrafficAarry[i].Num
                                || val1.ISSI != currentTrafficAarry[i].ISSI || val1.Name != currentTrafficAarry[i].Name
                                || val1.type != currentTrafficAarry[i].type || val1.Telephone != currentTrafficAarry[i].Telephone
                                || val1.Longitude != currentTrafficAarry[i].Longitude || val1.Latitude != currentTrafficAarry[i].Latitude
                                || val1.MsRssi != currentTrafficAarry[i].MsRssi || val1.UlRssi != currentTrafficAarry[i].UlRssi
                                || val1.Battery != currentTrafficAarry[i].Battery) {
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
            writeLog("system", "ol-trafficPoliceLayer.js loadTrafficPolices，error info:" + err);
        }
    }

    //添加单个人员要素
    this.addTrafficPolice = function (val) {
        try {
            currentTrafficAarry.push(val);
            var trafficPoliceFeature = createTrafficPoliceFeature(val);
            trafficPoliceSource.addFeature(trafficPoliceFeature);
            var feature = trafficPoliceSource.getFeatureById(val.id);
            loadImages(setFeatureStyle, [feature]);

        } catch (err) {
            writeLog("system", "ol-trafficPoliceLayer.js addTrafficPolice，error info:" + err);
        }
    }

    //更新单个人员要素
    this.updateTrafficPolice = function (val) {
        try {
            if (!trafficPoliceSource) {
                return;
            }
            var feature = trafficPoliceSource.getFeatureById(val.id);
            trafficPoliceSource.removeFeature(feature);
            var index = findTrafficInArray(val.ID);
            currentTrafficAarry.splice(index, 1);
            currentTrafficAarry.push(val);
            var newfeature = createTrafficPoliceFeature(val);
            trafficPoliceSource.addFeature(newfeature);
            var feature = trafficPoliceSource.getFeatureById(val.id);
            loadImages(setFeatureStyle, [feature]);
        } catch (err) {
            writeLog("system", "ol-trafficPoliceLayer.js updateTrafficPolice，error info:" + err);
        }
    }

    //移除单个人员要素
    this.removeTrafficSation = function (val) {
        try {
            if (!trafficPoliceSource) {
                return;
            }
            var feature = trafficPoliceSource.getFeatureById(val.id);
            trafficPoliceSource.removeFeature(feature);
            var index = findTrafficInArray(val.ID);
            currentTrafficAarry.splice(index, 1);
        } catch (err) {
            writeLog("system", "ol-trafficPoliceLayer.js removeTrafficSation，error info:" + err);
        }
    }

    //获取人员图层
    this.getLayer = function () {
        try {
            return trafficPoliceLayer;
        } catch (err) {
            writeLog("system", "ol-trafficPoliceLayer.js getLayer，error info:" + err);
        }
    }

    //设置图层是否显示
    this.setVisible = function (visible) {
        try {
            trafficPoliceLayer.setVisible(visible);
        } catch (err) {
            writeLog("system", "ol-trafficPoliceLayer.js setVisible，error info:" + err);
        }
    }

    //人员图层定位
    this.locateTrafficPolice = function (coordinates) {
        try {
            var coord = ol.proj.transform([parseFloat(coordinates[0]), parseFloat(coordinates[1])], 'EPSG:4326', 'EPSG:3857');
            mapLocateEvent.locate(coord, 5000);
        } catch (err) {
            writeLog("system", "ol-trafficPoliceLayer.js locateTrafficPolice，error info:" + err);
        }
    }
}



