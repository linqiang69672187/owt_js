//----------加载警员类型------------

var base64 = null;
var myMap = new Map();
var canvasMap = new Map();
var policeTypeLength = 0;
var checkedEntity = "";
var must_display_users = "";
var hide_timeout_device = "";
var ringvalue = "";
var boxselection = false;
var zoomin = false;
var zoomout = false;
var rangingactive = false
var BoxSelectiondraw = null
var olranging = null
var sourceranging = null
var userArray = new Array();
var overlay = null;
var imageSize = 64;

function initUserLayer() {
    var usertype = Cookies.get("usertype");
    if (usertype == "1") {
        getUserType();
    }
    // vector的layer来放置图标
    userLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            wrapX: false
        }),
        zIndex: 2
    });
    userLayer.setProperties({ 'ID': 'user' });//cxy-20180801-设置userlayer的ID
    map.addLayer(userLayer);
    overlay = AddUserPopup();
    map.addOverlay(overlay);
    LoadEvents();
}

function imgLoad(img, typename) {
    var timer = setInterval(function () {
        if (img.complete) {
            for (var i = 0; i < 16; i++) {
                var c = getCanvas_UserType(img, i);
                //alert(base64);
                myMap.set(typename + "_" + i, c);
                //document.getElementById("preview").src = "";

            }
            clearInterval(timer)
        }
    }, 50)
    document.getElementById("userHead").removeChild(img);
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
//if (data[i].CanvasIcons != "") {//绘制的图形（船舶）
            //    var shipCoordinates = JSON.parse(data[i].CanvasIcons);
            //    var typeName = data[i].TypeName;
            //    var image = getCanvas_ShipType(shipCoordinates);
            //    saveShipImage(typeName, image);
            //} else {//选择的图片（警员）
            setTimeout(getUserTypePhoto, 100, data[i].TypeName + "_1");
            setTimeout(getUserTypePhoto, 100, data[i].TypeName + "_2");
        //}
        }
    });

}

function getUserTypePhoto(typename) {

    var cc = document.createElement("img");
    var myDate = new Date();
    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
    var photoUrl = "/lqnew/opePages/Upload/ReadImage.aspx?name=" + typename + "&Type=UserType&sec=" + sec;
    var kk = typename.toString().split("_");
    cc.src = photoUrl;
    cc.style.display = "none";
    document.getElementById("userHead").appendChild(cc);
    imgLoad(cc, typename);

}

//获取人员的canvas
function getCanvas_UserType(source, index) {
    var canvas = document.createElement('canvas');
    var width = source.width;
    var height = source.height;
    var context = canvas.getContext('2d');

    // draw image params
    var sx = 0;
    var sy = 0;

    var sWidth = imageSize;
    var sHeight = imageSize;
    var dx = 0;
    var dy = 0;
    var dWidth = imageSize;
    var dHeight = imageSize;
    var quality = 0.92;

    if (index % 2 == 0) {
        sx = index / 2 * sWidth;
    }
    else {
        sx = ((index - 1) / 2) * sWidth
        sy = sHeight;
    }

    canvas.width = width;
    canvas.height = height;

    context.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    //var dataUrl = canvas.toDataURL('image/png', quality);
    //return dataUrl;
    return canvas;
};

function getBase64_UserType1(base64Photo) {
    document.getElementById("preview").src = base64Photo;
};

//绘制船体形状
function getCanvas_ShipType(coordiante) {
    var shipCanvas = ShipCanvas.createShipCanvas(coordiante, imageSize, imageSize, {
        backgroundColor: "rgba(255,255,255,0)",
        fillStyle: "rgb(180,180,180)"
    });
    //var dataUrl = shipCanvas.toDataURL('image/png', 1);
    //return dataUrl;
    return shipCanvas;
}

//保存船体图片在全局Map中
function saveShipImage(typename, image) {
    myMap.set(typename + "_2_" + 0, image);
    myMap.set(typename + "_2_" + 1, image);//添加两个一样的，为了融于警员的动画效果
}

