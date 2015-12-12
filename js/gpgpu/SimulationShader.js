/**
 * @author mrdoob / http://www.mrdoob.com
 */

//TODO! UI Mass not implemented yet

/**********************
**      Common       **
**********************/

function commonUniforms() {
    return [
        'uniform int u_rigid;',
        'uniform float u_wind;',
        'uniform vec2 Str;',
        'uniform vec2 Shr;',
        'uniform vec2 Bnd;',
        'uniform vec4 u_pins;',
        'uniform int u_pinEdges;',

    ].join('\n');
}

function addWind() {
    return [
        'F.x+=u_wind*0.3;',
        'F.z+=u_wind*0.7;',
    ].join('\n');
}
function getNeighbor() {
    return [
        'vec2 getNeighbor(int n, out float ks, out float kd)',
        '{',
            //structural springs (adjacent neighbors)
      '	    if (n < 4){ ks = Str[0]; kd = Str[1]; }',	//ksStr, kdStr
      '     if (n == 0)	return vec2(1.0, 0.0);',
      '	    if (n == 1)	return vec2(0.0, -1.0);',
      '	    if (n == 2)	return vec2(-1.0, 0.0);',
      ' 	if (n == 3)	return vec2(0.0, 1.0);',
            //shear springs (diagonal neighbors)
      '     if (n<8) { ks = Shr[0]; kd = Shr[1]; } ',//ksShr,kdShr
      '     if (n == 4) return vec2(1.0, -1.0);',
      '     if (n == 5) return vec2(-1.0, -1.0);',
      '     if (n == 6) return vec2(-1.0, 1.0);',
      '     if (n == 7) return vec2(1.0, 1.0);',
            //bend spring (adjacent neighbors 1 node away)   
      '     if (n<12) { ks =Bnd[0]; kd = Bnd[1]; }', //ksBnd,kdBnd
      '     if (n == 8)	return vec2(2.0, 0.0);',
      '     if (n == 9) return vec2(0.0, -2.0);',
      '     if (n == 10) return vec2(-2.0, 0.0);',
      '     if (n == 11) return vec2(0.0, 2.0);',
                  //bend spring (adjacent neighbors 1 node away)                  //(TODO: far neighbor)
      '     if (n<16) { ks =Bnd[0]; kd = Bnd[1]; }', //ksBnd,kdBnd
      '     if (n == 12)	return vec2(15.0, 0.0);',
      '     if (n == 13) return vec2(0.0, -15.0);',
      '     if (n == 14) return vec2(-15.0, 0.0);',
      '     if (n == 15) return vec2(0.0, 15.0);',
      '     return vec2(0.0,0.0);',
      '}',
    ].join('\n');
}
function sphereCollision()
{
    return [
        'bool sphereCollision(inout vec3 x, vec3 center, float r)',
        '{',
        '   r *= 1.01;',
	    '   vec3 delta = x - center;',
        '   float dist = length(delta);',
        '   if (dist < r) {',
        '       x = center + delta*(r / dist);',
        '       return true;',
        '   }',
        '   return false;',
        '} ',
    ].join('\n');
}

