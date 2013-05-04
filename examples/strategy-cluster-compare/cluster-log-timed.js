var _logStarted = false;
var getMinMaxDistances = function(strategy) {
    var _resolution = strategy.resolution;
    var getDistance = function(x, y) {
        return Math.sqrt(x * x + y * y) / _resolution;
    };
    var clusters = strategy.layer.features;
    var minClusterDistance = 9999999,
        maxFeatureDistance = 0,
        centerDisplacementOver10pc = 0,
        centerDisplacement = 0,
        maxCenterDisplacement = 0,
        lowerDistance = 0,
        cLen = clusters.length,
        cCount = 0,
        cFeaturesCount = 0,
        chk = {};
    for (var i = 0; i < cLen; i++) {
        var cluster = clusters[i],
            cc = cluster.cluster;
        if (cc) {
            var ii,
                cCenter = cluster.geometry.getBounds().getCenterLonLat(),
                x = cCenter.lon,
                y = cCenter.lat;
            // Cluster distances
            for (ii = 0; ii < i; ii++) {
                var ccFeature = clusters[ii];
                if (ccFeature.cluster) {
                    var ccCenter = ccFeature.geometry.getBounds()
                                                             .getCenterLonLat();
                    var currDistance = getDistance(x - ccCenter.lon,
                                                   y - ccCenter.lat);
                    minClusterDistance = Math.min(
                                              minClusterDistance, currDistance);
                    if (currDistance < strategy.distance) {
                        lowerDistance++;
                    }
                }
            }
        // Feature distances
            var ccLen = cc.length,
                xSum = 0,
                ySum = 0;
            cFeaturesCount += ccLen;
            for (var ii = 0; ii < ccLen; ii++) {
                var feature = cc[ii];
                if (feature.geometry) {
                    var fCenter = feature.geometry.getBounds()
                                                             .getCenterLonLat();
                    xSum += fCenter.lon;
                    ySum += fCenter.lat;
                    maxFeatureDistance = Math.max(
                        maxFeatureDistance,
                        getDistance(x - fCenter.lon, y - fCenter.lat)
                    );
                }
                chk[feature.id] = 1;
            }
            cCount++;
            var auxDisp = getDistance(x - xSum / ccLen, y - ySum / ccLen);
            if (auxDisp > strategy.distance / 10) {
                centerDisplacementOver10pc++;
            }
            centerDisplacement += auxDisp;
            maxCenterDisplacement = Math.max(maxCenterDisplacement, auxDisp);
        } else {
            chk[cluster.id] = 1;
        }
    }
    var lenChk = 0;
    for (var key in chk) {
        lenChk++;
    }
    return {
        clusterCount: cCount,
        clusterFaturesCount: cFeaturesCount,
        minClusterDistance: minClusterDistance,
        maxFeatureDistance: maxFeatureDistance,
        lowerDistance: lowerDistance,
        centerDisplacementOver10pc: centerDisplacementOver10pc,
        maxCenterDisplacement: maxCenterDisplacement,
        centerDisplacement: centerDisplacement / cCount,
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
        if (_strategy.features && _strategy.features.length &&
                                         window.console && window.console.log) {
            if (!_logStarted) {
                console.log('; zoom; time; clusters; clusteredFeatures;' +
                    ' features/cluster;' +
                    ' lowerDistance; minClusterDistance; maxFeatureDistance;' +
                    ' centerDisplacementOver10pc; maxCenterDisplacement; centerDisplacement;' +
                    ' class; distance; threshold; features;');
                _logStarted = true;
            }
            var distances = getMinMaxDistances(_strategy);
            console.log(
                '; ' + _strategy.layer.map.getZoom() +
                '; ' + (finalTime.getTime() - initialTime.getTime()) +
                '; ' + distances.clusterCount +
                '; ' + distances.clusterFaturesCount +
                '; ' + (distances.clusterFaturesCount / distances.clusterCount)
                                                                   .toFixed(1) +
                '; ' + distances.lowerDistance +
                '; ' + distances.minClusterDistance.toFixed(3) +
                '; ' + distances.maxFeatureDistance.toFixed(3) +
                '; ' + distances.centerDisplacementOver10pc +
                '; ' + distances.maxCenterDisplacement.toFixed(5) +
                '; ' + distances.centerDisplacement.toFixed(5) +
                '; ' + _strategy.CLASS_NAME
                                          .replace('OpenLayers.Strategy.', '') +
                '; ' + _strategy.distance +
                '; ' + _strategy.threshold +
                '; ' + ((_strategy.features.length === distances.lenChk &&
                         _strategy.features.length === distances.clusterFaturesCount) ?
                        _strategy.features.length :
                        'WARNING: ' + _strategy.features.length + '!==' +
                                      distances.clusterFaturesCount + '!==' +
                                      distances.lenChk) +
                ';'
            );
        }
    };
    // Return instance.
    return _strategy;
}