function LoadEvents() {

    //地图移动事件
    function onMoveEnd(evt) {

        if ((policeTypeLength > 0) && (myMap.size >= policeTypeLength)) {
            //cxy-20180723-锁定绑定地图移动事件
            var lockedFeature = userLayer.getSource().getFeatureById("p" + useprameters.lockid);
            if (lockedFeature) {
                var coord = lockedFeature.values_.geometry.flatCoordinates;
                moveCenter(coord);
            }
            ReLoadUser();
        }
    }
    map.on('moveend', onMoveEnd);

    var menu_overlay = new ol.Overlay({//警员右键
        element: document.getElementById("contextmenu_container"),
        positioning: 'center-center'
    });
    var menu_overlay2 = new ol.Overlay({//地图右键
        element: document.getElementById("contextmenu_container2"),
        positioning: 'center-center'
    });
    menu_overlay.setMap(map);
    menu_overlay2.setMap(map);

    $(map.getViewport()).on("contextmenu", function (event) {
        event.preventDefault();
        //当捕捉到地图元素右键时，判断鼠标所在像素点位置处是否存在要素，如果存在，设置右键框overlay弹出，坐标为事件发生的坐标。
        //修改地图右键在电子栅栏上无效问题---------------------------xzj--2018/7/8-----------------------------------------------
        var pixel = [event.clientX, event.clientY];
        var police = false;
        var feature = map.forEachFeatureAtPixel(pixel, function (feature) {

            if (feature.values_.layer == "police") {
                police = true;
                return feature;
            }
        })

        if (police) {
            //if (feature.values_.layer != "police")
            //    return;
            //获取警员ISSI，判断需要显示的菜单项目---------------------xzj--2018/4/12----------------------------------------------
            var issi = feature.values_.person.issi;
            var lat = feature.values_.person.lat;
            var lon = feature.values_.person.lon;
            getUserStatusByISSI(issi);//获取issiStatus，id

            var coordinate = map.getEventCoordinate(event);
            menu_overlay2.setPosition(undefined);
            document.getElementById("contextmenu_container").parentNode.style.display = "block";
            menu_overlay.setPosition(coordinate);
        } else {
            //判断地图右键需要显示的菜单项目---------------------xzj--2018/4/18----------------------------------------------
            var userType = Cookies.get("usertype");
            if (userType == 1) {
                MapMenuIsDisplayByPower();
                var coordinate = map.getEventCoordinate(event);
                menu_overlay.setPosition(undefined);
                document.getElementById("contextmenu_container").parentNode.style.display = "none";
                document.getElementById("contextmenu_container2").parentNode.style.display = "block";
                //将右键菜单display改为block------------------xzj--2018/7/10---------------------------
                document.getElementById("contextmenu_container2").style.display = "block";
                menu_overlay2.setPosition(coordinate);
            }
        }
    });

    $(map.getViewport()).on("click", function (e) {
        e.preventDefault();
        menu_overlay.setPosition(undefined);
        menu_overlay2.setPosition(undefined);
    });


    var selectdoubleClick = new ol.interaction.Select({
        condition: ol.events.condition.doubleClick,
        layers: [userLayer]
    });
    map.addInteraction(selectdoubleClick);
    // 监听选中事件，然后在事件处理函数中改变被选中的`feature`的样式
    selectdoubleClick.on('select', function (event) {
        if (event.selected.length > 0) {
            if (typeof (event.selected[0].values_.layer) != "undefined") {
                if (event.selected[0].values_.layer == "police") {
                    //var coordinate = event.mapBrowserEvent.coordinate;
                    var content = document.getElementById('popup-content');
                    var status = GetTextByName(event.selected[0].values_.person.gpsStatus, useprameters.languagedata);
                    var entity = GetTextByName("Lang_Unit", useprameters.languagedata);
                    var lon = GetTextByName("Lang-Longitude", useprameters.languagedata);
                    var lat = GetTextByName("Lang-Latitude", useprameters.languagedata);

                    var gpsStatus = GetTextByName("GPSStatus", useprameters.languagedata);
                    var sendtime = GetTextByName("Lang_SendMSGTIME", useprameters.languagedata);
                    var terminalType = GetTextByName("Lang_TerminalType", useprameters.languagedata);
                    var tel = GetTextByName("Lang_telephone", useprameters.languagedata);
                    var position = GetTextByName("Lang_position", useprameters.languagedata);
                    var remark = GetTextByName("Lang_Remark", useprameters.languagedata);
                    
                    var battery = GetTextByName("energy", useprameters.languagedata);//xzj--20181224--添加场强信息--手台电量
                    var ulRssi = GetTextByName("signalup", useprameters.languagedata);//上行场强
                    var msRssi = GetTextByName("signaldown", useprameters.languagedata);//手台场强

                    var valueTel, valuePosition, valueRemark;
                    var myDate = new Date();
                    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
                    var param = {
                        sec: sec,
                        ID: event.selected[0].values_.person.userId
                    };
                    jquerygetNewData_ajax("/Handlers/GetUserInfoByID_Handler.ashx", param, function (request) {
                        var data = request;
                        var bubbInfo = useprameters.Bubble_information;
                        var person = event.selected[0].get("person");
                        content.innerHTML = '<code><b>' + person.info + '</b></code>';
                        if (bubbInfo.indexOf("Unit") != "-1") {
                            content.innerHTML += '<br/><code>' + entity + ': ' + (person.entity || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("Latitude") != "-1") {
                            content.innerHTML += '<br/><code>' + lat + ': ' + (person.lat || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("Longitude") != "-1") {
                            content.innerHTML += '<br/><code>' + lon + ': ' + (person.lon || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("GPSStatus") != "-1") {
                            content.innerHTML += '<br/><code>' + gpsStatus + ': ' + status + '</code>';
                        }
                        if (bubbInfo.indexOf("SendMSGTIME") != "-1") {
                            content.innerHTML += '<br/><code>' + sendtime + ': ' + (person.sendTime || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("TerminalType") != "-1") {
                            content.innerHTML += '<br/><code>' + terminalType + ': ' + (person.terminalType || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("telephone") != "-1") {
                            content.innerHTML += '<br/><code>' + tel + ': ' + (request[0].Telephone||"") + '</code>';
                        }
                        if (bubbInfo.indexOf("position") != "-1") {
                            content.innerHTML += '<br/><code>' + position + ': ' + (request[0].Position||"") + '</code>';
                        }
                        if (bubbInfo.indexOf("Remark") != "-1") {
                            content.innerHTML += '<br/><code>' + remark + ': ' + (request[0].bz||"") + '</code>';
                        }
                        if (bubbInfo.indexOf("Battery") != "-1") {//xzj--20181224--添加场强信息--手台电量--20190515--添加数值单位
                            content.innerHTML += '<br/><code>' + battery + ': ' + (request[0].battery == "" ? request[0].battery : request[0].battery +"%" || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("MsRssi") != "-1") {//--手台场强
                            content.innerHTML += '<br/><code>' + msRssi + ': ' + (request[0].msRssi == "" ? request[0].msRssi : request[0].msRssi + "dB" || "") + '</code>';
                        }
                        if (bubbInfo.indexOf("UlRssi") != "-1") {//--上行场强
                            content.innerHTML += '<br/><code>' + ulRssi + ': ' + (request[0].ulRssi == "" ? request[0].ulRssi : request[0].ulRssi + "dB" || "") + '</code>';
                        }
                        var coordinate = ol.proj.transform([parseFloat(person.lon), parseFloat(person.lat)], 'EPSG:4326', 'EPSG:3857');
                        overlay.setPosition(coordinate);

                    });

                    selectdoubleClick.getFeatures().clear();//cxy-20180724-修改双击选中后用户一直存在selectedLayer的临时图层中
                }
            }
        }
    })

    //cxy-20180723-锁定初始化
    moveCenter();
    function zoomIn() {
        var view = map.getView();
        view.animate({ zoom: view.getZoom() + 1 });
        //view.setZoom(view.getZoom()+1)
    }

    //缩小地图
    function zoomOut() {
        var view = map.getView();
        view.animate({ zoom: view.getZoom() - 1 });
        // view.setZoom(view.getZoom() + 1)
    }
    //xzj--20190419--母船位置回归
    function motherShipPositionReturn() {
        var entityID = Cookies.get("id");
        jquerygetNewData_ajax_post("Handlers/GetMotherShipCoordinateByEntityId.ashx", { entityID: entityID }, function (request) {
            if (JSON.stringify(request)!="{}" && request.longitude != "" && request.latitude != "") {
                var coord = ol.proj.transform([parseFloat(request.longitude), parseFloat(request.latitude)], 'EPSG:4326', 'EPSG:3857');
                mapLocateEvent.locate(coord, 3000);
            }
            else {
                alert(GetTextByName("Lang_ShipPositionReturnFail", useprameters.languagedata));
            }
        })
    }

    function reactive() { //重置右侧工具栏状态2018.8.8虞晨超

        map.removeLayer(sourceranging)
        if (boxselection == true) { map.removeInteraction(BoxSelectiondraw); }
        if (rangingactive == true) { map.removeInteraction(olranging); }
        boxselection = false;
        zoomin = false;
        zoomout = false;
        rangingactive = false
        $("#ol-ranging").css("background", "url(Images/ring.png) 0 0 no-repeat")
        $("#ol-BoxSelection").css("background", "url(Images/choose.png) 0 0 no-repeat")
        // $("#zoomin").css("background", "url(Images/zoomin.png) 0 0 no-repeat")
        //  $("#zoomout").css("background", "url(Images/zoomout.png) 0 0 no-repeat")
        $("#BoxSelection-type").css("display", "none")
        $("#mouse-position").css("display", "none")
    }
    $("#ol-BoxSelection").click(function () {//框选2018.8.8虞晨超
        if (boxselection == false) {
            reactive()
            boxselection = true;
            $("#ol-BoxSelection").css("background", "url(Images/choose_un.png) 0 0 no-repeat")
            olBoxSelection()
        } else {

            $("#ol-BoxSelection").css("background", "url(Images/choose.png) 0 0 no-repeat")
            if (boxselection == true) { map.removeInteraction(BoxSelectiondraw); }
            boxselection = false;
        }
    })
    $("#ol-ranging").click(function () {//测距测面积窗口开关2018.8.8虞晨超
        if (rangingactive == false) {
            reactive()
            rangingactive = true;
            $("#ol-ranging").css("background", "url(Images/ring_un.png) 0 0 no-repeat")
            $("#BoxSelection-type").css("display", "block")
            $("#mouse-position").css("display", "block")
        } else {
            reactive()
            rangingactive = false;
            $("#ol-ranging").css("background", "url(Images/ring.png) 0 0 no-repeat")
            $("#BoxSelection-type").css("display", "none");
            $("#mouse-position").css("display", "none");

            //删除所有测量提示
            var overlays = map.getOverlays();
            var deleteOverlays = [];
            overlays.forEach(function (o) {
                var id = o.getId();
                if (id) {
                    if (id.indexOf('temp') >= 0) {
                        deleteOverlays.push(o);
                    }
                }
            });
            deleteOverlays.forEach(function (o) {
                map.removeOverlay(o);
            })
        }
    })
    $("#zoomin").click(function () {//放大图层2018.8.8虞晨超
        //if (zoomin == false) {
         reactive()
        // zoomin = true;
        //$("#zoomin").css("background", "url(Images/zoomin_un.png) 0 0 no-repeat")
        //} else {
        // zoomin = false;
        // $("#zoomin").css("background", "url(Images/zoomin.png) 0 0 no-repeat")
        zoomIn()
        // }
    })
    $("#zoomout").click(function () {//缩小图层2018.8.8虞晨超
        // if (zoomout == false) {
         reactive()
        //zoomout = true;
        //$("#zoomout").css("background", "url(Images/zoomout_un.png) 0 0 no-repeat")
        // } else {
        //zoomout = false;
        // $("#zoomout").css("background", "url(Images/zoomout.png) 0 0 no-repeat")
        zoomOut()
        // }
    })
    $("#positionReturn").click(function () {//xzj--20190419--母船位置回归
        motherShipPositionReturn();

    })
    $("#BoxSelection-type1 ").click(function () {//测距2018.8.8虞晨超
        $("div").remove(".measure-TooltipElement");
        map.removeLayer(sourceranging)
        if (boxselection == true) {
            map.removeInteraction(BoxSelectiondraw);
            boxselection = false
            $("#ol-BoxSelection").css("background", "url(Images/choose.png) 0 0 no-repeat");
        }
        if (ringvalue == "") {
            ringvalue = "lengthss"
            Olranging()
        } else {
            map.removeInteraction(olranging);
            $("#map").unbind('mousemove');
            if (ringvalue == "area") {
                ringvalue = "lengthss"
                Olranging()
            } else if (ringvalue == "lengthss") {
                ringvalue = ""
            }
        }
    })
    $("#BoxSelection-type2 ").click(function () {//测面积2018.8.8虞晨超
        map.removeLayer(sourceranging)
        if (boxselection == true) {
            map.removeInteraction(BoxSelectiondraw);
            boxselection = false
            $("#ol-BoxSelection").css("background", "url(Images/choose.png) 0 0 no-repeat")
        }
        if (ringvalue == "") {
            ringvalue = "area"
            Olranging()
        } else {
            map.removeInteraction(olranging);
            $("#map").unbind('mousemove');
            if (ringvalue == "lengthss") {
                ringvalue = "area"
                Olranging()
            } else if (ringvalue == "area") {
                ringvalue = ""
            }
        }
    })

    function Olranging() {//新建测距测面积draw2018.8.8虞晨超
        var type;
        var measureTooltipElement, measureTooltip;
        var count = 0;
        var ranging = new ol.source.Vector({
            wrapX: false
        })
        sourceranging = new ol.layer.Vector({
            source: ranging
        });
        map.addLayer(sourceranging)

        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: '#fff'
            }),
            stroke: new ol.style.Stroke({
                color: '#0099ff',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#0099ff'
                })
            })
        })
        if (ringvalue == "lengthss") {
            type = "LineString"
        } else if (ringvalue == "area") {
            type = "Polygon"
        }
        olranging = new ol.interaction.Draw({
            source: ranging,
            type: type,
            stopClick: true,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.4)'
                    //color: '#fff'
                }),
                stroke: new ol.style.Stroke({
                    color: '#0099ff',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: '#0099ff',
                    }),
                    fill: new ol.style.Fill({
                        color: '#0099ff',
                    })
                })
            })

        })

        function drawStart() {
            var coordinateLength = 2;
            sourceranging.getSource().clear();
            $("#map").mousemove(function (e) {
                var CoorDinates = olranging.sketchCoords_
                var Lengthss
                if (ringvalue == "lengthss") {
                    var LineString = new ol.geom.LineString()
                    LineString.setCoordinates(CoorDinates)
                    var lengths = LineString.getLength();
                    if (lengths > 1000) {
                        lengths = lengths / 1000

                        unit = 'km';
                    } else {
                        unit = 'm';
                    }
                    var c1 = CoorDinates[coordinateLength - 2];
                    var c2 = CoorDinates[coordinateLength - 1];
                    
                    var lastCoordinate = CoorDinates[CoorDinates.length - 1];
                    var lastbuoneCoordinate = CoorDinates[CoorDinates.length - 2];
                    Lengthss = (lengths).toFixed(3) + unit;
                    
                    if (CoorDinates.length > coordinateLength) {
                        setMeasureTooltip(c1, c2, false);
                        coordinateLength++;
                    }
                    setMeasureTooltip(lastCoordinate, lastbuoneCoordinate, true);



                } else if (ringvalue == "area") {
                    var plygon = new ol.geom.Polygon()
                    plygon.setCoordinates(CoorDinates)
                    var area = plygon.getArea();
                    if (area > 1000000) {
                        area = area / 1000000;
                        unit = 'km²';
                    } else {
                        unit = 'm²';
                    }
                    Lengthss = Math.round(area) + unit;
                } else {
                    Lengthss = ""
                }
                document.getElementById("mouse-position").innerHTML = Lengthss;
            });

        };

        function drawEnd() {
            $("#map").unbind('mousemove');

            $("div").remove(".measure-TooltipElement");
        
        }
             
        //创建测量提示
        function createMeasureTooltip(deg,isRemove) {
            if (measureTooltip && isRemove) {
                //measureTooltipElement.parentNode.parentNode.removeChild(measureTooltipElement.parentNode);
                //measureTooltipElement.parentNode.removeChild(measureTooltipElement);
                map.removeOverlay(measureTooltip);
            }
            measureTooltipElement = document.createElement('div');
            measureTooltipElement.classList.add("measure-TooltipElement");
            measureTooltipElement.style.cssText += 'transform:rotate(' + deg + 'deg);padding:5px;';
            measureTooltip = new ol.Overlay({
                id: 'temp' + count,
                element: measureTooltipElement,
                offset: [0, -15],
                positioning: 'center-bottom'
            });
            map.addOverlay(measureTooltip);
            count++;
            return [measureTooltipElement, measureTooltip];
        }

        //设置提示内容与位置
        function setMeasureTooltip(lastCoordinate, lastbuoneCoordinate, isRemove) {
            var offsetX = lastCoordinate[0] - lastbuoneCoordinate[0];
            var offsetY = lastCoordinate[1] - lastbuoneCoordinate[1];
            if (offsetX == 0) {
                offsetX = Math.pow(0.1, 10);
            }
            var degree = (Math.PI - Math.atan(offsetY / offsetX) - offsetX / Math.abs(offsetX) * Math.PI / 2) / Math.PI * 180;
            var distance = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2));
            var measureTooltip = createMeasureTooltip(degree > 180 ? Math.abs(degree - 180) - 90 : degree - 90, isRemove);

            measureTooltip[0].innerHTML = (distance/1000).toFixed(3) + 'km' + '<br/>' + degree.toFixed(0) + '°';
            var position = [(lastCoordinate[0] + lastbuoneCoordinate[0]) / 2, (lastCoordinate[1] + lastbuoneCoordinate[1]) / 2];
            measureTooltip[1].setPosition(position);
        }

        map.addInteraction(olranging);

        olranging.on('drawend', drawEnd);
        olranging.on('drawstart', drawStart);
    }


    function olBoxSelection() {//新建框选draw2018.8.8虞晨超
        BoxSelectiondraw = new ol.interaction.Draw({
            source: new ol.source.Vector({
                wrapX: false
            }),
            type: 'Circle',
            geometryFunction: ol.interaction.Draw.createBox(),
            stopClick: true,

        });
        function drawEnd() {
            var CoorDinates = BoxSelectiondraw.sketchCoords_
            var points;
            var myDate = new Date();

            var startCoordinates = ol.proj.transform(CoorDinates[0], 'EPSG:3857', 'EPSG:4326');
            var endCoordinates = ol.proj.transform(CoorDinates[1], 'EPSG:3857', 'EPSG:4326');

            myrectangle([Math.min(startCoordinates[0], endCoordinates[0]), Math.max(startCoordinates[0], endCoordinates[0]), Math.min(startCoordinates[1], endCoordinates[1]), Math.max(startCoordinates[1], endCoordinates[1])]);

            map.removeInteraction(BoxSelectiondraw);
            boxselection = false
            $("#ol-BoxSelection").css("background", "url(Images/choose.png) 0 0 no-repeat")
        }
        map.addInteraction(BoxSelectiondraw);
        BoxSelectiondraw.on('drawend', drawEnd);
    }
}