/**********************
**      WebGL2       **
**********************/
function simLoop2() {
    return [
        //Main Simulation Loop
      'vec3 F = vec3(0.0);',
      'F.y = -9.8*pos.w;',
      ' vec3 vel = (texPos.xyz-texPrevPos.xyz)/timestep;',
      'F+=DAMPING*vel;',
      addWind(),
      'float ks, kd;',

      'for (int k = 0; k < 12; k++)',
      '{',
      '	vec2 nCoord = getNeighbor(k, ks, kd);',

      '	float inv_cloth_size = 1.0 / (u_clothWidth);//size of a single patch in world space',
      '	float rest_length = length(nCoord*inv_cloth_size);',

      '	float nxid = xid + nCoord.x;',
      '	float nyid = yid + nCoord.y;',
      '	if (nxid < 0.0 || nxid>(u_clothWidth-1.0) || nyid<0.0 || nyid>(u_clothWidth-1.0)) continue;',
      '	nCoord = vec2(nyid,u_clothWidth-1.0-nxid) / u_clothWidth;',
      '	vec3 posNP = texture2D(u_texPos, nCoord).xyz;',
      '	vec3 prevNP = texture2D(u_texPrevPos, nCoord).xyz;',

      '	vec3 v2 = (posNP - prevNP) / timestep;',
      '	vec3 deltaP = pos.xyz - posNP;',
      '	vec3 deltaV = vel - v2;',
      '	float dist = length(deltaP);',
      '	float   leftTerm = -ks * (dist - rest_length);',
      '	float  rightTerm = kd * (dot(deltaV, deltaP) / dist);',
      '	vec3 springForce = (leftTerm + rightTerm)* normalize(deltaP);',
      '	F += springForce;',
      '};',

      'vec3 acc = F/pos.w;', // acc = F/m
      'vel = vel+ acc*timestep;',//v = v0+a*t
    ].join('\n');
}
function simulationCommon() {
    //UBO:
    //http://www.opentk.com/node/2926
    return [
        //'layout(std140) uniform u_tryUBO{',
        //'   vec4 uboTry1;',
        //'   vec4 uboTry2;',
        //'};',
        'uniform float u_timer;',
        'uniform float u_clothWidth;',
        'uniform float u_clothHeight;',
        'uniform vec4 u_newPinPos;',
        //'uniform float mass;',
        commonUniforms(),

        'uniform sampler2D u_texPos;',
        'uniform sampler2D u_texPrevPos;',
        'float DAMPING = -0.0125;',

        sphereCollision(),
        getNeighbor(),

      'vec4 runSimulation(vec4 pos,float v_id) {',

      'float xid = float( int(v_id)/int(u_clothWidth));',
      'float yid = v_id - u_clothWidth*xid;',
      'bool pinBoolean = (pos.w<=0.0);',//Pin1
      'if(!pinBoolean) {',
      ' pinBoolean = (xid<=1.0)&&(yid<=1.0)&&(u_pins.x>0.0);',
      ' if(u_newPinPos.w==1.0&&pinBoolean) pos.xyz = u_newPinPos.xyz;',
      '}',
      'if(!pinBoolean) pinBoolean = (xid>=u_clothWidth-2.0)&&(yid<=1.0)&&(u_pins.y>0.0);',//Pin2
      'if(!pinBoolean) pinBoolean = (xid<=1.0)&&(yid>=u_clothWidth-2.0)&&(u_pins.z>0.0);',//Pin3
      'if(!pinBoolean) pinBoolean = (xid>=u_clothWidth-2.0)&&(yid>=u_clothWidth-2.0)&&(u_pins.w>0.0);',//Pin4
      'if(pinBoolean) return pos;',
      'vec2 coord;',
      'coord = vec2(yid,u_clothWidth-1.0-xid)*(1.0/u_clothWidth);',
      'float timestep = u_timer;',
      ' vec4 texPos = texture2D(u_texPos,coord);',
      ' vec4 texPrevPos = texture2D(u_texPrevPos,coord);',

      simLoop2(),

      'if(pinBoolean); else pos.xyz += vel*timestep;',
      'if(u_rigid ==  0) sphereCollision(pos.xyz,vec3(0.5,0.45,0.4),0.3);',
    '  return pos;',
      '}',
    ].join('\n');
}
GPGPU2.SimulationShader2 = function (renderer,c_w,c_h) {
  var gl = renderer.context;

  var attributes = {
      a_position: 0,
      a_trytry: 1,
  };
  var pos_fbo;
  var pos_tex;

  function createProgram () {

      //WebGL doesn't support gl_VertexID
      //http://max-limper.de/tech/batchedrendering.html
      //TODO:uniform block
      //https://www.opengl.org/wiki/Interface_Block_(GLSL)
    var vertexShader = gl.createShader( gl.VERTEX_SHADER );
    var fragmentShader = gl.createShader( gl.FRAGMENT_SHADER );

    gl.shaderSource(vertexShader, [
       //'#version 300 es',
        'precision ' + renderer.getPrecision() + ' float;',
        'attribute vec4 a_position;',
        'attribute vec4 a_trytry;',
        'varying vec4 v_prevpos;',
        simulationCommon(),
        'void main() {',
        '  vec4 pos = a_position;',
        '  v_prevpos = pos;',
        ' pos = runSimulation(pos,a_trytry.x);',
        '  gl_Position =vec4(pos.xyz,pos.w);',
      '}'
    ].join('\n'));

    gl.shaderSource(fragmentShader, [
      //'#version 300 es',
      'precision ' + renderer.getPrecision() + ' float;',
      'varying vec4 v_prevpos;',
      'void main() {',
        'gl_FragColor = vec4(v_prevpos.xyz, 1.0);',
        //'gl_Color = vec4(1.0, 1.0, 1.0, 1.0);',
      '}',
    ].join('\n'));

    gl.compileShader( vertexShader );
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error("Shader failed to compile", gl.getShaderInfoLog( vertexShader ));
      return null;
    }

    gl.compileShader( fragmentShader );
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error("Shader failed to compile", gl.getShaderInfoLog( fragmentShader ));
      return null;
    }

    var program = gl.createProgram();

    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );

    gl.deleteShader( vertexShader );
    gl.deleteShader( fragmentShader );

    for (var i in attributes) {
      gl.bindAttribLocation( program, attributes[i], i );
    }
    var maxSepTrans = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS);

    gl.transformFeedbackVaryings(program, ["gl_Position"], gl.SEPARATE_ATTRIBS);

    gl.linkProgram( program );

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader program failed to link", gl.getProgramInfoLog( program ));
      gl.deleteProgram(program);
      return null;
    }

    pos_fbo = gl.createFramebuffer();
    pos_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, pos_tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 50, 50, 0, gl.RGBA, gl.FLOAT, null);//!!!TODO: clothsize
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pos_fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pos_tex, 0);


    return program;
  };

  var program = createProgram();

  if (!program) {
    return null;
  }

  var uniforms = {};
  var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < count; i++) {
      uniform = gl.getActiveUniform(program, i);
      name = uniform.name.replace("[0]", "");
      uniforms[name] = gl.getUniformLocation(program, name);
  }

  var timerValue = 0;
  var cWidth = c_w;
  var cHeight = c_h;


  return {
    program: program,

    attributes: attributes,

    bind: function (tempData, prevData, cfg, usrCtrl) {
        //TODO: VBO -> Texture
        //http://stackoverflow.com/questions/17262574/packing-vertex-data-into-a-webgl-texture
        //TODO: don't need to re-create texture every frame.....put those into init
        gl.useProgram(program);

        var tempTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tempTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cWidth, cHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(tempData));
        gl.bindTexture(gl.TEXTURE_2D, null);

        var tempPrevTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tempPrevTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cWidth, cHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(prevData));
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tempTexture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tempPrevTexture);

        gl.uniform1i(uniforms.u_texPos, 0);
        gl.uniform1i(uniforms.u_texPrevPos, 1);

        gl.uniform1i(uniforms.u_rigid, cfg.getRigid());
        gl.uniform1f(uniforms.u_timer, cfg.getTimeStep());
        gl.uniform1f(uniforms.u_clothWidth, cWidth);
        gl.uniform1f(uniforms.u_clothHeight, cHeight);
        gl.uniform1f(uniforms.u_wind, cfg.getWindForce());

        //gl.uniform1f(uniforms.mass, 0.1);
        
        gl.uniform2f(uniforms.Str, cfg.getKsString(), -cfg.getKdString());
        gl.uniform2f(uniforms.Shr, cfg.getKsShear(), -cfg.getKdShear());
        gl.uniform2f(uniforms.Bnd, cfg.getKsBend(), -cfg.getKdBend());
        
        gl.uniform1i(uniforms.u_pinEdges, cfg.getEdge());
        gl.uniform4f(uniforms.u_pins, cfg.getPin1(), cfg.getPin2(), cfg.getPin3(), cfg.getPin4());//TODO: one int would be enough..change later 0000~1111
        gl.uniform4f(uniforms.u_newPinPos, usrCtrl.uniformPins[0], usrCtrl.uniformPins[1], usrCtrl.uniformPins[2], usrCtrl.uniformPins[3]);
    },

    renderPosition: function () {

    },

    setTimer: function ( timer ) {
      timerValue = timer;
    },


  }

};

