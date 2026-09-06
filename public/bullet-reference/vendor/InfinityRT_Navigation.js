// InfinityRT Navigation

var M_PI = 3.1415926535897932384626433832795028841968;
var hidden = false;

var infinityrt_navigation = function (scene,w,h) {
   this._scene = scene;
   this._fovRecoveryOffset = 0.0;
   this._revertPan = false;
   this._revertPanOriginal = []; this._revertPanOriginal[0] = 0.0;  this._revertPanOriginal[1] = 0.0;
   
   this._navMX = this._midx = w / 2;
   this._navMY = this._midy = h / 2; 
   this._zoomFactor = 0.0;
	this._navEnabled = true;
	this._navMode = 2;
	this._navMinDolly = -125.0;//14.0; //50
	this._navMaxDolly = 1.0;//28.0; //110
	this._zoomMaxFactor = this._navMaxDolly + 1 * (this._navMinDolly - this._navMaxDolly);
	this._zoomMinFactor = this._navMaxDolly + 0 * (this._navMinDolly - this._navMaxDolly);
	this._ellipticalNav = false;

	//DESKTOP NAVIGATION VALUES*************************
	this._navRotationSpeed = 0.015;
	this._navDollySpeed = 0.0025;
	this._navPanSpeed = 0.05;
	this._navDecay = 0.3;
	this._navMode2DecayHalflife = 150;	// General decay
	this._navDesiredTargetSpeed = 0.1;
   //MOBILE NAVIGATION VALUES**************************
   var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
   if (isMobile) {
      this._navRotationSpeed = 0.015;
      this._navDollySpeed = 0.02;
      this._navPanSpeed = 0.15;
      this._navDecay = 0.75;
            this._navMode2DecayHalflife = 150;	// General decay)
    } //************************************************ 
    this._navDesiredTarget=null;
    this._navGotoPosFrames = 0;
    this._navGotoPosActive = false;
    this._navGotoPosQuatFrom = null;
    this._navGotoPosQuatTo = null;
    this._navGotoPosPanDelta = [0.0, 0.0];
    this._navGotoPosOnComplete = function () { };
    this._navGotoPosEnableSlowInOut = false;
    this._navDX = 0;
    this._navDY = 0;
    this._navXAng = 0;
    this._navYAng = 0;
	this._navYAngOffset = 0;
    this._navZAng = 0;
    this._navDolly = 0.0;
    this._navTarget = null;
    this._navMatLastView = null;
    this._navMatHierModel = null;
    this._navPan = [0.0, 0.0];
    this._navQuat = {};
    this.onSample = null;
    this.lastUpdate = now();
    this._axisAllow = [true, true];

    // GotoFoV (Variables)
   this._navGotoFoV = null;
   this._navGotoFoVOnComplete = function () { };
   this.SetFoVRange(scene.fovy,scene.fovy);
   this._fovadjust = 0.6;
   this._fovRecoveryOnZoom = true;
   // Mode 2 Nav (Variables)
    this._navDXAng = 0;
    this._navDYAng = 0;
    this._navDPan = [0, 0];
    this._navDDolly = 0;
    this._navFDolly = 0;
    this._navChange = false;
    // Mode 2 Nav (Parameters)
    this._navPanDolly = -650;        // Distance when pan changes to rotation

	// this._navMode2Speed = 0.03;     // Navigation speed

	this._panMax = [16,65];    //[left, bottom];
	this._panMin = [-16,-68];  //[right, top];

	// slowinout easing
   this._curveSIO = {
        _preInfinity: FANIM_INFINITY_CONSTANT,
        _postInfinity: FANIM_INFINITY_CONSTANT,
        _is2DCurveEvaluation: 1,
        _keys: [
            {
                _input: 0,
                _output: 0,
                _interpolation: FANIM_INTERPOLATION_BEZIER,
                _inTangent: [0.5, 0.5],
                _outTangent: [0.5, 0.5]
            },
            {
                _input: 1,
                _output: 1,
                _interpolation: FANIM_INTERPOLATION_BEZIER,
                _inTangent: [0.5, 0.5],
                _outTangent: [0.5, 0.5]
            }
        ]
    };

	this.InitGotoPosHelper();
	//TODO: UPDATE nav values from file
	return; //TODO: Remove to load navigation settings 
	if (this.IsMobilePlatform()){
		this.UpdateNavFromJSON("navsettings_mobile.json");
		if (this.IsAndroidPlatform())
			this.UpdateNavFromJSON("navsettings_mobile_android.json");
		else if (this.IsIPadPlatform())
			this.UpdateNavFromJSON("navsettings_mobile_ipad.json");
		else
			this.UpdateNavFromJSON("navsettings_mobile_ios.json");
	} else {
		this.UpdateNavFromJSON("navsettings_desktop.json");
	}
   
};

infinityrt_navigation.prototype.IsMobilePlatform = function () {
	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};
	
infinityrt_navigation.prototype.IsAndroidPlatform = function () {
	return /Android/i.test(navigator.userAgent);
};

infinityrt_navigation.prototype.UpdateNavFromJSON = function (filename) {
	fetch(filename)
    .then(async response => {
        const isJson = response.headers.get('content-type') && response.headers.get('content-type').includes('application/json');
        const newNav = isJson ? await response.json() : null;

        // check for error response
        if (!response.ok) {
            // get error message from body or default to response status
            const error = (newNav && newNav.message) || response.status;
            return Promise.reject(error);
        }

        console.log(JSON.stringify(newNav, null, 4));
        for (const property in newNav) {
		  this[property] = newNav[property];
		}
    })
    .catch(error => {
        console.error('There was an error!', error);
    });

};

infinityrt_navigation.prototype.canvasResize = function (w,h) {
   this._navMX = this._midx = w / 2;
   this._navMY = this._midy = h / 2;
};

infinityrt_navigation.prototype.SetFoVRange = function (minfovy, maxfovy) {
    this._fovMin = minfovy;
    this._fovMax = maxfovy;
};

infinityrt_navigation.prototype.MatrixRotationAxis = function (fAngle, fX, fY, fZ) {
    var s = Math.sin(fAngle);
    var c = Math.cos(fAngle);
    var x = fX;
    var y = fY;
    var z = fZ;

    var mOut = Array();
    mOut[0] = x * x * (1 - c) + c;
    mOut[4] = x * y * (1 - c) - (z * s);
    mOut[8] = x * z * (1 - c) + (y * s);
    mOut[12] = 0;

    mOut[1] = y * x * (1 - c) + (z * s);
    mOut[5] = y * y * (1 - c) + c;
    mOut[9] = y * z * (1 - c) - (x * s);
    mOut[13] = 0;

    mOut[2] = z * x * (1 - c) - (y * s);
    mOut[6] = z * y * (1 - c) + (x * s);
    mOut[10] = z * z * (1 - c) + c;
    mOut[14] = 0.0;

    mOut[3] = 0.0;
    mOut[7] = 0.0;
    mOut[11] = 0.0;
    mOut[15] = 1.0;
    return mOut;
};

infinityrt_navigation.prototype.MatrixTranslation = function (fX, fY, fZ) {
    var mOut = Array();
    mOut[0] = 1.0; mOut[4] = 0.0; mOut[8] = 0.0; mOut[12] = fX;
    mOut[1] = 0.0; mOut[5] = 1.0; mOut[9] = 0.0; mOut[13] = fY;
    mOut[2] = 0.0; mOut[6] = 0.0; mOut[10] = 1.0; mOut[14] = fZ;
    mOut[3] = 0.0; mOut[7] = 0.0; mOut[11] = 0.0; mOut[15] = 1.0;
    return mOut;
};