//重载人员信息
function ReLoadUser() {
    if (useprameters.hide_timeout_device) {
        if (hide_timeout_device != "" && hide_timeout_device != useprameters.hide_timeout_device) {
            //当隐藏不在线用户时关闭实时轨迹
            if (useprameters.hide_timeout_device) {
                ClearRealtimeTraceUsers();
            }
            //userLayer.getSource().clear();
        }
    }
    hide_timeout_device = useprameters.hide_timeout_device;
    var projection = ol.proj.get('EPSG:3857');
    var projectionExtent = projection.getExtent();

    var extent = map.getView().calculateExtent(map.getSize());

    var bottomLeft = ol.proj.transform(ol.extent.getBottomLeft(extent),
        'EPSG:3857', 'EPSG:4326');
    var topRight = ol.proj.transform(ol.extent.getTopRight(extent),
        'EPSG:3857', 'EPSG:4326');
        var loadType = 0;
    //xzj--20190325--当为海上系统时
    if (useprameters.SystemType == '2') {
        bottomLeft = [-180, -90];
        topRight = [180, 90];
        if ($("#chkMariner").is(":checked") && $("#chkShip").is(":checked")) {
            loadType = 0;
        } else if ($("#chkShip").is(":checked")) {
            loadType = 1;
        } else if ($("#chkMariner").is(":checked")) {
            loadType = 2;
        }
    }

    var device_timeout = "10";
    if (useprameters.device_timeout)
        device_timeout = useprameters.device_timeout;
    var myDate = new Date();
    var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
    var users = JSON.stringify(userArray);
    var param = {
        sec: sec,
        checkEntity: checkedEntity,
        bss: bottomLeft[0] + "," + topRight[0] + "," + bottomLeft[1] + "," + topRight[1] + "|||" + hide_timeout_device + "|" + device_timeout,
        func: "LoadDataToLayerControl",
        layers: "Police",
        must_display_user: must_display_user(),
        maxla: topRight[1],
        minla: bottomLeft[1],
        maxlo: topRight[0],
        minlo: bottomLeft[0],
        users: users,
        loadType:loadType
    };

    jquerygetNewData_ajax_post("WebGis/Service/LayerControl.aspx", param, function (request) {
        var data = request;
        var addData = [].concat(request.add, request.update);
        var addlength = addData.length;
        for (var i = 0; i < addlength; i++) {
            var p = addData[i];
            var lon = p.Longitude;
            var lat = p.Latitude;
            var entity = p.entity;
            var type = p.type;
            var gpsStatus = p.Send_reason;
            var sendTime = p.Send_time;
            var terminalType = p.terminalType;
            var terminalStatus = p.terminalStatus;
            var ipAddress = p.ipAddress;
            var info = p.Info;
            var ISSI = p.ISSI;
            var userId = p.ID;
            var msRssi = p.MsRssi;
            var ulRssi = p.UlRssi;
            var battery = p.Battery;
            var mobile = '';
            var zhiwu = '';
            var bz = '';
            var typeflag = p.CanvasIcons.length > 0 ? 2 : 1;
            var canvasIcons = p.CanvasIcons;
            var canvasColor = p.Color;
            var length = parseFloat(p.Length);
            var width = parseFloat(p.Width);
            var shiptype = parseInt(p.ShipType);
            var l = length > width ? length : width;

            var date = new Date();
            var msSendTime = Date.parse(new Date(sendTime.replace(/-/g, "/")));
            var internalSeconds = (date.getTime() - msSendTime) / 1000  //时间差的秒数

            //document.getElementById("preview").src = myMap.get(type + "_1").toDataURL('image/png', 1);
            var imgsrc1,imgsrc2;

            var coordinate = ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857');
            var positionIndex = 12;
            var coordinate1 = null;
            var degree = 0;
            var featurePolice = userLayer.getSource().getFeatureById("p" + userId);
            var featureTxt = userLayer.getSource().getFeatureById("head" + userId);
            if (featurePolice) {
                var p = featurePolice.get("person");
                var lon1 = p.lon;
                var lat1 = p.lat;
                coordinate1 = ol.proj.transform([parseFloat(lon1), parseFloat(lat1)], 'EPSG:4326', 'EPSG:3857');
                positionIndex = p.direction;
                degree = p.degree;
            }

            if (typeflag == 1) {//当加载数据为人员时
                positionIndex = getUserDirection(coordinate1, coordinate, positionIndex);
            } else if (typeflag == 2) {//当加载数据为船舶时
                positionIndex = 0;
                degree = getShipAspect(coordinate1, coordinate, degree);
            }

            var imageInfos = drawUserImages(type, internalSeconds, device_timeout, positionIndex, canvasIcons, canvasColor, typeflag, l, degree);
            
            if (!imageInfos.imageArray) {
                break;
            }

            var trace = new RealTimeTrace(userId, ISSI, "#fff", 2);
            var isRealTimeTrace = false;
            //if (featurePolice) {
            //    trace = featurePolice.values_.person.realTimeTrace;
            //    if (featurePolice.values_.person.isRealTimeTrace)
            //        isRealTimeTrace = featurePolice.values_.person.isRealTimeTrace;
            //}
            RealTimeTraceArray.forEach(function (val) {
                if (val.id == userId) {
                    trace = val;
                    isRealTimeTrace = true;
                }
            });    


            //-----------------------------end--------------------------------------------------------
            var Person = new Personinfo(info, entity, ISSI, type, lat, lon, gpsStatus, sendTime, terminalType, terminalStatus, ipAddress, mobile, zhiwu, bz, userId, trace, isRealTimeTrace, "new",
            positionIndex, msRssi, ulRssi, battery, imageInfos.isOnline, canvasIcons, canvasColor, length, width, shiptype, degree);
            var userfeature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857')),
                person: Person,
                typeflag: typeflag,//点要素类型表示，1表示警员，2表示船舶
                imageSize: imageSize,
                layer: "police",
                name: "p" + ISSI,
                id: "p" + userId
            });
            userfeature.setId("p" + userId);
            userfeature.setStyle(new ol.style.Style({
                image: imageInfos.imageArray[0]
            }));
            var headTxt = getHeadInfo(addData[i]);
            var scale = getCurrentScale(1);
            var offsetY = scale * (-imageSize / 2 - 26);
            if (typeflag == 2) {
                scale = getScaleByResolution(map.getView(), imageSize, l);
                offsetY = -scale * (imageSize + 70) / 2;
            }
            var txtfeature = new ol.Feature({
                  geometry: new ol.geom.Point(ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857')),
                  typeflag: typeflag,
                  imageSize: imageSize,
                  length: length,
                  width: width
            });
            var txtColor = useprameters.HeadInfo_FontColor;
            var txtFont = useprameters.HeadInfo_FontSize + " serif";
            txtfeature.setId("head" + userId);
            txtfeature.setStyle(
                new ol.style.Style({
                    text: new ol.style.Text({
                        text: headTxt,
                        font: txtFont,
                        offsetX: 0,
                        offsetY: offsetY,
                        scale: scale,
                        fill: new ol.style.Fill({
                            color: txtColor
                        })
                    })
                }));
                if (featurePolice && (coordinate1[0] != coordinate[0] || coordinate1[1] != coordinate[1])) {
                    userMoveAnimate(userId, [featurePolice, featureTxt], [userfeature, txtfeature], imageInfos.imageArray, Person, coordinate1, coordinate);
                } else {
                    addUserFeature(userfeature, txtfeature, Person, userId);
                }
        }
        var removeData = request.remove;
        removeData.forEach(function (p) {
            removeUser(p.ID, true);
        });
    });
}

