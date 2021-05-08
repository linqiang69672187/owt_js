/*!
*@file 创建摄像头地图显示图层
*@author xzj
*@createDate 20180822
@params {ol.map} thismap 地图对象 
@option params {number} [distance] 聚合距离,{number} [radius] 圆形半径,{boolean} [isCluster] 是否聚合
*/

var CreateCameraLayer = function (thismap, option) {
    var cameraLayer = null;
    var currentMap = thismap;
    var cameraSource, clusterSource;
    var cameraMoveInteraction;
    var currentCameraAarry = new Array();
    var tooltipElement, tooltip;

    var opt = option || {};
    var distance = opt.distance || 100;
    var radius = opt.radius || 20;
    distance = !opt.isCluster ? 0 : distance;
    var isVisible = opt.isVisible == null ? true : opt.isVisible;

    var cameraIcon1 = new ol.style.Icon({
        src: 'Images/qiuji.png'
    });
    var cameraIcon2 = new ol.style.Icon({
        src: 'Images/qianji.png'
    });

    var cameraIconArray = new Array(cameraIcon1, cameraIcon2);

    //默认样式
    function styleFunction(feature) {
        return createClusterStyle('#00CACA', feature);
    }
    //鼠标选中样式
    function selectStyleFunction(feature) {
        return createClusterStyle('#FA9B74', feature);
    }
    //摄像头聚合样式
    function createClusterStyle(fillColor, feature) {
        var size = feature.get('features').length;
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
            style = createCameraStyle(originalFeature, currentMap.getView().getZoom());
        }
        
        return style;
    }

    //摄像头样式
    function createCameraStyle(feature, zoomLevel) {
        var cameraName = feature.get('cameraName');
        var cameraTypeName = feature.get("cameraTypeName");
        var cameraIcon;
        //if (cameraTypeName == GetTextByName('qiangji')) {
        //    cameraIcon = cameraIconArray[0];
        //} else {
        //    cameraIcon = cameraIconArray[1];
        //}
        var imageSrc = 'Images/qiuji.png';
        if (cameraTypeName.indexOf(GetTextByName('qiangji'))!=-1) {
            imageSrc = 'Images/qianji.png';
        }
        var textStyle = null;
        if (zoomLevel > 6) {
            textStyle = new ol.style.Text({
                text: name,
                offsetX: 0,
                offsetY: -30,
                font: '15px 宋体',
                fill: new ol.style.Fill({
                    color: '#ff0000'
                })
            })
        }

        return new ol.style.Style({
            image: new ol.style.Icon({
                src: imageSrc
            }),
            text: textStyle
        });
    }
    //打开摄像头下终端列表
    this.openCamera=function(feature) {
        VideoCallFuction("", "", feature[0].get('encoderDeviceNum'), feature[0].get('cameraName'), "400", "300", "false", "99", "false", "PlayWindow/play.html?deviceName=" +
            feature[0].get('cameraName') + "&deviceNum=" + feature[0].get('encoderDeviceNum') + "&realm=" + feature[0].get('realm') + "&cameraNum=" + feature[0].get('cameraDeviceNum') + "&latitude=" +
            feature[0].get('latitude') + "&longitude=" + feature[0].get('longitude') + "&cameraIP=null")
    }
    //创建摄像头tooltip
    function createCameraTooltip() {
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
    //移除摄像头tooltip
    this.removeCameraTooltip = function() {
        currentMap.getTargetElement().style.cursor = '';
        if (tooltipElement) {
            tooltipElement.parentNode.removeChild(tooltipElement);
        }
        tooltipElement = null;
    }
    //添加摄像头要素及属性
    function createCameraFeature(cameraInfo) {
        var lon = cameraInfo.longitude;
        var lat = cameraInfo.latitude;
        if (lon != "" && lat != "" && cameraInfo.cameraDeviceNum!="") {//经纬度或编号为空则返回null
            if (lat < 90 && lat > -90) {//判断精度不在-90~90范围内则返回null
                var coordinates = ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857');
                var feature = new ol.Feature({
                    geometry: new ol.geom.Point(coordinates),
                    cameraID: cameraInfo.cameraID,
                    cameraName: cameraInfo.cameraName,
                    longitude: lon,
                    latitude: lat,
                    cameraDeviceNum: cameraInfo.cameraDeviceNum,
                    cameraTypeName: cameraInfo.cameraTypeName,
                    encoderDeviceNum: cameraInfo.encoderDeviceNum,
                    isControllablePTZ: cameraInfo.isControllablePTZ,
                    realm: cameraInfo.realm,
                    status: cameraInfo.status,
                    storeDeviceNum: cameraInfo.storeDeviceNum,
                    storeRealm: cameraInfo.storeRealm
                });
                feature.setId(cameraInfo.encoderDeviceNum);
                return feature;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }

    function findCameraInArray(id) {
        for (var i = 0; i < currentCameraAarry.length; i++) {
            if (currentCameraAarry[i].ID == id) {
                return i;
            }
        }
    }
    //查找最大距离
    function getMaxDistance(array1, array2) {
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
    }

    this.LoadCameras = function () {
        var openCamera = this.openCamera;
        var removeCameraTooltip = this.removeCameraTooltip;
        try {
                    if (arrAllCameraJson.result == "SUCCESS") {
                    var allCameraArray = arrAllCameraJson.data;
                        var cameraFeatureArray = new Array();
                        allCameraArray.forEach(function (value) {
                            var cameraFeature = createCameraFeature(value);
                            if (cameraFeature != null) {
                                cameraFeatureArray.push(cameraFeature);
                            }
                        });

                        cameraSource = new ol.source.Vector({
                            features: cameraFeatureArray
                        });

                        clusterSource = new ol.source.Cluster({
                            distance: distance,
                            source: cameraSource
                        });

                        cameraLayer = new ol.layer.Vector({
                            source: clusterSource,
                            style: styleFunction
                        });
                        cameraLayer.setProperties({ 'ID': 'cameraLayer' });

                        //鼠标移动选择交互
                        cameraMoveInteraction = new ol.interaction.Select({
                            condition: ol.events.condition.pointerMove,
                            layers: [cameraLayer],
                            style: selectStyleFunction
                        });
                        cameraMoveInteraction.on('select', function (event) {
                            if (event.selected.length > 0) {
                                currentMap.getTargetElement().style.cursor = 'pointer';
                                var originalFeatures = event.selected[0].get('features');
                                if (originalFeatures.length == 1) {//当只有一个摄像头时显示摄像头信息
                                    createCameraTooltip();
                                    var name = originalFeatures[0].get('cameraName');
                                    var lat = originalFeatures[0].get('latitude');
                                    var lon = originalFeatures[0].get('longitude');
                                    tooltipElement.innerHTML = '<big>' + GetTextByName('Lang_videoinfoName') + ": " + name + '</big>' + '<br>'
                                    + GetTextByName('Lang_videoLo') + ": " + lon + '<br>' + GetTextByName('Lang_videoLa') + ": " + lat;
                                    tooltip.setPosition(event.mapBrowserEvent.coordinate);
                                    tooltipElement.classList.remove('hidden');
                                }

                            } else {
                                removeCameraTooltip();
                            }

                        });

                        cameraLayer.setVisible(isVisible);
                        currentMap.addLayer(cameraLayer);
                        currentMap.addInteraction(cameraMoveInteraction);
                        currentMap.addInteraction(cameraClickInteraction);
                        currentCameraAarry = allCameraArray;
                    }
                    else {
                        alert(arrAllCameraJson.message);
                    }
        } catch (err) {
            writeLog("system", "ol-CameraLayer.js LoadCameras，error info:" + err);
        }
    }

    this.getLayer = function () {
        return cameraLayer;
    }

    this.setVisible = function (visible) {
        cameraLayer.setVisible(visible);
    }
    this.getVisible = function () {
        return cameraLayer.getVisible();
    }
    this.RefreshCameraLayer = function (d, isCluster) {
        var istrue = eval(isCluster.toLowerCase());
        var ds = d;
        if (!istrue) {
            ds = 0;
            useprameters.IsCameraLayerCluster = "False";
        } else {
            useprameters.IsCameraLayerCluster = "True";
        }
        clusterSource.setDistance(ds);
        currentMap.render();
    }

    this.LocateCamera = function (coordinates) {
        var coord = ol.proj.transform([parseFloat(coordinates[0]), parseFloat(coordinates[1])], 'EPSG:4326', 'EPSG:3857');
        mapLocateEvent.locate(coord, 5000);
    }

    this.removeMoveSelectedFeatures = function () {
        cameraMoveInteraction.getFeatures().clear();
    }

    //当图层为最大zoom时，摄像头可能还处于聚合状态，所以实时设置聚合距离，当图层缩放到最大，设置聚合距离为0，表示不聚合
    this.setDistanceByZoom = function () {
        if (!clusterSource) {
            return;
        }
        var currentZoom = currentMap.getView().getZoom();
        var maxZoom = currentMap.getView().getMaxZoom();
        var setDistance = useprameters.CameraClusterDistance;
        var iscluster = eval(useprameters.IsCameraLayerCluster.toLowerCase());
        if (!iscluster) {
            setDistance = 0;
        }
        if (currentZoom >= maxZoom) {
            if (clusterSource.getDistance() != 0) {
                setDistance = 0;
                clusterSource.setDistance(setDistance);
            }
        } else {
            if (clusterSource.getDistance() == 0 && setDistance != 0) {
                clusterSource.setDistance(setDistance);
            }
        }
    }
}