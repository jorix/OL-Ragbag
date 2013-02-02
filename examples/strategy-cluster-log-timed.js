var _logStarted = false;
var getMinMaxDistances = function(strategy) {
    var _resolution = strategy.resolution;
    var getDistance = function(x, y) {
        return Math.sqrt(x * x + y * y) / _resolution;
    };
    var clusters = strategy.layer.features;
    var minClusterDistance = 9999999,
        maxFeatureDistance = 0,
        maxCenterDisplacement = 0,
        centerDisplacement = 0,
        cLen = clusters.length,
        chk = {};
    for (var i = 0; i < cLen; i++) {
        var ii,
            cluster = clusters[i],
            cCenter = cluster.geometry.getBounds().getCenterLonLat(),
            x = cCenter.lon,
            y = cCenter.lat;
        // Cluster distances
        for (ii = 0; ii < i; ii++) {
            var ccCenter = clusters[ii].geometry.getBounds().getCenterLonLat();
            minClusterDistance = Math.min(
                minClusterDistance,
                getDistance(x - ccCenter.lon, y - ccCenter.lat)
            );
        }
        // Feature distances
        var cc = cluster.cluster;
        if (cc) {
            var ccLen = cc.length,
                xSum = 0,
                ySum = 0;
            for (var ii = 0; ii < ccLen; ii++) {
                var feature = cc[ii];
                if (feature.geometry) {
                    var fCenter = feature.geometry.getBounds().getCenterLonLat();
                    xSum += fCenter.lon;
                    ySum += fCenter.lat;
                    maxFeatureDistance = Math.max(
                        maxFeatureDistance,
                        getDistance(x - fCenter.lon, y - fCenter.lat)
                    );
                }
                chk[feature.id] = 1;
            }
        } else {
            chk[cluster.id] = 1;
        }
        var auxDisp = getDistance(x - xSum / ccLen, y - ySum / ccLen);
        centerDisplacement += auxDisp;
        maxCenterDisplacement = Math.max(maxCenterDisplacement, auxDisp);
    }
    var lenChk = 0;
    for (var key in chk) {
        lenChk++;
    }
    return {
        minClusterDistance: minClusterDistance,
        maxFeatureDistance: maxFeatureDistance,
        maxCenterDisplacement: maxCenterDisplacement,
        centerDisplacement: centerDisplacement / cLen,
        lenChk: lenChk
    };
};
function createTimedStrategy(strategy, options) {
    var _strategy = new strategy(options),
        _cluster = _strategy.cluster;
    // Overwrite `cluster` to obtain clocking annotations.
    _strategy.cluster = function(event) {
        var initialTime = new Date();
        _cluster.apply(_strategy, arguments);
        var finalTime = new Date();
        if (_strategy.features && _strategy.features.length && console && console.log) {
            if (!_logStarted) {
                console.log('; zoom; time; clusters; features; count; minClusterDistance; maxFeatureDistance; maxCenterDisplacement; centerDisplacement; class;');
                _logStarted = true;
            }
            var distances = getMinMaxDistances(_strategy);
            console.log(
                '; ' + _strategy.layer.map.getZoom() +
                '; ' + (finalTime.getTime() - initialTime.getTime()) +
                '; ' + _strategy.layer.features.length +
                '; ' + (_strategy.features.length === distances.lenChk ?
                        _strategy.features.length :
                        'WARNING: ' + _strategy.features.length + '!==' + distances.lenChk) +
                '; ' + (_strategy.features.length / _strategy.layer.features.length).toFixed(1) +
                '; ' + distances.minClusterDistance.toFixed(3) +
                '; ' + distances.maxFeatureDistance.toFixed(3) +
                '; ' + distances.maxCenterDisplacement.toFixed(5) +
                '; ' + distances.centerDisplacement.toFixed(5) +
                '; ' + _strategy.CLASS_NAME.replace('OpenLayers.Strategy.', '') +
                ';'
            );
        }
    };
    // Return instance.
    return _strategy;
}
