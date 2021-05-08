
var map = null;
var userLayer = null;
var userAnimationLayer = null;//cxy-20180801-添加用户动画图层

function HisLoadMap() {

   
    var GISTYPE = useprameters.GISTYPE.toLowerCase();

    var viewParam = {
        "lo": useprameters.PGIS_Center_lo,//中心点
        "la": useprameters.PGIS_Center_la,//中心点
        "maxLevel": useprameters.maxLevel,//最大层级
        "minLevel": useprameters.minLevel,//最小层级
        "currentLevel": useprameters.maxLevel-2//显示层级
    }
    var view = createView(GISTYPE, viewParam);//创建视图

    map = new ol.Map({
        target: 'map',
        // 设置地图控件，默认的三个控件都不显示
        controls: ol.control.defaults({
            attribution: false,
            rotate: false,
            zoom: false
        }),
        view: view
    });

    var offlineMapLayerParams = createBaseMapParameter(GISTYPE);
    var streetMapLayer = createStreetMapLayer(map, "offlineMapLayer", offlineMapLayerParams);//创建街景图
    //map.addLayer(streetMapLayer);//添加街景图

    MapChange();//cxy-20180801-监听图层变化
}


//坐标系转换公用方法
function Conversion(lo,la)
{

    return ol.proj.transform([parseFloat(lo), parseFloat(la)], 'EPSG:4326', 'EPSG:3857');

}

//cxy-20180801-监听图层变化
function MapChange() {
    map.getView().on('change:resolution', function (event) {
        var layers = map.getLayers();
        layers.forEach(function (value) {
            var layerID = value.get("ID");
            if (layerID == "histroyUser" || layerID == "histroyUserAnimation") {
                var features = value.getSource().getFeatures();
                for (var k = 0; k < value.getSource().getFeatures().length ; k++) {
                    var type = features[k].get('type');
                    if (type == 'geoMarker') {
                        var style = features[k].getStyle();
                        if (style != null) {
                            if (style.image_ != null) {
                                style.getImage().setScale(map.getView().getZoom() / useprameters.maxLevel);
                                features[k].setStyle(style);
                            }
                        }
                    }
                }
            }
        })
    })
}