function ClearRealtimeTraceUsers() {
    var Ids = useprameters.realtimeTraceUserIds;
    for (var i = 0; i < Ids.length; i++) {
        var layers = map.getLayers();
        var l = map.getLayerById("realTime" + Ids[i]);
        if (l)
            map.removeLayer(l);
    }
    useprameters.realtimeTraceUserIds = [];
    RealTimeTraceArray.splice(0, RealTimeTraceArray.length);
    
}

var drawUserImages = function (policeType, internalSeconds, device_timeout, positionIndex, canvasIcons, canvasColor, typeflag, length, degree) {
        var imageArray = new Array();
        var isOnline = true;
        var str;
        if (internalSeconds < device_timeout * 60) {
            //在线
            if (typeof (myMap.get(policeType + "_1_" + positionIndex)) != "undefined") {
                str = "_1_";
                isOnline = true;
            }else{
                return null;
            }
            if (typeflag == 2 && typeof (myMap.get(policeType + "_1_" + canvasColor + positionIndex)) == "undefined") {//如果无船舶图形，而有船舶的图形字符串，进行绘制并存储到Map中
                var pointsJson = JSON.parse(canvasIcons);
                var shipCanvas = ShipCanvas.createShipCanvas(pointsJson, imageSize, imageSize, {
                    backgroundColor: "rgba(255,255,255,0)",
                    fillStyle: canvasColor,
                    strokeStyle: "rgba(255,255,255,0)"
                });
                myMap.set(policeType + "_1_" + canvasColor + 0, shipCanvas);
                myMap.set(policeType + "_1_" + canvasColor + 1, shipCanvas);
                str = "_1_";
                isOnline = true;
            }
        }
        else {
            //不在线
            if (typeof (myMap.get(policeType + "_2_" + positionIndex)) != "undefined") {
                str = "_2_";
                isOnline = false;
            }
            else {
                return null;
            }
            if (typeflag == 2 && typeof (myMap.get(policeType + "_2_" + canvasColor + positionIndex)) == "undefined") {//如果无船舶图形，而有船舶的图形字符串，进行绘制并存储到Map中
                var pointsJson = JSON.parse(canvasIcons);
                var shipCanvas = ShipCanvas.createShipCanvas(pointsJson, imageSize, imageSize, {
                    backgroundColor: "rgba(255,255,255,0)",
                    fillStyle: canvasColor,
                    strokeStyle: "rgba(255,255,255,0)",
                    isDrawLine: true
                });
                myMap.set(policeType + "_2_" + canvasColor + 0, shipCanvas);
                myMap.set(policeType + "_2_" + canvasColor + 1, shipCanvas);
                str = "_2_";
                isOnline = true;
        }
    }

    var array;
    if (typeflag == 2) {//当为船舶时,Map的key多一个颜色
        array = canvasMap.get(policeType + str + canvasColor + positionIndex + degree + length);//xzj--20190709--添加长度用于区分,否则船舶大小无效
    } else {
        array = canvasMap.get(policeType + str + positionIndex + degree);
    }

        if (!array) {
            var imgArray = new Array();
            var img1, img2;
            if (typeflag == 2) {//当为船舶时,Map的key多一个颜色
                img1 = myMap.get(policeType + str + canvasColor + positionIndex);
                img2 = myMap.get(policeType + str + canvasColor + (positionIndex + 1));
            } else {
                img1 = myMap.get(policeType + str + positionIndex);
                img2 = myMap.get(policeType + str + (positionIndex + 1));
            }

            imgArray.push(img1);
            imgArray.push(img2);
            imgArray.forEach(function (canvas) {
                var scale = getCurrentScale(1);
                if (typeflag == 2) {//当为船舶时
                    scale = getScaleByResolution(map.getView(), imageSize, length);
                }
                var imageStyle = new ol.style.Icon({
                    img: canvas,
                    scale: scale,
                    imgSize: [imageSize, imageSize],
                    rotation: degree
                });
                imageArray.push(imageStyle);
            });
                if (typeflag == 2) {
                    canvasMap.set(policeType + str + canvasColor + positionIndex + degree + length, imageArray);//xzj--20190709--添加长度用于区分,否则船舶大小无效
                } else {
                    canvasMap.set(policeType + str + positionIndex + degree, imageArray);
                }
            } else {
            imageArray = array;
        }
        return { "imageArray": imageArray, "isOnline": isOnline };
    }


var addUserFeature = function (userFeature, txtFeature, person, userId) {
    removeUser(userId, false);
    var isOpenheadInfo = useprameters.IsOpenUserHeaderInfo;
    userLayer.getSource().addFeature(userFeature);
    var scale = getCurrentScale(1);
    var offsetY = scale * (-imageSize / 2 - 26);
    if (userFeature.get('typeflag') == 2) {//当为船舶时
        var p = userFeature.get('person');
        var l = p.length > p.width ? p.length : p.width;
        scale = getScaleByResolution(map.getView(), imageSize, l);
        offsetY = -scale * (imageSize + 70) / 2;
    }
    userFeature.getStyle().getImage().setScale(scale);//当快速缩放时，重新设置图片scale
    if (isOpenheadInfo == "open") {
        txtFeature.getStyle().getText().setScale(scale);
        txtFeature.getStyle().getText().setOffsetY(offsetY);
        userLayer.getSource().addFeature(txtFeature);
    }
    addAllSelctUsersFlag();
    initLockUserFlag(person);
    addConcernUsersFlag(userId, 1);
    AddPeruserRealtimeTrace_line(userId);
    fsLayerManager.loadFeature([userFeature, txtFeature]);
    addUserArray(userId);
}

