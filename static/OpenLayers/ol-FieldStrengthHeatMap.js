/*!
*@file 创建场强热力图
*@author cxy
*@createDate 20180921
@option params {number} width 界面初始值宽度 {number} height 界面初始值高度
*/

function createHeatMap(option) {
    var heatMap;//地图
    var currentView;//当前视图
    var streetBasicLayer;//底图
    var heatMapLayers = {};//热力图
    var KrigingLayers = {};//插值图
    var opt = option || {};
    var width = opt.width || document.body.clientWidth / 1.5;//panel宽
    var height = opt.height || document.body.clientHeight / 1.5;//panel高
    var blur = opt.blur || 5;//热力图模糊大小
    var radius = opt.radius || 8;//热力图半径大小
    var fullWidth = document.body.clientWidth, fullHeight = document.body.clientHeight;//全局范围
    var topHeight = 30, bottomHeight = 10, leftorrightWidth = 10;//顶部、底部、两边边框大小
    var contentHeight = height - topHeight - bottomHeight, contentWidth = width - 2 * leftorrightWidth;//当前内容大小
    var heatMapPanel;//地图panel
    var isMax = false;//panel是否放大
    var legendCanvas = {};//图例对象
    var params = {
        krigingModel: 'exponential',//model还可选'gaussian','spherical'
        krigingSigma2: 0,
        krigingAlpha: 100,
        canvasAlpha: 0.5,//canvas图层透明度
        colors: ['#E3FFC6', '#0f0', '#00f', '#ff0', '#f00']
    }
    var dragBox;
    
    var isDragBox = false;

    //热力图类型
    var heatMapTypes_ = [{
        "label":"MsRssi",
        "value": GetTextByName("signaldown")
    }, {
        "label":"UlRssi",
        "value":GetTextByName("signalup")
    }]
    var heatMapType = heatMapTypes_[0].label;//当前选中的热力图类型
    var startDate, endDate;//开始时间和结束时间

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
            "z-Index":"888"
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
            "box-shadow": "inset 0px "+ topHeight/2 +"px "+topHeight/4+"px #4db6d7"
        },
        "left": {
            "height": height - topHeight - bottomHeight + 4 + "px",
            "width": leftorrightWidth + "px",
            "float": "left",
            "background-color": "#054366",
            "margin-top":"-2px",
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
            "position":"absolute"
        },
        "setwin": {
            "position": "absolute",
            "right": "20px",
        },
        "setwin_close_a": {
            "width": "16px",
            "height": "16px",
            "position":"relative",
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
    this.open = function () {
        try{
            if (!document.getElementById("heatMapPanel")) {
                creatHeatMapPanel();
                loadHeatMap();
            }
            else
            {
                close();
            }
        } catch (err) {
            writeLog("system", "ol-FieldStrengthHeatMap.js open，error info:" + err);
        }
    }


    /************private*************/


    //创建热力图panel
    var creatHeatMapPanel = function () {
        //创建CSS
        function createCss(cssObject) {
            var css = "";
            Object.keys(cssObject).forEach(function (key) {
                css += key + ":" + cssObject[key] + ";";
            });
            return css;
        }
        //创建DIV
        function creatediv(type,style) {
            var element = document.createElement("div");
            var style = createCss(style);
            element.setAttribute("style", style);
            return element;
        }
        heatMapPanel = creatediv("div", styleJson.panel);
        heatMapPanel.id = "heatMapPanel";
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

            heatMapPanel.style.top = parseFloat(heatMapPanel.style.top) + ny + "px";
            heatMapPanel.style.left = parseFloat(heatMapPanel.style.left) + nx + "px";
        }
        topBorder.onmouseup = function (e) {
            dragEnabled = false;
        }
        topBorder.onmouseout = function (e) {
            dragEnabled = false;
        }

        //panel的缩放和关闭
        var span = creatediv("span",styleJson.setwin);
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
        
        var leftBorder = creatediv("div",styleJson.left);
        var rightBorder = creatediv("div",styleJson.right);
        var bottomBorder = creatediv("div", styleJson.bottom);
        var content = creatediv("div", styleJson.content);//创建Content作为具体的容器
        content.id = "entityContent";

        heatMapPanel.appendChild(topBorder);
        heatMapPanel.appendChild(leftBorder);
        heatMapPanel.appendChild(rightBorder);
        heatMapPanel.appendChild(bottomBorder);
        heatMapPanel.appendChild(content);
        document.body.appendChild(heatMapPanel);
    }

    //关闭
    var close = function () {
        var content = document.getElementById("entityContent");
        removeHeatMapDiv(content);

        document.body.removeChild(heatMapPanel);

        $(".panel.combo-p.panel-htop").remove();
        
        contentHeight = height - topHeight - bottomHeight;
        contentWidth = width - 2 * leftorrightWidth;//当前内容大小
        isMax = false;
        isDragBox = false;
        closeprossdiv();
        $('#mapmask').css("display", "none");
        dragBox = null;
        
        //移除所有热力图
        for (var layer in KrigingLayers) {
            heatMap.removeLayer(KrigingLayers[layer]);
        }
        KrigingLayers = {};
        heatMap = null;
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

        heatMapPanel.style.width = panelWidth + "px";
        heatMapPanel.style.height = panelHeight + "px";
        heatMapPanel.style.top = top + "px";
        heatMapPanel.style.left = left + "px";
        heatMapPanel.children[1].style.height = contentHeight + 4 + "px";
        heatMapPanel.children[2].style.height = contentHeight + 4 + "px";
        heatMapPanel.children[3].style.width = panelWidth + "px";
        heatMapPanel.children[0].children[0].children[0].style.backgroundImage = "url(" + image + ")";
        
        //重新加载地图
        loadHeatMap();
    }

    //初始化地图
    var loadHeatMap = function () {
        var content = document.getElementById("entityContent");
        removeHeatMapDiv(content);//移除地图

        //创建地图界面
        var mapDiv = document.createElement("div");
        mapDiv.style.width = contentWidth + "px";
        mapDiv.style.height = contentHeight + "px";
        mapDiv.id = "heatmap";

        //创建地图掩没
        if ($('#mapmask')) {
            $('#mapmask').remove();
        }
        var maskDiv = document.createElement("div");
        maskDiv.style.width = contentWidth + "px";
        maskDiv.style.height = contentHeight + "px";
        maskDiv.style.position = "absolute";
        maskDiv.style.top = "30px";
        maskDiv.style.backgroundColor = "rgba(150,150,150,0.4)"
        maskDiv.id = "mapmask";
        
        
        //创建控件容器
        var controlDiv = document.createElement("div");
        controlDiv.style.position = "absolute"
        controlDiv.style.margin = "5px";
        controlDiv.style.zIndex = "99";
        controlDiv.style.backgroundColor = "#fff";
        controlDiv.style.padding = "5px";
        controlDiv.style.boxShadow = "1px 1px 5px rgba(0,0,0,0.5)";
        controlDiv.style.borderRadius = "0 5px 5px 0";
        mapDiv.appendChild(controlDiv);

        //创建下拉控件
        var selectDiv = document.createElement("select");
        if (useprameters.defaultLanguage == "en-US") {//xzj--20181122--英文版本需增加长度
            selectDiv.style.width = "150px";
        }
        else {
            selectDiv.style.width = "85px";
        }
        selectDiv.id = "selectType";
        controlDiv.appendChild(selectDiv);

        //创建时间控件
        var startLabel = document.createElement("span");
        startLabel.style.margin = "0 2px 0 5px";
        startLabel.innerHTML = GetTextByName("startTime") + ":"
        var startDateInput = document.createElement("input");
        startDateInput.style.width = "100px";
        startDateInput.setAttribute("type", "text");
        startDateInput.id = "startDate";
        var endLabel = document.createElement("span");
        endLabel.style.margin = "0 2px 0 5px";
        endLabel.innerHTML = GetTextByName("endTime") + ":"
        var endDateInput = document.createElement("input");
        endDateInput.style.width = "100px";
        endDateInput.setAttribute("type", "text");
        endDateInput.id = "endDate";
        var dragBoxButton = document.createElement("a");
        dragBoxButton.style.height = "22px";
        dragBoxButton.id = "dragBoxButton";

        controlDiv.appendChild(startLabel);
        controlDiv.appendChild(startDateInput);
        controlDiv.appendChild(endLabel);
        controlDiv.appendChild(endDateInput);
        controlDiv.appendChild(dragBoxButton);
        
        content.appendChild(mapDiv);
        content.appendChild(maskDiv);
        
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
        heatMap = new ol.Map({
            target: 'heatmap',
            view: currentView,
            controls: ol.control.defaults({
                attribution: false,
                rotate: false,
                zoom: false
            })
        });
        
        dragBox = new ol.interaction.DragBox();

        var layerParam = createBaseMapParameter(gistype);
        var isAddLayer = streetBasicLayer?true:false;
        streetBasicLayer = streetBasicLayer || createStreetMapLayer(heatMap, "streetmap_sub", layerParam);
        if (isAddLayer) {
            heatMap.addLayer(streetBasicLayer);
        }


        $('#startDate').datebox({
            panelWidth: 150,
            panelHeight: 220,
            editable: false,
            onSelect: dateSelectedEvent

        });
        startDate = startDate || getDateMinusMonth(new Date(), 1);
        $('#startDate').datebox('setValue', startDate);
        $('#endDate').datebox({
            panelWidth: 150,
            panelHeight: 220,
            editable: false,
            onSelect: dateSelectedEvent
            
        });
        endDate = endDate || getDateMinusMonth(new Date(), 0);
        $('#endDate').datebox('setValue', endDate);

        //监听下拉事件，选择地图类型和图例类型
        $("#selectType").combobox({
            valueField: 'label',
            textField: 'value',
            editable: false,
            panelHeight: 50,
            data: heatMapTypes_,
            onSelect: function (value) {
                heatMapType = value.label;
                //switchHeatMapLayer(heatMapType);
                switchKrigingLayer(heatMapType);
                legendCanvas = Object.keys(legendCanvas).length >= heatMapTypes_.length ? legendCanvas : createLegendCanvas();
                switchLegend(heatMapType);
            }
        });
        $("#selectType").combobox("select", heatMapType);

        //拖拽框选自定义范围
        dragBox.on('boxend', function(){
            var extent = dragBox.getGeometry().getExtent();
            if (extent) {
                var coordinate1 = ol.extent.getBottomLeft(extent);
                var coordinate2 = ol.extent.getTopRight(extent);
                var coordinate1_ = ol.proj.transform(coordinate1, 'EPSG:3857', 'EPSG:4326');
                var coordinate2_ = ol.proj.transform(coordinate2, 'EPSG:3857', 'EPSG:4326');

                var x1 = coordinate1[0] - coordinate2[0];
                var x2 = coordinate1_[0] - coordinate2_[0];
                var y1 = coordinate1[1] - coordinate2[1];
                var y2 = coordinate1_[1] - coordinate2_[1];
                var rate = y1 * x2 / y2 / x1 - 1;
                coordinate2_[1] = coordinate2_[1] + (coordinate2_[1] - coordinate1_[1]) * rate;
                addKrigingSourceToLayer(heatMapType, KrigingLayers[heatMapType], {}, { "minX": coordinate1_[0], "minY": coordinate1_[1], "maxX": coordinate2_[0], "maxY": coordinate2_[1] });

                $("#dragBoxButton").linkbutton({ "selected": false });
                heatMap.removeInteraction(dragBox);
                isDragBox = false;
            }
            
        });
        $("#dragBoxButton").linkbutton({ "toggle": true,"text":GetTextByName("CustomField")});
        $('#dragBoxButton').bind('click', function () {
            if (!isDragBox) {
                var interactions = heatMap.getInteractions();
                var count = 0;
                interactions.forEach(function (v) {
                    if (v instanceof ol.interaction.DragBox) {
                        count += 1;
                    }
                })
                if (count <= 1) {
                    heatMap.addInteraction(dragBox);
                }
                isDragBox = true;
            } else {
                heatMap.removeInteraction(dragBox);
                isDragBox = false;
            }
        });
        isDragBox = false;
    }

    //获取类似"2018-9-29"时间格式，num表示月份减少的数量
    var getDateMinusMonth = function (date, num) {
        var dateStr = date.getFullYear() + "-" + (date.getMonth() - num + 1) + "-" + date.getDate();
        return dateStr;
    }

    //日期框选择事件
    var dateSelectedEvent = function (date) {
        //判断选择的是哪一个日期框，在进行赋值
        var startTime = this.id == "startDate" ? date : new Date($('#startDate').datebox('getValue') + "T00:00:00");
        var endTime = this.id == "endDate" ? date : new Date($('#endDate').datebox('getValue') + "T00:00:00");
        //选择日期后判断开始日期是否小于等于结束日期
        if (startTime <= endTime) {
            addKrigingSourceToLayer(heatMapType, KrigingLayers[heatMapType], { "startTime": getDateMinusMonth(startTime, 0), "endTime": getDateMinusMonth(endTime, 0) });
        } else {
            alert(GetTextByName("Time_selection_error_prompt"));
            KrigingLayers[heatMapType].getSource().clear();
            startDate = getDateMinusMonth(startTime, 0), endDate = getDateMinusMonth(endTime, 0);//清空图层后对全局时间进行赋值
        }
    }

    //创建热力图图层
    var creatHeatMapLayer = function () {

        var heatMapSource = new ol.source.Vector();

        var heatMapLayer = new ol.layer.Heatmap({
            source: heatMapSource,
            blur: blur,
            radius: radius
        });

        //加Feature时赋值热力图权重
        heatMapSource.on('addfeature', function (event) {
            var weigth = event.feature.get(heatMapType);
            switch (heatMapType) {
                case heatMapTypes_[0].label:
                    weigth = Math.abs(weigth - 125) / 125;
                    break;
                case heatMapTypes_[1].label:
                    weigth = Math.abs(weigth - 255) / 255;
                    break;
            }
            event.feature.set('weight', weigth);
        });

        return heatMapLayer;
    }

    var createKrigingLayer = function () {
        var krigingLayer = new ol.layer.Image()
        return krigingLayer;
    }

    //向热力图数据源添加要素
    var addFeatureToSource = function (layer, time) {
        var opt_time = time || {};
        var startTime = opt_time.startTime || $('#startDate').datebox('getValue');
        var endTime = opt_time.endTime || $('#endDate').datebox('getValue') ;

        getNewData_ajaxStock("Handlers/GetHistoryRSSIInfos.ashx?L=1", { "startTime": startTime, "endTime": endTime + "T23:59:59" }, function (request) {
            if (request) {
                var data = request.HistoryRSSIInfos;
                var source = layer.getSource();
                source.clear();
                data.forEach(function (v) {
                    var coordinates = ol.proj.transform([parseFloat(v.Longitude), parseFloat(v.Latitude)], 'EPSG:4326', 'EPSG:3857');
                    var feature = new ol.Feature({
                        geometry: new ol.geom.Point(coordinates),
                        MsRssi: v.MsRssi,
                        UlRssi: v.UlRssi
                    });
                    source.addFeature(feature);
                });
                startDate = startTime, endDate = endTime;//添加图层要素成功后对全局时间进行赋值
            }
        })
    }

    var addKrigingSourceToLayer = function (type, layer, time,coordinates) {
        creatprossdiv();
        $('#mapmask').css("display", "block");

        var opt_time = time || {};
        var startTime = opt_time.startTime || $('#startDate').datebox('getValue');
        var endTime = opt_time.endTime || $('#endDate').datebox('getValue');
        var opt_coordinates = coordinates || {};
        var minX = opt_coordinates["minX"] || '';
        var minY = opt_coordinates["minY"] || '';
        var maxX = opt_coordinates["maxX"] || '';
        var maxY = opt_coordinates["maxY"] || '';

        var num = 200;
        var alpha = 100;
        getNewData_ajax_Post("Handlers/GetHistoryRSSIInfos.ashx", {
            "startTime": startTime, "endTime": endTime + "T23:59:59", "type": type, "alpha": alpha, "num": num,
            "minX": minX,"minY":minY,"maxX":maxX,"maxY":maxY
        }, function (request) {
            if (request) {
                if (request.statue) {
                    closeprossdiv();
                    $('#mapmask').css("display", "none");
                    layer.setSource(null);
                    alert(GetTextByName("HistoryPointLimit"));
                    return;
                }
                var grid = request;

                var xlim = request.xlim.map(function (v,i) {
                    return ol.proj.transform([parseFloat(v), parseFloat(request.ylim[i])], 'EPSG:4326', 'EPSG:3857')[0];
                })
                var ylim = request.ylim.map(function (v, i) {
                    return ol.proj.transform([parseFloat(request.xlim[i]), parseFloat(v)], 'EPSG:4326', 'EPSG:3857')[1];
                })
                grid.xlim = xlim;
                grid.ylim = ylim;
                grid.width = (xlim[1] - xlim[0]) / num;

                var source = new ol.source.ImageCanvas({
                    canvasFunction: function (extent, resolution, pixelRatio, size, projection) {
                        var canvas = document.createElement('canvas');
                        canvas.width = size[0];
                        canvas.height = size[1];
                        canvas.style.display = 'block';
                        //设置canvas透明度
                        canvas.getContext('2d').globalAlpha = params.canvasAlpha;

                        var colors = [];
                        params.colors.forEach(function (val, num) {
                            if (num == 0) {
                                var partColors = new gradientColor(val, params.colors[num + 1], 24);
                                colors = colors.concat(partColors);
                            } else if (num == 1) {
                                var partColors = new gradientColor(val, params.colors[num + 1], 3);
                                colors = colors.concat(partColors);
                            } else if (num == 2) {
                                var partColors = new gradientColor(val, params.colors[num + 1], 3);
                                colors = colors.concat(partColors);
                            } else if (num == 3) {
                                var partColors = new gradientColor(val, params.colors[num + 1], 3);
                                colors = colors.concat(partColors);
                            } else if (num == 4) {
                                var partColors = new gradientColor("#000000", "#000000", 12);
                                colors = colors.concat(partColors);
                            }
                                
                        });

                        //使用分层设色渲染
                        kriging.plot(canvas, grid,
                            [extent[0], extent[2]], [extent[1], extent[3]], colors);

                        return canvas;
                    }
                })
                layer.setSource(source);

                startDate = startTime, endDate = endTime;//添加图层要素成功后对全局时间进行赋值
            }
            closeprossdiv();
            $('#mapmask').css("display", "none");

        })
    }

    //选择热力图
    var switchHeatMapLayer = function (heatMapType) {

        //移除所有不是选择热力图的热力图
        for (var layer in heatMapLayers) {
            if (layer != heatMapType) {
                heatMap.removeLayer(heatMapLayers[layer]);
            }
        }

        //判断热力图是否存在，存在：添加；不存在：创建
        var currentHeatMapLayer = heatMapLayers[heatMapType];
        if (currentHeatMapLayer) {
            heatMap.addLayer(currentHeatMapLayer);
        } else {
            heatMapLayers[heatMapType] = creatHeatMapLayer();
            heatMap.addLayer(heatMapLayers[heatMapType]);
            addFeatureToSource(heatMapLayers[heatMapType]);
        }
    }

    var switchKrigingLayer = function (type) {
        
        
        //移除所有不是选择插值图的插值图
        for (var layer in KrigingLayers) {
            if (layer != type) {
                heatMap.removeLayer(KrigingLayers[layer]);
            }
        }

        var currentKrigingLayer = KrigingLayers[type];
        if (currentKrigingLayer) {
            heatMap.addLayer(currentKrigingLayer);
            closeprossdiv();
            $('#mapmask').css("display", "none");
        } else {
            KrigingLayers[type] = createKrigingLayer();
            heatMap.addLayer(KrigingLayers[type]);
            addKrigingSourceToLayer(type, KrigingLayers[type]);
        }
    }

    //创建图例
    var createLegendCanvas = function () {
        var canvasObejct = {};

        //绘制标签
        var drawLabel = function (x, y, color, type, text, textSize) {
            var side = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + side, y - side);
            ctx.lineTo(x + side, y + side);
            ctx[type + 'Style'] = color;
            ctx.closePath();
            ctx[type]();
            ctx.font = textSize + "px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText(text, x + side + 2, y + textSize / 2 - 2);
        }

        for (var obj in heatMapTypes_) {
            var label = heatMapTypes_[obj].label;

            var minValue, maxValue;
            switch (label) {
                case "MsRssi":
                    minValue = -125, maxValue = 0;
                    break;
                case "UlRssi":
                    minValue = -127, maxValue = 0;
                    break;
            }
            var textOffsetHeight = 25,textHeight = 16;//文字与上部偏离，文字大小
            var offsetY = 15, offsetX = 10;//渐变矩阵偏离度
            var rectHeight = 70, rectWidth = 30;//渐变矩阵高和宽

            var canvas = document.createElement('canvas');
            canvas.style.marginBottom = "-5px";
            var ctx = canvas.getContext("2d");
            canvas.height = 140;
            canvas.width = 100;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height); //绘制底图
            ctx.font = "bold "+ textHeight + "px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText(GetTextByName("legend"), canvas.width / 2.6, textOffsetHeight);

            //绘制渐变矩形
            var lg = ctx.createLinearGradient(offsetX, textOffsetHeight + offsetY, offsetX, textHeight + textOffsetHeight + offsetY + rectHeight);
            var colorArray = params.colors;
            colorArray.forEach(function (v,n) {
                lg.addColorStop(n / colorArray.length, v);
            });
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.fillRect(offsetX, textOffsetHeight + offsetY, rectWidth, rectHeight);
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.fillRect(offsetX, textOffsetHeight + offsetY + rectHeight, rectWidth, rectHeight / 4);

            //绘制标签
            drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY, "#000", "fill", maxValue + " dB", "12");
            drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight / 4, "#000", "fill", "-80 dB", "12");
            drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight / 2, "#000", "fill", "-90 dB", "12");
            drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight * 3 / 4, "#000", "fill", "-100 dB", "12");
            drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight, "#000", "fill", "-110 dB", "12");
            drawLabel(offsetX + rectWidth + 2, textOffsetHeight + offsetY + rectHeight * 5 / 4, "#000", "fill", "-150 dB", "12");

            canvasObejct[label] = canvas;
        }
        
        return canvasObejct;
    }

    //选择图例
    var switchLegend = function (heatMapType) {
        var legendDiv = document.createElement("div");
        legendDiv.style.position = "absolute";
        legendDiv.style.bottom = "20px";
        legendDiv.style.right = "20px";
        legendDiv.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.3)"
        legendDiv.style.color = "#595959";
        var content = document.getElementById("heatmap");
        legendDiv.appendChild(legendCanvas[heatMapType]);
        content.appendChild(legendDiv);
    }

    //移除地图
    var removeHeatMapDiv = function (content) {
        var heatmap = document.getElementById("heatmap");
        //判断地图是否存在，存在：清空所有图层，删除地图；
        if (heatmap && heatMap) {
            heatMap.removeLayer(streetBasicLayer);
            for (var layer in heatMapLayers) {
                heatMap.removeLayer(heatMapLayers[layer]);
            }
            content.removeChild(heatmap);
        }
    }

    
    function gradientColor(startColor, endColor, step) {
        startRGB = this.colorRgb(startColor);//转换为rgb数组模式
        startR = startRGB[0];
        startG = startRGB[1];
        startB = startRGB[2];
        endRGB = this.colorRgb(endColor);
        endR = endRGB[0];
        endG = endRGB[1];
        endB = endRGB[2];
        sR = (endR - startR) / step;//总差值
        sG = (endG - startG) / step;
        sB = (endB - startB) / step;
        var colorArr = [];
        for (var i = 0; i < step; i++) {
            //计算每一步的hex值
            var hex = this.colorHex('rgb(' + parseInt((sR * i + startR)) + ',' + parseInt((sG * i + startG)) + ',' + parseInt((sB * i + startB)) + ')');
            colorArr.push(hex);
        }
        return colorArr;
    }
    // 将hex表示方式转换为rgb表示方式(这里返回rgb数组模式)
    gradientColor.prototype.colorRgb = function (sColor) {
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var sColor = sColor.toLowerCase();
        if (sColor && reg.test(sColor)) {
            if (sColor.length === 4) {
                var sColorNew = "#";
                for (var i = 1; i < 4; i += 1) {
                    sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
                }
                sColor = sColorNew;
            }
            //处理六位的颜色值
            var sColorChange = [];
            for (var i = 1; i < 7; i += 2) {
                sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
            }
            return sColorChange;
        } else {
            return sColor;
        }
    };
    // 将rgb表示方式转换为hex表示方式
    gradientColor.prototype.colorHex = function (rgb) {
        var _this = rgb;
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        if (/^(rgb|RGB)/.test(_this)) {
            var aColor = _this.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
            var strHex = "#";
            for (var i = 0; i < aColor.length; i++) {
                var hex = Number(aColor[i]).toString(16);
                hex = hex < 10 ? 0 + '' + hex : hex;// 保证每个rgb的值为2位
                if (hex === "0") {
                    hex += hex;
                }
                strHex += hex;
            }
            if (strHex.length !== 7) {
                strHex = _this;
            }
            return strHex;
        } else if (reg.test(_this)) {
            var aNum = _this.replace(/#/, "").split("");
            if (aNum.length === 6) {
                return _this;
            } else if (aNum.length === 3) {
                var numHex = "#";
                for (var i = 0; i < aNum.length; i += 1) {
                    numHex += (aNum[i] + aNum[i]);
                }
                return numHex;
            }
        } else {
            return _this;
        }
    }
}