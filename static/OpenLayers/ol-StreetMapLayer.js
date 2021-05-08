/*!
*@file 创建街景底图
*@author cxy
*@createDate 20180925
*@params {String} id 地图标识ID，{Object} option 地图参数
*/

var createStreetMapLayer = function (thismap, id, option) {
    try {
        var currentMap = thismap;
        var streetMapLayer;

        //创建webgisno街景底图图层
        var getWebGISNo = function () {
            var osmSource = new ol.source.TileImage({
                cacheSize: 500,
                wrapX: false,
                projection: option.projection,
                tileGrid: option.tilegrid,
                tileUrlFunction: function (tileCoord, pixelRatio, proj) {  // 参数tileCoord为瓦片坐标
                    var z = tileCoord[0];
                    var x = tileCoord[1] + 1;
                    var y = (-tileCoord[2]);
                    return option.mapurl + "Normal/" + z + "/" + y + "_" + x + "." + option.maptype;
                },
            });

            // 添加一个使用离线瓦片地图的层
            var streetMapLayer = new ol.layer.Tile({
                source: osmSource
            });

            return streetMapLayer;
        }

        //创建天地图街景底图图层
        var getWebGIS = function () {
            var streetMapLayer = new ol.layer.Tile({//xzj--2018/8/16--将图层提出，添加id属性
                source: new ol.source.XYZ({
                    cacheSize: 500,
                    wrapX: false,
                    url: option.mapurl + "Normal/" + '{z}/{x}/{y}.' + option.maptype
                })
            });

            return streetMapLayer;
        }

        //创建pgis街景底图图层
        var getPGIS = function () {
            var streetMapLayer = new ol.layer.Tile({//xzj--2018/8/13--将图层提出并添加id属性
                source: new ol.source.WMTS({
                    cacheSize: 500,
                    url: option.mapurl,
                    layer: '0',
                    matrixSet: 'EPSG:3857',
                    format: 'image/' + option.maptype,
                    projection: option.projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(option.projectionExtent),
                        resolutions: option.resolutions,
                        matrixIds: option.matrixIds
                    }),
                    style: 'default',
                    wrapX: false
                })
            });
            return streetMapLayer;
        }

        //创建wlpgis街景底图图层
        var getWLPGIS = function () {
            var streetMapLayer = new ol.layer.Tile({//xzj--2018/8/13--将图层提出并添加id属性
                source: new ol.source.WMTS({
                    cacheSize: 500,
                    url: option.mapurl,
                    layer: option.maptype,
                    matrixSet: 'c',
                    format: 'title',
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: [-180.0, 90.0],
                        resolutions: option.resolutions,
                        matrixIds: option.matrixIds,
                        extent: [-180.0, -90.0, 180.0, 90.0]
                    }),
                    style: 'default',
                    version: '1.0.0',
                    projection: option.projection
                })
            });
            return streetMapLayer;
        }

        //创建动态纠偏坐标系的谷歌街景图
        var getGoogleBiased = function () {
            var count=1;
            var streetMapSource = new ol.source.XYZ({
                cacheSize: 500,
                projection: option.projection,
                url: option.mapurl + "Normal/" + '{z}/{x}/{x}_{y}.' + option.maptype,
                tileLoadFunction: function (imageTile, src) {
                    var view = currentMap.getView();
                    var mapExtent = view.calculateExtent(currentMap.getSize());
                    var center = ol.extent.getCenter(mapExtent)
                    var projection = CoordinateBiasedAlgorithm.createGoogleProjection("GoogleBiased" + count, center);
                    streetMapSource.projection_ = projection;
                    imageTile.getImage().src = src;
                    count++;
                }
            });
            var streetMapLayer = new ol.layer.Tile({
                source: streetMapSource
            });
            return streetMapLayer;
        }
        
        //创建动态纠偏的百度街景图
        var getBaiduBiased = function () {
            var currentCenter = option.center, currentBiased = [0, 0];//定义当前中心点和当前偏移情况
            var count = 0;
            var streetMapSource = new ol.source.TileImage({
                cacheSize: 500,
                projection: option.projection,
                tileGrid: option.tilegrid,
                tileUrlFunction: function (tileCoord, pixelRatio, proj) {
                    if (!tileCoord) {
                        return "";
                    }
                    var z = tileCoord[0];
                    var x = tileCoord[1];
                    var y = tileCoord[2];
                    if (x < 0) {
                        x = "M" + (-x);
                    }
                    if (y < 0) {
                        y = "M" + (-y);
                    }

                    var view = currentMap.getView();
                    var mapExtent = view.calculateExtent(map.getSize());
                    var center = ol.extent.getCenter(mapExtent);
                    if (currentCenter[0] != center[0] && currentCenter[1] != center[1]) {
                        currentBiased = CoordinateBiasedAlgorithm.getBaiduBiased(center);//计算百度偏移的距离
                        currentCenter = center;
                    }
                    
                    streetMapSource.tileGrid.origin_ = currentBiased.map(function (item) { return -item });

                    return option.mapurl + "Normal/" + z + "/" + x + "/" + y + "." + option.maptype

                }
            });
            var streetMapLayer = new ol.layer.Tile({
                source: streetMapSource
            });
            return streetMapLayer;
        }

        //创建动态纠偏坐标系的高德地图
        var getGaodeBiased = function () {
            var count = 1;
            var streetMapSource = new ol.source.XYZ({
                cacheSize:500,
                projection: option.projection,
                url: option.mapurl + "Normal/" + '{z}/{x}/{x}_{y}.' + option.maptype,
                tileLoadFunction: function (imageTile, src) {
                    var view = currentMap.getView();
                    var mapExtent = view.calculateExtent(map.getSize());
                    var center = ol.extent.getCenter(mapExtent)
                    var projection = CoordinateBiasedAlgorithm.createGaodeProjection("GaodeBiased" + count, center);
                    streetMapSource.projection_ = projection;
                    imageTile.getImage().src = src;
                    count++;
                }
            });
            var streetMapLayer = new ol.layer.Tile({
                source: streetMapSource
            });
            return streetMapLayer;
        }
                
        switch (option.gistype) {
            case "tianditu":
                streetMapLayer = getWebGIS();
                break;
            case "webgisno":
                streetMapLayer = getWebGISNo();
                break;
            case "google":
                streetMapLayer = getGoogleBiased();
                break;
            case "pgis":
                streetMapLayer = getPGIS();
                break;
            case "wspgis":
                streetMapLayer = getWLPGIS();
                break;
            case "baidu":
                streetMapLayer = getBaiduBiased();
                break;
            case "gaode":
                streetMapLayer = getGaodeBiased();
        }

        streetMapLayer.setProperties({ "ID": id });
        
        currentMap.addLayer(streetMapLayer);

        return streetMapLayer;
    } catch (err) {
        writeLog("system", "ol-StreetMapLayer.js createStreetMapLayer，error info:" + err);
    }
}