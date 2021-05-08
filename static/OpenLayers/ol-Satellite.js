//添加卫星图层
var CreateSatelliteLayer = function (thismap, options) {
    var currentMap = thismap;
    var satelliteLayer = new ol.layer.Tile({
    });
    var satelliteSource = null;

    getSatelliteSourceByGisType();
    satelliteLayer.setProperties({ "ID": "satelliteLayer" });
    satelliteLayer.setZIndex(-1);
    satelliteLayer.setSource(satelliteSource);
    satelliteLayer.setVisible(false);
    currentMap.addLayer(satelliteLayer);

    //根据gistype获取对应的卫星source
    function getSatelliteSourceByGisType() {
        switch (options.gistype) {
            case "webgisno"://非标准
                satelliteSource = new ol.source.TileImage({
                    cacheSize: 500,
                    wrapX: false,
                    projecction: options.projection,
                    tileGrid: options.tilegrid,
                    tileUrlFunction: function (tileCoord, pixelRatio, proj) {  // 参数tileCoord为瓦片坐标
                        var z = tileCoord[0];
                        var x = tileCoord[1] + 1;
                        var y = (-tileCoord[2]);
                        return options.mapurl + "HYBRID/" + z + "/" + y + "_" + x + "." + options.maptype;
                    }
                });
                break;
            case "tianditu"://天地图
                satelliteSource = new ol.source.XYZ({
                    cacheSize: 500,
                    url: options.mapurl + "HYBRID/" + '{z}/{x}/{y}.' + options.maptype
                });
                break;
            case "pgis"://pgis地图
                var wmtsURL = getWmtsUrl(options.mapurl, 1);
                satelliteSource = new ol.source.WMTS({
                    cacheSize: 500,
                    url: wmtsURL,
                    layer: '0',
                    matrixSet: 'EPSG:3857',
                    format: 'image/' + options.maptype,
                    projection: options.projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(options.projectionExtent),
                        resolutions: options.resolutions,
                        matrixIds: options.matrixIds
                    }),
                    style: 'default',
                    wrapX: false
                });
                break;
            case "wspgis"://wspgis
                var wmtsURL = getWmtsUrl(options.mapurl, 1);
                satelliteSource = new ol.source.WMTS({
                    cacheSize: 500,
                    url: wmtsURL,
                    layer: options.maptype,
                    matrixSet: 'c',
                    format: 'title',
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: [-180.0, 90.0],
                        resolutions: options.resolutions,
                        matrixIds: options.matrixIds,
                        extent: [-180.0, -90.0, 180.0, 90.0]
                    }),
                    style: 'default',
                    version: '1.0.0',
                    projection: options.projection
                });
                break;
            case 'google'://谷歌偏移地图
                var count = 1;
                satelliteSource = new ol.source.XYZ({
                    cacheSize: 500,
                    projection: options.projection,
                    url: options.mapurl + "HYBRID/" + '{z}/{x}/{x}_{y}.' + options.maptype,
                    tileLoadFunction: function (imageTile, src) {
                        var view = currentMap.getView();
                        var mapExtent = view.calculateExtent(map.getSize());
                        var center = ol.extent.getCenter(mapExtent);
                        var projection = CoordinateBiasedAlgorithm.createGoogleProjection("GoogleBiased" + count, center);
                        satelliteSource.projection_ = projection;
                        imageTile.getImage().src = src;
                        count++;
                    }
                });
                break;
            case "baidu"://百度地图
                var currentCenter = options.center, currentBiased = [0, 0];//定义当前中心点和当前偏移情况
                var count = 0;
                satelliteSource = new ol.source.TileImage({
                    cacheSize: 500,
                    projection: options.projection,
                    tileGrid: options.tilegrid,
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
                        if (currentCenter[0] != center[0] && currentCenter[1] != center[1]) {//如果中心点未变化，则偏移距离不变
                            currentBiased = CoordinateBiasedAlgorithm.getBaiduBiased(center);//计算百度偏移的距离
                            currentCenter = center;
                        }

                        satelliteSource.tileGrid.origin_ = currentBiased.map(function (item) { return -item });

                        return options.mapurl + "HYBRID/" + z + "/" + x + "/" + y + "." + options.maptype

                    }
                });
                break;
            case "gaode":
                var count = 1;
                satelliteSource = new ol.source.XYZ({
                    cacheSize: 500,
                    projection: options.projection,
                    url: options.mapurl + "HYBRID/" + '{z}/{x}/{x}_{y}.' + options.maptype,
                    tileLoadFunction: function (imageTile, src) {
                        var view = currentMap.getView();
                        var mapExtent = view.calculateExtent(map.getSize());
                        var center = ol.extent.getCenter(mapExtent);
                        var projection = CoordinateBiasedAlgorithm.createGaodeProjection("GaodeBiased" + count, center);
                        satelliteSource.projection_ = projection;
                        imageTile.getImage().src = src;
                        count++;
                    }
                });
                break;
        }
    }
}