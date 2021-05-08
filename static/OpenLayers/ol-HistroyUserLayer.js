/*
**cxy
**20180724
**添加时间轴功能
*/
var animatingState = 0;//动画状态，0是无动画、1是开启动画、2是停止动画、3播放结束
var startAnimationState = true;//开始动画状态，true是动画运行，false是动画停止
function LoadEvents(freshTime,TypeArr,TimeArr, usertype, varcolor, selectWidth, judge) {


  
    var base64 = null;
    var myMap = new Map();
    var policeTypeLength = 0;
    var checkedEntity = "";
    var lengthIndex = 0, startLengthIndex = 0;
    var drawTimeInterval = null, featureMark = null, featureStartMark = null;


    function imgLoad(img, typename) {
        var timer = setInterval(function () {
            if (img.complete) {
                var base64 = getBase64_UserType(img);
                //alert(base64);
                myMap.set(typename, base64);
               // document.getElementById("userHead").removeChild(img);
               // document.getElementById("preview").src = "";
                base64 = null;
                clearInterval(timer)
            }
        }, 50)
    }


    function getUserType() {
        var myDate = new Date();
        var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
        var param = {
            sec: sec
        };
        jquerygetNewData_ajax("/WebGis/Service/getTypePictureLoadPath.aspx", param, function (request) {
            var data = request;
            var length = request.length;
            policeTypeLength = length * 2;
        
            for (var i = 0; i < length; i++) {
                if (usertype == request[i].TypeName)
                {
                    setTimeout(getUserTypePhoto, 100, request[i].TypeName + "_1");
                   // setTimeout(getUserTypePhoto, 100, request[i].TypeName + "_2");
                }
            }
        });

    }



    function getUserTypePhoto(typename) {

        var cc = document.createElement("img");
        var myDate = new Date();
        var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
        var photoUrl = "/lqnew/opePages/Upload/ReadImage.aspx?name=" + typename + "&Type=UserType&sec=" + sec;
        //var kk = typename.toString().split("_");
        cc.src = photoUrl;
        cc.style.display = "none";
       // document.getElementById("userHead").appendChild(cc);
        imgLoad(cc, typename);

    }


    var canvas = document.createElement('canvas');

    function getBase64_UserType(source) {
        //var source = document.getElementById("userTypePhoto");
        var width = source.width;
        var height = source.height;
        var context = canvas.getContext('2d');

        // draw image params
        var sx = 0;
        var sy = 0;
        var sWidth = 50;
        var sHeight = 50;
        var dx = 0;
        var dy = 0;
        var dWidth = 50;
        var dHeight = 50;
        var quality = 0.92;

        canvas.width = width;
        canvas.height = height;

        context.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

        var dataUrl = canvas.toDataURL('image/png', quality);
        return dataUrl;


    };
    
    getUserType();



   
    var TypeArrLength = TypeArr.length;

  
    var speed,now;
    var LoadLine = [];//加载线用
    
    var JudgeLine = true;//判断是否启用整线

    //选择颜色为黑，展示颜色为红，其他均为黑
    var displayColor = "#000000"
    if (varcolor == "#000000") {
        displayColor = "#ff0033"
    }

    var styles = {
        'route': new ol.style.Style({
            stroke: new ol.style.Stroke({ //线的样式
                width: selectWidth,//宽度
                color: varcolor//颜色
            })
        }),
        'default': new ol.style.Style({
            stroke: new ol.style.Stroke({ //线的样式
                width: 1,//宽度
                color: displayColor//颜色
            })
        }),

        'geoMarker': new ol.style.Style({
            image: new ol.style.Icon({
                img: canvas,
                imgSize: [50, 50],
                //scale: map.getView().getZoom() / 16,
                anchor: [1, 1]
            })

        })
    };

    if (judge == 1) {





                // vector的layer来放置图标
                userLayer = new ol.layer.Vector({
                    source: new ol.source.Vector()
                });
                userLayer.setProperties({ 'ID': 'histroyUser' });
                map.addLayer(userLayer);


                userAnimationLayer = new ol.layer.Vector({
                    source: new ol.source.Vector()
                });
                userAnimationLayer.setProperties({ 'ID': 'histroyUserAnimation' });
                map.addLayer(userAnimationLayer);

                map.render();


                var drawInterval = setInterval(function () {
                    if (startAnimationState == false) {
                        clearInterval(drawInterval);
                    } else {
                        drawFeature(drawInterval);
                    }
                }, freshTime);

            }
 

    //时间轴渲染动画
    var drawTimeFeature = function (interval) {
        if (animatingState == 1 && lengthIndex < TypeArrLength) {
            
            if (lengthIndex != 0) {
                var LoadLine = [TypeArr[lengthIndex - 1], TypeArr[lengthIndex]]
                var headLine = new ol.geom.LineString(LoadLine);
                var featureLine = new ol.Feature({ type: "route", geometry: headLine });
                featureLine.setStyle(styles['route']);
                userAnimationLayer.getSource().addFeature(featureLine);

                userAnimationLayer.getSource().removeFeature(featureMark);
            }

            //加载点
            featureMark = new ol.Feature({ type: "geoMarker", geometry: new ol.geom.Point(TypeArr[lengthIndex]) });
            featureMark.setStyle(styles['geoMarker']);
            userAnimationLayer.getSource().addFeature(featureMark);

            
            lengthIndex = lengthIndex + 1;
            map.render();
        } else {
            clearInterval(interval);
        }
    };

    //页面加载时动画
    var drawFeature = function (interval) {
        if (startLengthIndex < TypeArrLength) {

            if (startLengthIndex != 0) {
                var startLine = new ol.geom.LineString([TypeArr[startLengthIndex - 1], TypeArr[startLengthIndex]]);
                var lineFeature = new ol.Feature({ type: "route", geometry: startLine });
                lineFeature.setStyle(styles['route']);
                userLayer.getSource().addFeature(lineFeature);
                userLayer.getSource().removeFeature(featureStartMark);
            }

            //加载点
            featureStartMark = new ol.Feature({ type: "geoMarker", geometry: new ol.geom.Point(TypeArr[startLengthIndex]) });
            featureStartMark.setStyle(styles['geoMarker']);
            userLayer.getSource().addFeature(featureStartMark);


            startLengthIndex = startLengthIndex + 1;
            map.render();
        } else {
            clearInterval(interval);
            Display();
        }
    };

    //时间轴开始动画
    function startAnimation() {
        
        if ((new Date(TimeArr[0].replace(/-/g,"\/")))>(new Date(EndHistoryTime.replace(/-/g,"\/")))){
            alert(GetTextByName("NOTraceRecord", useprameters.languagedata));
            return;
        }
        if (startAnimationState) {
            alert(GetTextByName("ShowAllTrace", useprameters.languagedata));
            return;
        }
        if (animatingState == 1) {
            stopAnimation();
        } else {
            if (animatingState != 2) {
                userAnimationLayer.getSource().clear();
            }
            animatingState = 1;
            speed = parseInt(freshTime);

            userLayer.getSource().getFeatures().forEach(function (f) {
                if (f.values_.type == "geoMarker") {
                    userLayer.getSource().removeFeature(f);
                } 
            })
            
            $("#stop-animation").removeAttr("disabled");
            $("#stop-animation").css("color", "black");
            if ($("#start-animation").html() == GetTextByName("play_stop", useprameters.languagedata)) {
                $("#start-animation").html(GetTextByName("play_start", useprameters.languagedata));
            } else {
                $("#start-animation").html(GetTextByName("play_stop", useprameters.languagedata));
                $("#times").attr("disabled", true);
            }

            var drawTimeInterval = setInterval(function () {
                if (animatingState == 0) {
                    clearInterval(drawTimeInterval);
                }
                if (animatingState == 2) {
                    clearInterval(drawTimeInterval);
                }
                
                if (lengthIndex >= TypeArrLength) {
                    clearInterval(drawTimeInterval);
                    finishAnimation();
                }
                if ((new Date(TimeArr[lengthIndex].replace(/-/g, "\/"))) > (new Date(EndHistoryTime.replace(/-/g, "\/")))) {//cxy
                    clearInterval(drawTimeInterval);
                    finishAnimation();
                }

                drawTimeFeature(drawTimeInterval);

                
            }, freshTime);
        }
    }


    function stopAnimation() {
        animatingState = 2;
        $("#start-animation").html(GetTextByName("play_continue", useprameters.languagedata));
    }

    var endAnimation = function () {
        animatingState = 0;
        userAnimationLayer.getSource().clear();
        lengthIndex = 0;
        $("#times").removeAttr("disabled");
        $("#stop-animation").attr("disabled", true);
        $("#stop-animation").css("color", "#999999");
        $("#start-animation").html(GetTextByName("play_start", useprameters.languagedata));

        featureStartMark = new ol.Feature({
            type: 'geoMarker',
            geometry: new ol.geom.Point(TypeArr[TypeArrLength - 1])
        });
        featureStartMark.setStyle(styles['geoMarker']);
        userLayer.getSource().addFeature(featureStartMark);
    }

    var finishAnimation = function () {
        animatingState = 3;
        lengthIndex = 0;
        
        $("#start-animation").html(GetTextByName("play_restart", useprameters.languagedata));
    }

    //快速显示轨迹
    var Display = function () {
        if (startAnimationState) {

            //清空userLayer图层
            userLayer.getSource().clear();
            // 在地图上添加一条线
            var allLine = new ol.Feature({
                type: 'default',
                geometry: new ol.geom.LineString(TypeArr)
            });

            //最后运动的点
            featureStartMark = new ol.Feature({
                type: 'geoMarker',
                geometry: new ol.geom.Point(TypeArr[TypeArrLength - 1])
            });
            featureStartMark.setStyle(styles['geoMarker']);
            allLine.setStyle(styles['default']);
            userLayer.getSource().addFeatures([allLine, featureStartMark]);
        } else {
            alert(GetTextByName("AllTraceShowed", useprameters.languagedata));
            return;
        }
        startAnimationState = false;
    }

    var setEndHistoryTime = function (endHistoryTime) {
        EndHistoryTime = endHistoryTime;
    }


    return { startAnimation: startAnimation, endAnimation: endAnimation, setEndHistoryTime: setEndHistoryTime, Display: Display };
}












