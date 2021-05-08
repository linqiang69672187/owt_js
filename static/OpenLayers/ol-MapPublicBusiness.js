/*!
*@file 地图公共方法 {MapMonitoringEvent:地图缩放监控,MapLocateEvent:地图定位方法, MapFeatureClickInteraction:地图点击交互}
*@author cxy
*@createDate 20180720 update-20180820
@params {ol.map} inputMap 地图对象 
*/

//地图缩放监控事件
function MapMonitoringEvent(inputMap){
    this.currentMap = inputMap;

    //设置图层图片缩放尺度
    this.setScaleChange = function (view, layerID, ids, layer, scaleRate) {
        if (ids.indexOf && typeof (ids.indexOf) == 'function') {
            if (ids.indexOf(layerID) >= 0) {
                var features = layer.getSource().getFeatures();
                for (var k = 0; k < features.length ; k++) {
                    var style = features[k].getStyle();
                    if (style) {
                        var img = style.getImage();
                        if (img) {
                            var typeflag = features[k].get('typeflag');
                            if (typeflag == 2) {
                                var imagesize = features[k].get('imageSize');
                                var p = features[k].get('person');
                                if (typeflag == 2) {//当为船舶时
                                    var length = p ? p.length : 0;
                                    var width = p ? p.width : 0;
                                    var l = length > width ? length : width;
                                    if (imagesize === undefined) {//当为场强电量时
                                        var imageStyle = features[k].getStyle().getImage();
                                        if (imageStyle) {
                                            if (imageStyle.iconImage_.size_) {
                                                imagesize = imageStyle.iconImage_.size_[1];
                                                l = features[k].get('length');
                                            }
                                        }
                                    }
                                    if (imagesize) {
                                        var scale = getScaleByResolution(view, imagesize, l);
                                        img.setScale(scale);
                                    }
                                }
                            } else {
                            if (!img.isFirstLoad) {
                                img.isFirstLoad = true;
                                img.firstScale = img.getScale() / scaleRate;
                            } else {
                                var scale = img.firstScale * scaleRate;
                                img.setScale(scale);
                            }
                        }
                    }
                        var text = style.getText();
                        if (text) {
                            var typeflag = features[k].get('typeflag');
                            var imagesize = features[k].get('imageSize');
                            var length = features[k].get('length');
                            var width = features[k].get('width');
                            if (typeflag && imagesize && length && width) {
                                if (typeflag == 2) {//当为船舶时
                                    var l = length > width ? length : width;
                                    var scale = getScaleByResolution(view, imagesize, l);
                            if (!text.isFirstLoad) {
                                text.isFirstLoad = true;
                                text.firstOffsetY = text.getOffsetY() / text.getScale();
                            } else {
                                text.setScale(scale);
                                        text.setOffsetY(text.firstOffsetY * scale);
                                    }
                                }
                            } else {
                                if (!text.isFirstLoad) {
                                    text.isFirstLoad = true;
                                    text.firstOffsetY = text.getOffsetY() / text.getScale();
                                } else {
                                    text.setScale(scaleRate);
                                text.setOffsetY(text.firstOffsetY * scaleRate);
                            }
                        }
                    }
                }
            }
        }
    }
}
}

//地图分辨率变化时进行监听
MapMonitoringEvent.prototype.MapResolutionChange = function (idArray) {
    try{
        var cMap = this.currentMap;
        var setScaleChange = this.setScaleChange;
        // 监听地图层级变化
        cMap.getView().on('change:resolution', function (event) {
            var layers = cMap.getLayers();
            var view = cMap.getView();
            var zoom = view.getZoom();
            if (zoom % 1 != 0) {
                event.preventDefault();
            }
            var scaleRate = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());
            this.firstInit = true;

            layers.forEach(function (value) {
                var layerID = value.get("ID");
                //设置图层的图片或文字大小随着地图变化而变化
                setScaleChange(cMap.getView(), layerID, idArray, value, scaleRate);
            })
            
            if (bsLayerManager) {
                bsLayerManager.setDistanceByZoom();
            }
            if (cameraLayerManager) {//xzj--2018/9/1
                cameraLayerManager.setDistanceByZoom();
            }
        })
    } catch (err) {
        writeLog("system", "ol-MapPublicBusiness.js MapMonitoringEvent.MapResolutionChange，error info:" + err);
    }
}

