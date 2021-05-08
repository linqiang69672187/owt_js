/*!
*@file 创建地图的视图及底图参数控制
*@author cxy
*@createDate 20180925
*@params {String} gistype 地图类型
*/

var createView = function (gistype, option) {
    try{
        var lo = option.lo;//中心点
        var la = option.la;//中心点
        var maxLevel = option.maxLevel;//最大几层
        var minLevel = option.minLevel;//最小几层
        var currentLevel = option.currentLevel;//显示第几层

        //获取非标准化切片地图（自编算法）初始化视图
        var getWebGISNo = function () {
            var Origin_Lo = useprameters.OriginLo;
            var Origin_La = useprameters.OriginLa;
            var RDLat = map_region.RDLat;
            var RDLng = map_region.RDLng;
            var extent_proj = ol.proj.transformExtent([parseFloat(Origin_Lo), parseFloat(Origin_La), parseFloat(RDLng), parseFloat(RDLat)], 'EPSG:4326', 'EPSG:3857');
            var resolution = (extent_proj[2] - extent_proj[0]) / useprameters.mapsize;

            var projection = new ol.proj.Projection({
                code: 'EPSG:3857',
                units: 'm'
            });
            var view = new ol.View({
                projection: projection,
                center: ol.proj.transform([parseFloat(lo), parseFloat(la)], 'EPSG:4326', 'EPSG:3857'),
                zoom: parseInt(currentLevel),
                minZoom: parseInt(minLevel),
                maxZoom: parseInt(maxLevel),
                maxResolution: resolution,
                minResolution: resolution / Math.pow(2, parseInt(maxLevel))
            });
            return view;
        }

        //标准化切片地图（官方算法）初始化视图
        var getWebGIS = function () {
            var view = new ol.View({
                center: ol.proj.fromLonLat([parseFloat(lo), parseFloat(la)]),
                zoom: parseInt(currentLevel),
                minZoom: parseInt(minLevel),
                maxZoom: parseInt(maxLevel),
            });

            return view;
        }

        //谷歌gcj-02坐标系地图初始化视图
        var getGoogleBiased = function () {
            var projection = new ol.proj.Projection({
                code: 'EPSG:3857',
                units: 'm'
            });
            var view = new ol.View({
                projection: projection,
                center: ol.proj.fromLonLat([parseFloat(lo), parseFloat(la)]),
                zoom: parseInt(currentLevel),
                minZoom: parseInt(minLevel),
                maxZoom: parseInt(maxLevel),
            });

            return view;
        }

        //百度bd-09坐标系地图初始化视图
        var getBaiduBiased = function () {
            var projection = new ol.proj.Projection({
                code: 'EPSG:3857',
                units: 'm'
            });
            var view = new ol.View({
                projection: projection,
                center: ol.proj.fromLonLat([parseFloat(lo), parseFloat(la)]),
                zoom: parseInt(currentLevel),
                minZoom: parseInt(minLevel),
                maxZoom: parseInt(maxLevel),
            });

            return view;
        }
        
        //高德gcj-02坐标系地图初始化视图
        var getGaodeBiased = function () {
            var projection = new ol.proj.Projection({
                code: 'EPSG:3857',
                units: 'm'
            });
            var view = new ol.View({
                projection: projection,
                center: ol.proj.fromLonLat([parseFloat(lo), parseFloat(la)]),
                zoom: parseInt(currentLevel),
                minZoom: parseInt(minLevel),
                maxZoom: parseInt(maxLevel),
            });

            return view;
        }
        
        //标准PGis基于WMTS服务（官方算法） 初始化视图
        var getPGIS = function () {
            var view = new ol.View({
                center: ol.proj.transform([parseFloat(lo), parseFloat(la)], 'EPSG:4326', 'EPSG:3857'),
                zoom: parseInt(currentLevel),
                minZoom: parseInt(minLevel),
                maxZoom: parseInt(maxLevel)
            })

            return view;
        }

        //文山 兰州PGis基于WMTS服务（算法从地图1层开始算） 初始化视图
        var getWLPGIS = function () {
            var projection = ol.proj.get('EPSG:4326');
            var view = new ol.View({
                center: [104.20326232910156, 23.453613293822854],
                zoom: 10,
                minZoom: 10,
                maxZoom: 20,
                projection: projection
            });
            return view;
        }

        switch (gistype) {
            case "tianditu":
                return getWebGIS();
                break;
            case "webgisno":
                return getWebGISNo();
                break;
            case "google":
                return getGoogleBiased();
                break;
            case "pgis":
                return getPGIS();
                break;
            case "wspgis":
                return getWLPGIS();
                break;
            case "baidu":
                return getBaiduBiased();
                break;
            case "gaode":
                return getGaodeBiased();
                break;
        }
    } catch (err) {
        writeLog("system", "ol-View.js createView，error info:" + err);
    }
}