/**********************
**      WebGL1       **
**********************/

function isPin() {
    return [
        'int pinEdge = u_pinEdges;',
        'if((pinEdge-8)>=0){pinEdge-=8; pinBoolean = (vUv.x<0.1);}',//Edge Up

        'if(!pinBoolean)',
        '   if((pinEdge-4)>=0){',
        '       pinEdge-=4;',
        '       pinBoolean = (vUv.y<0.1);',
        '   }',//Edge Right

        'if(!pinBoolean)',
        '   if((pinEdge-2)>=0){',
        '       pinEdge-=2;',
        '       pinBoolean = (vUv.x>(1.0-0.1));',
        '   }',//Edge Bottom

        'if(!pinBoolean)',
        '   if((pinEdge)>0){',
        '       pinBoolean = (vUv.y >(1.0-0.1));',
        '   }',//Edge Left


        'if(!pinBoolean) pinBoolean = ((vUv.y>(1.0-0.1)) && vUv.x<0.1) &&(u_pins.x>0.0);',//Pin1
        'if(!pinBoolean) pinBoolean = (vUv.y <0.1&& vUv.x<0.1 && u_pins.y>0.0);',//Pin2
        'if(!pinBoolean) pinBoolean = (vUv.y >(1.0-0.1) && vUv.x>(1.0-0.1) && u_pins.z>0.0);',//Pin3
        'if(!pinBoolean) pinBoolean = (vUv.y <(2.0/cloth_w) && vUv.x>(1.0-2.0/cloth_w) && u_pins.w>0.0);',//Pin4

    ].join('\n');
}