//var base64 = null;
//var myMap = new Map();
//var policeTypeLength = 0;
//var checkedEntity = "";

//function imgLoad(img, typename) {
//    var timer = setInterval(function () {
//        if (img.complete) {
//            var base64 = getBase64_UserType(img); //自定义画布，设置警员图片
//            //alert(base64);
//            myMap.set(typename, base64);
//            document.getElementById("userHead").removeChild(img);
//            document.getElementById("preview").src = "";
//            base64 = null;
//            clearInterval(timer)
//        }
//    }, 50)
//}

////查找所有警員類型
//function getUserType() {
//    var myDate = new Date();
//    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
//    var param = {
//        sec: sec
//    };
//    jquerygetNewData_ajax("/WebGis/Service/getTypePictureLoadPath.aspx", param, function (request) {
//        var data = request;
//        var length = request.length;
//        policeTypeLength = length * 2;
//        for (var i = 0; i < length; i++) {
//            setTimeout(getUserTypePhoto, 100, request[i].TypeName + "_1");
//            setTimeout(getUserTypePhoto, 100, request[i].TypeName + "_2");
//        }
//    });

//}
////根据警员类型名称查找警员类型图片
//function getUserTypePhoto(typename) {

//    var cc = document.createElement("img");
//    var myDate = new Date();
//    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
//    var photoUrl = "/lqnew/opePages/Upload/ReadImage.aspx?name=" + typename + "&Type=UserType&sec=" + sec;
//    var kk = typename.toString().split("_");
//    cc.src = photoUrl;
//    cc.style.display = "none";
//    document.getElementById("userHead").appendChild(cc);
//    imgLoad(cc, typename);