//地图定位公共方法
function MapLocateEvent(inputMap, option) {
    var currentMap = inputMap;
    this.animationLayer = null;
    var source;
    var locateTimer, locateTimeout;

    opt = option || {};
    var innerColor = opt.innerColor || "#FF5200";//内圈颜色
    var outerColor = opt.outerColor || "#FFA28B";//外圈颜色
    var divisionRadius = opt.divisionRadius || 30;//分割半径



    //添加定位信息
    function addLocation(coord) {

        var circle = new ol.Feature({
            geometry: new ol.geom.Point(coord)
        });
        circle.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 0,
                stroke: new ol.style.Stroke({
                    color: 'red',
                    size: 1
                })
            })
        }));
        source.addFeature(circle);

        var view = currentMap.getView();
        var scale = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());

        var flag = new ol.Feature({
            geometry: new ol.geom.Point(coord)
        });
        flag.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                src: '/images/layer/local_dw.png',
                anchor: [1.5, 0.5],
                scale: scale
            })
        }));
        source.addFeature(flag);
        return { circle: circle, flag: flag };
    }

    //定位时间初始化，创建定位动画图层
    MapLocateEvent.prototype.init = function () {
        try{
            var animationSource = new ol.source.Vector();
            source = animationSource;
            this.animationLayer = new ol.layer.Vector({
                source: animationSource,
                zIndex: 100,
                ID: 'animation'
            });
            currentMap.addLayer(this.animationLayer);
        } catch (err) {
            writeLog("system", "ol-MapPublicBusiness.js MapLocateEvent.init，error info:" + err);
        }
    }

    MapLocateEvent.prototype.locate = function (coordinates, interval) {
        try{
            this.removeLocation();
            var obj = addLocation(coordinates);
            var radius = 0;
            var cc = innerColor;
            locateTimer = setInterval(function () {
                radius++;
                radius = radius % 40;
                if (radius < divisionRadius)
                    cc = innerColor
                if (radius >= divisionRadius)
                    cc = outerColor;
                    var view = currentMap.getView();
                    var scale = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());
                // 设置样式
                obj.circle.setStyle(new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius * scale,
                        stroke: new ol.style.Stroke({
                            color: cc,
                            width: 8
                        })
                    })
                }));
            }, 15);


            currentMap.getView().animate({
                zoom: currentMap.getView().getMaxZoom(),
                center: coordinates,
                duration: 200,
                easing: ol.easing.easeOut
            });
            if (locateTimeout) {
                clearTimeout(locateTimeout);
            }
            locateTimeout = setTimeout(this.removeLocation, interval);
        } catch (err) {
            writeLog("system", "ol-MapPublicBusiness.js MapLocateEvent.locate，error info:" + err);
        }
    }
    
    //移除定位信息
    MapLocateEvent.prototype.removeLocation = function () {
        try{
            if (locateTimer) {
                clearInterval(locateTimer);
                locateTimer = null;
            }
            source.clear();
        } catch (err) {
            writeLog("system", "ol-MapPublicBusiness.js MapLocateEvent.removeLocation，error info:" + err);
        }
    }
}