infinityrt_navigation.prototype.MatrixInvert = function (m) {
    var r = new Array();
    var det = m[3] * m[6] * m[9] * m[12] - m[2] * m[7] * m[9] * m[12] - m[3] * m[5] * m[10] * m[12] + m[1] * m[7] * m[10] * m[12] +
		m[2] * m[5] * m[11] * m[12] - m[1] * m[6] * m[11] * m[12] - m[3] * m[6] * m[8] * m[13] + m[2] * m[7] * m[8] * m[13] +
		m[3] * m[4] * m[10] * m[13] - m[0] * m[7] * m[10] * m[13] - m[2] * m[4] * m[11] * m[13] + m[0] * m[6] * m[11] * m[13] +
		m[3] * m[5] * m[8] * m[14] - m[1] * m[7] * m[8] * m[14] - m[3] * m[4] * m[9] * m[14] + m[0] * m[7] * m[9] * m[14] +
		m[1] * m[4] * m[11] * m[14] - m[0] * m[5] * m[11] * m[14] - m[2] * m[5] * m[8] * m[15] + m[1] * m[6] * m[8] * m[15] +
		m[2] * m[4] * m[9] * m[15] - m[0] * m[6] * m[9] * m[15] - m[1] * m[4] * m[10] * m[15] + m[0] * m[5] * m[10] * m[15];
    if (det != 0) {
        var invdet = 1.0 / (det);
        (r)[0] = (m[6] * m[11] * m[13] - m[7] * m[10] * m[13] + m[7] * m[9] * m[14] - m[5] * m[11] * m[14] - m[6] * m[9] * m[15] + m[5] * m[10] * m[15]) * invdet;
        (r)[1] = (m[3] * m[10] * m[13] - m[2] * m[11] * m[13] - m[3] * m[9] * m[14] + m[1] * m[11] * m[14] + m[2] * m[9] * m[15] - m[1] * m[10] * m[15]) * invdet;
        (r)[2] = (m[2] * m[7] * m[13] - m[3] * m[6] * m[13] + m[3] * m[5] * m[14] - m[1] * m[7] * m[14] - m[2] * m[5] * m[15] + m[1] * m[6] * m[15]) * invdet;
        (r)[3] = (m[3] * m[6] * m[9] - m[2] * m[7] * m[9] - m[3] * m[5] * m[10] + m[1] * m[7] * m[10] + m[2] * m[5] * m[11] - m[1] * m[6] * m[11]) * invdet;
        (r)[4] = (m[7] * m[10] * m[12] - m[6] * m[11] * m[12] - m[7] * m[8] * m[14] + m[4] * m[11] * m[14] + m[6] * m[8] * m[15] - m[4] * m[10] * m[15]) * invdet;
        (r)[5] = (m[2] * m[11] * m[12] - m[3] * m[10] * m[12] + m[3] * m[8] * m[14] - m[0] * m[11] * m[14] - m[2] * m[8] * m[15] + m[0] * m[10] * m[15]) * invdet;
        (r)[6] = (m[3] * m[6] * m[12] - m[2] * m[7] * m[12] - m[3] * m[4] * m[14] + m[0] * m[7] * m[14] + m[2] * m[4] * m[15] - m[0] * m[6] * m[15]) * invdet;
        (r)[7] = (m[2] * m[7] * m[8] - m[3] * m[6] * m[8] + m[3] * m[4] * m[10] - m[0] * m[7] * m[10] - m[2] * m[4] * m[11] + m[0] * m[6] * m[11]) * invdet;
        (r)[8] = (m[5] * m[11] * m[12] - m[7] * m[9] * m[12] + m[7] * m[8] * m[13] - m[4] * m[11] * m[13] - m[5] * m[8] * m[15] + m[4] * m[9] * m[15]) * invdet;
        (r)[9] = (m[3] * m[9] * m[12] - m[1] * m[11] * m[12] - m[3] * m[8] * m[13] + m[0] * m[11] * m[13] + m[1] * m[8] * m[15] - m[0] * m[9] * m[15]) * invdet;
        (r)[10] = (m[1] * m[7] * m[12] - m[3] * m[5] * m[12] + m[3] * m[4] * m[13] - m[0] * m[7] * m[13] - m[1] * m[4] * m[15] + m[0] * m[5] * m[15]) * invdet;
        (r)[11] = (m[3] * m[5] * m[8] - m[1] * m[7] * m[8] - m[3] * m[4] * m[9] + m[0] * m[7] * m[9] + m[1] * m[4] * m[11] - m[0] * m[5] * m[11]) * invdet;
        (r)[12] = (m[6] * m[9] * m[12] - m[5] * m[10] * m[12] - m[6] * m[8] * m[13] + m[4] * m[10] * m[13] + m[5] * m[8] * m[14] - m[4] * m[9] * m[14]) * invdet;
        (r)[13] = (m[1] * m[10] * m[12] - m[2] * m[9] * m[12] + m[2] * m[8] * m[13] - m[0] * m[10] * m[13] - m[1] * m[8] * m[14] + m[0] * m[9] * m[14]) * invdet;
        (r)[14] = (m[2] * m[5] * m[12] - m[1] * m[6] * m[12] - m[2] * m[4] * m[13] + m[0] * m[6] * m[13] + m[1] * m[4] * m[14] - m[0] * m[5] * m[14]) * invdet;
        (r)[15] = (m[1] * m[6] * m[8] - m[2] * m[5] * m[8] + m[2] * m[4] * m[9] - m[0] * m[6] * m[9] - m[1] * m[4] * m[10] + m[0] * m[5] * m[10]) * invdet;
    }
    return r;
};

infinityrt_navigation.prototype.QuaternionFromRotationMatrix = function (m) {
    var m11 = m[0], m12 = m[4], m13 = m[8],
		m21 = m[1], m22 = m[5], m23 = m[9],
		m31 = m[2], m32 = m[6], m33 = m[10],
		trace = m11 + m22 + m33, s;
    if (trace > 0) {
        s = 0.5 / Math.sqrt(trace + 1.0);
        this._navQuat.w = 0.25 / s;
        this._navQuat.x = (m32 - m23) * s;
        this._navQuat.y = (m13 - m31) * s;
        this._navQuat.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
        this._navQuat.w = (m32 - m23) / s;
        this._navQuat.x = 0.25 * s;
        this._navQuat.y = (m12 + m21) / s;
        this._navQuat.z = (m13 + m31) / s;
    } else if (m22 > m33) {
        s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
        this._navQuat.w = (m13 - m31) / s;
        this._navQuat.x = (m12 + m21) / s;
        this._navQuat.y = 0.25 * s;
        this._navQuat.z = (m23 + m32) / s;
    } else {
        s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
        this._navQuat.w = (m21 - m12) / s;
        this._navQuat.x = (m13 + m31) / s;
        this._navQuat.y = (m23 + m32) / s;
        this._navQuat.z = 0.25 * s;
    }
};

infinityrt_navigation.prototype.QuatSlerp = function (qa, qb, qm, t) {
    var cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
    if (cosHalfTheta < 0) {
        qm.w = -qb.w;
        qm.x = -qb.x;
        qm.y = -qb.y;
        qm.z = -qb.z;
        cosHalfTheta = -cosHalfTheta;
    } else {
        qm.w = qb.w;
        qm.x = qb.x;
        qm.y = qb.y;
        qm.z = qb.z;
    }
    if (Math.abs(cosHalfTheta) >= 1.0) {
        qm.w = qa.w;
        qm.x = qa.x;
        qm.y = qa.y;
        qm.z = qa.z;
        return qm;
    }
    var halfTheta = Math.acos(cosHalfTheta);
    var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
    if (Math.abs(sinHalfTheta) < 0.001) {
        qm.w = 0.5 * (qa.w + qm.w);
        qm.x = 0.5 * (qa.x + qm.x);
        qm.y = 0.5 * (qa.y + qm.y);
        qm.z = 0.5 * (qa.z + qm.z);
        return qm;
    }
    var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    var ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
    qm.w = (qa.w * ratioA + qm.w * ratioB);
    qm.x = (qa.x * ratioA + qm.x * ratioB);
    qm.y = (qa.y * ratioA + qm.y * ratioB);
    qm.z = (qa.z * ratioA + qm.z * ratioB);
    return qm;
};

