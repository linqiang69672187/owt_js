/**
 *@file 航海线路
 *@author cxy
 *@createDate 2019/03/21
 *@params {ol.Map} map
 *@option params 
 */

var NavigationLines = function (map, option) {

    var opt = option || {};
    var pointColor = opt.lineBackgroundColor || 'rgb(231,0,17)';//点的颜色
    var lineWidth = opt.lineWidth || 1;//线宽
    var circleRadius = opt.circleRadius || 2;//点的半径
    var lineColor = opt.lineColor || 'rgb(34,69,112)';//线的颜色
    var lineBackgroundColor = opt.lineBackgroundColor || 'rgb(158,158,158)';//线的背景色
    var highlightColor = opt.highlightColor || 'rgb(255,205,66)';//高亮颜色
    var arrowSize = opt.arrowSize || [8,4];//箭头大小
    var isDashed = opt.isDashed || true;//线的类别

    var source = new ol.source.Vector();//航线数据源
    var sourceTemp = new ol.source.Vector();//临时航线数据源
    var navigationLayer = new ol.layer.Vector({//航线图层
        source: source,
        style: _layerStyle
    });
    var tempLayer = new ol.layer.Vector({//临时航线图层
        source: sourceTemp,
        style: _tempLayerStyle
    });
    map.addLayer(navigationLayer);
    map.addLayer(tempLayer);
    var tooltipElement, tooltip;
    _addNavigationLinesInteraction();

    var image = _drawCanvas(arrowSize[0], arrowSize[1], lineColor);



    /********************************
    *************公共函数************
    ********************************/

    //从数据库查询，显示所有航线
    this.addAllLine = function () {
        try {
            jquerygetNewData_ajax("Handlers/GetNavigationLine.ashx", "", function (request) {//xzj--20190919--getNewData_ajaxStock改为jquerygetNewData_ajax，否则同时请求只能有一个返回
                if (request) {
                    source.clear();//清空原有图形
                    var navigationLine = request.NavigationLine;
                    navigationLine.forEach(function (n) {
                        var cJson = JSON.parse(n.Coordinates);
                        var id = n.ID;
                        _addLine(id, cJson, n);
                    })
                }
            });
        } catch (err) {
            writeLog("system", "ol-PickLine.js pick，error info:" + err);
        }
    }

    //设置临时图层的一个点并画线
    this.addPoint = function (id, coordinate) {
        if ((coordinate[0] > -180 && coordinate[0] < 180) || (-90 < coordinate[1] && coordinate[1] < 90)) {
            coordinate = ol.proj.transform([parseFloat(coordinate[0]), parseFloat(coordinate[1])], 'EPSG:4326', 'EPSG:3857');
        }

        var features = sourceTemp.getFeatures();
        if (features.length == 0) {//加第一个点时
            var pointFeature = new ol.Feature({
                geometry: new ol.geom.Point(coordinate)
            });
            pointFeature.setId('point');
            sourceTemp.addFeature(pointFeature);
        } else {
            if (sourceTemp.getFeatureById('point')) {
                var preCoordinate = features[0].getGeometry().flatCoordinates;
                var lineFeature = new ol.Feature({
                    geometry: new ol.geom.LineString([preCoordinate, coordinate])
                });
                sourceTemp.clear();
                sourceTemp.addFeature(lineFeature);
            } else {
                features[0].getGeometry().appendCoordinate(coordinate);
            }
        }
    }

    //删除临时图层一个点
    this.removePoint = function (coordinate) {
        if (sourceTemp.getFeatureById('point')) {//当只有一个点时
            sourceTemp.clear();
        } else {
            var features = sourceTemp.getFeatures();
            var line = features[0].getGeometry();
            var lineCoordinates = line.getCoordinates();
            if (lineCoordinates.length == 2) {//当为两个点组成直线时，移除线，添加点
                var i = _findCoordiante(lineCoordinates, coordinate);
                i = i == 0 ? 1 : 0;
                var pointFeature = new ol.Feature({
                    geometry: new ol.geom.Point(lineCoordinates[i])
                });
                pointFeature.setId('point');
                sourceTemp.clear();
                sourceTemp.addFeature(pointFeature);
            } else {
                var i = _findCoordiante(lineCoordinates, coordinate);
                line.flatCoordinates.splice(i * 2, 2);
                line.changed();
            }
        }
    }

    //添加临时航线
    this.addTempLine = function (coordinates) {
        var cs = new Array();
        coordinates.forEach(function (c, i) {
            if ((c[0] > -180 && c[0] < 180) || (-90 < c[1] && c[1] < 90)) {
                cs[i] = ol.proj.transform([parseFloat(c[0]), parseFloat(c[1])], 'EPSG:4326', 'EPSG:3857');
            }
        })
        var lineFeature = new ol.Feature({
            geometry: new ol.geom.LineString(cs)
        })
        sourceTemp.addFeature(lineFeature);
    }

    this.clear = function () {
        sourceTemp.clear();
    }

    //设置隐藏一条航线
    this.hiddenLine = function (id) {
        var feature = source.getFeatureById(id);
        if (feature) {
            feature.set("visible", false);
        }
    }

    //设置显示一条航线
    this.showLine = function (id) {
        var feature = source.getFeatureById(id);
        if (feature) {
            feature.set("visible", true);
        }
    }

    /********************************
    *************私有函数************
    ********************************/

    //图层样式
    function _layerStyle(feature) {
        var visible = feature.get('visible');
        var styles;
        if (visible == false) {//当要素不显示时，返回样式为null
            styles = null;
        } else {
            var geometry = feature.getGeometry();
            var Direction = feature.get('Direction');
            styles = [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: lineBackgroundColor,
                        width: lineWidth * 2
                    }),
                    zIndex: 1
                })
            ];

            geometry.forEachSegment(function (start, end) {

                var dx = end[0] - start[0];
                var dy = end[1] - start[1];
                var d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                var _kx = dx < 0 ? -1 : 1;
                var _ky = dy < 0 ? -1 : 1;
                var rotation;
                if (Direction == "0")//正方向

                {

                    rotation = Math.atan2(dy, dx);//这里改变角度
                }
                else {

                   rotation = Math.atan2(-dy, -dx);
                }
                var resolution = map.getView().getResolution();
                var arrowLength = arrowSize[0] * resolution;
                var circleLength = circleRadius * resolution;

                //根据分辨率对线进行裁剪
                var newEndX = end[0] - _kx * (Math.abs(dx / d)) * (circleLength + arrowLength / 2);
                var newEndY = end[1] - _ky * (Math.abs(dy / d)) * (circleLength + arrowLength / 2);

                var newStartX = start[0] + _kx * (Math.abs(dx / d)) * circleLength * 1.5;
                var newStartY = start[1] + _ky * (Math.abs(dy / d)) * circleLength * 1.5;

                var dx_ = newEndX - newStartX - _kx * circleLength;
                var dy_ = newEndY - newStartY - _ky * circleLength;
                if ((dx / Math.abs(dx) != dx_ / Math.abs(dx_)) || (dy_ / Math.abs(dy_) != dy_ / Math.abs(dy_))) {//当距离小于一个点的半径时，直接用连接线
                    //连接线
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.LineString([start, end]),
                        stroke: new ol.style.Stroke({
                            color: lineColor,
                            width: lineWidth
                        }),
                        zIndex: 2
                    }));
                } else {
                    // 箭头
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.Point([newEndX, newEndY]),
                        image: new ol.style.Icon({
                            img: image,
                            imgSize: arrowSize,
                            anchor: [0.5, 0.5],
                            rotateWithView: true,
                            rotation: -rotation + Math.PI /2
                        }),
                        zIndex: 2
                    }));

                    //短线段
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.LineString([[newStartX, newStartY], [newEndX, newEndY]]),
                        stroke: new ol.style.Stroke({
                            color: lineColor,
                            width: lineWidth,
                            lineDash: isDashed ? [10, 10] : undefined
                        }),
                        zIndex: 2
                    }));
                }


            });
            //点样式
            geometry.getCoordinates().forEach(function (c) {
                styles.push(new ol.style.Style({
                    geometry: new ol.geom.Point(c),
                    image: new ol.style.Circle({
                        radius: circleRadius,
                        fill: new ol.style.Fill({
                            color: pointColor
                        })
                    }),
                    zIndex: 4
                }));
            })
        }
        return styles;

    }

    //临时图层的样式
    function _tempLayerStyle() {
        return [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: lineBackgroundColor,
                    width: lineWidth * 2
                })
            }),
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: lineColor,
                    width: lineWidth
                })
            }),
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: circleRadius,
                    fill: new ol.style.Fill({
                        color: pointColor
                    }),
                    stroke: new ol.style.Stroke({
                        color: pointColor,
                        width: 1
                    })
                })
            })
        ];
    }

    //添加一条航线
    function _addLine(id, coordinates, option) {
        var opt = option || {};
        var name = opt.Name || "";
        var fleetName = opt.EntityName || "";
        var navigationName = opt.Name || "";
        var Direction = opt.Direction|| "";


        coordinates.forEach(function (c,i) {
            if ((c[0] > -180 && c[0] < 180) || (-90 < c[1] && c[1] < 90)) {
                coordinates[i] = ol.proj.transform([parseFloat(c[0]), parseFloat(c[1])], 'EPSG:4326', 'EPSG:3857');
            }
        });
        var line = new ol.geom.LineString(coordinates);
        var lineFeature = new ol.Feature({
            geometry: line,
            fleetName: fleetName,
            navigationName: navigationName,
            Direction: Direction
        });


        lineFeature.setId(id);

        source.addFeature(lineFeature);
    }

    //查找点并返回坐标索引
    function _findCoordiante(coordinates, coordinate) {
        if ((coordinate[0] > -180 && coordinate[0] < 180) || (-90 < coordinate[1] && coordinate[1] < 90)) {
            coordinate = ol.proj.transform([parseFloat(coordinate[0]), parseFloat(coordinate[1])], 'EPSG:4326', 'EPSG:3857');
        }
        var index = -1;
        coordinates.forEach(function (c,i) {
            if (c[0] == coordinate[0] && c[1] == coordinate[1]) {
                index = i;
            }
        });
        return index;
    }

    //画箭头
    function _drawCanvas(width, height, color) {
        var canvas = document.createElement('canvas');
        canvas.height = height;
        canvas.width = width;
        var context = canvas.getContext('2d');
        context.beginPath();
        context.moveTo(width / 2.0, 0);
        context.lineTo(0, height);
        context.lineTo(width, height);
        context.lineTo(width / 2.0, 0);
        context.fillStyle = color;
        context.fill();
        context.save();
        return canvas;
    }

    //添加鼠标地图移动的航线交互
    function _addNavigationLinesInteraction() {
        //鼠标移动选择交互
        var navigationLinesInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            layers: [navigationLayer],
            style: _selectStyleFunction
        });

        navigationLinesInteraction.on('select', function (event) {
            if (event.selected.length > 0) {
                var originalFeature = event.selected[0];
                if (tooltipElement) {
                    tooltipElement.parentNode.removeChild(tooltipElement);
                }
                tooltipElement = document.createElement('div');//创建tooltip实体
                tooltipElement.style.cssText = "position: relative;background: #F7F5B9;border-radius: 4px;padding: 4px 8px;";
                tooltipElement.style.cssText += "white-space: nowrap;font-size:10px;box-shadow: 0px 2px 1px #888888;";//设置样式
                tooltipElement.className = 'hidden';//设置隐藏
                tooltip = new ol.Overlay({
                    element: tooltipElement,
                    offset: [15, 0]
                });
                map.addOverlay(tooltip);
                var navigationName = originalFeature.get('navigationName');
                var fleetName = originalFeature.get('fleetName');
                tooltipElement.innerHTML = '<big>' + GetTextByName('Lang_NavigationName') + ':' + navigationName + '</big>' + '<br><big>'
                    + GetTextByName('Lang_FleetName') + ':' + fleetName + '</big>';
                tooltip.setPosition(event.mapBrowserEvent.coordinate);
                tooltipElement.classList.remove('hidden');//显示

            } else {//移除Tooltip
                if (tooltipElement) {
                    tooltipElement.parentNode.removeChild(tooltipElement);
                }
                tooltipElement = null;
            }

        });
        map.addInteraction(navigationLinesInteraction);
    }

    //移动选择样式
    function _selectStyleFunction(feature) {
        var styles = _layerStyle(feature);
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: highlightColor,
                width: lineWidth * 3
            }),
            zIndex: 3
        }));
        return styles;
    }
}