function addDZZLLayer() {//新建电子栅栏图层
    sourceDZZL = new ol.source.Vector({})
    sourceDZZL2 = new ol.source.Vector({})
    DZZLLayer = new ol.layer.Vector({
        source: sourceDZZL,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });

    map.addLayer(DZZLLayer);
}
function loadDZZL() {//加载刷新电子栅栏数据
    //DZZLLayer.getSource().clear()
    //sourceDZZL.clear()
    var myDate = new Date();
    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
    var param = {
        sec: sec
    }; jquerygetNewData_ajax_post("/handlers/GetStockade_Handler.ashx", param, function (msg) {
        var zNodes = msg;
        var featureDzzlNowId = []
        for (var i = 0; i < zNodes.length; i++) {
            if (zNodes[i].type == "1") {
                var arr = zNodes[i].pa.replace("[", "").replace("]", "").replace("minLo", "").replace("maxLo", "").replace("minLa", "").replace("maxLa", "").replace(/{/g, "").replace(/}/g, "").replace(/:/g, "").split(",")
                var polygon = new ol.geom.Polygon([[
                    [parseFloat(arr[0]), parseFloat(arr[2])],
                    [parseFloat(arr[0]), parseFloat(arr[3])],
                    [parseFloat(arr[1]), parseFloat(arr[3])],
                    [parseFloat(arr[1]), parseFloat(arr[2])],
                    [parseFloat(arr[0]), parseFloat(arr[2])]
                ]]);
                polygon.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
                var arrStyle = zNodes[i].divstyle.replace(/\s/g, "").replace(/\"/g, "").replace("[{strokecolor:", "").replace("}]", "").replace("opacity:", "").replace("fillcolor:", "").replace("linestyle:", "").split(",")
                var Polygon = new ol.Feature(polygon)
                //LastStatus"0"

                fillcolorjs(arrStyle[2],arrStyle[1])//xzj--20190516--添加透明度
                if (zNodes[i].LastStatus == "1") {
                    fillColorDZZL = 'rgba(255, 193, 37, 0.3)'
                }
                //红色#ff0033 绿色#33FF33 蓝色#0000FF
                // if (arrStyle[2] == "#000000") {
                //  fillColor = 'rgba(0, 0, 0, 0.3)'
                // }
                Polygon.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: arrStyle[0],
                    }),
                    fill: new ol.style.Fill({
                        color: fillColorDZZL

                    })
                }))

                var featureDzzl = DZZLLayer.getSource().getFeatureById("Dzzl" + zNodes[i].divid);
                featureDzzlNowId.push("Dzzl" + zNodes[i].divid)
                if (featureDzzl) {
                    DZZLLayer.getSource().removeFeature(featureDzzl);
                }


                Polygon.setId("Dzzl" + zNodes[i].divid);
                DZZLLayer.getSource().addFeature(Polygon);
            } else if (zNodes[i].type == "2") {//[{lo:120.18373489737492,la:30.17677139091798},{lo:120.16227722549993,la:30.128827312846028},{lo:120.22373199774992,la:30.123927689557146},{lo:120.23231506649992,la:30.15821994561585},{lo:120.16742706674992,la:30.109375860137547},{lo:120.22802353212494,la:30.101950631527323}]
                var ARR = zNodes[i].pa.replace(/{/g, "[").replace(/}/g, "]").replace(/lo/g, "").replace(/la/g, "").replace(/:/g, "")
                arr = $.parseJSON(ARR)
                var arrStyle = zNodes[i].divstyle.replace(/\s/g, "").replace(/\"/g, "").replace("[{strokecolor:", "").replace("}]", "").replace("opacity:", "").replace("fillcolor:", "").replace("linestyle:", "").split(",")
                var polygon = new ol.geom.Polygon([arr]);
                for (var j = 0; j < polygon.length; j++) {
                    polygon[j] = parseFloat(polygon[j])
                }

                var Polygon = new ol.Feature(polygon)
                fillcolorjs(arrStyle[2], arrStyle[1])//xzj--20190516--添加透明度
                if (zNodes[i].LastStatus == "1") {
                    fillColorDZZL = 'rgba(255, 193, 37, 0.3)'
                }
                Polygon.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: arrStyle[0],
                    }),
                    fill: new ol.style.Fill({
                        color: fillColorDZZL

                    })
                }))
                polygon.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
                var featureDzzl = DZZLLayer.getSource().getFeatureById("Dzzl" + zNodes[i].divid);
                featureDzzlNowId.push("Dzzl" + zNodes[i].divid)
                if (featureDzzl) {
                    DZZLLayer.getSource().removeFeature(featureDzzl);
                }


                Polygon.setId("Dzzl" + zNodes[i].divid);
                DZZLLayer.getSource().addFeature(Polygon);
            } else if (zNodes[i].type == "4") {
                var arr = zNodes[i].pa.replace("[", "").replace("]", "").replace("{", "").replace("}", "").replace("lo1", "").replace("lo2", "").replace("la1", "").replace("la2", "").replace(/:/g, "").split(",")
                var a = ol.proj.transform([parseFloat(arr[0]), parseFloat(arr[1])], 'EPSG:4326', 'EPSG:3857')
                var b = ol.proj.transform([parseFloat(arr[2]), parseFloat(arr[3])], 'EPSG:4326', 'EPSG:3857')
                var wgs84Sphere = new ol.Sphere(6378137);
                var arrStyle = zNodes[i].divstyle.replace(/\s/g, "").replace(/\"/g, "").replace("[{strokecolor:", "").replace("}]", "").replace("opacity:", "").replace("fillcolor:", "").replace("linestyle:", "").split(",")
                var radius = wgs84Sphere.haversineDistance([parseFloat(arr[0]), parseFloat(arr[1])], [parseFloat(arr[2]), parseFloat(arr[3])]);
                var Circle = new ol.Feature(new ol.geom.Circle(ol.proj.transform([parseFloat(arr[0]), parseFloat(arr[1])], 'EPSG:4326', 'EPSG:3857'), radius * 1.160973836))

                fillcolorjs(arrStyle[2], arrStyle[1])//xzj--20190516--添加透明度
                if (zNodes[i].LastStatus == "1") {
                    fillColorDZZL = 'rgba(255, 193, 37, 0.3)'
                }
                Circle.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: arrStyle[0],
                    }),
                    fill: new ol.style.Fill({
                        color: fillColorDZZL

                    })
                }))
                var featureDzzl = DZZLLayer.getSource().getFeatureById("Dzzl" + zNodes[i].divid);
                featureDzzlNowId.push("Dzzl" + zNodes[i].divid);
                if (featureDzzl) {

                    DZZLLayer.getSource().removeFeature(featureDzzl);

                }

                Circle.setId("Dzzl" + zNodes[i].divid);
                DZZLLayer.getSource().addFeature(Circle)
            }
        }
        var featureDzzlNow = DZZLLayer.getSource().getFeatures()
        if (featureDzzlNow) {
            for (var i = 0; i < featureDzzlNow.length; i++) {
                if (featureDzzlNowId.indexOf(featureDzzlNow[i].getId()) == "-1") {
                    DZZLLayer.getSource().removeFeature(DZZLLayer.getSource().getFeatureById(featureDzzlNow[i].getId()));
                }
            }
        }
    })
}
function removeDZZL() {
    DZZLLayer.getSource().clear();
    loadDZZL();
}
//定位电子栅栏 /*cxy-20180713*/
function locateDZZL(ID, mytype, arrpoint) {
    var geo = null
    if (mytype == 2) {
        var strCoordinate = arrpoint.replace(new RegExp("{lo:", "g"), "[").replace(new RegExp("la:", "g"), "").replace(new RegExp("}", "g"), "]");
        var arrCoordinate = eval("(" + strCoordinate + ")");
        geo = new ol.geom.Polygon([arrCoordinate]);
        geo.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
    } else if (mytype == 1) {
        var strCoordinate = arrpoint.replace("[", "").replace("]", "").replace("minLo", "").replace("maxLo", "").replace("minLa", "").replace("maxLa", "").replace(/{/g, "").replace(/}/g, "").replace(/:/g, "").split(",")
        geo = new ol.geom.Polygon([[
            [parseFloat(strCoordinate[0]), parseFloat(strCoordinate[2])],
            [parseFloat(strCoordinate[0]), parseFloat(strCoordinate[3])],
            [parseFloat(strCoordinate[1]), parseFloat(strCoordinate[3])],
            [parseFloat(strCoordinate[1]), parseFloat(strCoordinate[2])],
            [parseFloat(strCoordinate[0]), parseFloat(strCoordinate[2])]
        ]]);
        geo.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
    } else if (mytype == 4) {
        var strCoordinate = arrpoint.replace("[", "").replace("]", "").replace("{", "").replace("}", "").replace("lo1", "").replace("lo2", "").replace("la1", "").replace("la2", "").replace(/:/g, "").split(",");
        var wgs84Sphere = new ol.Sphere(6378137);
        var radius = wgs84Sphere.haversineDistance([parseFloat(strCoordinate[0]), parseFloat(strCoordinate[1])], [parseFloat(strCoordinate[2]), parseFloat(strCoordinate[3])]);
        geo = new ol.geom.Circle(ol.proj.transform([parseFloat(strCoordinate[0]), parseFloat(strCoordinate[1])], 'EPSG:4326', 'EPSG:3857'), radius * 1.160973836);
    }


    var dzzlFeature = new ol.Feature({
        geometry: geo
    });
    var extent = dzzlFeature.getGeometry().getExtent();
    var size = map.getSize();
    var view = map.getView();
    var resolution = view.constrainResolution(view.getResolutionForExtent(extent, size));


    var flickerStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(0,0,255,0.1)'
        }),
        stroke: new ol.style.Stroke({
            color: '#00FAF2',
            width: 4
        })
    });
    DZZLLayer.getSource().addFeature(dzzlFeature);

    var flickerNum = 2;
    var flickerTimer = setInterval(function () {
        dzzlFeature.setStyle(flickerStyle);
        setTimeout(function () {
            dzzlFeature.setStyle(null);
        }, 500);
        if (!flickerNum) {
            clearInterval(flickerTimer);
            DZZLLayer.getSource().removeFeature(dzzlFeature);
        }
        flickerNum--;
    }, 1000);

    view.animate({
        resolution: resolution * 2,
        center: ol.extent.getCenter(extent),
        duration: 200,
        easing: ol.easing.easeOut
    });
}
//xzj--20190516--添加透明度参数，原来固定为0.3
function fillcolorjs(Color,opacity) {
    if (Color == "#000000") {
        fillColorDZZL = "rgba(0, 0, 0,"+ opacity/100+")"
    } else if (Color == "#ff0033") {
        fillColorDZZL = "rgba(255, 0, 0," + opacity / 100 + ")"
    } else if (Color == "#33FF33") {
        fillColorDZZL = "rgba(0, 139, 0," + opacity / 100 +  ")"
    } else if (Color == "#0000FF") {
        fillColorDZZL = "rgba(30,144, 255,"+ opacity / 100 + ")"
    }
}
function addInteraction(id, fillcolor, strokecolor, type, mytitle, opacity) {
    //console.log(id + "," + fillcolor + "," + strokecolor + "," + opacity + "," + type + "," + myusers + "," + mytitle)
    var Fillcolor = fillcolor
    var Id = id
    var Strokecolor = strokecolor
    var Type = type
    var Mytitle = mytitle
    var Opacity = opacity
    var image = new ol.style.Circle({
        radius: 5,
        fill: null,
        stroke: new ol.style.Stroke({ color: 'red', width: 1 })
    });
    var Fillcolor = fillcolorjs(fillcolor, opacity)//xzj--20190516--添加透明度
    var styles = {
        'Polygon': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: strokecolor
            }),
            fill: new ol.style.Fill({
                color: Fillcolor
            })
        }),
        'Circle': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: strokecolor
            }),
            fill: new ol.style.Fill({
                color: Fillcolor
            })
        })
    };

    if (valueDZZL !== 'None') {
        var geometryFunction;
        if (valueDZZL === 'Box') {
            value = 'Circle';
            geometryFunction = ol.interaction.Draw.createBox();;
        } else if (valueDZZL === 'Polygon') {
            value = 'Polygon';
        } else if (valueDZZL === 'Circle') {
            value = 'Circle';
        }

        draw = new ol.interaction.Draw({
            source: sourceDZZL2,
            type: value,
            geometryFunction: geometryFunction,
            stopClick: true,

        });
        // function drawStart() {  }
        function drawEnd() {
            var CoorDinates = draw.sketchCoords_
            var points;
            var myDate = new Date();
            var divid = "" + myDate.getFullYear() + myDate.getMonth() + myDate.getHours() + myDate.getMinutes() + myDate.getSeconds();
            var divStyle = divStyle = "[{strokecolor: \\\"" + strokecolor + "\\\", opacity: \\\"" + opacity + "\\\", fillcolor: \\\"" + fillcolor + "\\\", linestyle: \\\"solid\\\"}]";

            //[{minLo:120.13609886581246,maxLo:120.15206337368747,minLa:30.171169222432027,maxLa:30.179479609825528}]
            if (Type == "Box") {
                Type = 1;
                var coordinate1 = ol.proj.transform(CoorDinates[0], 'EPSG:3857', 'EPSG:4326');
                var coordinate2 = ol.proj.transform(CoorDinates[1], 'EPSG:3857', 'EPSG:4326');
                points = "[{minLo:" + coordinate1[0] + ",maxLo:" + coordinate2[0] + ",minLa:" + coordinate1[1] + ",maxLa:" + coordinate2[1] + "}]";
            }
            if (Type == "Polygon") {
                //console.log(Feature[Feature.length - 1].getGeometry().getCoordinates());
                Type = 2;
                var coordinates = CoorDinates[0]
                //[{lo:120.13815554088242,la:30.183654446380903},{lo:120.1392069668043,la:30.183394768388172},{lo:120.1382842869137,la:30.18259718170189},{lo:120.13761909908555,la:30.182875410349133},{lo:120.1377693027887,la:30.183431865286195},{lo:120.13813408321057,la:30.183710091576},{lo:120.13826282924181,la:30.183672994782757}]
                var points = "[";
                if (coordinates.length > 0) {
                    for (var i = 0; i < coordinates.length; i++) {
                        var coordinate1 = ol.proj.transform(coordinates[i], 'EPSG:3857', 'EPSG:4326');
                        if (i != coordinates.length - 1) {
                            points = points + "{lo:" + coordinate1[0] + ",la:" + coordinate1[1] + "},";
                        }
                        else {
                            points = points + "{lo:" + coordinate1[0] + ",la:" + coordinate1[1] + "}";
                        }

                    }

                }
                points = points + "]";

            } else if (Type == "Circle") {//如果是圆 则返回：
                //console.log(Feature[Feature.length - 1].getGeometry().getCenter())//圆心坐标
                //console.log(Feature[Feature.length - 1].getGeometry().getFirstCoordinate())//第一个点坐标
                //console.log(Feature[Feature.length - 1].getGeometry().getLastCoordinate())//最后一个点坐标
                Type = 4;
                var coordinates1 = CoorDinates[0];
                var coordinates2 = CoorDinates[1];
                coordinate1 = ol.proj.transform(coordinates1, 'EPSG:3857', 'EPSG:4326');
                coordinate2 = ol.proj.transform(coordinates2, 'EPSG:3857', 'EPSG:4326');
                points = "[{lo1:" + coordinate1[0] + ",la1:" + coordinate1[1] + ",lo2:" + coordinate2[0] + ",la2:" + coordinate2[1] + "}]";
            }
            isBegStackadeSel = false
            //draw.finishDrawing()
            //添加到数据库
            //[{lo:120.13815554088242,la:30.183654446380903},{lo:120.1392069668043,la:30.183394768388172},{lo:120.1382842869137,la:30.18259718170189},{lo:120.13761909908555,la:30.182875410349133},{lo:120.1377693027887,la:30.183431865286195},{lo:120.13813408321057,la:30.183710091576},{lo:120.13826282924181,la:30.183672994782757}]

            var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
            var param = {
                sec: sec,
                cmd: "add",
                pointarray: points,
                type: Type,
                divid: divid,
                divstyle: divStyle,
                title: mytitle,
                userid: id
            };
            jquerygetNewData_ajax("/Handlers/Stockade_Handler.ashx", param, function (request) {
                var data = request;
                var AddStackSuccess = GetTextByName("AddStackSuccess", useprameters.languagedata);
                var AddStackFailed = GetTextByName("AddStackFailed", useprameters.languagedata);
                map.removeInteraction(draw);
                if (data.result == AddStackSuccess) {
                    alert(AddStackSuccess);
                    loadDZZL();
                }
                else {
                    alert(AddStackFailed);
                }
            });
        }
        function changefeature() {
            var Feature = sourceDZZL.getFeatures()
            //DrawCoordinates = sketchFeature.getGeometry().getCoordinates()
            var points;
            var myDate = new Date();
            var divid = "" + myDate.getFullYear() + myDate.getMonth() + myDate.getHours() + myDate.getMinutes() + myDate.getSeconds();
            var divStyle = divStyle = "[{strokecolor: \\\"" + strokecolor + "\\\", opacity: \\\"" + opacity + "\\\", fillcolor: \\\"" + fillcolor + "\\\", linestyle: \\\"solid\\\"}]";

            //[{minLo:120.13609886581246,maxLo:120.15206337368747,minLa:30.171169222432027,maxLa:30.179479609825528}]
            if (Type == "Box") {
                Type = 1;
                var coordinates = Feature[Feature.length - 1].getGeometry().getCoordinates();
                var coordinate1 = ol.proj.transform(coordinates[0][0], 'EPSG:3857', 'EPSG:4326');
                var coordinate2 = ol.proj.transform(coordinates[0][2], 'EPSG:3857', 'EPSG:4326');
                points = "[{minLo:" + coordinate1[0] + ",maxLo:" + coordinate2[0] + ",minLa:" + coordinate1[1] + ",maxLa:" + coordinate2[1] + "}]";
                console.log(coordinates)
            }
            if (Type == "Polygon") {
                //console.log(Feature[Feature.length - 1].getGeometry().getCoordinates());
                Type = 2;
                var coordinates = Feature[Feature.length - 1].getGeometry().getCoordinates()
                console.log(coordinates)
                //[{lo:120.13815554088242,la:30.183654446380903},{lo:120.1392069668043,la:30.183394768388172},{lo:120.1382842869137,la:30.18259718170189},{lo:120.13761909908555,la:30.182875410349133},{lo:120.1377693027887,la:30.183431865286195},{lo:120.13813408321057,la:30.183710091576},{lo:120.13826282924181,la:30.183672994782757}]
                var points = "[";
                if (coordinates[0].length > 0) {
                    for (var i = 0; i < coordinates[0].length; i++) {
                        var coordinate1 = ol.proj.transform(coordinates[0][i], 'EPSG:3857', 'EPSG:4326');
                        if (i != coordinates[0].length - 1) {
                            points = points + "{lo:" + coordinate1[0] + ",la:" + coordinate1[1] + "},";
                        }
                        else {
                            points = points + "{lo:" + coordinate1[0] + ",la:" + coordinate1[1] + "}";
                        }

                    }

                }
                points = points + "]";

            } else if (Type == "Circle") {//如果是圆 则返回：
                //console.log(Feature[Feature.length - 1].getGeometry().getCenter())//圆心坐标
                //console.log(Feature[Feature.length - 1].getGeometry().getFirstCoordinate())//第一个点坐标
                //console.log(Feature[Feature.length - 1].getGeometry().getLastCoordinate())//最后一个点坐标
                Type = 4;
                var coordinates1 = Feature[Feature.length - 1].getGeometry().getFirstCoordinate();
                var coordinates2 = Feature[Feature.length - 1].getGeometry().getLastCoordinate();
                var ra = Feature[Feature.length - 1].getGeometry().getRadius()
                coordinate1 = ol.proj.transform(coordinates1, 'EPSG:3857', 'EPSG:4326');
                coordinate2 = ol.proj.transform(coordinates2, 'EPSG:3857', 'EPSG:4326');
                points = "[{lo1:" + coordinate1[0] + ",la1:" + coordinate1[1] + ",lo2:" + coordinate2[0] + ",la2:" + coordinate2[1] + "}]";
                console.log(coordinates1)
                console.log(coordinates2)
            }
            isBegStackadeSel = false
            //draw.finishDrawing()
            //添加到数据库
            //[{lo:120.13815554088242,la:30.183654446380903},{lo:120.1392069668043,la:30.183394768388172},{lo:120.1382842869137,la:30.18259718170189},{lo:120.13761909908555,la:30.182875410349133},{lo:120.1377693027887,la:30.183431865286195},{lo:120.13813408321057,la:30.183710091576},{lo:120.13826282924181,la:30.183672994782757}]

            var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
            var param = {
                sec: sec,
                cmd: "add",
                pointarray: points,
                type: Type,
                divid: divid,
                divstyle: divStyle,
                title: mytitle,
                userid: id
            };
            jquerygetNewData_ajax("/Handlers/Stockade_Handler.ashx", param, function (request) {
                var data = request;
                var AddStackSuccess = GetTextByName("AddStackSuccess", useprameters.languagedata);
                var AddStackFailed = GetTextByName("AddStackFailed", useprameters.languagedata);
                map.removeInteraction(draw);
                if (data.result == AddStackSuccess) {
                    alert(AddStackSuccess);
                    loadDZZL();
                    DZZLLayer.getSource().removeFeature(Feature[Feature.length - 1])
                }
                else {
                    alert(AddStackFailed);
                }
            });

        }
        map.addInteraction(draw);
        // draw.on('drawstart', drawStart);
        draw.on('drawend', drawEnd);
        //sourceDZZL.on('changefeature', changefeature);
        //sourceDZZL.dispatchEvent(changefeature)
        //sourceDZZL.once('change', changefeature);

    }


}