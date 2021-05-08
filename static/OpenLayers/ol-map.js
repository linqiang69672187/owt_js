
var map = null;
var userLayer = null;
var sourceDZZL = null;
var sourceDZZL2 = null;
var draw;
var valueDZZL = null;
var draw
var DZZLLayer = null;
var DrawCoordinates = null;
var fillColorDZZL = null
var bsLayerManager, psLayerManager, fsLayerManager, mapMonitoringEvent, mapLocateEvent;//bsLayerManager：基站图层管理器；psLayerManager：单位图层管理器;fsLayerManager:场强图层管理器;mapMonitoringEvent:地图全局事件;mapLocateEvent:地图定位事件。
var cameraLayerManager, heatMapManager, pickLines, navigationLine, trafficControlBoxManager;//cameraLayerManager:摄像头图层管理器;heatMapManager:热力图管理图层;trafficControlBoxManager:交通岗警员图层管理器;trafficLayerManager:交通岗图层;pickLines拾取线图层

function LoadMap() {

    var GISTYPE = useprameters.GISTYPE.toLowerCase();
    var mapurl = useprameters.Emapurl;
    var lo = useprameters.PGIS_Center_lo;
    var la = useprameters.PGIS_Center_la;
    var maxLevel = useprameters.maxLevel;//最大几层
    var minLevel = useprameters.minLevel;//最小几层
    var currentLevel = useprameters.currentLevel;//显示第几层
    var maptype = useprameters.maptype;//图片类型

    //图层配置参数
    var fsParams = null;
    var blParams = {//cxy-20180730-基站图层参数
        isCluster: eval(useprameters.IsBaseStationLayerCluster.toLowerCase()),
        distance: useprameters.BaseStationClusterDistance,
        radius: useprameters.BaseStationClusterRaduis,
        isVisible: document.getElementById("Radio0").checked
    };
    var plParams = {//xzj--20180815-警站图层参数
        isVisible: document.getElementById("Radio1").checked
    }
    var clParams = {//xzj--20180815-摄像头图层参数
        isCluster: eval(useprameters.IsCameraLayerCluster.toLowerCase()),
        distance: useprameters.CameraClusterDistance,
        raduis: useprameters.CameraClusterRaduis,
        isVisible: document.getElementById("Checkbox1").checked
    };
    var satelliteLayerParams = createBaseMapParameter(GISTYPE);
    var offlineMapLayerParams = createBaseMapParameter(GISTYPE);
    
    var viewParam = {
        "lo": useprameters.PGIS_Center_lo,//中心点
        "la": useprameters.PGIS_Center_la,//中心点
        "maxLevel": useprameters.maxLevel,//最大层级
        "minLevel": useprameters.minLevel,//最小层级
        "currentLevel": useprameters.currentLevel//显示层级
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

    initMapManager(fsParams, blParams, plParams, clParams, satelliteLayerParams, offlineMapLayerParams);//初始化地图图层管理
}

//加载地图图层信息，包括重载用户图层和基站图层
function reloadMapInfo() {
    ReLoadUser();
    loadDZZL();
    if (bsLayerManager) {
        bsLayerManager.loadBaseStations();//刷新基站图层
    }
    if (psLayerManager) {
        psLayerManager.loadPoliceStations();//刷新单位图层
    }
    if (fsLayerManager) {
        fsLayerManager.loadFSLayer();//刷新场强图层
    }
}

//初始化图层管理器
function initMapManager(fsLayersParams, baseLayersParams, policeLayersParams, cameraLayerParams, satelliteLayerParams, offlineMapLayerParams) {
    
    createStreetMapLayer(map, "offlineMapLayer", offlineMapLayerParams);//创建街景图

    CreateSatelliteLayer(map, satelliteLayerParams);//添加卫星图层

    initUserLayer();//初始化人员图层

    addDZZLLayer()//新建电子栅栏图层
    loadDZZL();//加载电子栅栏

    fsLayerManager = new FieldStrengthLayer(map, fsLayersParams);//创建场强图层

    bsLayerManager = new BaseStationLayer(map, baseLayersParams);
    bsLayerManager.loadBaseStations();//cxy-20180727-添加基站聚合图层
    psLayerManager = new PoliceStationLayer(map, policeLayersParams);
    psLayerManager.loadPoliceStations();//cxy-20180730-添加单位图层
    mapMonitoringEvent = new MapMonitoringEvent(map);//cxy-20180801-地图监听
    mapMonitoringEvent.MapResolutionChange(["user", "policeStation", "fieldStrength", "animation"]);//地图分辨率变化
    mapLocateEvent = new MapLocateEvent(map);//地图定位
    mapLocateEvent.init();//初始化地图定位

    if (useprameters.VideoCommandEnable == 1) {//注释，先默认不加载监控
        cameraLayerManager = new CreateCameraLayer(map, cameraLayerParams);//添加摄像头图层--xzj--20180827
        StringgetAllCameraForJson();//请求摄像头数据
        createSynTreeWithoutResource();//获取监控树形节点数据并加载树形   
    }

    //地图全局点击交互
    MapFeatureClickInteraction.init(map);

    //创建热力图管理器
    heatMapManager = new createHeatMap();
    
    //新建拾取线图层
    pickLines = new PickLines(map);

    //新建航线图层
    navigationLine = new NavigationLines(map);

    navigationLine.addAllLine();
    
    //xzj--20190618--添加交通岗警员管理器
    trafficControlBoxManager = new createTrafficControlBoxPoliceListMap();
}

//cxy-20180730-获取地图图层
ol.Map.prototype.getLayerById = function (id) {
    var layers = this.getLayers();
    var resultLayer = null;
    if (layers.getLength() > 0) {
        layers.forEach(function (value, index) {
            if (value.get("ID") == id) {
                resultLayer = value;
            }
        })
    }
    return resultLayer;
}