function boarderCondition() {
    return ['newCoord.x<=0.0 || newCoord.x>=1.0 || newCoord.y<=0.0 || newCoord.y>=1.0'].join('');
}

GPGPU.SimulationShader = function () {

   // if (!maxColliders) maxColliders = 8;
    var initVelMat = new THREE.ShaderMaterial({

        vertexShader: [

          'void main() {',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          '}',
        ].join('\n'),

        fragmentShader: [

          'void main() {',
          '  gl_FragColor = vec4(0.0,0.0,0.0,1.0);',
          '}',
        ].join('\n'),
    });

    var updateVelMat = new THREE.ShaderMaterial({

        uniforms: {        
            u_rigid: { type: "i", value: -1 },
            cloth_w: { type: "f", value: 50.0 },
            tVelocity: { type: "t", value: texture },
            tPositions: { type: "t", value: texture },
            timestep: { type: "f", value: 0.003 },
            u_wind: { type: "f", value: 0.0 },
            Str: { type: "v2", value: new THREE.Vector2(850.0, -0.25) },
            Shr: { type: "v2", value: new THREE.Vector2(850.0, -0.25) },
            Bnd: { type: "v2", value: new THREE.Vector2(2550.0, -0.25) },
            u_pins: { type: "v4", value: new THREE.Vector4(1.0, 1.0, 0.0, 0.0) },
            u_pinEdges: { type: "i", value: 0 },
        },

        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv.xy;',
            '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
            '}',
        ].join('\n'),

        fragmentShader: [
            'varying vec2 vUv;',
            'uniform float cloth_w;',
            'uniform sampler2D tVelocity;',  
            'uniform sampler2D tPositions;',
            'uniform float timestep;',
            commonUniforms(),
            'float DAMPING = -0.0125;',
            getNeighbor(),
            sphereCollision(),
            'void main() {',
            '  vec4 pos = texture2D( tPositions, vUv );',
            '   vec3 F = vec3(0.0,-9.8*0.1,0.0);',//TODO:mass
            addWind(),
            '   vec4 vel =  texture2D( tVelocity, vUv );',
            'F+=DAMPING*vel.xyz;',

/****************
**  SIMULATION **
*****************/

      'for (int k = 0; k < 12; k++)',
      '{',
      ' vec3 tempVel = vel.xyz;',
      ' float ks, kd;',
      '	vec2 nCoord = getNeighbor(k, ks, kd);',

      '	float inv_cloth_size = 1.0 / cloth_w;',
      '	float rest_length = length(nCoord*inv_cloth_size);',

      '	nCoord *=(1.0/cloth_w);',
      ' vec2 newCoord = vUv+nCoord;',
      ' if( '+ boarderCondition() +') continue;',

      '	vec3 posNP = texture2D( tPositions, newCoord).xyz;',
      '	vec3 v2 = texture2D( tVelocity, newCoord ).xyz;',
      '	vec3 deltaP = pos.xyz - posNP;',

      'tempVel += deltaP;',

      '	vec3 deltaV = tempVel - v2;',
      '	float dist = length(deltaP);',
      '	float   leftTerm = -ks * (dist - rest_length);',
      '	float  rightTerm = kd * (dot(deltaV, deltaP) / dist);',
      '	vec3 springForce = (leftTerm + rightTerm)* normalize(deltaP);',
      '	F += springForce;',
      '};',
/****************
*****************/
            '   vec3 acc = F/0.1;',//TODO:mass
            'bool sphereCol = false;',
            'if(u_rigid==0) sphereCol = sphereCollision(pos.xyz,vec3(0.5,0.45,0.4),0.28);',
            'bool pinBoolean = false;',
            isPin(),
            'if(pinBoolean) vel.xyz = vec3(0.0);else  vel.xyz += acc*timestep;',
            //'if(sphereCol) vel.xyz*=0.95;',//TODO: direction
            '   gl_FragColor = vec4(vel.xyz,1.0);',
            '}',
        ].join('\n'),
    });

    var material = new THREE.ShaderMaterial({
        uniforms: {
            u_rigid: { type: "i", value: -1 },
            cloth_w: { type: "f", value: 50.0 },
            tVelocity: { type: "t", value: texture },
            tPositions: { type: "t", value: texture },
            origin: { type: "t", value: texture },
            timer: { type: "f", value: 0.003 },
            isStart: { type: "i", value: 1 },
            u_pins: { type: "v4", value: new THREE.Vector4(1.0, 1.0, 0.0, 0.0) },
            u_newPinPos: { type: "v4", value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
            u_pinEdges: { type: "i", value: 0 },
        },

        vertexShader: [
          'varying vec2 vUv;',

          'void main() {',
          '  vUv = uv.xy;',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          '}',
        ].join('\n'),

        fragmentShader: [
          'varying vec2 vUv;',

          'uniform float cloth_w;',
          'uniform int u_rigid;',
          'uniform sampler2D tVelocity;',
          'uniform sampler2D tPositions;',

          'uniform sampler2D origin;',
          'uniform float timer;',
          'uniform int isStart;',

          'uniform vec4 u_pins;',
          'uniform vec4 u_newPinPos;',
          'uniform int u_pinEdges;',
          sphereCollision(),
          //getNeighbor(),
          'void main() {',
          '  vec4 pos = texture2D( tPositions, vUv );',
          '  vec4 vel = texture2D( tVelocity, vUv );',
          //*
          'if(isStart==1) {',
          '     pos = vec4(texture2D( origin, vUv ).xyz, 0.1);',
          '}',
          'else{',
           '    bool pinBoolean = false;',
           isPin(),
           '    if( pinBoolean) ; else pos.xyz+=vel.xyz*timer;',
           '    if(u_rigid==0) sphereCollision(pos.xyz,vec3(0.5,0.45,0.4),0.3);',
          '}',

          '  gl_FragColor = pos;',
          '}',
        ].join('\n'),
    });
    var ss = 1;
    return {

        initVelMat: initVelMat,

        updateVelMat: updateVelMat,

        material: material,

        setCfgSettings: function (cfg) {
            material.uniforms.u_rigid.value = cfg.getRigid();
            material.uniforms.u_pins.value = new THREE.Vector4(cfg.getPin1(), cfg.getPin2(), cfg.getPin3(), cfg.getPin4());//TODO: same as above
            material.uniforms.u_pinEdges.value = cfg.getEdge();
            updateVelMat.uniforms.u_rigid.value = cfg.getRigid();
            updateVelMat.uniforms.timestep.value = cfg.getTimeStep();
            updateVelMat.uniforms.Str.value = new THREE.Vector2(cfg.getKsString(), -cfg.getKdString());
            updateVelMat.uniforms.Shr.value = new THREE.Vector2(cfg.getKsShear(), -cfg.getKdShear());
            updateVelMat.uniforms.Bnd.value = new THREE.Vector2(cfg.getKsBend(), -cfg.getKdBend());
            updateVelMat.uniforms.u_wind.value = cfg.getWindForce();
            updateVelMat.uniforms.u_pins.value = new THREE.Vector4(cfg.getPin1(), cfg.getPin2(), cfg.getPin3(), cfg.getPin4());//TODO: same as above
            updateVelMat.uniforms.u_pinEdges.value = cfg.getEdge();

        },

        setPositionsTexture: function (positions) {           
            material.uniforms.tPositions.value = positions;
            updateVelMat.uniforms.tPositions.value = positions;
            return this;
        },

        setVelocityTexture: function (velocities) {
            material.uniforms.tVelocity.value = velocities;
            return this;
        },

        setOriginsTexture: function (origins) {

            material.uniforms.origin.value = origins;
            return this;
        },

        setTimer: function (timer) {

            material.uniforms.timer.value = timer;

            return this;

        },

        setClothDim: function (clothDim) {

            updateVelMat.uniforms.cloth_w.value = clothDim;
            material.uniforms.cloth_w.value = clothDim;

            return this;

        },

        setStart: function (isStart) {

            material.uniforms.isStart.value = isStart;

            return this;

        },

        setPrevVelocityTexture: function (velocities) {
            updateVelMat.uniforms.tVelocity.value = velocities;
            return this;
        },


    }

};