infinityrt_navigation.prototype.ParseOnSample = function (param) {
    if (param != undefined) {
        if (typeof (param) == 'object') {
            this.onSample = this.EvalCurve;
            var keys = this._curveSIO._keys;
            if (typeof (param.preset) != 'undefined') {
                if (param.preset == 'linear') {
                    keys[0]._outTangent = [0.5, 0.5];
                    keys[1]._inTangent = [0.5, 0.5];
                } else if (param.preset == 'slowinout') {
                    keys[0]._outTangent = [0.5, 0.0];
                    keys[1]._inTangent = [0.5, 1.0];
                } else if (param.preset == 'slowout') {
                    keys[0]._outTangent = [0.25, 0.5];
                    keys[1]._inTangent = [0.5, 1.0];
                }
            } else if (typeof (param.tangents) != 'undefined') {
                keys[0]._outTangent = param.tangents[0];
                keys[1]._inTangent = param.tangents[1];
            }
        } else {
            this.onSample = param;
        }
    } else {
        this.onSample = null;
    }
};

infinityrt_navigation.prototype.NavStartGoto = function (namedpos, numFrames, onComplete, onSample) {
    if (typeof (this._scene.ui) == 'undefined')
        return false;
    var t = this._scene.ui.storedpositions[namedpos];
    if (typeof (t) == 'undefined')
        return false;
    return this.NavStartGotoPos(t.yang, t.xang, t.xpan, t.ypan, t.dolly, numFrames, onComplete, onSample);
};

infinityrt_navigation.prototype.NavStartGotoPos = function (yang, xang, xpan, ypan, dolly, numFrames, onComplete, onSample) {
    if (this._navMode == 1)
        return; // Not Supported, use NavStartGotoPosQuat
    if (onComplete !== undefined)
        this._navGotoPosOnComplete = onComplete;
    this.ParseOnSample(onSample);

    while (yang < -M_PI) yang += 2 * M_PI;
    while (yang > M_PI) yang -= 2 * M_PI;

    if (numFrames == 0)
        this._scene.RelaxFocusRate();
    this._navGotoPosActive = true;
    this._navGotoPosFrames = (numFrames == 0) ? 1 : numFrames;
    this._navGotoPosTimeSt = undefined;
    var gotoposDelta = 1.0 / this._navGotoPosFrames;

    this._navGotoPosDelta = {};
    if (this._navGotoPosEnableSlowInOut || this.onSample != null) {
        this._navGotoPosDelta.currentframesRatio = 0;
        this._navGotoPosDelta.framesRatio = gotoposDelta;
        // Rotation
        this._navGotoPosDelta.navXAng = { t0: this._navXAng, td: (xang - this._navXAng) };
        var yangDiff = yang - this._navYAng;
        var yangDiff2 = (2 * M_PI + yang) - this._navYAng;
        if (Math.abs(yangDiff2) < Math.abs(yangDiff))
            yangDiff = yangDiff2;
        var yangDiff3 = (-2 * M_PI + yang) - this._navYAng;
        if (Math.abs(yangDiff3) < Math.abs(yangDiff))
            yangDiff = yangDiff3;
        this._navGotoPosDelta.navYAng = { t0: this._navYAng, td: yangDiff };
        this._navGotoPosDelta.navZAng = { t0: 0, td: 0 };
        // Pan
        if (isNaN(xpan))
            this._navGotoPosDelta.navXPan = { t0: this._navPan[0], td: 0 };
        else
            this._navGotoPosDelta.navXPan = { t0: this._navPan[0], td: (xpan - this._navPan[0]) };
        if (isNaN(ypan))
            this._navGotoPosDelta.navYPan = { t0: this._navPan[1], td: 0 };
        else
            this._navGotoPosDelta.navYPan = { t0: this._navPan[1], td: (ypan - this._navPan[1]) };
        // Zoom
        this._navGotoPosDelta.navDolly = { t0: this._navDolly, td: (dolly - this._navDolly) };
    } else {
        // Rotation
        this._navGotoPosDelta.navXAng = gotoposDelta * (xang - this._navXAng);
        var yangDiff = yang - this._navYAng;
        var yangDiff2 = (2 * M_PI + yang) - this._navYAng;
        if (Math.abs(yangDiff2) < Math.abs(yangDiff))
            yangDiff = yangDiff2;
        var yangDiff3 = (-2 * M_PI + yang) - this._navYAng;
        if (Math.abs(yangDiff3) < Math.abs(yangDiff))
            yangDiff = yangDiff3;
        this._navGotoPosDelta.navYAng = gotoposDelta * yangDiff;
        this._navGotoPosDelta.navZAng = { t0: 0, td: 0 };
        // Pan
        if (isNaN(xpan))
            this._navGotoPosDelta.navXPan = 0.0;
        else
            this._navGotoPosDelta.navXPan = gotoposDelta * (xpan - this._navPan[0]);
        if (isNaN(ypan))
            this._navGotoPosDelta.navYPan = 0.0;
        else
            this._navGotoPosDelta.navYPan = gotoposDelta * (ypan - this._navPan[1]);
        // Zoom
        this._navGotoPosDelta.navDolly = gotoposDelta * (dolly - this._navDolly);
    }
};

infinityrt_navigation.prototype.SetDesiredTarget = function(target){
    this._navDesiredTarget=target;
}

infinityrt_navigation.prototype.NavStartGotoFoV = function (targetFoV, numFrames, onComplete) {
    if (onComplete !== undefined)
        this._navGotoFoVOnComplete = onComplete;
    if (targetFoV > this._fovMax)
        this._fovMax = targetFoV;
    else if (targetFoV < this._fovMin)
        this._fovMin = targetFoV;

    var fovframes = (numFrames == 0) ? 1 : numFrames;
    var gotofovDelta = 1.0 / fovframes;
    this._navGotoFoV = { _frames: fovframes, _deltafovy: gotofovDelta * (targetFoV - this._scene.fovy) };
};

infinityrt_navigation.prototype.NavStartGotoFoVInTime = function (targetFoV, durationInMS, onComplete) {
    if (onComplete !== undefined)
        this._navGotoFoVOnComplete = onComplete;
    if (targetFoV > this._fovMax)
        this._fovMax = targetFoV;
    else if (targetFoV < this._fovMin)
        this._fovMin = targetFoV;

    this._navGotoFoV = { _st: now(), _dur: durationInMS, _fovy_t0: this._scene.fovy, _fovy_t1: targetFoV - this._scene.fovy };
};

infinityrt_navigation.prototype.NavStartGotoInTime = function (namedpos, durationInMS, onComplete, onSample, optional) {
    if (typeof (this._scene.ui) == 'undefined')
        return false;
    var t = this._scene.ui.storedpositions[namedpos];
    if (typeof (t) == 'undefined')
        return false;
   return this.NavStartGotoPosInTime(t.yang,t.xang,t.xpan,t.ypan,t.dolly,durationInMS,onComplete,onSample,optional);
};

infinityrt_navigation.prototype.NavSetRevertPanPos = function (xpan, ypan) {
	this._revertPanOriginal[0] = xpan;
   this._revertPanOriginal[1] = ypan;
};
   