//用户地图移动动画
var userMoveAnimate = function (userId, oldfeatures, newfeatures, imageArray, person, from, to) {
        //当人员开始移动时，再次加载不影响本次移动
        if (!oldfeatures[0].moving) {
            oldfeatures[0].moving = true;
        } else {
            return;
        }
    
        var isResetOverlay = false;//人员的双击提示信息跟着人员走动
    if (overlay.getPosition()) {
        if (parseInt(overlay.getPosition()[0]) == parseInt(from[0]) && parseInt(overlay.getPosition()[1]) == parseInt(from[1])) {
            isResetOverlay = true;
        }
    }
    
    var totalTime = 1000;
    var stepNum = parseInt(Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)) / 10);
    if (stepNum < 2)
    {
        stepNum = 2;
    }
    var stepx = (to[0] - from[0]) / stepNum, stepy = (to[1] - from[1]) / stepNum;
    var position = from;
    var stepCount = 0
    var userMoveItv = setInterval(function () {
        if (stepCount > stepNum - 2) {
            clearInterval(userMoveItv);
            addUserFeature(newfeatures[0], newfeatures[1], person, userId);
            if (isResetOverlay) {
                overlay.setPosition(to);
            }
        }
        position = [position[0] + stepx, position[1] + stepy];
        var geometry = new ol.geom.Point(position);
        oldfeatures[0].setGeometry(geometry);
        if (oldfeatures[1]) {
            oldfeatures[1].setGeometry(geometry);
        }
        var scale = getCurrentScale(1);
        if (newfeatures[0].get('typeflag') == 2) {//要素为船舶时
            var p = newfeatures[0].get('person');
            var shiptype = p.shipType;//船舶是否为母船，1表示母船，2表示子船
            var id = p.userId;
            var l = p.length > p.width ? p.length : p.width;
            scale = getScaleByResolution(map.getView(), imageSize, l);
            pickLines.resetCoordiantes(id, shiptype, position);//船舶移动，重置拾取线位置
        }
        (imageArray[stepCount % 2]).setScale(scale);
        oldfeatures[0].getStyle().setImage(imageArray[stepCount % 2]);
        fsLayerManager.loadFeature(oldfeatures);
        resetAllFlagPosition(userId, position, isResetOverlay);//人员移动，重置所有标签
        var coordinate = newfeatures[0].getGeometry().flatCoordinates.concat();//复制一份新的坐标

        stepCount++;
    }, totalTime / stepNum);
}

//添加用户数组
var addUserArray = function (id) {
    var source = userLayer.getSource();
    var feature = source.getFeatureById("p" + id);
    if (feature) {
        var person = feature.get("person");
        userArray.push({
            "ID": person.userId, "Info": person.info, "ISSI": person.issi, "Latitude": person.lat, "Longitude": person.lon,
            "Send_reason": person.gpsStatus, "Send_time": person.sendTime, "type": person.type, "terminalType": person.terminalType,
            "enity": person.entity, "MsRssi": person.msRssi, "UlRssi": person.ulRssi, "Battery": person.battery,
            "terminalStatus": person.terminalStatus, "ipAddress": person.ipAddress, "online": person.online, "CanvasIcons": person.canvasIcons,
            "Color": person.color, "Length": person.length.toString(), "Width": person.width.toString(), "ShipType": person.shipType.toString(),
        });
    }
}

//删除用户数组
var removeUserArray = function (id) {
    var source = userLayer.getSource();
    var feature = source.getFeatureById("p" + id);
    if (!feature) {
        userArray.forEach(function (v,i) {
            if (v.ID == id) {
                userArray.splice(i, 1);
            }
        });
    }
}

var setting = {        //zTree 插件配置
    view: {
        selectedMulti: false
    },
    check: {
        enable: true
    },
    data: {
        simpleData: {
            enable: true
        }
    },
    callback: {
        onCheck: onCheck,
        onClick: onClick
    }
};

var myDate = new Date();
var sec = myDate.getSeconds().toString() + myDate.getMilliseconds().toString();
var param = {
    sec: sec
};
$(function () {
    jquerygetNewData_ajax_post("/WebGis/Service/getEntiybyID.aspx", param, function (msg) {
        var zNodes = msg;
        $.fn.zTree.init($("#treeDemo"), setting, zNodes);
        setCheck();
        $("#py").bind("change", setCheck);
        $("#sy").bind("change", setCheck);
        $("#pn").bind("change", setCheck);
        $("#sn").bind("change", setCheck);
        $("#zTree img").click(function () {
            if ($('#zTree').css('left') == "0px") {
                $("#zTree").animate({ left: '-195px' });
                $("#zTree img").removeClass('img1').addClass('img2');
            } else {
                $("#zTree").animate({ left: '0px' });
                $("#zTree img").removeClass('img2').addClass('img1');
            }
        })

        var zTree = $.fn.zTree.getZTreeObj("treeDemo")
        zTree.checkAllNodes(true);//默认初始全选
    });
})
//var zNodes = [        //模拟数据

//    { id: 1, pId: 0, name: "Entity Lists", open: true },
//    { id: 11, pId: 1, name: "Unit Name", open: true },
//    { id: 111, pId: 11, name: "直属", open: true },
//    { id: 1111, pId: 111, name: "城管aas" },
//    { id: 112, pId: 11, name: "东方通信", open: true },
//    { id: 1121, pId: 112, name: "直属", open: true },
//    { id: 11211, pId: 1121, name: "城管aas" },
//    { id: 11212, pId: 1121, name: "武警" },
//    { id: 1122, pId: 112, name: "东方软件", open: true },
//    { id: 11221, pId: 1122, name: "直属", open: true },
//    //{ id: 112211, pId: 11221, name: "城管ass" }
//];
function onCheck(e, treeId, treeNode) {
    onClick(e, treeId, treeNode)
    ReLoadUser();
}
function onClick(e, treeId, treeNode) {   //单机勾选后回调函数
    //但无该节点全部权限，checkbox无法勾选，节点无法选中
    if (treeNode.chkDisabled) {
        var tree = this.getZTreeObj(treeId);
        tree.cancelSelectedNode(treeNode);
        return;
    }

    if (treeNode.objType == "entity") {
        displaypolicelistsdiv();
        window.frames['policelists'].Displayprocessbar();
        window.frames['policelists'].getpolices(treeNode.name, treeNode.entityId);
        window.frames['policelists'].createpolicetable_ajax(treeNode.objType, treeNode.entityId, "");
    }
    if (treeNode.objType == "zhishuuser") {
        displaypolicelistsdiv();
        window.frames['policelists'].Displayprocessbar();
        window.frames['policelists'].getpolices(treeNode.name, "");
        window.frames['policelists'].createpolicetable_ajax(treeNode.objType, treeNode.entityId, "");
    }
    if (treeNode.objType == "usertype") {
        displaypolicelistsdiv();
        window.frames['policelists'].Displayprocessbar();
        window.frames['policelists'].getpolices(treeNode.name, treeNode.entityId);
        window.frames['policelists'].createpolicetable_ajax(treeNode.objType, treeNode.name, treeNode.entityId);
    }
    var zTree = $.fn.zTree.getZTreeObj("treeDemo")
    var Znodes = zTree.getCheckedNodes(true);
    
    checkedEntity = "";
    var arr1 = new Array()
    var arr2 = new Array()
    var arr3 = new Array()
    // var halfCheck = Znodes[0].getCheckStatus();
    for (var i = 0; i < Znodes.length; i++) {
        var halfCheck = Znodes[i].getCheckStatus();
        if (halfCheck.half) {
            // TreeArray[Type].splice($.inArray(Znodes[i].id, TreeArray[Type]), 1);
            //$obj["tree_" + TreeStrArray[Type]].removeNode(Znodes[i]);
            delete Znodes[i]
        }
    }
    for (var i = 0; i < Znodes.length; i++) {
        if (typeof Znodes[i] != "undefined") {
            if (Znodes[i].getParentNode()) {
                var pnode = Znodes[i].getParentNode().getCheckStatus();
                pnode = pnode || { half: true };
                if (pnode.half) {
                    if (Znodes[i].name != GetTextByName("Lang_zhishu")) {
                        if (Znodes[i].typeId) {
                            if (arr2.indexOf(Znodes[i].entityId) == -1 && arr1.indexOf(Znodes[i].entityId) == -1) {
                                arr3.push(Znodes[i].entityId + ":" + Znodes[i].typeId)
                            }
                        } else {
                            arr2.push(Znodes[i].entityId)
                        }
                    } else {
                        if (arr2.indexOf(Znodes[i].entityId) == -1) {
                            arr1.push(Znodes[i].entityId)
                        }

                    }
                }
            } else {
                arr2.push(Znodes[i].entityId)

            }
        }
    }
    var a1 = ""
    var a2 = ""
    if (arr1.toString() != "") { a1 += arr1.toString() + "," }
    if (arr2.toString() != "") { a2 += arr2.toString() + "," }
    checkedEntity = a1 + "/" + a2 + "/"
    for (var i = 0; i < arr3.length; i++) { checkedEntity += arr3[i].toString() + ";" }


    //console.log(checkedEntity)//xzj--20190418--注释输出
}

var code;

function setCheck() {
    var zTree = $.fn.zTree.getZTreeObj("treeDemo"),
    py = $("#py").attr("checked") ? "p" : "",
    sy = $("#sy").attr("checked") ? "s" : "",
    pn = $("#pn").attr("checked") ? "p" : "",
    sn = $("#sn").attr("checked") ? "s" : "";
    //type = { "Y": ps, "N": ps };
    //zTree.setting.check.chkboxType = type;
    //showCode('setting.check.chkboxType = { "Y" : "' + type.Y + '", "N" : "' + type.N + '" };');
}
function showCode(str) {
    if (!code) code = $("#code");
    code.empty();
    code.append("<li>" + str + "</li>");
}

//$(document).ready(function () {
//    $.fn.zTree.init($("#treeDemo"), setting, zNodes);
//    setCheck();
//    $("#py").bind("change", setCheck);
//    $("#sy").bind("change", setCheck);
//    $("#pn").bind("change", setCheck);
//    $("#sn").bind("change", setCheck);

