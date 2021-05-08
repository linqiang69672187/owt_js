/*!
*@file 创建场强显示图层，依附于用户图层
*@author cxy
*@createDate 20180803
*@params {ol.Map} thismap 地图对象
*@option params {number} ewidth 电池绘制宽度 {number} eheight 电池绘制高度
*@option params {number} swidth 信号绘制区域宽度 {number} sheight 信号绘制区域高度
*@option params {number} lineWidth 绘制线宽
*/

function FieldStrengthLayer(thismap, opt_options) {
    var currentMap = thismap;
    var fsMoveInteraction;
    var tooltipElement, tooltip;
    var maxEnergy = 100, maxSignalUp = 127, maxSignalDown = 125;
    var canvasMap = new Map(); 

    var currentFSArray = new Array();//记录当前场强的基本信息
    var fieldStrengthSource = new ol.source.Vector({ wrapX: false });//场强图层数据源
    var fieldStrengthLayer = new ol.layer.Vector({//场强图层
        source: fieldStrengthSource,
        style: null
    });
    fieldStrengthLayer.setProperties({ 'ID': 'fieldStrength' });//设置场强图层ID
    currentMap.addLayer(fieldStrengthLayer);
    var isShowEnergy = false, isShowUp = false, isShowDown = false;//三种信息是否展示的全局标识

    var currentUserLayer = currentMap.getLayerById("user");//获取当前人员图层

    var opt = opt_options || {};

    /*
    *电量绘制的参数
    */
    opt.ewidth = opt.ewidth || 14;//绘制的宽度
    opt.eheight = opt.eheight || 22;//绘制的高度

    /*
    *信号绘制的参数
    */
    opt.swidth = opt.swidth || 28;//绘制区域宽度
    opt.sheight = opt.sheight || 24;//绘制区域高度

    opt.lineWidth = opt.lineWidth || 2;//绘制边界宽度

    /*
    *要素类型
    */
    FeatureType_ = {
        //电池电量
        ENERGY: 'energy',
        //上行信号
        SIGNALINTENSITYUP: 'signalup',
        //下行信号
        SIGNALINTENSITYDOWN: 'signaldown'
    };

    /*
    *界面文字展示信息(中英文对照)
    */
    FeatureLable_ = {
        ENERGY: GetTextByName(FeatureType_.ENERGY),
        SIGNALINTENSITYUP: GetTextByName(FeatureType_.SIGNALINTENSITYUP),
        SIGNALINTENSITYDOWN: GetTextByName(FeatureType_.SIGNALINTENSITYDOWN)
    }

//绘制图片位置设置，type表示类型，array表示需要展示的类型数组,offsety表示偏移Y
var ImagePosition_ = function (type, array, offsety) {
        var step = 0.5;//间距
        var count = array.length;
        var rate = (opt.swidth - opt.ewidth) / opt.ewidth;//电池与信号宽度比例
        var indexs = Array(count + 1).join(0).split('').map(function (v, k) { return step * (count - 1 - 2 * k) + 0.5; });//位置数组

        switch (type) {
            //电池图片位置
            case FeatureType_.ENERGY:
                var i = array.indexOf(FeatureType_.ENERGY);
                if (count == 1) {
                    return [indexs[i], offsety];
                } else {
                    if (i == 0) {
                        return [indexs[i] + 2 * step / rate, offsety];
                    } else if (i == count - 1) {
                        return [indexs[i] - step / rate, offsety];
                    } else {
                        return [indexs[i], offsety];
                    }
                }
                break;
            //上行信号位置
            case FeatureType_.SIGNALINTENSITYUP:
                var i = array.indexOf(FeatureType_.SIGNALINTENSITYUP);
                return [indexs[i], offsety];
                break;
            //下行信号位置
            case FeatureType_.SIGNALINTENSITYDOWN:
                var i = array.indexOf(FeatureType_.SIGNALINTENSITYDOWN);
                return [indexs[i], offsety];
                break;
        }
    }
    //加载是否显示的参数，strObj为'|'分隔字符串,如'energy|singalup|singaldown'
    var loadParams = function(strObj){
        var strArray = strObj.split('|');
        isShowEnergy = false, isShowUp = false, isShowDown = false;
        strArray.forEach(function (v) {
            switch (v) {
                case FeatureType_.ENERGY:
                    isShowEnergy = true;
                    break;
                case FeatureType_.SIGNALINTENSITYUP:
                    isShowUp = true;
                    break;
                case FeatureType_.SIGNALINTENSITYDOWN:
                    isShowDown = true;
                    break;
            }
        });
        return strArray;
    }

    

    //根据type类型返回相应的ol.style.Style
    var newStyle = function (type, option) {
        switch(type){
            case FeatureType_.ENERGY:
                if (isShowEnergy) {
                    var style = returnStyle(drawEnergy, ImagePosition_, option.userid, type, option.energy, [opt.ewidth, opt.eheight], option.online, option.typeflag, option.length, FeatureType_.ENERGY);
                    return style;
                } else {
                    return null;
                }
                break;
            case FeatureType_.SIGNALINTENSITYUP:
                if (isShowUp) {
                    var style = returnStyle(drawSignalUp, ImagePosition_, option.userid, type, option.signalup, [opt.swidth, opt.sheight], option.online, option.typeflag, option.length, FeatureType_.SIGNALINTENSITYUP);
                    return style;
                } else {
                    return null;
                }
                break;
            case FeatureType_.SIGNALINTENSITYDOWN:
                if (isShowDown) {
                    var style = returnStyle(drawSignalDown, ImagePosition_, option.userid, type, option.signaldown, [opt.swidth, opt.sheight], option.online, option.typeflag, option.length, FeatureType_.SIGNALINTENSITYDOWN);
                    return style;
                } else {
                    return null;
                }
                break;
        }
        
    }

   //返回样式
   var returnStyle = function (drawFun, positionFun, id, type, value, imgSize, online, typeflag, length, mark) {
    var view = currentMap.getView();
    var zoomScale = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());
    var index = value + online.toString() + mark;
    var offsetY = 2.2;
    if (typeflag == 2) {//当为船舶时
        zoomScale = getScaleByResolution(view, imgSize[1], length);
        offsetY = 2.6; 
        index = value + online.toString() + mark + typeflag + id;
    } 
    
        var image = canvasMap.get(index);
        if (!image) {
            var canvas = drawFun(value, online);
            image = new ol.style.Icon({
                img: canvas,
                scale: zoomScale,
                imgSize: imgSize
            });
            canvasMap.set(index, image);
        }
        image.setAnchor(positionFun(type, showArray, offsetY));
        var style = new ol.style.Style({
            image: image
        });
        return style;
    }

    //绘制剩余电量
    var drawEnergy = function (energy, online) {
        var cvs = document.createElement('canvas');
        var ctx = cvs.getContext('2d');
        var l = opt.lineWidth, w = opt.ewidth, h = opt.eheight;
        var color = getColorByRate(energy, 1, false);
        var lightColor = getColorByRate(energy, 0.5, false);
        var lineColor = "#000000";
        if (energy <= 0) {//energy=-1时，灰色显示
            lineColor = "#C4C4C4";
            energy = 0;
        }
        if (!online) {//人员不在线时，灰色显示
            lineColor = "#C4C4C4";
            color = "#C4C4C4";
            lightColor = "#C4C4C4";
        }
        ctx.clearRect(0, 0, w, h);
        //画头样式
        ctx.beginPath();
        ctx.fillStyle = lineColor;
        ctx.lineJoin = "round";
        var headx = (w - l) * (1 / 3) + l / 3, heady = 0, headw = w * (1 / 3), headh = h * (1 / 6);
        ctx.fillRect(headx, heady, headw, headh);
        ctx.closePath();
        //画背景
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(l, headh, w - 2 * l, h - headh);
        //画填充
        var r = 1 / 3;
        var eh = (h - headh - 2 * l) * energy / maxEnergy;
        var ofy = (h - 2 * l) - eh;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.fillRect(l + (w - 2 * l) * r, ofy + l, (w - 2 * l) * (1 - r), eh);
        ctx.fillStyle = lightColor;
        ctx.fillRect(l, ofy + l, (w - 2 * l) * r, eh);
        ctx.closePath();
        //画外边框
        ctx.beginPath();
        ctx.lineWidth = l;
        ctx.strokeStyle = lineColor;
        ctx.lineJoin = "round";
        ctx.strokeRect(l / 2, headh + 1, w - l, h - headh - l);
        ctx.closePath();
        return cvs;
    }

    //绘制信号强度,ctx:画布上下文, signal:信号强度, color:颜色, r:占画布比例, l:线宽, w:画布宽, h:画布高, achorPoint:初始锚定点, radius:半径
    var drawSignal = function (ctx, signal, color, lineColor, r, l, w, h, achorPoint, radius, maxValue) {
        ctx.clearRect(0, 0, w, h);
        var sradius = Math.abs(signal - maxValue) / maxValue * (radius - l);//信号半径
        //画背景
        ctx.beginPath();
        ctx.arc(achorPoint[0], achorPoint[1], radius, Math.PI * 5 / 4, Math.PI * 7 / 4, false);
        ctx.lineTo(achorPoint[0], achorPoint[1]);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        //在canvas上画信号强度
        ctx.beginPath();
        ctx.arc(achorPoint[0], achorPoint[1] - l, sradius, Math.PI * 5 / 4, Math.PI * 7 / 4, false);
        ctx.lineTo(achorPoint[0], achorPoint[1]);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        //绘制底部样式
        ctx.fillStyle = lineColor;
        ctx.fillRect(achorPoint[0] - 2, achorPoint[1], 4, 2);
        //绘制外边框样式
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = l;
        ctx.moveTo(achorPoint[0], achorPoint[1]);
        ctx.lineTo(achorPoint[0] - Math.sin(Math.PI / 8) * radius, achorPoint[1] - Math.sin(Math.PI / 8) * radius);
        ctx.arc(achorPoint[0], achorPoint[1], radius, Math.PI * 5 / 4, Math.PI * 7 / 4, false);
        ctx.lineTo(achorPoint[0], achorPoint[1]);
        ctx.stroke();
        ctx.closePath();
    }

    //画上行
    var drawSignalUp = function (signal, online) {
        var cvs = document.createElement('canvas');
        var ctx = cvs.getContext('2d');
        var r = 2 / 3;//四分之一圆占整体画布比例
        var l = opt.lineWidth, w = opt.swidth, h = opt.sheight;//l:线宽,w:画布宽,h:画布高;
        var achorPoint = [w * r / 2, 11 / 12 * h];//锚定位置
        var radius = (w - 2 * l) / 2;//整体半径
        //计算颜色值
        var lineColor = "#000000";
        var color = getColorByRate(signal / maxSignalUp * 100, 1, true);
        if (signal <= 0 || signal > maxSignalUp) {//signal=-1时，灰色显示
            lineColor = "#C4C4C4";
            color = "#C4C4C4";
            signal = maxSignalUp;
        }
        if (!online) {//人员不在线时，灰色显示
            lineColor = "#C4C4C4";
            color = "#C4C4C4";
        }
        drawSignal(ctx, signal, color, lineColor, r, l, w, h, achorPoint, radius, maxSignalUp);
        //绘制箭头标志
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.moveTo(w * r + 2 * l, achorPoint[1] - radius + 1 / 4 * h);
        ctx.lineTo(w * r + 2 * l, achorPoint[1] - radius);
        ctx.lineTo(w * r, achorPoint[1] - radius + 1 / 4 * h - 2 * l);
        ctx.moveTo(w * r + 2 * l, achorPoint[1] - radius);
        ctx.lineTo(w * r + 4 * l, achorPoint[1] - radius + 1 / 4 * h - 2 * l);
        ctx.stroke();
        ctx.closePath();
        return cvs;
    }

    //画下行
    var drawSignalDown = function (signal, online) {
        var cvs = document.createElement('canvas');
        var ctx = cvs.getContext("2d");
        var r = 2 / 3;//圆弧占整体画布比例
        var l = opt.lineWidth, w = opt.swidth, h = opt.sheight;//l:线宽,w:画布宽,h:画布高;
        var achorPoint = [w * r / 2, 11 / 12 * h];//锚定位置
        var radius = (w - 2 * l) / 2;//整体半径
        
        //计算颜色值
        var lineColor = "#000000";
        var color = getColorByRate(signal / maxSignalDown * 100, 1, true);
        if (signal <= 0) {
            lineColor = "#C4C4C4";
            color = "#C4C4C4";
            signal = maxSignalDown;
        }
        if (!online) {
            lineColor = "#C4C4C4";
            color = "#C4C4C4";
        }
        drawSignal(ctx, signal, color, lineColor, r, l, w, h, achorPoint, radius, maxSignalDown);
        //绘制箭头标志
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.moveTo(w * r + 2 * l, achorPoint[1] - radius);
        ctx.lineTo(w * r + 2 * l, achorPoint[1] - radius + 1 / 4 * h);
        ctx.lineTo(w * r, achorPoint[1] - radius + 1 / 4 * h - 2 * l);
        ctx.moveTo(w * r + 2 * l, achorPoint[1] - radius + 1 / 4 * h);
        ctx.lineTo(w * r + 4 * l, achorPoint[1] - radius + 1 / 4 * h - 2 * l);
        ctx.stroke();
        ctx.closePath();
        return cvs;
    }

    //求由绿到红的渐变色值,百分比 rate 取值 1...100,a表示透明度，reverse表示是否反转
    var getColorByRate = function (rate, a, reverse) {
        if (reverse) {
            rate = Math.abs(rate - 100);
        }
        //var 百分之一 = (单色值范围) / 50;  单颜色的变化范围只在50%之内
        var one = (255 + 255) / 100;
        var r = 0;
        var g = 0;
        var b = 0;
        
        if (rate < 50) {
            //比例小于50的时候红色是越来越多的,直到红色为255时(红+绿)变为黄色.
            r = 255;
            g = rate * one;
        }
        if (rate >= 50) {
            //比例大于50的时候绿色是越来越少的,直到0 变为纯红
            g = 255;
            r = 255 - ((rate - 50) * one);
        }
        r = parseInt(r-45);
        g = parseInt(g-45);
        b = parseInt(b-45);
        r = Math.max(r, 0);
        g = Math.max(g, 0);
        b = Math.max(b, 0);

        return "rgba(" + r + "," + g + "," + b + "," + a + ")";

    }

    //根据type类型创建矢量要素
    var createFeature = function(type,option){
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(option.coordinates),
            typeflag: option.typeflag,
            length: option.length//当为船舶时，场强的实际大小为船的长度/3
        });
        feature.setStyle(newStyle(type, option));
        if (type == FeatureType_.ENERGY) {
            feature.setId(option.deID);
            feature.setProperties({ "energy": option.energy });
        } else if (type == FeatureType_.SIGNALINTENSITYUP) {
            feature.setId(option.siuID);
            feature.setProperties({ "signalup": option.signalup });
        } else if (type == FeatureType_.SIGNALINTENSITYDOWN) {
            feature.setId(option.sidID);
            feature.setProperties({ "signaldown": option.signaldown });
        }
        return feature;
    }

    //位置更新时重新设置位置
    var setPosition = function (i, coordinates) {
        var f1 = fieldStrengthSource.getFeatureById(currentFSArray[i].deID);
        var f2 = fieldStrengthSource.getFeatureById(currentFSArray[i].siuID);
        var f3 = fieldStrengthSource.getFeatureById(currentFSArray[i].sidID);
        if (f1) {
            f1.getGeometry().setCoordinates(coordinates);
        }
        if (f2) {
            f2.getGeometry().setCoordinates(coordinates);
        }
        if (f3) {
            f3.getGeometry().setCoordinates(coordinates);
        }
    }
    
    //电量更新时重新设置电量
    var setEnergy = function (i, energy, online) {
        var f = fieldStrengthSource.getFeatureById(currentFSArray[i].deID);
        if (!isShowEnergy) {
            f.setStyle(null);
            return;
        } else {
            f.setStyle(newStyle(FeatureType_.ENERGY, currentFSArray[i]));
        }
        f.setProperties({ "energy": energy });
    }

    //上行信号更新时重新设置信号
    var setSignalIntensityUp = function (i, signal, online) {
        var f = fieldStrengthSource.getFeatureById(currentFSArray[i].siuID);
        if (!isShowUp) {
            f.setStyle(null);
            return;
        } else {
            f.setStyle(newStyle(FeatureType_.SIGNALINTENSITYUP, currentFSArray[i]));
        }
        f.setProperties({ "signalup": signal });
    }

    //下行信号更新时重新设置信号
    var setSignalIntensityDown = function (i, signal, online) {
        var f = fieldStrengthSource.getFeatureById(currentFSArray[i].sidID);
        if (!isShowDown) {
            f.setStyle(null);
            return;
        } else {
            f.setStyle(newStyle(FeatureType_.SIGNALINTENSITYDOWN, currentFSArray[i]));
        }
        f.setProperties({ "signaldown": signal });
    }

    //更新要素信息，包括位置、电量、信号
    var updateFeature = function (func, i, p, v, o) {
        if (v.toString() !== (currentFSArray[i][p]).toString()) {
            func(i, v, o);
            currentFSArray[i][p] = v;
        }
    }

    //添加要素信息
    var addFeature = function (opt) {
        var f1 = createFeature(FeatureType_.ENERGY, opt);
        var f2 = createFeature(FeatureType_.SIGNALINTENSITYUP, opt);
        var f3 = createFeature(FeatureType_.SIGNALINTENSITYDOWN, opt);
        resetScale([f1, f2, f3], opt.typeflag, opt.length);
        fieldStrengthSource.addFeatures([f1, f2, f3]);

        currentFSArray.push(opt);
    }

    var resetScale = function (features, typeflag, length) {
        var view = currentMap.getView();
        var scale = (view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom());

        features.forEach(function (f) {
            if (f) {
                var style = f.getStyle();
                if (style) {
                    var image = style.getImage();
                    if (image) {
                        if (typeflag == 2) {//当为船舶时
                            var imgSize = image.iconImage_.size_[1]
                            scale = getScaleByResolution(view, imgSize, length);
                        }
                        image.setScale(scale);
                    }
                }
            }
        })
    }

    //删除要素信息
    this.removeFeature = function (userId) {
        try {
            var f1 = fieldStrengthSource.getFeatureById("de_" + userId);
            var f2 = fieldStrengthSource.getFeatureById("siu_" + userId);
            var f3 = fieldStrengthSource.getFeatureById("sid_" + userId);
            if (f1) {
                fieldStrengthSource.removeFeature(f1);
            }
            if (f2) {
                fieldStrengthSource.removeFeature(f2);
            }
            if (f3) {
                fieldStrengthSource.removeFeature(f3);
            }
            currentFSArray.forEach(function (fs,i) {
                if (fs.userid == userId) {
                    currentFSArray.splice(i, 1);
                    return;
                }
            });
        }
        catch (err) {
            writeLog("system", "ol-FieldStrengthLayer.js removeFeature，error info:" + err);
        }
    }

    //创建tooltip
    var createTooltip = function () {
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

    //添加fieldStrengthLayer的鼠标移动交互事件，显示信息
    var addLayerMoveInteraction = function () {
        if (fsMoveInteraction) {
            return;
        }
        fsMoveInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            layers: [fieldStrengthLayer],
            wrapX: false
        });
        fsMoveInteraction.on("select", function (event) {
            if (event.selected.length > 0) {
                var feature = event.selected[0];
                createTooltip();
                var energy = feature.get(FeatureType_.ENERGY);
                var signalup = feature.get(FeatureType_.SIGNALINTENSITYUP);
                var signaldown = feature.get(FeatureType_.SIGNALINTENSITYDOWN);
                if (energy >= -1) {
                    var energyText = '';
                    if (energy <= 0) {
                        energyText = GetTextByName("noenergy");
                    } else {
                        energyText = energy + '%';
                    }
                    tooltipElement.innerHTML = '<big>' + FeatureLable_.ENERGY + ': ' + energyText + '</big>';
                }
                if (signalup >= -1) {
                    var signalupText = '';
                    if (signalup <= 0) {
                        signalupText = GetTextByName("nosignalup");
                    }
                    else {
                        signalupText = '-' + signalup + ' dB';
                    }
                    tooltipElement.innerHTML = '<big>' + FeatureLable_.SIGNALINTENSITYUP + ": " + signalupText + '</big>';
                }
                if (signaldown >= -1) {
                    var signaldownText = '';
                    if (signaldown <= 0) {
                        signaldownText = GetTextByName("nosignaldown")
                    } else {
                        signaldownText = '-' + signaldown + ' dB';
                    }
                    tooltipElement.innerHTML = '<big>' + FeatureLable_.SIGNALINTENSITYDOWN + ": " + signaldownText + '</big>';
                }
                
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
        currentMap.addInteraction(fsMoveInteraction);
    }

    this.loadFSLayer = function () {
        try{
            var loadFeatureFunc = this.loadFeature;
            fieldStrengthLayer.setVisible(currentUserLayer.getVisible());
            var currentUserLayerSource = currentUserLayer.getSource();
            var userLayerFeatures = currentUserLayerSource.getFeatures();

            var indexs = Array(currentFSArray.length + 1).join(0).split('').map(function (v, k) { return k++; });//创建[0-currentFSArray.length-1]数组
            userLayerFeatures.forEach(function (val) {
                loadFeatureFunc([val], function (i) {
                    var index = indexs.indexOf(i);
                    indexs.splice(index, 1);//如果存在，移除索引数组内的索引值
                });
                    
            });
                //对已经移除的用户移除场强信息
            for (var i = indexs.length - 1; i >= 0; i--) {
                this.removeFeature(currentFSArray[indexs[i]].userid);
            }
        } catch (err) {
            writeLog("system", "ol-FieldStrengthLayer.js loadFSLayer，error info:" + err);
        }
    }

    this.loadFeature = function (features, func) {
        try{
            features.forEach(function (feature) {
                if (feature) {
                    var id = feature.getId();
                    //当要素为用户时，展示相应的场强信息
                    if (id.indexOf("p") == 0) {
                        var coord = feature.getGeometry().getCoordinates();
                        var person = feature.get("person");
                        var typeflag = feature.get("typeflag");
                        var energy = person.battery;
                        var signalup = person.ulRssi;
                        var signaldown = person.msRssi;
                        var online = person.online;
                        var l = person.length / 3;//当为船舶时，场强的实际大小为船的长度/3
                        var isHaving = false;
                        for (var i = 0; i < currentFSArray.length; i++) {
                            if (id == currentFSArray[i].userid) {
                                isHaving = true;
                                updateFeature(setPosition, i, "coordinates", coord, online);//如果位置出现变化，更新位置信息
                                updateFeature(setEnergy, i, "energy", energy, online);//如果电量出现变化，更新电量信息
                                updateFeature(setSignalIntensityUp, i, "signalup", signalup, online);//如果上行强度出现变化，更新上行强度信息
                                updateFeature(setSignalIntensityDown, i, "signaldown", signaldown, online);//如果下行强度出现变化，更新下行强度信息
                                if (typeof func == "function") {
                                    func(i);
                                }
                                break;
                            }
                        }
                        //对重新添加的用户重新添加场强信息
                        if (!isHaving) {
                            addFeature({
                                userid: id, deID: 'de_' + id, siuID: 'siu_' + id, sidID: 'sid_' + id, coordinates: coord,
                                energy: energy, signalup: signalup, signaldown: signaldown, online: online, typeflag: typeflag, length: l
                            });//如果该用户以前不存在，添加要素
                        }
                    }
                    //当无或者重新添加场强展示信息时，对头部信息重新设置位置
                    if (id.indexOf("head") == 0) {
                        if (showArray.length == 1 && showArray[0] == "") {
                            var fstyle = feature.getStyle();
                            if (fstyle) {
                                var ftext = fstyle.getText();
                                if (ftext) {
                                    var view = currentMap.getView();
                                    if (feature.get('typeflag') == 2) {
                                        var imagesize = feature.get('imageSize');
                                        var length = feature.get('length');
                                        var scale = getScaleByResolution(currentMap.getView(), imagesize, length);//xzj--20190724--getView加()
                                        var offsetY = -scale * (imagesize + 20) / 2;
                                        ftext.setOffsetY(offsetY);
                                    } else {
                                        ftext.setOffsetY((view.getZoom() - view.getMinZoom()+3) / (view.getMaxZoom()) * (-64 / 2 - 5));
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } catch (err) {
            writeLog("system", "ol-FieldStrengthLayer.js loadFeature，error info:" + err);
        }
    }
    //隐藏或者展示场强的信息
    this.setHideOrShow = function (obj) {
        try{
            showArray = loadParams(obj);
            useprameters.FieldStrength = obj;
            clearUserLayer();//清空用户图层
            this.loadFSLayer();
        } catch (err) {
            writeLog("system", "ol-FieldStrengthLayer.js setHideOrShow，error info:" + err);
        }
    }

    //场强图层显示或者隐藏
    this.setVisible = function (visible) {
        try{
            fieldStrengthLayer.setVisible(visible);
        } catch (err) {
            writeLog("system", "ol-FieldStrengthLayer.js setVisible，error info:" + err);
        }
    }

    //初始化部分方法及参数
    var showArray = loadParams(useprameters.FieldStrength);//对展示表示进行加载并返回展示数组
    addLayerMoveInteraction();//添加场强图层鼠标移动地图交互事件，主要为信息展示
}