infinityrt_navigation.prototype.NavStartGotoPosInTime = function (yang,xang,xpan,ypan,dolly,durationInMS,onComplete,onSample,optional) {
   if (this._navMode == 1)
      return; // Not Supported, use NavStartGotoPosQuatInTime
   this._fovRecoveryOffset = 0.0;
   this._revertPan = false;
   this._revertPanOriginal[0] = this._navPan[0]; // Unnecessary?
   this._revertPanOriginal[1] = this._navPan[1]; // Unnecessary?
   
   if (onComplete !== undefined)
      this._navGotoPosOnComplete = onComplete;
   this.ParseOnSample(onSample);

    while (yang < -M_PI) yang += 2 * M_PI;
    while (yang > M_PI) yang -= 2 * M_PI;

    if (durationInMS == 0)
        this._scene.RelaxFocusRate();
    this._navGotoPosActive = true;
    this._navGotoPosTimeSt = now();
    this._navGotoPosTimeDur = durationInMS;

    this._navGotoPosDelta = {};
    // Rotation
    this._navGotoPosDelta.navXAng = { t0: this._navXAng, td: (xang - this._navXAng) };
    var yangDiff = yang - this._navYAng;
    var yangDiff2 = (2 * M_PI + yang) - this._navYAng;
    if (Math.abs(yangDiff2) < Math.abs(yangDiff))
        yangDiff = yangDiff2;
    var yangDiff3 = (-2 * M_PI + yang) - this._navYAng;
    if (Math.abs(yangDiff3) < Math.abs(yangDiff))
        yangDiff = yangDiff3;
    this._navGotoPosDelta.navYAng = { t0: this._navYAng, td: yangDiff };
    if (optional && optional.zang)
        this._navGotoPosDelta.navZAng = { t0: this._navZAng, td: optional.zang - this._navZAng };
    else
        this._navGotoPosDelta.navZAng = { t0: this._navZAng, td: 0 - this._navZAng };
    // Pan
    if (isNaN(xpan))
        this._navGotoPosDelta.navXPan = { t0: this._navPan[0], td: 0 };
    else
        this._navGotoPosDelta.navXPan = { t0: this._navPan[0], td: (xpan - this._navPan[0]) };
    if (isNaN(ypan))
        this._navGotoPosDelta.navYPan = { t0: this._navPan[1], td: 0 };
    else
        this._navGotoPosDelta.navYPan = { t0: this._navPan[1], td: (ypan - this._navPan[1]) };
    // Zoom
    this._navGotoPosDelta.navDolly = { t0: this._navDolly, td: (dolly - this._navDolly) };

   if (optional !== undefined) {
	  if (optional._revertPan !== undefined){
		  this._revertPan = optional._revertPan;
	  }
	  if (optional._revertPanOriginal !== undefined){
		  this._revertPanOriginal[0] = optional._revertPanOriginal[0];
		  this._revertPanOriginal[1] = optional._revertPanOriginal[1];
	  }
	  if (optional._fovRecoveryOffset !== undefined){
		  this._fovRecoveryOffset = optional._fovRecoveryOffset;
	  }
      if (optional.target !== undefined) {
         if (this._navTarget == null)
            this._navTarget = [0,0,0];
		this._navGotoPosDelta.navTarget = { t0: this._navTarget,td: (infinityrt_vertex_sub(optional.target,this._navTarget)) };
	} else {
		this._navTarget = [0,0,0];
	}
	if (optional.fovy !== undefined){
         var s1 = Math.sin(this._scene.fovy * 0.5 * (3.141592658 / 180.0));
            var s2=Math.sin(optional.fovy*0.5*(3.141592658/180.0));
            // console.log(this._navDolly+","+this._scene.fovy+","+optional.fovy+","+s1+","+s2);

            //this._navGotoPosDelta.navFoVY = { t0: this._scene.fovy, td: optional.fovy - this._scene.fovy };
            this._navGotoPosDelta.navFFac= {t0:s1*this._navDolly, td:(s2*dolly)-(s1*this._navDolly)};
        }
    }
};

//infinityrt_navigation.prototype.SetNavTarget = function (center){
infinityrt_navigation.prototype.SetRotationCenter = function (center){
	this._navTarget = center;
	var delta = infinityrt_vertex_sub(this._scene.camPosGlobal, center);
	this._scene._nav._navPan[0] = infinityrt_dp(delta, [this._navMatLastView[0], this._navMatLastView[1], this._navMatLastView[2]]);
	this._scene._nav._navPan[1] = infinityrt_dp(delta, [this._navMatLastView[4], this._navMatLastView[5], this._navMatLastView[6]]);
	this._scene._nav._navDolly = infinityrt_dp(delta, [this._navMatLastView[8], this._navMatLastView[9], this._navMatLastView[10]]);
	//this.ApplyRestrictionAdjust(this._fovadjust);
	if (this._scene._nav._navPan[0] > this._panMax[0]) {
		this._panMax[0] = this._scene._nav._navPan[0];
	}
	if (this._scene._nav._navPan[1] > this._panMax[1]) {
		this._panMax[1] = this._scene._nav._navPan[1];
	}
	if (this._scene._nav._navPan[0] < this._panMin[0]) {
		this._panMin[0] = this._scene._nav._navPan[0];
	}
	if (this._scene._nav._navPan[1] < this._panMin[1]) {
		this._panMin[1] = this._scene._nav._navPan[1];
	}
	this._scene.clearRefine();
};

infinityrt_navigation.prototype.NavStartGotoPosQuat = function (qw, qx, qy, qz, xpan, ypan, dolly, numFrames, onComplete, onSample) {
    if (this._navMode == 0)
        return; // Not Supported, use NavStartGotoPos
    if (onComplete !== undefined)
        this._navGotoPosOnComplete = onComplete;
    this.ParseOnSample(onSample);

    if (numFrames == 0)
        this._scene.RelaxFocusRate();
    this._navGotoPosActive = true;
    this._navGotoPosFrames = numFrames;
    this._navGotoPosTimeSt = undefined;

    this._navGotoPosDelta = {};
    this._navGotoPosDelta.fraction = 1.0 / this._navGotoPosFrames;
    this._navGotoPosDelta.framesSoFar = 0;
    // Rotation
    this._navGotoPosDelta.qb = {};
    this._navGotoPosDelta.qb.x = qx;
    this._navGotoPosDelta.qb.y = qy;
    this._navGotoPosDelta.qb.z = qz;
    this._navGotoPosDelta.qb.w = qw;
    this._navGotoPosDelta.qm = {};
    // Pan
    if (isNaN(xpan))
        this._navGotoPosDelta.navXPan = 0.0;
    else
        this._navGotoPosDelta.navXPan = (xpan - this._navPan[0]);
    this._navGotoPosDelta.prevXPan = this._navPan[0];
    if (isNaN(ypan))
        this._navGotoPosDelta.navYPan = 0.0;
    else
        this._navGotoPosDelta.navYPan = (ypan - this._navPan[1]);
    this._navGotoPosDelta.prevYPan = this._navPan[1];
    // Zoom
    this._navGotoPosDelta.navDolly = (dolly - this._navDolly);
    this._navGotoPosDelta.prevDolly = this._navDolly;
};