//}

////自定义画布，设置警员图片
//var canvas = document.createElement('canvas');
//function getBase64_UserType(source) {
//    //var source = document.getElementById("userTypePhoto");
//    var width = source.width;
//    var height = source.height;
//    var context = canvas.getContext('2d');

//    // draw image params
//    var sx = 0;
//    var sy = 0;
//    var sWidth = 50;
//    var sHeight = 50;
//    var dx = 0;
//    var dy = 0;
//    var dWidth = 50;
//    var dHeight = 50;
//    var quality = 0.92;

//    canvas.width = width;
//    canvas.height = height;

//    context.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

//    var dataUrl = canvas.toDataURL('image/png', quality);
//    return dataUrl;


//};

//function getBase64_UserType1(base64Photo) {
//    document.getElementById("preview").src = base64Photo;
//};


//function LoadUser() {
//    userLayer.getSource().clear();
//    var projection = ol.proj.get('EPSG:3857');
//    var projectionExtent = projection.getExtent();

   

//        var extent = map.getView().calculateExtent(map.getSize());
//    var bottomLeft = ol.proj.transform(ol.extent.getBottomLeft(extent),
//        'EPSG:3857', 'EPSG:4326');
//    var topRight = ol.proj.transform(ol.extent.getTopRight(extent),
//        'EPSG:3857', 'EPSG:4326');

