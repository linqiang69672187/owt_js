
function Personinfo(info, entity, issi, type, lat, lon, gpsStatus, sendTime, terminalType, terminalStatus, ipAddress, mobile, zhiwu, bz, userId, realTimeTrace, isRealTimeTrace, mark, direction, msRssi, ulRssi, battery, online, canvasIcons, color, length, width, shipType, degree) {
    this.info = info;
    this.entity = entity;
    this.issi = issi;
    this.type = type;
    this.lat = lat;
    this.lon = lon;
    this.gpsStatus = gpsStatus;
    this.sendTime = sendTime;
    this.terminalType = terminalType;
    this.terminalStatus = terminalStatus;
    this.ipAddress = ipAddress;
    this.mobile = mobile;
    this.zhiwu = zhiwu;
    this.bz = bz;
    this.userId = userId;
    this.realTimeTrace = realTimeTrace;
    this.isRealTimeTrace = isRealTimeTrace;
    this.mark = mark;
    this.direction = direction;
    this.msRssi = msRssi;
    this.ulRssi = ulRssi;
    this.online = online;
    this.battery = battery;
    this.canvasIcons = canvasIcons;
    this.color = color;
    this.length = length;
    this.width = width;
    this.shipType = shipType;//1表示母船,而表示子船
    this.degree = degree;//船舶的旋转角度
}