infinityrt_navigation.prototype.NavCreateViewMatrix = function (initialViewMatrix) {
    if (this._scene.xrActive)
        return this._navMatLastView;
    var mTmp, timestamp = now();
    this._navMatLastView = initialViewMatrix;
    if (this._navMode == 0 || this._navMode == 2) {
        if (this._navMode == 2) {
          
            var decay = mdown ? this._navDecay : Math.pow(0.5, (timestamp - this.lastUpdate) / this._navMode2DecayHalflife);
            this._navChange = false;
            if (this._navDXAng != 0.0 || this._navDYAng != 0.0 || this._navDPan[0] != 0.0 || this._navDPan[1] != 0.0 || this._navDDolly != 0.0 || this._navFDolly !=0) {
            // Rotation
            this._navXAng += this._navDXAng;
            this._navYAng += this._navDYAng;
            var fRotLimit = M_PI * 0.28;
            // var fRotMinLimit = -M_PI * this.tempfRotMinLimit;
            var fRotMinLimit = -M_PI * 0.030;
            if (this._navXAng > fRotLimit)
               this._navXAng = fRotLimit;
            else if (this._navXAng < fRotMinLimit)
                    this._navXAng = fRotMinLimit;
                while (this._navYAng < 0.0) this._navYAng += 2 * M_PI;
                while (this._navYAng > 2 * M_PI) this._navYAng -= 2 * M_PI;
                // Pan

                if (this._navXAng > 0.2912761274) {
                    if (hidden == false) {
                       // scene.groupApplyState("Lights_OFF");
                       scene.groupApplyState("Lights:Lights_OFF");
                       scene.groupApplyState("Small_Light_OFF");
                       scene.groupApplyState('Ceiling_OFF');
                       hidden = true;
                    }
                 }
                 else {
                    if (hidden == true) {
                       // scene.groupApplyState("Lights_ON");
                       scene.groupApplyState("Lights:Lights_ON");
                       scene.groupApplyState("Small_Light_ON");
                       scene.groupApplyState('Ceiling_ON');
                       hidden = false;
                    }
                 }

                this._navPan[0] += this._navDPan[0];
                this._navPan[1] += this._navDPan[1];
                if (this._navPan[0] > this._panMax[0]) {
                    this._navPan[0] = this._panMax[0];
                    this._navDPan[0] = 0;
                }
                if (this._navPan[1] > this._panMax[1]) {
                    this._navPan[1] = this._panMax[1];
                    this._navDPan[1] = 0;
                }
                if (this._navPan[0] < this._panMin[0]) {
                    this._navPan[0] = this._panMin[0];
                    this._navDPan[0] = 0;
                }
                if (this._navPan[1] < this._panMin[1]) {
                    this._navPan[1] = this._panMin[1];
                    this._navDPan[1] = 0;
                }
                // Dolly
                this._navDolly += this._navDDolly;
                if (this._navDDolly != 0.0) {
                    if (this._navDolly < this._navMinDolly) {
                        this._navDolly = this._navMinDolly;
                        if (this._navDDolly < 0)
                            this._navDDolly = 0;
                    }
                    else if (this._navDolly > this._navMaxDolly) {
                  this._navDolly = this._navMaxDolly;
                  if (this._navDDolly > 0)
                     this._navDDolly = 0;
               }
            }
                
                this._navDolly += this._navFDolly;
                if (this._navFDolly != 0.0) {
                    if (this._navDolly < this._zoomMaxFactor / Math.tan(this._scene.fovy*0.5*(3.141592658/180.0)) ) {
                        this._navDolly = this._zoomMaxFactor / Math.tan(this._scene.fovy*0.5*(3.141592658/180.0)) ;
                        if (this._navFDolly < 0)
                            this._navFDolly = 0;
                    }
                    else if (this._navDolly > this._zoomMinFactor / Math.tan(this._scene.fovy*0.5*(3.141592658/180.0))) {
                        this._navDolly = this._zoomMinFactor / Math.tan(this._scene.fovy*0.5*(3.141592658/180.0));
                        if (this._navFDolly > 0)
                            this._navFDolly = 0;
                    }
                }

                

                //
                this._scene.clearRefine();
            }
            this._navDXAng *= decay;
            this._navDYAng *= decay;
            this._navDPan[0] *= decay;
            this._navDPan[1] *= decay;
            this._navDDolly *= decay;
            this._navFDolly *= decay;
            var thresDelta = 0.001;
            if (Math.abs(this._navDXAng) < thresDelta) this._navDXAng = 0;
            if (Math.abs(this._navDYAng) < thresDelta) this._navDYAng = 0;
            if (Math.abs(this._navDPan[0]) < thresDelta) this._navDPan[0] = 0;
            if (Math.abs(this._navDPan[1]) < thresDelta) this._navDPan[1] = 0;
            if (Math.abs(this._navDDolly) < thresDelta) this._navDDolly = 0;
            if (Math.abs(this._navFDolly) < thresDelta) this._navFDolly = 0;
        }
        if (this._navGotoPosActive) {
            var s0, animcomplete = false;
            if (this._navGotoPosFrames < 1)
                this._navGotoPosFrames = 1;

            if (typeof (this._navGotoPosTimeSt) != "undefined") {
                s0 = (now() - this._navGotoPosTimeSt) / this._navGotoPosTimeDur;
                if (s0 >= 1.0) {
                    animcomplete = true;
                    s0 = 1.0;
                }
                if (this.onSample != null)
                    s0 = this.onSample(s0);
                else if (this._navGotoPosEnableSlowInOut)
                    s0 = slowinout(s0, this._scene._slowinoutfac);
                this._navXAng = this._navGotoPosDelta.navXAng.t0 + s0 * this._navGotoPosDelta.navXAng.td;
                this._navYAng = this._navGotoPosDelta.navYAng.t0 + s0 * this._navGotoPosDelta.navYAng.td;
                this._navZAng = this._navGotoPosDelta.navZAng.t0 + s0 * this._navGotoPosDelta.navZAng.td;
                this._navPan[0] = this._navGotoPosDelta.navXPan.t0 + s0 * this._navGotoPosDelta.navXPan.td;
                this._navPan[1] = this._navGotoPosDelta.navYPan.t0 + s0 * this._navGotoPosDelta.navYPan.td;
                this._navDolly = this._navGotoPosDelta.navDolly.t0 + s0 * this._navGotoPosDelta.navDolly.td;
                if (this._navTarget && this._navGotoPosDelta.navTarget)
                    this._navTarget = infinityrt_vertex_scladd(this._navGotoPosDelta.navTarget.t0, this._navGotoPosDelta.navTarget.td, s0);
                if (this._navGotoPosDelta.navFFac){ 
                    var interpfac=this._navGotoPosDelta.navFFac.t0 + s0*this._navGotoPosDelta.navFFac.td;
                    var interps=interpfac/this._navDolly;
                    this._scene.fovy = 2.0*(180.0/3.141592658)*Math.asin(interps);
                }
            } else if (this._navGotoPosEnableSlowInOut || this.onSample != null) {
                this._navGotoPosDelta.currentframesRatio += this._navGotoPosDelta.framesRatio;
                if (this.onSample != null)
                    s0 = this.onSample(this._navGotoPosDelta.currentframesRatio);
                else
                    s0 = slowinout(this._navGotoPosDelta.currentframesRatio, this._scene._slowinoutfac);
                this._navXAng = this._navGotoPosDelta.navXAng.t0 + s0 * this._navGotoPosDelta.navXAng.td;
                this._navYAng = this._navGotoPosDelta.navYAng.t0 + s0 * this._navGotoPosDelta.navYAng.td;
                this._navZAng = this._navGotoPosDelta.navZAng.t0 + s0 * this._navGotoPosDelta.navZAng.td;
                this._navPan[0] = this._navGotoPosDelta.navXPan.t0 + s0 * this._navGotoPosDelta.navXPan.td;
                this._navPan[1] = this._navGotoPosDelta.navYPan.t0 + s0 * this._navGotoPosDelta.navYPan.td;
                this._navDolly = this._navGotoPosDelta.navDolly.t0 + s0 * this._navGotoPosDelta.navDolly.td;
                if (this._navTarget && this._navGotoPosDelta.navTarget)
                    this._navTarget = infinityrt_vertex_scladd(this._navGotoPosDelta.navTarget.t0, this._navGotoPosDelta.navTarget.td, s0);
                 if (this._navGotoPosDelta.navFFac){ 
                    var interpfac=this._navGotoPosDelta.navFFac.t0 + s0*this._navGotoPosDelta.navFFac.td;
                    var interps=interpfac/this._navDolly;
                    this._scene.fovy = 2.0*(180.0/3.141592658)*Math.asin(interps);                 
                }
            } else {
                this._navXAng += this._navGotoPosDelta.navXAng;
                this._navYAng += this._navGotoPosDelta.navYAng;
                this._navZAng += this._navGotoPosDelta.navZAng;
                this._navPan[0] += this._navGotoPosDelta.navXPan;
                this._navPan[1] += this._navGotoPosDelta.navYPan;
                this._navDolly += this._navGotoPosDelta.navDolly;
            }

            // Rotation
            mTmp = MatrixRotationAxis(this._navYAng, 0.0, 1.0, 0.0);
            this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            mTmp = MatrixRotationAxis(-this._navXAng, this._navMatLastView[0], this._navMatLastView[1], this._navMatLastView[2]);
            this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            mTmp = MatrixRotationAxis(this._navZAng, this._navMatLastView[8], this._navMatLastView[9], this._navMatLastView[10]);
            this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            // Zoom
            mTmp = MatrixTranslation(this._navMatLastView[8] * this._navDolly, this._navMatLastView[9] * this._navDolly, this._navMatLastView[10] * this._navDolly);
            this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);

            if (this._navTarget) {
                mTmp = MatrixTranslation(this._navTarget[0], this._navTarget[1], this._navTarget[2]);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            }

            if (typeof (this._navGotoPosTimeSt) == "undefined") {
                this._navGotoPosFrames -= 1;
                animcomplete = (this._navGotoPosFrames == 0);
            }

            if (animcomplete) {
                var navobject = this;
                setTimeout(function () {
                    while (navobject._navYAng < -M_PI) navobject._navYAng += 2 * M_PI;
                    while (navobject._navYAng > M_PI) navobject._navYAng -= 2 * M_PI;
                    navobject._navGotoPosDelta = null;
                    navobject._navGotoPosActive = false;
                    navobject._navGotoPosOnComplete();
                    navobject._navGotoPosOnComplete = function () { };
                    if (typeof (NavOnDoneAnim) != "undefined")
                        NavOnDoneAnim();
                }, 50);
            }
        } else {
            if (this._scene.upvector == 2) {
                // Rotation
                mTmp = MatrixRotationAxis(this._navYAng, 0.0, 0.0, 1.0);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
                mTmp = MatrixRotationAxis(this._navXAng, this._navMatLastView[4], this._navMatLastView[5], this._navMatLastView[6]);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
                mTmp = MatrixRotationAxis(this._navZAng, this._navMatLastView[8], this._navMatLastView[9], this._navMatLastView[10]);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
                // Zoom
                mTmp = MatrixTranslation(this._navMatLastView[0] * -this._navDolly, this._navMatLastView[1] * -this._navDolly, this._navMatLastView[2] * -this._navDolly);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            } else {
                // Rotation
                mTmp = MatrixRotationAxis(this._navYAng, 0.0, 1.0, 0.0);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
                mTmp = MatrixRotationAxis(-this._navXAng, this._navMatLastView[0], this._navMatLastView[1], this._navMatLastView[2]);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
                mTmp = MatrixRotationAxis(this._navZAng, this._navMatLastView[8], this._navMatLastView[9], this._navMatLastView[10]);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
                // Zoom
                mTmp = MatrixTranslation(this._navMatLastView[8] * this._navDolly, this._navMatLastView[9] * this._navDolly, this._navMatLastView[10] * this._navDolly);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            }

            if (this._navTarget) {
                mTmp = MatrixTranslation(this._navTarget[0], this._navTarget[1], this._navTarget[2]);
                this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);
            }
        }
    } else {
        // Zoom
        mTmp = MatrixTranslation(this._navMatLastView[8] * this._navDolly, this._navMatLastView[9] * this._navDolly, this._navMatLastView[10] * this._navDolly);
        this._navMatLastView = MatrixMultiply(this._navMatLastView, mTmp);

        if (this._navGotoPosActive) {
            if (this._navGotoPosFrames == 1) {
                if (typeof (NavOnDoneAnim) != "undefined")
                    NavOnDoneAnim();
            }
        }
    }
    if (this._navGotoFoV != null) {
        var fovcomplete = false;

        if (typeof (this._navGotoFoV._st) != "undefined") {
            s0 = (now() - this._navGotoFoV._st) / this._navGotoFoV._dur;
            if (s0 >= 1.0) {
                fovcomplete = true;
                s0 = 1.0;
            }

            this._scene.fovy = this._navGotoFoV._fovy_t0 + s0 * this._navGotoFoV._fovy_t1;
        }
        else {
            if (this._navGotoFoV._frames < 1)
                this._navGotoFoV._frames = 1;

            this._scene.fovy += this._navGotoFoV._deltafovy;

            this._navGotoFoV._frames -= 1;
            fovcomplete = (this._navGotoFoV._frames == 0);
        }

        if (animcomplete) {
            var navobject = this;
            setTimeout(function () {
                navobject._navGotoFoV = null;
                navobject._navGotoFoVOnComplete();
                navobject._navGotoFoVOnComplete = function () { };
            }, 50);
        }
    }

    this.lastUpdate = timestamp;
    return this._navMatLastView;
};