//    $("#zTree img").click(function () {
//        if ($('#zTree').css('left') == "0px") {
//            $("#zTree").animate({ left: '-195px' });
//            $("#zTree img").removeClass('img1').addClass('img2');
//        } else {
//            $("#zTree").animate({ left: '0px' });
//            $("#zTree img").removeClass('img2').addClass('img1');
//        }
//    })

//    $(".sub_li_1").mouseover(function () {
//        $(this).children("ul").css("display","block")
//    })
//    $(".sub_li_1").mouseout(function () {
//        $(this).children("ul").css("display", "none")
//    })
//});
//var dwWaveTimer = null;
//var dwTimeout = null;
function LocatePerUser(id, ISSI, Lo, La, isOnline) {
    var coord = ol.proj.transform([parseFloat(Lo), parseFloat(La)], 'EPSG:4326', 'EPSG:3857');
    
    if (isOnline) {
        mapLocateEvent.locate(coord, 10000);
    } else {
        var view = map.getView();
        var clientW = document.getElementById("map").clientWidth;
        var clientH = document.getElementById("map").clientHeight;
        view.centerOn(ol.proj.transform([parseFloat(Lo), parseFloat(La)], 'EPSG:4326', 'EPSG:3857'), [clientW, clientH], [clientW / 2, clientH / 2]);
    }
}

function resetAllFlagPosition(userId, position, isResetOverlay) {
    var featureSelcetIcon = userLayer.getSource().getFeatureById("selectIcon" + userId);
    var featureConcernIcon = userLayer.getSource().getFeatureById("concern" + userId);
    var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
    var geometry = new ol.geom.Point(position);
    if (featureSelcetIcon) {
        featureSelcetIcon.setGeometry(geometry);
    }
    if (featureConcernIcon) {
        featureConcernIcon.setGeometry(geometry);
    }
    if (featureLockIcon) {
        featureLockIcon.setGeometry(geometry);
    }
    if (isResetOverlay) {
        overlay.setPosition(position);
    }
}

function addConcernUsersFlag(userId, type) {

    //var userId = person.userId;

    var feature = userLayer.getSource().getFeatureById("p" + userId);
    if (!feature)
        return;
    var lat = feature.values_.person.lat;
    var lon = feature.values_.person.lon;
    var coordinate = ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857');
    var isConcenrn = false;
    if (type == 1) {
        for (var k = 0; k < useprameters.concernusers_array.length; k++) {
            if (useprameters.concernusers_array[k] == userId) {
                isConcenrn = true;
                break;
            }
        }
        if (!isConcenrn)
            return;
    }

    var featureSelcetIcon = userLayer.getSource().getFeatureById("selectIcon" + userId);
    var featureConcernIcon = userLayer.getSource().getFeatureById("concern" + userId);
    var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
    if (featureConcernIcon)
        return;

    //var lonlat = "[" + lat + "," + lon + "]";
    //lonlat = eval("(" + lonlat + ")");
    var mm = coordinate;
    var pixelCoord = map.getPixelFromCoordinate(mm);

    var pixelCoord = "[" + (pixelCoord[0]) + "," + (pixelCoord[1]) + "]";
    var obj2 = eval("(" + pixelCoord + ")");
    featureCoord = map.getCoordinateFromPixel(obj2);
    
    var scale = getCurrentScale(0.8);
    if (feature.get('typeflag') == 2) {//单位船舶时
        scale = getScaleByResolution(map.getView(), 20, 60);
    }

    var flagIcon = new ol.Feature({
        geometry: new ol.geom.Point(featureCoord),
        name: "concern" + userId,
        typeflag: feature.get('typeflag'),
        length: 60
    });
    var x = -0.5;
    var y = 1.5;
    if (featureSelcetIcon) {
        if (featureLockIcon) {
            //存在锁定用户
            flagIcon.setId("concern" + userId);
            flagIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/guanzhu.png',
                    anchor: [x, y - 1.2 * 2],
                    scale: scale
                })
            }));
            userLayer.getSource().addFeature(flagIcon);
        }
        else {
            //不存在锁定用户-ok
            flagIcon.setId("concern" + userId);
            flagIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/guanzhu.png',
                    anchor: [x, y - 1.2],
                    scale: scale
                })
            }));
            userLayer.getSource().addFeature(flagIcon);
        }

    }
    else {
        //不存在选中用户
        if (featureLockIcon) {
            //存在锁定用户
            flagIcon.setId("concern" + userId);
            flagIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/guanzhu.png',
                    anchor: [x, y - 1.2],
                    scale: scale
                })
            }));
            userLayer.getSource().addFeature(flagIcon);
        }
        else {
            //不存在锁定用户-ok
            flagIcon.setId("concern" + userId);
            flagIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/guanzhu.png',
                    anchor: [x, y],
                    scale: scale
                })
            }));
            userLayer.getSource().addFeature(flagIcon);
        }

    }
}
function removeSelectUsersFlag(userId) {

    //删除所有选中图标
    var features = userLayer.getSource().getFeatures();
    for (var k = 0; k < features.length ; k++) {
        if (features[k].values_.layer == "police") {
            var ff = userLayer.getSource().getFeatureById("selectIcon" + features[k].values_.person.userId);
            if (ff != null)
                userLayer.getSource().removeFeature(ff);
        }
    }
    //重新排序关注、锁定按钮
    var Selectid = useprameters.Selectid;
    var SelectISSI = useprameters.SelectISSI;
    var num = Selectid.length;
    for (var i = 0; i < num; i++) {
        userId1 = Selectid[i];
        //delSelectUserVar(Selectid[i], SelectISSI[i]);

        var featureConcerIcon = userLayer.getSource().getFeatureById("concern" + userId1);
        var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId1);
        var feature = userLayer.getSource().getFeatureById("p" + userId1);
        var x = -0.5;
        var y = 1.5;
        var scale = getCurrentScale(0.8);
        if (feature.get('typeflag') == 2) {//单位船舶时
            scale = getScaleByResolution(map.getView(), 20, 60);
        }

        if (featureConcerIcon) {

            var flatCoordinates = featureConcerIcon.values_.geometry.flatCoordinates;
            userLayer.getSource().removeFeature(featureConcerIcon);


            //添加关注图标
            var concerIcon = new ol.Feature({
                geometry: new ol.geom.Point(flatCoordinates),
                 name: "concern" + userId1,
                typeflag: feature.get('typeflag'),
                length: 60
            });
            concerIcon.setId("concern" + userId1);
            concerIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/guanzhu.png',
                    scale: scale,
                    size: [20, 20],
                    anchor: [x, y]
                })
            }));
            userLayer.getSource().addFeature(concerIcon);
        }
        if (featureLockIcon) {
            var flatCoordinates = featureLockIcon.values_.geometry.flatCoordinates;
            userLayer.getSource().removeFeature(featureLockIcon);
            if (featureConcerIcon)
                y = y - 1.2;
            //添加锁定图标
            var lockIcon = new ol.Feature({
                geometry: new ol.geom.Point(flatCoordinates),
                name: "lock" + userId1,
                typeflag: feature.get('typeflag'),
                length: 60
            });
            lockIcon.setId("lock" + userId1);
            lockIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/lockbzpic.png',
                    scale: scale,
                    size: [20, 20],
                    anchor: [x, y]
                })
            }));
            userLayer.getSource().addFeature(lockIcon);
        }
    }

}
function removeConcernUsersFlag(userId) {
    var featureConcernIcon = userLayer.getSource().getFeatureById("concern" + userId);
    if (!featureConcernIcon)
        return;
    userLayer.getSource().removeFeature(featureConcernIcon);

    var featureSelcetIcon = userLayer.getSource().getFeatureById("selectIcon" + userId);
    var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
    var feature = userLayer.getSource().getFeatureById("p" + userId);
    var x = -0.5;
    var y = 1.5;
    var scale = getCurrentScale(0.8);
    if (feature.get('typeflag') == 2) {//单位船舶时
        scale = getScaleByResolution(map.getView(), 20, 60);
    }
    if (featureSelcetIcon) {
        var scale = featureSelcetIcon.getStyle().getImage().getScale();
        var flatCoordinates = featureSelcetIcon.values_.geometry.flatCoordinates;
        userLayer.getSource().removeFeature(featureSelcetIcon);

        //添加选中图标
        var selectIcon = new ol.Feature({
            geometry: new ol.geom.Point(flatCoordinates),
            name: "selectIcon" + userId,
            typeflag: feature.get('typeflag'),
            length: 60
        });
        selectIcon.setId("selectIcon" + userId);
        selectIcon.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                src: '/images/layer/selectover.png',
                scale: scale,
                size: [20, 20],
                anchor: [x, y]
            })
        }));
        userLayer.getSource().addFeature(selectIcon);
    }
    if (featureLockIcon) {
        var flatCoordinates = featureLockIcon.values_.geometry.flatCoordinates;
        userLayer.getSource().removeFeature(featureLockIcon);
        if (featureSelcetIcon)
            y = y - 1.2;
        //添加锁定图标
        var lockIcon = new ol.Feature({
            geometry: new ol.geom.Point(flatCoordinates),
            name: "lock" + userId,
            typeflag: feature.get('typeflag'),
            length: 60
        });
        lockIcon.setId("lock" + userId);
        lockIcon.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                src: '/images/layer/lockbzpic.png',
                scale: scale,
                size: [20, 20],
                anchor: [x, y]
            })
        }));
        userLayer.getSource().addFeature(lockIcon);
    }
}
function addLockUserFlag(userId) {
    removeLockUsersFlag();
    useprameters.lockid = userId;
    var featureSelcetIcon = userLayer.getSource().getFeatureById("selectIcon" + userId);
    var featureConcernIcon = userLayer.getSource().getFeatureById("concern" + userId);
    var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
    var feature = userLayer.getSource().getFeatureById("p" + userId);
    if (featureLockIcon)
        return;
        //var feature = userLayer.getSource().getFeatureById("p" + userId);
    //var featureCoord = feature.values_.geometry.flatCoordinates;
    var param = { "id": userId };
    jquerygetNewData_ajax("WebGis/Service/getlola_byID.aspx", param, function (request) {
        var _data = request;
        if (_data) {
            var isOnline = true;
            var send_time = _data.Send_time;
            if (useprameters.hide_timeout_device == 'True') {
                var interval = (new Date()) - (new Date(send_time));
                var device_timeout = "10";
                if (useprameters.device_timeout) {
                    device_timeout = useprameters.device_timeout;
                }
                if (interval > device_timeout * 60 * 1000) {
                    isOnline = false;
                }
            }
            var featureCoord = ol.proj.transform([parseFloat(_data.lo), parseFloat(_data.la)], 'EPSG:4326', 'EPSG:3857')
            if (isOnline) {
                var scale = getCurrentScale(0.8);
                if (feature.get('typeflag') == 2) {
                    scale = getScaleByResolution(map.getView(), 20, 60);
                }

    var lockIcon = new ol.Feature({
        geometry: new ol.geom.Point(featureCoord),
         name: "lock" + userId,
        typeflag: feature.get('typeflag'),
        length: 60
    });
    lockIcon.setId("lock" + userId);
    var x = -0.5;
    var y = 1.5;

    if (featureSelcetIcon) {
        if (featureConcernIcon) {
            //添加选中图标
            lockIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/lockbzpic.png',
                    scale: scale,
                    size: [20, 20],
                    anchor: [x, y - 1.2 * 2]
                })
            }));
            userLayer.getSource().addFeature(lockIcon);
        }
        else {
            //添加选中图标
            lockIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/lockbzpic.png',
                    scale: scale,
                    size: [20, 20],
                    anchor: [x, y - 1.2]
                })
            }));
            userLayer.getSource().addFeature(lockIcon);
        }

    }
    else {
        if (featureConcernIcon) {
            //添加选中图标
            lockIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/lockbzpic.png',
                    scale: scale,
                    size: [20, 20],
                    anchor: [x, y - 1.2]
                })
            }));
            userLayer.getSource().addFeature(lockIcon);
        }
        else {
            //添加选中图标
            lockIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/lockbzpic.png',
                    scale: scale,
                    size: [20, 20],
                    anchor: [x, y]
                })
            }));
            userLayer.getSource().addFeature(lockIcon);
        }

    }
    disableMove();
    moveCenter(featureCoord);//cxy-20180723-首次锁定移动到中心
}
}
});


}
function initLockUserFlag(person) {

    var userId = person.userId;
    var coordinate = ol.proj.transform([parseFloat(person.lon), parseFloat(person.lat)], 'EPSG:4326', 'EPSG:3857');
    if (useprameters.lockid == userId) {
        var featureSelcetIcon = userLayer.getSource().getFeatureById("selectIcon" + userId);
        var featureConcernIcon = userLayer.getSource().getFeatureById("concern" + userId);
        var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
        if (featureLockIcon)
            return;
        var feature = userLayer.getSource().getFeatureById("p" + userId);
        var featureCoord = coordinate;
        var lockIcon = new ol.Feature({
            geometry: new ol.geom.Point(featureCoord),
            name: "lock" + userId,
            typeflag: feature.get('typeflag'),
            length: 60
        });
        lockIcon.setId("lock" + userId);
        var x = -0.5;
        var y = 1.5;
        var scale = getCurrentScale(0.8);
        if (feature.get('typeflag') == 2) {
            scale = getScaleByResolution(map.getView(), 20, 60);
        }
        if (featureSelcetIcon) {
            if (featureConcernIcon) {
                //添加选中图标
                lockIcon.setStyle(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '/images/layer/lockbzpic.png',
                        scale: scale,
                        size: [20, 20],
                        anchor: [x, y - 1.2 * 2]
                    })
                }));
                userLayer.getSource().addFeature(lockIcon);
            }
            else {
                //添加选中图标
                lockIcon.setStyle(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '/images/layer/lockbzpic.png',
                        scale: scale,
                        size: [20, 20],
                        anchor: [x, y - 1.2]
                    })
                }));
                userLayer.getSource().addFeature(lockIcon);
            }

        }
        else {
            if (featureConcernIcon) {
                //添加选中图标
                lockIcon.setStyle(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '/images/layer/lockbzpic.png',
                        scale: scale,
                        size: [20, 20],
                        anchor: [x, y - 1.2]
                    })
                }));
                userLayer.getSource().addFeature(lockIcon);
            }
            else {
                //添加选中图标
                lockIcon.setStyle(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '/images/layer/lockbzpic.png',
                        scale: scale,
                        size: [20, 20],
                        anchor: [x, y]
                    })
                }));
                userLayer.getSource().addFeature(lockIcon);
            }

        }
        disableMove();
    }
}