//cxy-20180907-地图点击交互事件
var MapFeatureClickInteraction = {
    //图层ID
    _LayerIds: {
        baseStation: "baseStation",
        cameraLayer: "cameraLayer",
        userlayer: "user"
    },
    //获取最大距离
    _getMaxDistance: function (array1, array2) {
        var farthestDistance = 0;
        array1.forEach(function (value1) {
            array2.forEach(function (value2) {
                var d = Math.sqrt(Math.pow(value1[0] - value2[0], 2)
                + Math.pow(value1[1] - value2[1], 2));
                if (d > farthestDistance) {
                    farthestDistance = d;
                }
            })
        });
        return farthestDistance;
    },
    //打开聚合状态
    _openCluster: function (currentMap, originalFeatures, distance, getMaxDistance) {
        var coordinates = new Array();
        originalFeatures.forEach(function (value) {
            var geo = value.getGeometry();
            if (geo) {
                coordinates.push(geo.getCoordinates());
            }
        });
        var currentView = currentMap.getView();
        var currentExtent = ol.extent.boundingExtent(coordinates);
        var currentCenter = ol.extent.getCenter(currentExtent);

        var currentZoom = currentView.getZoom() + 1;
        if (coordinates.length < 50) {//聚合数少于一定数值时，需要确定zoom一个等级是否能够打开聚合
            //查找最大间距
            var farthestDistance = getMaxDistance(coordinates, coordinates);
            var maxZoom = currentView.getMaxZoom();//cxy-20180802-控制最大等级
            var resolution = currentView.getResolutionForZoom(currentZoom);
            //判断移动一层是否能够展开最大间距的点，否在再进行判断，知道能够展开为止
            while (farthestDistance < distance * resolution && currentZoom <= maxZoom) {//cxy-20180802-控制最大等级
                currentZoom = currentZoom + 1;
                resolution = currentView.getResolutionForZoom(currentZoom);
            }
        }

        currentView.animate({
            zoom: currentZoom,
            center: currentCenter,
            duration: 0,
            easing: ol.easing.easeOut
        });
    },
    //初始化地图点击交互事件
    init: function (currentMap) {
        try {
            var bslayer = bsLayerManager ? bsLayerManager.getLayer() : null;
            var cameralayer = cameraLayerManager ? cameraLayerManager.getLayer() : null;
            var layers = [bslayer, cameralayer, userLayer];
            //鼠标点击选择交互
            var clickInteraction = new ol.interaction.Select({
                condition: ol.events.condition.click,
                layers: layers
            });
            var layerids = this._LayerIds;
            var openCluster = this._openCluster, getMaxDistance = this._getMaxDistance;
            clickInteraction.on('select', function (event) {
                if (event.selected.length > 0) {
                    var selectedFeature = event.selected[0];
                    var layer = this.getLayer(selectedFeature);
                    var layerId = layer ? layer.get("ID") : "";
                    switch (layerId) {
                        case layerids.baseStation://基站图层
                            var originalFeatures = selectedFeature.get('features');
                            if (originalFeatures.length == 1) {//单个信息
                                var bsid = originalFeatures[0].get('bsissi');
                                var switchID = originalFeatures[0].get('switchID');//xzj--20181217--添加交换ID
                                bsLayerManager.openBaseStationById(switchID, bsid);//xzj--20181217--添加交换ID
                                bsLayerManager.removeBaseSationTooltip();
                            } else {
                                var distance = bsLayerManager.getDistance();
                                openCluster(currentMap, originalFeatures, distance, getMaxDistance);
                                bsLayerManager.removeMoveSelectedFeatures();
                            }
                            break;
                        case layerids.cameraLayer://摄像头图层
                            var originalFeatures = selectedFeature.get('features');
                            if (originalFeatures.length == 1) {//单个信息
                                cameraLayerManager.openCamera(originalFeatures);
                                cameraLayerManager.removeCameraTooltip();
                            } else {
                                var distance = bsLayerManager.getDistance();
                                openCluster(currentMap, originalFeatures, distance, getMaxDistance);
                                cameraLayerManager.removeMoveSelectedFeatures();
                            }
                            break;
                        case layerids.userlayer://警员图层
                            if (typeof (selectedFeature.values_.layer) != "undefined") {
                                if (!window.useprameters.multiSel) {
                                    removeSelectUsersFlag(event.selected[0].values_.person.userId);
                                    useprameters.Selectid = [];
                                    useprameters.SelectISSI = [];
                                }

                                var police = event.selected[0].values_.person;
                                var lon = police.lon;
                                var lat = police.lat;
                                var coordinate = ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857');
                                useprameters.Selectid.push(police.userId);
                                useprameters.SelectISSI.push(police.issi);
                                if ($("#CallNamber")) { $("#CallNamber").val(police.issi); $("#Calling").css("background-image", "url(Images/callbackground.png)"); $("#TeamCall").css("background-image", "url(Images/groupcall_disabled.png)");; }
                                addSelctUsersFlag(police.userId);
                            }
                            break;
                    }
                    //清除点击选择的图层
                    clickInteraction.getFeatures().clear();
                }
            });
            
            currentMap.addInteraction(clickInteraction);
        } catch (err) {
            writeLog("system", "ol-MapPublicBusiness.js MapFeatureClickInteraction.init，error info:" + err);
        }
    }
}


//获取当前的缩放比例
var getScaleByResolution = function (view, pixel, length) {
    var resolution = view.getResolution();
    var currentLength = pixel * resolution;
    var scale = length / currentLength;
    return scale;
}