infinityrt_navigation.prototype.enableEllipticalNav = function (valueA, valueB, valueCOpt, valueDOpt) {
    this._ellipticalNav = true;
    this._navMinDollyX = valueA;
    this._navMinDollyZ = valueB;
    if(valueCOpt)
        this._navMinDollyOpt = valueCOpt;
	if (valueDOpt)
		this._navYAngOffset = valueDOpt;
}

infinityrt_navigation.prototype.NavCreateModelMatrix = function (initialViewMatrix) {
   if (this._navMatHierModel == null)
        this._navMatHierModel = infinityrt_identity.slice(0);
    if (this._navMode == 1) {
        if (this._navGotoPosActive) {
            if (this._navGotoPosFrames < 1)
                this._navGotoPosFrames = 1;
            this._navGotoPosDelta.framesSoFar++;

            var t = this._navGotoPosDelta.fraction * this._navGotoPosDelta.framesSoFar;
            var thefraction = Math.sin(t * 3.14159 * 0.5);
            this._navPan[0] = this._navGotoPosDelta.prevXPan + thefraction * this._navGotoPosDelta.navXPan;
            this._navPan[1] = this._navGotoPosDelta.prevYPan + thefraction * this._navGotoPosDelta.navYPan;
            this._navDolly = this._navGotoPosDelta.prevDolly + thefraction * this._navGotoPosDelta.navDolly;

            this.QuatSlerp(this._navQuat, this._navGotoPosDelta.qb, this._navGotoPosDelta.qm, t);
            this._navQuat.w = this._navGotoPosDelta.qm.w;
            this._navQuat.x = this._navGotoPosDelta.qm.x;
            this._navQuat.y = this._navGotoPosDelta.qm.y;
            this._navQuat.z = this._navGotoPosDelta.qm.z;

            var x = this._navQuat.x, y = this._navQuat.y, z = this._navQuat.z, w = this._navQuat.w;
            var x2 = x + x, y2 = y + y, z2 = z + z;
            var xx = x * x2, xy = x * y2, xz = x * z2;
            var yy = y * y2, yz = y * z2, zz = z * z2;
            var wx = w * x2, wy = w * y2, wz = w * z2;

            this._navMatHierModel[0] = 1 - (yy + zz);
            this._navMatHierModel[4] = xy - wz;
            this._navMatHierModel[8] = xz + wy;

            this._navMatHierModel[1] = xy + wz;
            this._navMatHierModel[5] = 1 - (xx + zz);
            this._navMatHierModel[9] = yz - wx;

            this._navMatHierModel[2] = xz - wy;
            this._navMatHierModel[6] = yz + wx;
            this._navMatHierModel[10] = 1 - (xx + yy);

            this._navGotoPosFrames -= 1;
            if (this._navGotoPosFrames == 0) {
                this._navGotoPosDelta = null;
                this._navGotoPosActive = false;
                this._navGotoPosOnComplete();
                this._navGotoPosOnComplete = function () { };
            }
        } else {
            var coffx = (this._navMX - this._midx);
            var coffy = (this._navMY - this._midy);
            var mouserad = Math.sqrt(coffx * coffx + coffy * coffy);
            var mousespeed = Math.sqrt(this._navDX * this._navDX + this._navDY * this._navDY);

            if (mousespeed < 0.001)
                mousespeed = 0.001;

            // find radial and circumferential components
            var radx = (this._navMX - this._midx) / (mouserad + 1.0);
            var rady = (this._navMY - this._midy) / (mouserad + 1.0);
            var cirx = rady;
            var ciry = -radx;
            var circum = this._navDX * cirx + this._navDY * ciry * 0.1; //circumferential component of velocity
            var radial = this._navDX * radx + this._navDY * rady; //radial component of velocity
            if (radial < 0.0)
                radial = -radial;
            radial *= this._navSpeed;
            radial /= (180.0 * M_PI);
            circum *= this._navSpeed;
            circum /= (180.0 * M_PI);
            if (radial > 0 || circum > 0) {
                var mouseMoveInX = this._navDX / mousespeed;
                var mouseMoveInY = this._navDY / mousespeed;
                var zAngle = Math.acos(mouseMoveInY);
                if (mouseMoveInX < 0.0)
                    zAngle = (M_PI * 2.0) - zAngle;
                // apply radial and circumferential components to root hierarchical matrix
                var mTmp = MatrixRotationAxis(-zAngle, initialViewMatrix[8], initialViewMatrix[9], initialViewMatrix[10]);
                this._navMatHierModel = MatrixMultiply(this._navMatHierModel, mTmp);
                mTmp = MatrixRotationAxis(radial, initialViewMatrix[0], initialViewMatrix[1], initialViewMatrix[2]);
                this._navMatHierModel = MatrixMultiply(this._navMatHierModel, mTmp);
                mTmp = MatrixRotationAxis(zAngle, initialViewMatrix[8], initialViewMatrix[9], initialViewMatrix[10]);
                this._navMatHierModel = MatrixMultiply(this._navMatHierModel, mTmp);
                mTmp = MatrixRotationAxis(circum, initialViewMatrix[8], initialViewMatrix[9], initialViewMatrix[10]);
                this._navMatHierModel = MatrixMultiply(this._navMatHierModel, mTmp);
                // Update Quaternion values
                this.QuaternionFromRotationMatrix(this._navMatHierModel);
                this._scene.clearRefine();
            }
            // (Momentum) decay cursor delta
            this._navDX *= this._navDecay;
            this._navDY *= this._navDecay;
            if (Math.abs(this._navDX) < 1.0 && Math.abs(this._navDY) < 1.0) {
                this._navDX = this._navDY = 0;  // clear cursor delta
            }
        }
    }
    return this._navMatHierModel;
};

