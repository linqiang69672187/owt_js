//------------------------------实时轨迹对象----------------------

var pointNum = 100;
//var wholeData = [];
var RealTimeTraceArray = [];
function RealTimeTrace(id, Issi, color, lineHeight) {
    this.id = id;
    this.ISSI = Issi;
    this.color = color;
    this.LineHeight = lineHeight;
    this.wholeData = [];
    this.realTimeTraceLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        zIndex: 1
    });
    this.realTimeTraceLayer.setProperties({ "ID": "realTime" + id });
}

function PeruserRealtimeTrace_ISSI(id, Issi, color, lineHeight) {
    var person = userLayer.getSource().getFeatureById("p" + id);
    if (person) {
        person.values_.person.realTimeTrace = new RealTimeTrace(id, Issi, color, lineHeight);
        person.values_.person.isRealTimeTrace = true;
        RealTimeTraceArray.push(person.values_.person.realTimeTrace);
    }
}

RealTimeTrace.prototype.AddData = function (lon, lat, time) {
    this.wholeData.push(lon);
    this.wholeData.push(lat);
    this.wholeData.push(time);
    if (this.wholeData.length > pointNum)
        this.wholeData.shift();
}
RealTimeTrace.prototype.DrawLine = function (Trace) {

    var data = Trace.wholeData;
    var length = data.length;
    //设置轨迹箭头大小
    var scaleVale = 1;
    switch (Trace.LineHeight) {
        case "1":
            scaleVale = 3 / 5;
            break;
        case "2":
            scaleVale = 3 / 5;
            break;
        case "3":
            scaleVale = 3 / 5;
            break;
        case "4":
            scaleVale = 4 / 5;
            break;
        case "5":
            scaleVale = 4 / 5;
            break;
    }
    //设置轨迹箭头图片
    var srcimg = '/images/layer/jiantou/black.png';
    //black:#000000; red:"#ff0033";blue:"#0000FF";green:"#33FF33";yellow:"#FFFF00";
    switch (Trace.color) {
        case "#000000":
            srcimg = '/images/layer/jiantou/black.png';
            break;
        case "#ff0033":
            srcimg = '/images/layer/jiantou/red.png';
            break;
        case "#0000FF":
            srcimg = '/images/layer/jiantou/blue.png';
            break;
        case "#33FF33":
            srcimg = '/images/layer/jiantou/green.png';
            break;
        case "#FFFF00":
            srcimg = '/images/layer/jiantou/yellow.png';
            break;
    }

    if (length > 3) {
        var point1 = ol.proj.transform([parseFloat(data[length - 3]), parseFloat(data[length - 2])], 'EPSG:4326', 'EPSG:3857');
        var point2 = ol.proj.transform([parseFloat(data[length - 6]), parseFloat(data[length - 5])], 'EPSG:4326', 'EPSG:3857');
    } else {
        var point1 = ol.proj.transform([parseFloat(data[length - 3]), parseFloat(data[length - 2])], 'EPSG:4326', 'EPSG:3857');
        var point2 = ol.proj.transform([parseFloat(data[length - 3]), parseFloat(data[length - 2])], 'EPSG:4326', 'EPSG:3857');
    }
    var Coordinates = [];
    Coordinates[0] = point2;
    Coordinates[1] = point1;
    var line = new ol.Feature({
        geometry: new ol.geom.LineString(Coordinates)
    });
    line.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
            width: Trace.LineHeight,
            color: Trace.color
        })
    }));

    //添加箭头
    var dx = point1[0] - point2[0];
    var dy = point1[1] - point2[1];
    var rotation = Math.atan2(dy, dx);

    var pixel1 = map.getPixelFromCoordinate(point1);
    var anchOr = [0.75, 0.5];
    if (dx == 0 && dy == 0) {
        //point1 = map.getCoordinateFromPixel([pixel1[0]-10, pixel1[1]]);
        anchOr = [2.0, 0.5];
    }
    var jiantou = new ol.Feature({
        geometry: new ol.geom.Point(point1),
        name: "jiantou" + Trace.ISSI
    });
    
    jiantou.setId("jiantou" + Trace.id);
    jiantou.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            src: srcimg,
            anchor: anchOr,
            rotateWithView: true,
            scale: scaleVale,
            //offsetOrigin:'bottom-left',
            rotation: -rotation
        })
    }));

    map.removeLayer(Trace.realTimeTraceLayer);
    Trace.realTimeTraceLayer.getSource().addFeature(line);
    //删除原先的箭头
    var ff = Trace.realTimeTraceLayer.getSource().getFeatureById("jiantou" + Trace.id);
    if (ff) {
        Trace.realTimeTraceLayer.getSource().removeFeature(ff);
    }

    Trace.realTimeTraceLayer.getSource().addFeature(jiantou);
    map.addLayer(Trace.realTimeTraceLayer);
}
// function AddPeruserRealtimeTrace_line() {
//     if (useprameters.realtimeTraceUserIds.length > 0) {
//         for (var i = 0; i < useprameters.realtimeTraceUserIds.length; i++) {
//             var person = userLayer.getSource().getFeatureById("p" + useprameters.realtimeTraceUserIds[i]);
//             if (person) {
//                 var lat = person.values_.person.lat;
//                 var lon = person.values_.person.lon;
//                 var sendTime = person.values_.person.sendTime;
//                 var Trace = person.values_.person.realTimeTrace;
//                 Trace.AddData(lon, lat, sendTime);
//                 Trace.DrawLine(Trace);

//             }

//         }
//     }
// }

function AddPeruserRealtimeTrace_line(id) {
    if (useprameters.realtimeTraceUserIds.length > 0) {
        for (var i = 0; i < useprameters.realtimeTraceUserIds.length; i++) {
            if (id == useprameters.realtimeTraceUserIds[i]) {
                var person = userLayer.getSource().getFeatureById("p" + useprameters.realtimeTraceUserIds[i]);
                if (person) {
                    var p = person.get("person");
                    var lat = person.values_.person.lat;
                    var lon = person.values_.person.lon;
                    var sendTime = person.values_.person.sendTime;

                    RealTimeTraceArray.forEach(function (val, j) {
                        if (id == val.id) {
                            var Trace = val;
                            Trace.AddData(lon, lat, sendTime);
                            Trace.DrawLine(Trace);
                        }
                    })

                    //var Trace = person.values_.person.realTimeTrace;
                    //Trace.AddData(lon, lat, sendTime);
                    //Trace.DrawLine(Trace);

                }
            }
        }
    }
}

function RemoveRealtimeTrace_line(userId,isremovedata) {
    var person = userLayer.getSource().getFeatureById("p" + userId);
    if (person) {
        var Trace = person.values_.person.realTimeTrace;
        if (isremovedata) {
            var k = Trace.wholeData.length;
            Trace.wholeData.splice(0, k);
        }
        map.removeLayer(Trace.realTimeTraceLayer);

    }

}