//cxy-20180723-添加锁定用户移出范围是自动平移至中心功能
function moveCenter(coordinate) {
    var coord = null;
    if (useprameters.lockid > 0) {
        var lockedFeature = userLayer.getSource().getFeatureById("p" + useprameters.lockid);
        if (coordinate) {
            coord = coordinate;
        } else {
            coord = ol.proj.transform([parseFloat(useprameters.lo), parseFloat(useprameters.la)], 'EPSG:4326', 'EPSG:3857');
        }

    } else {
        return;
    }

    var currentExtent = map.getView().calculateExtent();
    if (!coord) {
        return;
    }

    if (coord[0] < currentExtent[0] || coord[0] > currentExtent[2] || coord[1] < currentExtent[1] || coord[1] > currentExtent[3]) {
        map.getView().setCenter(coord);
    }
}

function removeLockUsersFlag() {
    var lockId = useprameters.lockid;
    useprameters.lockid = 0;
    var featureLockIcon = userLayer.getSource().getFeatureById("lock" + lockId);
    if (!featureLockIcon)
        return;
    userLayer.getSource().removeFeature(featureLockIcon);
    var x = -0.5;
    var y = 1.5;
    var featureConcerIcon = userLayer.getSource().getFeatureById("concern" + lockId);
    var featureselectIcon = userLayer.getSource().getFeatureById("selectIcon" + lockId);
    var feature = userLayer.getSource().getFeatureById("p" + lockId);
    var scale = getCurrentScale(0.8);
    if (feature.get('typeflag') == 2) {
        scale = getScaleByResolution(map.getView(), 20, 60);
    }
    if (featureselectIcon) {
        var flatCoordinates = featureselectIcon.values_.geometry.flatCoordinates;
        userLayer.getSource().removeFeature(featureselectIcon);

        //添加选中图标
        var selectIcon = new ol.Feature({
            geometry: new ol.geom.Point(flatCoordinates),
            name: "selectIcon" + lockId,
            typeflag: feature.get('typeflag'),
            length: 60
        });
        selectIcon.setId("selectIcon" + lockId);
        selectIcon.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                src: '/images/layer/selectover.png',
                scale: scale,
                size: [20, 20],
                anchor: [x, y]
            })
        }));
        userLayer.getSource().addFeature(selectIcon);
    }
    if (featureConcerIcon) {
        var flatCoordinates = featureConcerIcon.values_.geometry.flatCoordinates;
        userLayer.getSource().removeFeature(featureConcerIcon);
        if (featureselectIcon)
            y = y - 1.2;
        //添加关注图标
        var concerIcon = new ol.Feature({
            geometry: new ol.geom.Point(flatCoordinates),
            name: "concern" + lockId,
            typeflag: feature.get('typeflag'),
            length: 60
        });
        concerIcon.setId("concern" + lockId);
        concerIcon.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                src: '/images/layer/guanzhu.png',
                scale: scale,
                size: [20, 20],
                anchor: [x, y]
            })
        }));
        userLayer.getSource().addFeature(concerIcon);
    }
    onMove();

}
function addAllSelctUsersFlag() {
    var Selectid = useprameters.Selectid;
    for (var i = 0; i < Selectid.length; i++) {
        var feature = userLayer.getSource().getFeatureById("p" + Selectid[i]);
        if (feature) {
            addSelctUsersFlag(Selectid[i]);
        }
    }
}
function addSelctUsersFlag(userId) {
    //var userId = person.userId;
    var Selectid = useprameters.Selectid;
    for (var i = 0; i < Selectid.length; i++) {
        if (Selectid[i] == userId) {
            if (userLayer.getSource().getFeatureById("selectIcon" + userId))
                return;

            var feature = userLayer.getSource().getFeatureById("p" + userId);
            var lat = feature.values_.person.lat;
            var lon = feature.values_.person.lon;
            var coordinate = ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857');
            var featureCoord = coordinate;
            var pixelCoord = map.getPixelFromCoordinate(featureCoord);
            //var pixelCoord = "[" + (pixelCoord[0]) + "," + (pixelCoord[1]) + "]";
            //var obj2 = eval("(" + pixelCoord + ")");
            featureCoord = map.getCoordinateFromPixel(pixelCoord);
            //添加选中图标
            var selectIcon = new ol.Feature({
                geometry: new ol.geom.Point(featureCoord),
                name: "selectIcon" + userId,
                typeflag: feature.get('typeflag'),
                length: 60
            });
            selectIcon.setId("selectIcon" + userId);
            var featureConcernIcon = userLayer.getSource().getFeatureById("concern" + userId);
            var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
            var x = -0.5;
            var y = 1.5;
            if (featureConcernIcon)
                y = y - 1.2;
            if (featureLockIcon)
                y = y - 1.2;
            var scale = getCurrentScale(0.8);
            if (feature.get('typeflag') == 2) {
                scale = getScaleByResolution(map.getView(), 20, 60);
            }
            selectIcon.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    src: '/images/layer/selectover.png',
                    scale: scale,
                    //offsetOrigin: 'bottom-left',
                    //offset:[0, 0],
                    size: [20, 20],
                    anchor: [x, y]
                })
            }));
            userLayer.getSource().addFeature(selectIcon);
            break;
        }
    }
}
function must_display_user() {
    must_display_users = "";
    if (useprameters.localid != "0" && useprameters.localid != "" && typeof (useprameters.localid) != "undefined")
        must_display_users = "|" + useprameters.localid;
    if (useprameters.lockid != "0" && useprameters.lockid != "" && typeof (useprameters.lockid) != "undefined")
        must_display_users = must_display_users + "|" + useprameters.lockid;
    if (useprameters.concernusers_array.length > 0) {
        for (var k = 0; k < useprameters.concernusers_array.length; k++) {
            if (useprameters.concernusers_array[k] != "0" && useprameters.concernusers_array[k] != "")
                must_display_users = must_display_users + "|" + useprameters.concernusers_array[k];
        }
    }
    if (useprameters.Selectid.length > 0) {
        for (var i = 0; i < useprameters.Selectid.length; i++) {
            if (useprameters.Selectid[i] != "0" && useprameters.Selectid[i] != "")
                must_display_users = must_display_users + "|" + useprameters.Selectid[i];
        }
    }
    if (useprameters.realtimeTraceUserIds.length > 0) {
        for (var i = 0; i < useprameters.realtimeTraceUserIds.length; i++) {
            if (useprameters.realtimeTraceUserIds[i] != "0" && useprameters.realtimeTraceUserIds[i] != "")
                must_display_users = must_display_users + "|" + useprameters.realtimeTraceUserIds[i];
        }
    }
    return must_display_users;
}