infinityrt_navigation.prototype.ApplyRestrictionAdjust = function (fovadjust) {
    // FoV
    var dir = this._fovMax - this._scene.fovy;
    var adir = Math.abs(dir);
    if (adir > fovadjust) {
      dir /= adir;
      var ofov = this._scene.fovy;
      this._scene.fovy += dir * fovadjust;
      var ratio = this._scene.fovy / ofov;
	  this._navDolly -= this._fovRecoveryOffset;
      this._navDolly /= ratio;
	  this._navDolly += this._fovRecoveryOffset;
   }
   if (this._revertPan){
	   for (var i = 0; i < 2; i++) {
         this._navPan[i] = (1.0 - this._navDesiredTargetSpeed) * this._navPan[i] + this._navDesiredTargetSpeed * this._revertPanOriginal[i];
      }
   }

   if (this._navZAng != 0) {
      // Z-Rotation
      this._navZAng *= 0.8;
        if (Math.abs(this._navZAng) < 0.01)
            this._navZAng = 0;
    }

    if(this._navDesiredTarget!=null){
        if(this._navTarget==null)this._navTarget=[0,0,0];
        for(var i=0;i<3;i++){
            this._navTarget[i]=(1.0-this._navDesiredTargetSpeed)*this._navTarget[i]+this._navDesiredTargetSpeed*this._navDesiredTarget[i];
        }
    }
}

infinityrt_navigation.prototype.getZoomFactor = function () {

   this._zoomMaxFactor = this._navMaxDolly + 1 * (this._navMinDolly - this._navMaxDolly);
   this._zoomMinFactor = this._navMaxDolly + 0 * (this._navMinDolly - this._navMaxDolly);
   
   // Autoadjust this._zoomMaxFactor or this._zoomMinFactor if needed
   var dir = this._fovMax - this._scene.fovy;
   var adir = Math.abs(dir);
   if (adir > this._fovadjust) {
	   if (!this._navMaxDollyOriginal){
		   this._navMaxDollyOriginal = this._navMaxDolly;
	   }
	   if (!this._navMinDollyOriginal){
		   this._navMinDollyOriginal = this._navMinDolly;
	   }
	   var fovRatio = this._fovMax / this._scene.fovy;
	   //if ((this._navDolly < this._navMinDolly) || (this._navDolly > this._navMaxDolly)) {
			//Autoadjust this._zoomMaxFactor so _navDolly doesn't change
			this._navMinDolly = this._navMinDollyOriginal * fovRatio;
			this._navMaxDolly = this._navMaxDollyOriginal * fovRatio;
			this._zoomMaxFactor = this._navMaxDolly + 1 * (this._navMinDolly - this._navMaxDolly);
			this._zoomMinFactor = this._navMaxDolly + 0 * (this._navMinDolly - this._navMaxDolly);
	   //}
   } else {
	   if (this._navMinDollyOriginal && this._navMaxDollyOriginal){
		   var fovRatio = this._fovMax / this._scene.fovy;
		   //if ((this._navDolly < this._navMinDolly) || (this._navDolly > this._navMaxDolly)) {
				//Autoadjust this._zoomMaxFactor so _navDolly doesn't change
				this._navMinDolly = this._navMinDollyOriginal * fovRatio;
				this._navMaxDolly = this._navMaxDollyOriginal * fovRatio;
				this._zoomMaxFactor = this._navMaxDolly + 1 * (this._navMinDolly - this._navMaxDolly);
				this._zoomMinFactor = this._navMaxDolly + 0 * (this._navMinDolly - this._navMaxDolly);
		   //}
	   }
	   this._navMaxDollyOriginal = undefined;
	   this._navMinDollyOriginal = undefined;
   }
   
   // return  ((this._navDolly * Math.tan(this._scene.fovy*0.5*(3.141592658/180.0))) - this._navMaxDolly) / (this._navMinDolly-this._navMaxDolly) ;
   //return 100 * (((this._navDolly * Math.tan(this._scene.fovy * 0.5 * (3.141592658 / 180.0))) - this._navMaxDolly) / (this._navMinDolly - this._navMaxDolly));
   // Use _zoomMinFactor/_zoomMaxFactor as they have been autoadjusted
    return 100 * (((this._navDolly * Math.tan(this._scene.fovy * 0.5 * (3.141592658 / 180.0))) - this._zoomMinFactor) / (this._zoomMaxFactor - this._zoomMinFactor));

}

