/*!
*@file 谷歌偏移算法
*@author cxy
*@createDate 20181016
*/

GoogleBiasedAlgorithm = {
    wgs84_gcj02 : {
        transform:function(wgs_coordinate){//wgs84坐标转换到gcj02（中国标准的谷歌坐标系）
            if (this.outOfChina(wgs_coordinate[1], wgs_coordinate[0]))
                return wgs_coordinate;
 
            var d = this.delta(wgs_coordinate[1], wgs_coordinate[0]);
            return [wgs_coordinate[0] + d.lon, wgs_coordinate[1] + d.lat];
        },
        PI : 3.14159265358979324,
        delta : function (lat, lon) {
            var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
            var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
            var dLat = this.transformLat(lon - 105.0, lat - 35.0);
            var dLon = this.transformLon(lon - 105.0, lat - 35.0);
            var radLat = lat / 180.0 * this.PI;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI);
            return {'lat': dLat, 'lon': dLon};
        },
        outOfChina : function (lat, lon) {//是否在中国之外
            if (lon < 72.004 || lon > 137.8347)
                return true;
            if (lat < 0.8293 || lat > 55.8271)
                return true;
            return false;
        },
        transformLat : function (x, y) {//转换纬度
            var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0;
            return ret;
        },
        transformLon : function (x, y) {//转换经度
            var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0;
            return ret;
        }
    },
    createProjection: function (name, coordinate) {//创建谷歌偏移地图的自定义坐标系
        if ((coordinate[0] > 180 || coordinate[0] < -180) && (coordinate[1] > 85.06 || coordinate[1] < -85.06)) {
            coordinate = proj4("EPSG:3857", "EPSG:4326", coordinate);
        }
        var coordinate_gcj = this.wgs84_gcj02.transform(coordinate);

        var coordinate_wgs_proj = proj4("EPSG:4326", "EPSG:3857", coordinate);
        var coordinate_gcj_proj = proj4("EPSG:4326", "EPSG:3857", coordinate_gcj);

        var offsetx = coordinate_gcj_proj[0] - coordinate_wgs_proj[0];
        var offsety = coordinate_gcj_proj[1] - coordinate_wgs_proj[1];

        proj4.defs(name, "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=" + offsetx + " +y_0=" + offsety + " +k=1.0 +units=m +nadgrids=@null +wktext +no_defs");
        var projection = new ol.proj.Projection({
            code: name,
            extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244]
        });

        return projection;
    }
}