var pan;
function onMove() {
    map.getInteractions().forEach(function (element, index, array) {
        if (element instanceof ol.interaction.DragPan) {
            pan = element;
            pan.setActive(true);
        }
    });
}
function disableMove() {
    map.getInteractions().forEach(function (element, index, array) {
        if (element instanceof ol.interaction.DragPan) {
            pan = element;
            pan.setActive(false);
        }
    });
}
function hidPerUser(id, status) {
    if (status == "1") {
        removeUser(id, true);

        //cxy-20180801-用户隐藏定位效果一起隐藏
        if (mapLocateEvent) {
            mapLocateEvent.removeLocation();
        }
        
    } else {
        ReLoadUser();
    }
}

//removoe user、concern、lock、select图标
function removeUser(userId,isRemoveOverlay) {
    var featureConcerIcon = userLayer.getSource().getFeatureById("concern" + userId);
    var featureLockIcon = userLayer.getSource().getFeatureById("lock" + userId);
    var featureselectIcon = userLayer.getSource().getFeatureById("selectIcon" + userId);
    var featureHeadInfo = userLayer.getSource().getFeatureById("head" + userId);
    if (featureConcerIcon)
        userLayer.getSource().removeFeature(featureConcerIcon);
    if (featureLockIcon)
        userLayer.getSource().removeFeature(featureLockIcon);
    if (featureselectIcon)
        userLayer.getSource().removeFeature(featureselectIcon);
        if (featureHeadInfo)
        userLayer.getSource().removeFeature(featureHeadInfo);
    var userFeature = userLayer.getSource().getFeatureById("p" + userId);
    if (userFeature) {
        var person = userFeature.get("person");

        if (isRemoveOverlay) {
            var coord = ol.proj.transform([parseFloat(person.lon), parseFloat(person.lat)], 'EPSG:4326', 'EPSG:3857');
            if (overlay.getPosition()) {
                if (overlay.getPosition()[0] == coord[0] && overlay.getPosition()[1] == coord[1]) {
                    overlay.setPosition(undefined);
                }
            }

            if (person.isRealTimeTrace) {
                removeIdTorealtimeTraceUserIds(person.userId, false);
            }
        }

        userLayer.getSource().removeFeature(userFeature);
    }

    if (fsLayerManager) {
        fsLayerManager.removeFeature("p" + userId);
    }

    removeUserArray(userId);//移除用户信息
}

//获取警员的方向的图片索引
function getUserDirection(preCoor, curCoor, oldIndex) {
    var index;
    if (preCoor == null) {
        index = oldIndex;
    } else if (curCoor[0] - preCoor[0] == 0 && curCoor[1] - preCoor[1] == 0) {
        index = oldIndex;
    } else {
        var offsetX = curCoor[0] - preCoor[0];
        var offsetY = curCoor[1] - preCoor[1];
        if (offsetX == 0) {
            offsetX = Math.pow(0.1, 10);
        }
        var angle = (Math.PI - Math.atan(offsetY / offsetX) - offsetX / Math.abs(offsetX) * Math.PI / 2) / Math.PI * 180;
        var k = angle < 157.5 ? -1 : 1;
        index = parseInt((180 + k * -180 + angle - 157.5) / 45) * 2;
    }
    return index;
}

//获取船舶数值方向，以正北为0度
function getShipAspect(preCoor, curCoor, oldDegree) {
    var degree = 0;
    if (preCoor == null) {
        degree = 0;
    } else if (curCoor[0] - preCoor[0] == 0 && curCoor[1] - preCoor[1] == 0) {
        degree = oldDegree;
    } else {
        var offsetX = curCoor[0] - preCoor[0];
        var offsetY = curCoor[1] - preCoor[1];
        if (offsetX == 0) {
            offsetX = Math.pow(0.1, 10);
        }
        var degree = (Math.PI - Math.atan(offsetY / offsetX) - offsetX / Math.abs(offsetX) * Math.PI / 2);
    }
    return degree;
}

function sethide_timeout_device(isHid) {
    try {

        setTimeout(
            function () {
                ReLoadUser();
            }, 1000);
    }
    catch (e) {
        sethide_timeout_device(isHid);
    }

}

function getHeadInfo(user) {
    //显示头部信息
    var info = user.Info;
    var infoArr = info.split(",");
    var name = infoArr[0].split("(")[0];
    var bianHao = infoArr[1];
    var typename = infoArr[2];
    var headInfo = useprameters.userHeadInfo;
    if (headInfo == "")
        headInfo = "name";
    var isOpenheadInfo = useprameters.IsOpenUserHeaderInfo;
    if (isOpenheadInfo == "open") {
        var headInfo1, headInfo2;
        var headTxt = "";
        if (headInfo.indexOf("|") > 0) {
            var a1 = headInfo.split("|")[0];
            var a2 = headInfo.split("|")[1];
            switch (a1) {
                case "name":
                    headInfo1 = name;
                    break;
                case "Num":
                    headInfo1 = bianHao;
                    break;
                case "ISSI":
                    headInfo1 = user.ISSI;
                    break;
                case "Unit":
                    headInfo1 = user.entity;
                    break;
                case "TerminalType":
                    headInfo1 = user.terminalType;
                    break;
                default:
                    headInfo1 = name;
            }
            switch (a2) {
                case "name":
                    headInfo2 = name;
                    break;
                case "Num":
                    headInfo2 = bianHao;
                    break;
                case "ISSI":
                    headInfo2 = user.ISSI;
                    break;
                case "Unit":
                    headInfo2 = user.entity;
                    break;
                case "TerminalType":
                    headInfo2 = user.terminalType;
                    break;
                    //default:
                    //    headInfo2 = name;
            }
            if (a2 != "")
                headTxt = headInfo1 + "(" + headInfo2 + ")";
            else
                headTxt = headInfo1;
        }
        else {
            switch (headInfo) {
                case "name":
                    headInfo1 = name;
                    break;
                case "Num":
                    headInfo1 = bianHao;
                    break;
                case "ISSI":
                    headInfo1 = user.ISSI;
                    break;
                case "Unit":
                    headInfo1 = user.entity;
                    break;
                case "TerminalType":
                    headInfo1 = user.terminalType;
                    break;
                default:
                    headInfo1 = name;
            }
            headTxt = headInfo1;
        }

    }

    return headTxt;
}

//获取当前地图缩放尺度，以zoom为依据
function getCurrentScale(rate) {
    var view = map.getView();
    var scale = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());
    return scale * rate;
}

//清空用户图层所有资源信息
function clearUserLayer() {
    userArray = [];
    userLayer.getSource().clear();
}

function AddUserPopup() {

    /**
    * 弹出的要素
    */
    var container = document.getElementById('popup');
    container.style.display = "block";
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');


    /**
     * 创建Overlay弹出锚定在地图上.
     */
    var overlay = new ol.Overlay({
        element: container,
        autoPan: true,
        offset: [0, -27],
        autoPanAnimation: {
            duration: 250
        }
    });


    /**
     * 点击X隐藏弹出.
     * @return {boolean} 不跟随href.
     */
    closer.onclick = function () {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };

    return overlay;
}