infinityrt_navigation.prototype.NavChangeDolly = function (delta, sliderValue) {
    if (!this._navEnabled)
      return false;

	this.getZoomFactor();
	
   //this.ApplyRestrictionAdjust(this._fovadjust);

   if (this._navMode == 2) {

      if (delta === undefined && sliderValue !== undefined) {
		 
         //this._zoomFactor = this._navMaxDolly + parseFloat(sliderValue) * (this._navMinDolly - this._navMaxDolly);
		 // We use _zoomMaxFactor & _zoomMinFactor, just in case this._zoomFactor is out of bounds due to fovy
		 this._zoomFactor = this._zoomMinFactor + parseFloat(sliderValue) * (this._zoomMaxFactor - this._zoomMinFactor);
		 
          this._navDolly = this._zoomFactor / Math.tan(this._scene.fovy * 0.5 * (3.141592658 / 180.0));
		 
		 if (this._fovRecoveryOnZoom){
			this.ApplyRestrictionAdjust(this._fovadjust);
		 }
		 
         this._scene.clearRefine();
         // console.log(this._navDolly);

        }
        else {
         //console.log(delta);      
         if (sliderValue !== undefined)
             this._navFDolly -= delta * this._navDollySpeed * (this._fovMax / this._scene.fovy) * (1.0 - this._navDecay) * (this._zoomMinFactor - this._zoomMaxFactor);

         else
            this._navDDolly -= delta * this._navDollySpeed * (1.0 - this._navDecay) * (this._zoomMinFactor - this._zoomMaxFactor);
		
		if (this._navFDolly != 0.0) {
            var maxLimit = this._zoomMaxFactor / Math.tan(this._scene.fovy * 0.5 * (3.141592658 / 180.0));
            var minLimit = this._zoomMinFactor / Math.tan(this._scene.fovy * 0.5 * (3.141592658 / 180.0));
		   
		   this.skipDollyMinMax = false;
		   if ((this._navDolly + this._navFDolly) < maxLimit) {
			  this._navFDolly = this._navDolly - maxLimit;
		   }
		   else if ((this._navDolly + this._navFDolly) > minLimit) {
			  this._navFDolly = minLimit - this._navDolly;
		   }
		   else {
			   if (this._fovRecoveryOnZoom){
					this.ApplyRestrictionAdjust(this._fovadjust);
			   }
		   }
		}
		
      }
      this._navChange = true;
    } else {
        this._navDolly -= delta;
        if (this._navDolly < this._navMinDolly)
            this._navDolly = this._navMinDolly;
        else if (this._navDolly > this._navMaxDolly)
            this._navDolly = this._navMaxDolly;
    }
    return true;
};

infinityrt_navigation.prototype.NavRotation = function (mpos, mdelta) {
    if (!this._navEnabled)
      return false;

	this.getZoomFactor();
    this.ApplyRestrictionAdjust(this._fovadjust);
	this.getZoomFactor();
	
    //If Elliptical Zoom is called
    if (this._ellipticalNav === true) {
        
        var q = this._navYAng + this._navYAngOffset;
        var p = this._navXAng;

        if (q > M_PI) q -= M_PI;
        if (p > M_PI) p -= M_PI;
        
        //var blendfac = Math.min(q, M_PI - q) / (0.5 * M_PI);
        //var blendfac2 = Math.min(p, M_PI - p) / (0.5 * M_PI);
		var blendfac = Math.min(Math.abs(q), M_PI - Math.abs(q)) / (0.5 * M_PI);
        var blendfac2 = Math.min(Math.abs(p), M_PI - Math.abs(p)) / (0.5 * M_PI);

        this._navMinDolly = blendfac * this._navMinDollyX + (1.0 - blendfac) * this._navMinDollyZ;

        if(this._navMinDollyOpt && blendfac2 > 0)
            this._navMinDolly = blendfac2 * this._navMinDollyOpt + (1.0 - blendfac2) * this._navMinDolly;

        if(this._navDolly < this._navMinDolly) this._navDolly = this._navMinDolly;

    } 

    if (!this._axisAllow[0])
      mdelta[0] = 0;
    if (!this._axisAllow[1])
        mdelta[1] = 0;

    if (this._navMode == 2) {
        if (this._navDolly <= this._navPanDolly)
            return this.NavPan(mdelta);
        this._navDXAng -= mdelta[1] * this._navRotationSpeed*(1.0-this._navDecay);
        this._navDYAng += mdelta[0] * this._navRotationSpeed*(1.0-this._navDecay);
        this._navChange = true;
    }
    else if (this._navMode == 1) {
        this._navMX = mpos[0]; this._navMY = mpos[1];
        this._navDX = -mdelta[0]; this._navDY = -mdelta[1];
   }
   else {
      this._navXAng -= mdelta[1] / 30.0;
      this._navYAng += mdelta[0] / 30.0;
      var fRotLimit = M_PI * 0.28;
      // var fRotMinLimit = -M_PI * this.tempfRotMinLimit;
      var fRotMinLimit = -M_PI * 0.030;
      if (this._navXAng > fRotLimit)
            this._navXAng = fRotLimit;
        else if (this._navXAng < fRotMinLimit)
            this._navXAng = fRotMinLimit;
        while (this._navYAng < 0.0) this._navYAng += 2 * M_PI;
        while (this._navYAng > 2 * M_PI) this._navYAng -= 2 * M_PI;
    }
    return true;
};

infinityrt_navigation.prototype.NavPan = function (mdelta) {
   if (!this._navEnabled)
      return false;

   this._revertPan = false;
   this.getZoomFactor();
   this.ApplyRestrictionAdjust(this._fovadjust);
   this.getZoomFactor();

   if (!this._axisAllow[0])
      mdelta[0] = 0;
   if (!this._axisAllow[1])
      mdelta[1] = 0;

    if (this._navMode == 2) {
        this._navDPan[0] += mdelta[0] * this._navPanSpeed*(1.0-this._navDecay);
        this._navDPan[1] -= mdelta[1] * this._navPanSpeed*(1.0-this._navDecay);
        this._navChange = true;
    }
    else {
        this._navPan[0] += mdelta[0] / 75.0;
        this._navPan[1] -= mdelta[1] / 75.0;

        if (this._navPan[0] > this._panMax[0]) this._navPan[0] = this._panMax[0];
        if (this._navPan[1] > this._panMax[1]) this._navPan[1] = this._panMax[1];
        if (this._navPan[0] < this._panMin[0]) this._navPan[0] = this._panMin[0];
        if (this._navPan[1] < this._panMin[1]) this._navPan[1] = this._panMin[1];
    }

    return true;
};

function RTOpenARViewer(arSrc) {
    //console.log("arSrc", arSrc)
    if (arSrc.endsWith(".usdz")) {
        const anchor = document.createElement('a');
        anchor.setAttribute('rel', 'ar');
        anchor.appendChild(document.createElement('img'));
        anchor.setAttribute('href', arSrc);
        anchor.click();
    } else {
        const locationUrl = new URL(self.location.toString());
        const modelUrl = new URL("intent://arvr.google.com/scene-viewer/1.0?file=" + encodeURIComponent(arSrc));
        const scheme = locationUrl.protocol.replace(':', '');
        modelUrl.protocol = 'intent://';
        const intent = `${modelUrl.toString()}&mode=ar_only#Intent;scheme=${scheme};package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(locationUrl.toString())};end;`;
        const anchor = document.createElement('a');
        anchor.setAttribute('href', intent);
        anchor.click();
    }
};

infinityrt_navigation.prototype.EvalCurve = function (t0) {
    return evaluateAnimationCurve(this._curveSIO, t0);
};

infinityrt_navigation.prototype.InitGotoPosHelper = function () {
    try {
        var nav = this;
        window.addEventListener('keypress', function (ev) {
            if ((ev.keyCode === 67 || ev.keyCode === 99) && ev.shiftKey) {
                var optional = '';
                if (nav._navTarget)
                    optional = 'target: [' + nav._navTarget[0].toFixed(4) + ',' + nav._navTarget[1].toFixed(4) + ',' + nav._navTarget[2].toFixed(4) + ']';
                if (optional.length > 0)
                    optional = ', undefined, undefined, {' + optional + '}';
                console.log('scene.gotoPosInTime(' + nav._navYAng.toFixed(4) + ', ' + nav._navXAng.toFixed(4) + ', ' +
                    nav._navPan[0].toFixed(4) + ', ' + nav._navPan[1].toFixed(4) + ', ' + nav._navDolly.toFixed(4) + ', 1000' + optional + ');');
            }
        }, false);
        window.addEventListener('keydown', function (ev) {
            if (ev.keyCode === 88 || ev.keyCode === 120)
                nav._axisAllow[1] = false;
            if (ev.keyCode === 89 || ev.keyCode === 121)
                nav._axisAllow[0] = false;
        }, false);
        window.addEventListener('keyup', function (ev) {
            if (ev.keyCode === 88 || ev.keyCode === 120)
                nav._axisAllow[1] = true;
            if (ev.keyCode === 89 || ev.keyCode === 121)
                nav._axisAllow[0] = true;
        }, false);
    } catch (e) {
    }
};