//创建街景图和卫星图的参数，根据不同地图各自的算法
function createBaseMapParameter(gistype) {
    var parm = {};
    parm.gistype = gistype;//地图类型
    parm.mapurl = useprameters.Emapurl;//地图地址
    parm.maptype = useprameters.maptype;//图片类型
    parm.maxLevel = useprameters.maxLevel;//最大几层
    switch (gistype) {
        case "tianditu":
            break;
        case "webgisno":
            //原点坐标
            var Origin_Lo = useprameters.OriginLo;
            var Origin_La = useprameters.OriginLa;
            var RDLat = map_region.RDLat;
            var RDLng = map_region.RDLng;
            var extent_proj = ol.proj.transformExtent([parseFloat(Origin_Lo), parseFloat(Origin_La), parseFloat(RDLng), parseFloat(RDLat)], 'EPSG:4326', 'EPSG:3857');
            var resolution = (extent_proj[2] - extent_proj[0]) / useprameters.mapsize;

            // 自定义分辨率和瓦片坐标系
            var resolutions = [];
            var maxResolution = resolution;

            //分辨率数组
            for (var i = 0; i <= parseInt(parm.maxLevel) ; i++) {
                resolutions[i] = maxResolution / Math.pow(2, i);
            }

            //瓦片网格
            var tilegrid = new ol.tilegrid.TileGrid({
                tileSize: [useprameters.mapsize, useprameters.mapsize],
                origin: ol.proj.transform([parseFloat(Origin_Lo) + parseFloat(useprameters.deviation_lo), parseFloat(Origin_La) + parseFloat(useprameters.deviation_la)], 'EPSG:4326', 'EPSG:3857'),    // 设置原点坐标
                resolutions: resolutions    // 设置分辨率
            });

            //坐标系
            var projection = new ol.proj.Projection({
                code: 'EPSG:3857',
                units: 'm'
            })

            parm.projection = projection;
            parm.tilegrid = tilegrid;
            break;
        case "google":
            var lon = useprameters.PGIS_Center_lo;//中心点
            var lat = useprameters.PGIS_Center_la;//中心点
            var projection = CoordinateBiasedAlgorithm.createGoogleProjection("GoogleBiased", [parseFloat(lon), parseFloat(lat)]);//创建谷歌偏移的坐标系

            parm.projection = projection;
            break;
        case "pgis":
            var projection = ol.proj.get('EPSG:3857');//坐标系
            var projectionExtent = projection.getExtent();//坐标范围
            var size = ol.extent.getWidth(projectionExtent) / 256;//最大宽度
            var resolutions = [];//分辨率数组
            var matrixIds = [];//瓦片网格
            for (var z = 0; z < parseInt(parm.maxLevel) ; ++z) {
                resolutions[z] = size / Math.pow(2, z);
                matrixIds[z] = z;
            }

            parm.projection = projection;
            parm.projectionExtent = projectionExtent;
            parm.resolutions = resolutions;
            parm.matrixIds = matrixIds;
            break;
        case "wspgis":
            var projection = ol.proj.get('EPSG:4326');//坐标系
            var size = 0.703125;
            var resolutions = [];//分辨率数组
            var matrixIds = [];//瓦片网格
            for (var z = 10; z <= 19; ++z) {
                resolutions[z] = size / Math.pow(2, z - 1);
                matrixIds[z] = z;
            }

            parm.resolutions = resolutions;
            parm.matrixIds = matrixIds;
            parm.projection = projection;
            break;
        case "baidu":
            var lon = useprameters.PGIS_Center_lo;//中心点
            var lat = useprameters.PGIS_Center_la;//中心点
            var biased = CoordinateBiasedAlgorithm.getBaiduBiased([parseFloat(lon), parseFloat(lat)]);//计算百度偏移的距离

            var resolutions = [];
            var matrixIds = [];
            for (var i = 0; i < parseInt(parm.maxLevel) + 1 ; i++) {
                resolutions[i] = Math.pow(2, 18 - i);
                matrixIds[i] = i;
            }
            var tilegrid = new ol.tilegrid.TileGrid({
                origin: biased.map(function (item) { return -item }),
                resolutions: resolutions,
                matrixIds: matrixIds
            });

            proj4.defs('BD-MC', '+proj=merc +lon_0=0 +units=m +ellps=clrk66 +no_defs');//定义百度Mercator坐标系

            parm.projection = 'BD-MC';
            parm.resolutions = resolutions;
            parm.tilegrid = tilegrid;
            parm.center = [lon, lat];
            break;
        case "gaode":
            var lon = useprameters.PGIS_Center_lo;//中心点
            var lat = useprameters.PGIS_Center_la;//中心点
            var projection = CoordinateBiasedAlgorithm.createGoogleProjection("GaodeBiased", [parseFloat(lon), parseFloat(lat)]);//创建谷歌偏移的坐标系
            parm.projection = projection;
            break;
    }
    return parm;
}