//    var myDate = new Date();
//    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
//    var param = {
//        sec: sec,
//        checkEntity: checkedEntity,
//        bss: bottomLeft[0] + "," + topRight[0] + "," + bottomLeft[1] + "," + topRight[1] + "|||false|10",
//        func: "LoadDataToLayerControl",
//        layers: "Police",
//        must_display_user: "|2|24001",
//        maxla: topRight[1],
//        minla: bottomLeft[1],
//        maxlo: topRight[0],
//        minlo: bottomLeft[0]
//    };

//    jquerygetNewData_ajax("WebGis/Service/LayerControl.aspx", param, function (request) {
//        var data = request;
//        var length = request.Police.length;
//        for (var i = 0; i < length; i++) {
//            var lon = request.Police[i].Longitude;
//            var lat = request.Police[i].Latitude;
//            var entity = request.Police[i].entity;
//            var gpsStatus = request.Police[i].Send_reason;
//            var sendTime = request.Police[i].Send_time;
//            var terminalType = request.Police[i].terminalType;
//            var info = request.Police[i].Info;
//            var ISSI = request.Police[i].ISSI;
//            var mobile = '';
//            var zhiwu = '';
//            var bz = '';

//            //---------------------根据Base64头像信息加载canvas-------------------------
//            var date = new Date();
//            var internalSeconds = (date - new Date(Date.parse(sendTime))) / 1000  //时间差的秒数
//            var canvas1 = document.createElement('canvas');
//            document.getElementById("preview").src = myMap.get(request.Police[i].type + "_1");
//            var source = document.getElementById("preview");
//            if (internalSeconds < 600) {
//                if (typeof (myMap.get(request.Police[i].type + "_2")) != "undefined") {
//                    source.src = myMap.get(request.Police[i].type + "_1");
//                }
//                else {
//                    break;
//                }
//            }
//            else {
//                if (typeof (myMap.get(request.Police[i].type + "_2")) != "undefined") {
//                    source.src = myMap.get(request.Police[i].type + "_2");
//                }
//                else {
//                    break;
//                }
//            }
//            var width = source.width;
//            var height = source.height;
//            var context = canvas1.getContext('2d');

//            // draw image params
//            var sx = 0;
//            var sy = 0;
//            var sWidth = 50;
//            var sHeight = 50;
//            var dx = 0;
//            var dy = 0;
//            var dWidth = 50;
//            var dHeight = 50;
//            var quality = 0.92;

//            canvas1.width = width;
//            canvas1.height = height;

//            context.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
//            //-----------------------------end--------------------------------------------------------
//            var Personinfo = { info: info, entity: entity, issi: ISSI, lat: lat, lon: lon, gpsStatus: gpsStatus, sendTime: sendTime, terminalType: terminalType, mobile: mobile, zhiwu: zhiwu, bz: bz };
//            var star1 = new ol.Feature({
//                geometry: new ol.geom.Point(ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857')),
//                person: Personinfo,
//                layer: "police",
//                name: "p" + ISSI
//            });
//            star1.setId("p" + ISSI);
//            //var imgSize = '[50, 50]';
//            //map.getView().on('change:resolution', function () {
//            //    imgSize = "[" + 50 / this.getZoom() + ", " + 50 / this.getZoom() + "]";
//            //})
//            var canHeight = 50 * ((map.getView().getZoom() - 7 + 1) / 10);
//            var canWidth = 50 * ((map.getView().getZoom() - 7 + 1) / 10);
//            star1.setStyle(new ol.style.Style({
//                image: new ol.style.Icon({
//                    //src: myMap.get(request.Police[i].type + "_1")
//                    img: canvas1,
//                    scale: map.getView().getZoom() / 16,
//                    imgSize: [50, 50]
//                })
//            }));

//            userLayer.getSource().addFeature(star1);


//        }
//    });
//}



