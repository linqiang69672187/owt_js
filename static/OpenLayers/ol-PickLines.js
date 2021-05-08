/**
 *@file 船舶拾取线，包括子船到母船的距离和方位角
 *@author cxy
 *@createDate 2019/03/19
 *@params {ol.Map} map
 *@option params {ol.Color} innerColor 内部线体颜色, {ol.Color} outerColor 外部线体颜色, {ol.Color} tootipColor 提示填充颜色
 */

var PickLines = function (map, option) {
    this.pickedArray = [];

    //zhangq-20190808
    this.pickedArrayIdList = [];
    this.pickedArrayLonLatList = [];

    var userLayer = map.getLayerById("user");

    var opt = option || {};
    var innerColor = opt.innercolor || 'rgb(0,0,0)';
    var outerColor = opt.outercolor || 'rgb(255,255,255)';
    var tootipColor = opt.tootipcolor || 'rgb(246,227,163)';

    var source = new ol.source.Vector();//拾取线数据源
    var lineLayer = new ol.layer.Vector({
        source: source,
        style: layerStyle
    });
    lineLayer.setZIndex(100)
    map.addLayer(lineLayer);

    //拾取
    this.pick = function (id) {
        var pickedArr = this.pickedArray;
        //zhangq-20190808
        var pickedArrIdList = this.pickedArrayIdList;
        var params = {
            id: id
        }
        try {
            getNewData_ajaxStock("Handlers/GetMotherShipID.ashx", params, function (request) {
                if (request) {
                    if (request.ids.length <= 0) {
                        return;
                    }
                    var motherID = request.ids[0].id;
                    var sonShipFeature = userLayer.getSource().getFeatureById('p' + id);
                    var motherShipFeature = userLayer.getSource().getFeatureById('p' + motherID);

                    var sonCoordinate = sonShipFeature.getGeometry().flatCoordinates;
                    var motherCoordinate = motherShipFeature.getGeometry().flatCoordinates;

                    var line = createLine(id, sonCoordinate, motherCoordinate);
                    var tooltip = createTooltip(id, sonCoordinate, motherCoordinate);
                    source.addFeature(line);
                    map.addOverlay(tooltip);
                    pickedArr.push(id);

                    //zhangq-20190808 添加pickedArrayIdList项；
                    var pickedArrayId = {};
                    pickedArrayId.ID = id;
                    pickedArrayId.MotherId = motherID;
                    pickedArrIdList.push(pickedArrayId);
                }
            });
        } catch (err) {
            writeLog("system", "ol-PickLine.js pick，error info:" + err);
        }
    }

    //取消拾取
    this.unpick = function (id) {
        var feature = source.getFeatureById(id);
        var tooltip = map.getOverlayById(id);
        source.removeFeature(feature);
        map.removeOverlay(tooltip);
        this.pickedArray.splice(this.pickedArray.indexOf(id), 1);

        //zhangq-20190808 删除pickedArrayIdList项；
        var pickIdArr = this.pickedArrayIdList.filter(function (item) {
            return item.ID === id;
        })
        this.pickedArrayIdList.splice(this.pickedArray.indexOf(pickIdArr), 1);
    }

    //重置坐标
    this.resetCoordiantes = function (id, shiptype, coordinate) {
        if (shiptype == 0 || !id) {
            return;
        }
        //zhangq-20190808 根据船舶类型画线
        if (shiptype == "1") {
            var pickedArrIdList = this.pickedArrayIdList;
            var pickIdArr = pickedArrIdList.filter(function (item) {
                return item.MotherId === id;
            })
            for (var i = 0; i < pickIdArr.length; i++) {
                //子船元素
                var feature = source.getFeatureById(pickIdArr[i].ID);
                var overlay = map.getOverlayById(pickIdArr[i].ID);
                if (!feature || !overlay) {
                    return;
                }
                var preCoordinate = feature.getGeometry();
                var flatCoordinates = preCoordinate.getCoordinates().concat();
                var curCoordinates = new Array();
                if (shiptype == 1) {
                    curCoordinates[0] = flatCoordinates[0];
                    curCoordinates[1] = coordinate;
                } else if (shiptype == 2) {
                    curCoordinates[0] = coordinate;
                    curCoordinates[1] = flatCoordinates[1];
                }
                feature.setGeometry(new ol.geom.LineString(curCoordinates));
                var d = calculateD(curCoordinates[0], curCoordinates[1]);
                var rotate = d.degree > 180 ? Math.abs(d.degree - 180) - 90 : d.degree - 90;
                overlay.setPosition([(curCoordinates[0][0] + curCoordinates[1][0]) / 2, (curCoordinates[0][1] + curCoordinates[1][1]) / 2]);
                var element = overlay.getElement();
                var Degree = d.degree
                if (Degree >= 180) {
                    Degree = Degree - 180
                } else if (Degree < 180) {
                    Degree = Degree + 180
                }
                element.innerHTML = (d.distance / 1000).toFixed(3) + 'km<br/>' + Degree + '°';
                element.style.cssText = element.style.cssText.replace(/rotate\((.+?)deg\)/g, 'rotate(' + rotate + 'deg)');
            }
        }
        if (shiptype == "2") {
            var feature = source.getFeatureById(id);
            var overlay = map.getOverlayById(id);
            if (!feature || !overlay) {
                return;
            }
            var preCoordinate = feature.getGeometry();
            var flatCoordinates = preCoordinate.getCoordinates().concat();
            var curCoordinates = new Array();
            if (shiptype == 1) {
                curCoordinates[0] = flatCoordinates[0];
                curCoordinates[1] = coordinate;
            } else if (shiptype == 2) {
                curCoordinates[0] = coordinate;
                curCoordinates[1] = flatCoordinates[1];
            }
            feature.setGeometry(new ol.geom.LineString(curCoordinates));
            var d = calculateD(curCoordinates[0], curCoordinates[1]);
            var rotate = d.degree > 180 ? Math.abs(d.degree - 180) - 90 : d.degree - 90;
            overlay.setPosition([(curCoordinates[0][0] + curCoordinates[1][0]) / 2, (curCoordinates[0][1] + curCoordinates[1][1]) / 2]);
            var element = overlay.getElement();
            var Degree = d.degree
            if (Degree >= 180) {
                Degree = Degree - 180
            } else if (Degree < 180) {
                Degree = Degree + 180
            }
            element.innerHTML = (d.distance / 1000).toFixed(3) + 'km<br/>' + Degree + '°';
            element.style.cssText = element.style.cssText.replace(/rotate\((.+?)deg\)/g, 'rotate(' + rotate + 'deg)');
        }

        //if (shiptype == 0 || !id) {
        //    return;
        //}
        //var feature = source.getFeatureById(id);
        //var overlay = map.getOverlayById(id);
        //if (!feature || !overlay) {
        //    return;
        //}
        //var preCoordinate = feature.getGeometry();
        //var flatCoordinates = preCoordinate.getCoordinates().concat();
        //var curCoordinates = new Array();
        //if (shiptype == 1) {
        //    curCoordinates[0] = flatCoordinates[0];
        //    curCoordinates[1] = coordinate;
        //} else if (shiptype == 2) {
        //    curCoordinates[0] = coordinate;
        //    curCoordinates[1] = flatCoordinates[1];
        //}
        //feature.setGeometry(new ol.geom.LineString(curCoordinates));
        //var d = calculateD(curCoordinates[0], curCoordinates[1]);
        //var rotate = d.degree > 180 ? Math.abs(d.degree - 180) - 90 : d.degree - 90;
        //overlay.setPosition([(curCoordinates[0][0] + curCoordinates[1][0]) / 2, (curCoordinates[0][1] + curCoordinates[1][1]) / 2]);
        //var element = overlay.getElement();
        //var Degree = d.degree
        //if (Degree >= 180) {
        //    Degree = Degree - 180
        //} else if (Degree < 180) {
        //    Degree = Degree + 180
        //}
        //element.innerHTML = (d.distance / 1000).toFixed(3) + 'm<br/>' + Degree + '°';
        //element.style.cssText = element.style.cssText.replace(/rotate\((.+?)deg\)/g, 'rotate(' + rotate + 'deg)');
    }

    ////zhangq-20190808 绘制对角线--废弃
    //function redrawFleetLine(id, coordinate, motherCoorinate, shiptype) {
    //    //if (shiptype == 0 || !id) {
    //    //    return;
    //    //}
    //    var feature = source.getFeatureById(id);
    //    var overlay = map.getOverlayById(id);
    //    if (!feature || !overlay) {
    //        return;
    //    }
    //    //var preCoordinate = feature.getGeometry();
    //    //var flatCoordinates = preCoordinate.getCoordinates().concat();
    //    //var curCoordinates = new Array();
    //    //if (shiptype == 1) {
    //    //    curCoordinates[0] = flatCoordinates[0];
    //    //    curCoordinates[1] = coordinate;
    //    //} else if (shiptype == 2) {
    //    //    curCoordinates[0] = coordinate;
    //    //    curCoordinates[1] = motherCoorinate;
    //    //}
    //    var curCoordinates = [];
    //    curCoordinates[0] = coordinate;
    //    curCoordinates[1] = motherCoorinate;
    //    feature.setGeometry(new ol.geom.LineString(curCoordinates));
    //    var d = calculateD(curCoordinates[0], curCoordinates[1]);
    //    var rotate = d.degree > 180 ? Math.abs(d.degree - 180) - 90 : d.degree - 90;
    //    overlay.setPosition([(curCoordinates[0][0] + curCoordinates[1][0]) / 2, (curCoordinates[0][1] + curCoordinates[1][1]) / 2]);
    //    var element = overlay.getElement();
    //    var Degree = d.degree
    //    if (Degree >= 180) {
    //        Degree = Degree - 180
    //    } else if (Degree < 180) {
    //        Degree = Degree + 180
    //    }
    //    element.innerHTML = (d.distance / 1000).toFixed(3) + 'm<br/>' + Degree + '°';
    //    element.style.cssText = element.style.cssText.replace(/rotate\((.+?)deg\)/g, 'rotate(' + rotate + 'deg)');
    //}
    ////zhangq-20190808 取出所有坐标绘制对角线--废弃
    //this.drawAllPickedLine = function () {

    //    var pickedIDArray = [];
    //    var pickedArrayIdList1 = this.pickedArrayIdList;
    //    var pickedArrayLonLatList1 = [];
    //    for (var i = 0; i < pickedArrayIdList1.length; i++) {
    //        pickedIDArray.push(pickedArrayIdList1[i].ID);
    //        if (pickedIDArray.indexOf(pickedArrayIdList1[i].MotherId) == -1) {
    //            pickedIDArray.push(pickedArrayIdList1[i].MotherId);
    //        }

    //    }
    //    $.ajax({
    //        type: "POST",
    //        url: "Handlers/GetFleetCordinate.ashx",
    //        data: "pickedId=" + encodeURI(pickedIDArray.toString()),
    //        success: function (msg) {
    //            var pickedArrLonlat = [];
    //            pickedArrLonlat = eval(msg); //将json转化为数组

    //            for (var k = 0; k < pickedArrayIdList1.length; k++) {

    //                //匹配pickedArrLonlat的经纬度
    //                var pickIdArr = pickedArrLonlat.filter(function (item) {
    //                    return item.id === pickedArrayIdList1[k].ID;
    //                })
    //                var pickIdMotherArr = pickedArrLonlat.filter(function (item) {
    //                    return item.id === pickedArrayIdList1[k].MotherId;
    //                })

    //                var pickedLatlon = {};
    //                pickedLatlon.Id = pickIdArr[0].id;
    //                pickedLatlon.Lon = pickIdArr[0].lon;
    //                pickedLatlon.Lat = pickIdArr[0].lat;
    //                pickedLatlon.MotherId = pickIdMotherArr[0].id;
    //                pickedLatlon.MotherLon = pickIdMotherArr[0].lon;
    //                pickedLatlon.MotherLat = pickIdMotherArr[0].lat;
    //                pickedArrayLonLatList1.push(pickedLatlon);

    //                for (var z = 0; z < pickedArrayLonLatList1.length; z++) {

    //                    var sonCoor = ol.proj.transform([parseFloat(pickedArrayLonLatList1[z].Lon), parseFloat(pickedArrayLonLatList1[z].Lat)], 'EPSG:4326', 'EPSG:3857');

    //                    var motherCoor = ol.proj.transform([parseFloat(pickedArrayLonLatList1[z].MotherLon), parseFloat(pickedArrayLonLatList1[z].MotherLat)], 'EPSG:4326', 'EPSG:3857');

    //                    redrawFleetLine(pickedArrayLonLatList1[z].Id, sonCoor, motherCoor);

    //                }

    //            }

    //        }
    //    });



    //}


    //判断是否为母船
    this.isMotherShip = function () {
        var result = true;
        var ship = userLayer.getSource().getFeatureById('p' + id);
        if (ship) {
            var typeflag = ship.get('person');
            if (typeflag) {
                result = typeflag.shipType == 1 ? true : false;
            }
        }
        return result;
    }

    /********************************
    *************私有函数************
    ********************************/

    //图层样式
    function layerStyle(feature) {
        return [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: outerColor,
                    width: 4
                })
            }),
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: innerColor,
                    width: 2
                })
            })
        ]
    }

    //生成直线，包括距离和方位角
    function createLine(id, start, target) {
        var feature = new ol.Feature({
            geometry: new ol.geom.LineString([start, target])

        });
        feature.setId(id);
        return feature;
    }

    //生成直线提示tooltip
    function createTooltip(id, start, target) {
        var d = calculateD(start, target);
        var rotate = d.degree > 180 ? Math.abs(d.degree - 180) - 90 : d.degree - 90;

        var tooltipElement = document.createElement('div');
        tooltipElement.style.cssText += ';color:black;transform:rotate(' + rotate + 'deg);padding:5px;';
        var Degree = d.degree
        if (Degree >= 180) {
            Degree = Degree-180
        } else if (Degree < 180) {
            Degree = Degree +180
        }
        var Distance = d.distance/1000
        tooltipElement.innerHTML = Distance.toFixed(3) + 'km<br/>' + Degree + '°';
        var tooltip = new ol.Overlay({
            id: id,
            element: tooltipElement,
            offset: [0, 0],
            positioning: 'center-center',
            position: [(target[0] + start[0]) / 2, (target[1] + start[1]) / 2]
        });
        return tooltip;
    }


    //计算距离、角度
    function calculateD(start, target) {
        var offsetX = target[0] - start[0];
        var offsetY = target[1] - start[1];
        offsetX = offsetX == 0 ? Math.pow(0.1, 10) : offsetX;
        var distance = (Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2))).toFixed(0);
        var degree = ((Math.PI - Math.atan(offsetY / offsetX) - offsetX / Math.abs(offsetX) * Math.PI / 2) / Math.PI * 180).toFixed(0);
        return { 'distance': distance, 'degree': degree };
    }
}