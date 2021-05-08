function createTrafficControlBoxPoliceListMap(option) {
    var listMap;//地图
    var mapLocate;//地图定位
    var currentView;//当前视图
    var streetBasicLayer;//底图
    var listMapLayers = {};//岗亭、警员图层
    var trafficLayerManager;//岗亭图层
    var trafficPoliceLayerManager;//人员图层
    var tooltipElement, tooltip;
    var currentTrafficControlBox;
    var option = option || {};
    var width = opt.width || document.body.clientWidth / 1.5;//panel宽
    var height = opt.height || document.body.clientHeight / 1.5;//panel高
    var blur = opt.blur || 5;//热力图模糊大小
    var radius = opt.radius || 8;//热力图半径大小
    var fullWidth = document.body.clientWidth, fullHeight = document.body.clientHeight;//全局范围
    var topHeight = 30, bottomHeight = 10, leftorrightWidth = 10;//顶部、底部、两边边框大小
    var contentHeight = height - topHeight - bottomHeight, contentWidth = width - 2 * leftorrightWidth;//当前内容大小
    var listMapPanel;//地图panel
    var isMax = false;//panel是否放大
    var legendCanvas = {};//图例对象
    var trafficControlBoxId="";//交通岗ID
    var ISSIAndName="";//警员信息

    var params = {
        canvasAlpha: 0.5,//canvas图层透明度
        colors: ['#E3FFC6', '#0f0', '#00f', '#ff0', '#f00']
    }

    var closeImage_ = {
        "on": "../../lqnew/images/close.png",
        "un": "../../lqnew/images/close_un.png"
    }
    var maxImage_ = {
        "on": "../../lqnew/images/max.png",
        "un": "../../lqnew/images/max_un.png"
    }
    var minImage_ = {
        "on": "../../lqnew/images/min.png",
        "un": "../../lqnew/images/min_un.png"
    }

    var styleJson = {
        "panel": {
            "left": (fullWidth - width) / 2 + "px",
            "top": (fullHeight - height) / 2 + "px",
            "height": height + "px",
            "width": width + "px",
            "background-color": "#EEEEEE",
            "position": "fixed",
            "border-radius": "1em",
            "z-Index": "888"
        },
        "content": {
            "height": contentHeight + "px",
            "width": contentWidth + "px",
            "margin-left": leftorrightWidth + "px"
        },
        "top": {
            "height": topHeight + "px",
            "background-color": "#054366",
            "border-radius": "1em 1em 0 0",
            "box-shadow": "inset 0px " + topHeight / 2 + "px " + topHeight / 4 + "px #4db6d7"
        },
        "left": {
            "height": height - topHeight - bottomHeight + 4 + "px",
            "width": leftorrightWidth + "px",
            "float": "left",
            "background-color": "#054366",
            "margin-top": "-2px",
        },
        "right": {
            "height": height - topHeight - bottomHeight + 4 + "px",
            "width": leftorrightWidth + "px",
            "float": "right",
            "background-color": "#054366",
            "margin-top": "-2px",
        },
        "bottom": {
            "height": bottomHeight + "px",
            "width": width + "px",
            "background-color": "#054366",
            "border-radius": "0 0 1em 1em",
            "bottom": "0",
            "position": "absolute"
        },
        "setwin": {
            "position": "absolute",
            "right": "20px",
        },
        "setwin_close_a": {
            "width": "16px",
            "height": "16px",
            "position": "relative",
            "display": "inline-block",
            "margin": "0 3px",
            "background": "url(" + closeImage_.on + ") no-repeat"
        },
        "setwin_max_a": {
            "width": "16px",
            "height": "16px",
            "position": "relative",
            "display": "inline-block",
            "margin": "0 3px",
            "background": "url(" + maxImage_.on + ") no-repeat"
        }
    }

    /********public************/

    //打开
    this.open = function (tcbId, issi) {
        try {
            trafficControlBoxId = tcbId;
            ISSIAndName = issi;
            if (!document.getElementById("listMapPanel")) {
                creatListMapPanel();
                loadListMap();
            }
            else {
                close();
            }
        } catch (err) {
            writeLog("system", "ol-TrafficControlBoxPoliceListMap.js open，error info:" + err);
        }
    }

    /************private*************/

    //创建panel
    var creatListMapPanel = function () {
        //创建CSS
        function createCss(cssObject) {
            var css = "";
            Object.keys(cssObject).forEach(function (key) {
                css += key + ":" + cssObject[key] + ";";
            });
            return css;
        }
        //创建DIV
        function creatediv(type, style) {
            var element = document.createElement("div");
            var style = createCss(style);
            element.setAttribute("style", style);
            return element;
        }
        listMapPanel = creatediv("div", styleJson.panel);
        listMapPanel.id = "listMapPanel";
        var topBorder = creatediv("div", styleJson.top);
        //panel的拖拽
        var offsetX, offsetY, dragEnabled = false;
        topBorder.onmousedown = function (e) {
            if (e.button == 0 && !dragEnabled) {
                offsetX = e.clientX, offsetY = e.clientY;
                dragEnabled = true;
            }
        }
        topBorder.onmousemove = function (e) {
            if (e.button == 0 && !dragEnabled) {
                return;
            }
            var nx = e.clientX - offsetX;
            var ny = e.clientY - offsetY;
            offsetX = e.clientX;
            offsetY = e.clientY;

            listMapPanel.style.top = parseFloat(listMapPanel.style.top) + ny + "px";
            listMapPanel.style.left = parseFloat(listMapPanel.style.left) + nx + "px";
        }
        topBorder.onmouseup = function (e) {
            dragEnabled = false;
        }
        topBorder.onmouseout = function (e) {
            dragEnabled = false;
        }

        //panel的缩放和关闭
        var span = creatediv("span", styleJson.setwin);
        var max_a = creatediv("a", styleJson.setwin_max_a);
        max_a.onmouseover = function () {
            if (isMax) {
                this.style.backgroundImage = "url(" + minImage_.un + ")";
            } else {
                this.style.backgroundImage = "url(" + maxImage_.un + ")";
            }
        }
        max_a.onmouseout = function () {
            if (isMax) {
                this.style.backgroundImage = "url(" + minImage_.on + ")";
            } else {
                this.style.backgroundImage = "url(" + maxImage_.on + ")";
            }
        }
        max_a.onclick = function () {
            resetPanelSize();
        }

        var close_a = creatediv("a", styleJson.setwin_close_a);
        close_a.onmouseover = function () {
            this.style.backgroundImage = "url(" + closeImage_.un + ")";
        }
        close_a.onmouseout = function () {
            this.style.backgroundImage = "url(" + closeImage_.on + ")";
        }
        close_a.onclick = function () {
            close();
        }

        span.appendChild(max_a);
        span.appendChild(close_a);
        topBorder.appendChild(span);

        var leftBorder = creatediv("div", styleJson.left);
        var rightBorder = creatediv("div", styleJson.right);
        var bottomBorder = creatediv("div", styleJson.bottom);
        var content = creatediv("div", styleJson.content);//创建Content作为具体的容器
        content.id = "policeListContent";

        listMapPanel.appendChild(topBorder);
        listMapPanel.appendChild(leftBorder);
        listMapPanel.appendChild(rightBorder);
        listMapPanel.appendChild(bottomBorder);
        listMapPanel.appendChild(content);
        document.body.appendChild(listMapPanel);
    }

    //关闭
    var close = function () {
        var content = document.getElementById("policeListContent");
        removeListMapDiv(content);

        document.body.removeChild(listMapPanel);

        $(".panel.combo-p.panel-htop").remove();

        contentHeight = height - topHeight - bottomHeight;
        contentWidth = width - 2 * leftorrightWidth;//当前内容大小
        isMax = false;
        closeprossdiv();
        //$('#mapmask').css("display", "none");

        listMap = null;
    }

    //重置panel大小
    var resetPanelSize = function () {
        //判断是否最大化从而改变panel大小和图片显示
        if (isMax) {
            var panelHeight = height, panelWidth = width;
            var top = (fullHeight - height) / 2, left = (fullWidth - width) / 2;
            var image = maxImage_.on;
            isMax = false;
        } else {
            var panelHeight = fullHeight - 50, panelWidth = fullWidth - 20;
            var top = 40, left = 10;
            var image = minImage_.on;
            isMax = true;
        }
        contentHeight = panelHeight - topHeight - bottomHeight;
        contentWidth = panelWidth - 2 * leftorrightWidth;

        listMapPanel.style.width = panelWidth + "px";
        listMapPanel.style.height = panelHeight + "px";
        listMapPanel.style.top = top + "px";
        listMapPanel.style.left = left + "px";
        listMapPanel.children[1].style.height = contentHeight + 4 + "px";
        listMapPanel.children[2].style.height = contentHeight + 4 + "px";
        listMapPanel.children[3].style.width = panelWidth + "px";
        listMapPanel.children[0].children[0].children[0].style.backgroundImage = "url(" + image + ")";

        //重新加载地图
        loadListMap();
    }

    //初始化地图
    var loadListMap = function () {
        var content = document.getElementById("policeListContent");
        removeListMapDiv(content);//移除地图

        //创建地图界面
        var mapDiv = document.createElement("div");
        mapDiv.style.width = contentWidth + "px";
        mapDiv.style.height = contentHeight + "px";
        mapDiv.id = "listmap";

        //创建地图掩没
        //if ($('#mapmask')) {
        //    $('#mapmask').remove();
        //}
        //var maskDiv = document.createElement("div");
        //maskDiv.style.width = contentWidth + "px";
        //maskDiv.style.height = contentHeight + "px";
        //maskDiv.style.position = "absolute";
        //maskDiv.style.top = "30px";
        //maskDiv.style.backgroundColor = "rgba(150,150,150,0.4)"
        //maskDiv.id = "mapmask";
        //maskDiv.style.display = "none";

        content.appendChild(mapDiv);
        //content.appendChild(maskDiv);

        //创建街景图
        var gistype = useprameters.GISTYPE.toLowerCase();
        //创建当前视图
        var viewParam = {
            "lo": useprameters.PGIS_Center_lo,//中心点
            "la": useprameters.PGIS_Center_la,//中心点
            "maxLevel": useprameters.maxLevel,//最大层级
            "minLevel": useprameters.minLevel,//最小层级
            "currentLevel": useprameters.currentLevel//显示层级
        }
        currentView = currentView || createView(gistype, viewParam);

        //创建地图
        listMap = new ol.Map({
            target: 'listmap',
            view: currentView,
            controls: ol.control.defaults({
                attribution: false,
                rotate: false,
                zoom: false
            })
        });

        var layerParam = createBaseMapParameter(gistype);
        var isAddLayer = streetBasicLayer ? true : false;
        streetBasicLayer = streetBasicLayer || createStreetMapLayer(listMap, "policestreetmap_sub", layerParam);
        if (isAddLayer) {
            listMap.addLayer(streetBasicLayer);
        }
        //创建岗亭、人员图层
        trafficLayerManager = new TrafficControlBoxLayer(listMap);
        trafficPoliceLayerManager = new TrafficPoliceLayer(listMap);
        //加载图层数据
        trafficControlBoxManager.getTrafficLayerManager().loadTrafficControlBoxs(trafficControlBoxId);
        trafficControlBoxManager.getTrafficPoliceLayerManager().loadTrafficPolices(ISSIAndName);

        listMapLayers["trafficLayer"] = trafficLayerManager.getLayer();
        listMapLayers["circleLayer"] = trafficLayerManager.getCircleLayer();
        listMapLayers["trafficPoliceLayer"] = trafficPoliceLayerManager.getLayer();
    }
    //移除地图
    var removeListMapDiv = function (content) {
        var listmap = document.getElementById("listmap");
        //判断地图是否存在，存在：清空所有图层，删除地图；
        if (listmap && listMap) {
            listMap.removeLayer(streetBasicLayer);
            for (var layer in listMapLayers) {
                listMap.removeLayer(listMapLayers[layer]);
            }
            content.removeChild(listmap);
        }
    }
    //获取交通岗亭图层管理
    this.getTrafficLayerManager = function () {
        return trafficLayerManager;
    }
    //获取人员图层管理
    this.getTrafficPoliceLayerManager = function () {
        return trafficPoliceLayerManager;
    }
    //获取当前地图
    this.getTrafficMap = function () {
        return listMap;
    }
}