var cubes = [];
var loaded = false;

// var boyNames = {};
// var girlNames = {};
// var boysLoaded = false;
// var girlsLoaded = false;

var rotateSpeed = 0.001;

var mouseX;
var mouseY;
var xNormal;
var yNormal;

//var xBound;
//var zBound;
//var height;

jQuery(document).ready(function($) {

	$.ajax({
		dataType: "json",
		url: "data/namesDB.json",
		success: function(data) {
			console.log(data);
			loaded = true;
			//}
			//**** SHOULD JUST PASS D INTO HERE
			threeJSinit(data);
		}
	});

	//console.log("Outside AJAX log: " + xBound);

	//xBound = 10;

});

// var bldgTextures = [
// 	'bldgtexture1.jpg',

// ];

//---BASIC SETUP HERE: -------
//http://threejs.org/docs/index.html#Manual/Introduction/Creating_a_scene

//---SCENE AND CAMERA

//Thanks to mcode for basis of this function - http://stackoverflow.com/questions/23514274/three-js-2d-text-sprite-labels
function makeTextTexture(message, parameters) {
	if (parameters === undefined) parameters = {};
	var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Open Sans";
	var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 42;
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 0;
	var borderColor = parameters.hasOwnProperty("borderColor") ? parameters["borderColor"] : {
		r: 0,
		g: 0,
		b: 0,
		a: 1.0
	};
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters["backgroundColor"] : {
		r: 255,
		g: 255,
		b: 255,
		a: 0.0
	};
	var textColor = parameters.hasOwnProperty("textColor") ? parameters["textColor"] : {
		r: 255,
		g: 255,
		b: 255,
		a: 1.0
	};

	var canvas = document.createElement('canvas');
	//canvas.width=window.innerWidth;
	var context = canvas.getContext('2d');
	context.font = fontsize + "px " + fontface;
	//context.font = "Bold " + fontsize + "px " + fontface;
	var metrics = context.measureText(message);
	var textWidth = metrics.width;


	context.shadowColor = "white";
	context.shadowBlur = 50;

	context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	//roundRect(context, borderThickness / 2, borderThickness / 2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);

	context.fillStyle = "rgba(" + textColor.r + ", " + textColor.g + ", " + textColor.b + ", 1.0)";
	context.fillText(message, textWidth * 0.5, fontsize + borderThickness);

	//context.fillText(message, borderThickness, fontsize + borderThickness);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	return texture;
}

function threeJSinit(d) {

	window.addEventListener('resize', onWindowResize, false);

	var renderStarted;

	console.log("Post-AJAX log: ");
	console.log(d);

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	//var controls = new THREE.OrbitControls( camera );
	//controls.addEventListener( 'change', render );

	//---RENDERER SETTINGS
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);
	//(NOTE THAT THE RENDERER CAN BE ATTACHED TO ANY D.O.M. ELEMENT)

	//var skyColor = new THREE.Color(0.9, 0.9, 1);
	var skyColor = new THREE.Color(0, 0, 0);
	renderer.setClearColor(skyColor, 1);

	var sunColor = new THREE.Color(1, 1, 0.9);


	//-------NAMEPOINTS------------

	//var xBound = 10;
	//var xBound = d.maleNames.length;
	//var xBound = Math.floor(data.maleNames.length * 0.5); //for names
	var zBound = 100; //for years

	var particles = new THREE.Geometry();
	var linePoints = new THREE.Geometry();

	var yearSystem = []; //SHOULD THIS BE SOME SORT OF CONTAINER?
	//var yearParticles = new THREE.Geometry();

	var gridWidth = d.maleNames.length;

	var midPosZ = 50;

	var lines = [];
	var renderedNames = [];

	var endSprite = THREE.ImageUtils.loadTexture(
		"images/endSpriteB.png"
	);

	var lineSprite = THREE.ImageUtils.loadTexture(
		"images/lineSpriteB.png"
	);

	var endPointMaterials = [];

	var yearMaterials = [];

	//for (var x = -xBound; x <= xBound; x++) {
	for (var x = 0; x < gridWidth; x++) {
		//START WITH X, THEN ADD THIS:
		//var height = Math.random() * 3;

		//console.log("x: " + x);

		var endPointParticles = new THREE.Geometry();

		var thisName = d.maleNames[x].name.toUpperCase();
		var nameSprite = makeTextTexture(thisName);

		endPointMaterials[x] = new THREE.PointCloudMaterial({
			size: 2, //was 1
			map: nameSprite,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});

		var hslAdjust = x / gridWidth;

		endPointMaterials[x].color.setRGB(1.0, hslAdjust, 0.0);
		//endPointMaterials[x].color.setHSL(1.0, hslAdjust, 1.0);
		//for (var z = -zBound; z <= zBound; z++) {
		for (var z = 1914; z < 2014; z++) {

			var height;

			//var thisYear = 1914;
			for (var statsIndex in d.maleNames[x].stats) {
				if (d.maleNames[x].stats[statsIndex].year == z) {
					height = d.maleNames[x].stats[statsIndex].count;
					//console.log("Name: " + d.maleNames[x].name + ", Year: " + d.maleNames[x].stats[statsIndex].year + ", Height: " + height);
					break;
				}
			}

			height *= 0.0005;

			//=====UPDATING X AND Z==========
			var gridSpacing = 0.8;
			var fX = (x) * gridSpacing * 1; //var fX = (x - gridWidth * 0.5) * gridSpacing * 1;
			var fZ = (z - 1914) * gridSpacing * 2;
			//var y = height;
			if (height > 0) {
				var particle = new THREE.Vector3(fX, height, fZ); //-d.maleNames.length/2
				//console.log("Particle Height: " + particle.y);
				//var particle = new THREE.Vertex(vert);

				//particles.vertices.push(particle);
				endPointParticles.vertices.push(particle);
			}

			for (var i = 0.5; i < height; i += 0.5) {
				var linePoint = new THREE.Vector3(fX, i, fZ);
				linePoints.vertices.push(linePoint);

			}

			//====SETTING UP YEAR GUIDE GRID====//

			if (x == 0) {
				if (z % 5 == 4) {
					var yearSprite = makeTextTexture(z, {
						'fontsize': 130
					});

					//yearMaterials[(z - 1914)] = new THREE.PointCloudMaterial({
					yearMaterial = new THREE.PointCloudMaterial({

						color: 0xFFFFFF,
						size: 5, //was 2
						map: yearSprite,
						blending: THREE.AdditiveBlending,
						depthTest: false,
						transparent: true
					});

					var yearParticle = new THREE.Vector3(fX, 0, fZ);

					var yearParticles = new THREE.Geometry();

					yearParticles.vertices.push(yearParticle);

					var singleYearPointCloud = new THREE.PointCloud(yearParticles, yearMaterial);
					yearSystem.push(singleYearPointCloud);
				}
			}

		}


		var endSystem = new THREE.PointCloud(endPointParticles, endPointMaterials[x]);
		scene.add(endSystem);
	}


	var material = new THREE.PointCloudMaterial({
		color: 0xFF0000,
		size: 1
	});

	var pMaterial = new THREE.PointCloudMaterial({
		color: 0xFFC960,
		size: 2,
		map: endSprite,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	});

	var pLineMaterial = new THREE.PointCloudMaterial({
		color: 0xFFFFFF,
		size: 1,
		map: lineSprite,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	});

	//var particleSystem = new THREE.PointCloud(particles, pMaterial);
	//scene.add(particleSystem);

	var lineSystem = new THREE.PointCloud(linePoints, pLineMaterial);

	scene.add(lineSystem);

	//different because "yearSystem is an array, not pointcloud"
	for (var i = 0; i < yearSystem.length; i++) {
		scene.add(yearSystem[i]);
	}
	// for (var i = 0; i < renderedNames.length; i++) {
	// 	scene.add(renderedNames[i]);
	// }



	//-------LIGHTS------------

	//POINT LIGHT

	var light = new THREE.PointLight(0xffffff, 1, 300);
	light.position.set(-5, 5, -5);
	//scene.add(light);

	//SPOT LIGHT - START NON-ROTATING

	var sunLight = new THREE.PointLight(sunColor, 3, 500);
	sunLight.position.set(-10, 6, 7);


	scene.add(sunLight);

	//USING VECTORS HERE... START WITH POSITION X, POSITION Y?
	camera.up = new THREE.Vector3(0, 1, 0);

	//camera.rotation.order = 'YXZ';

	//camera.position.set(-7, 3, 7);
	camera.position.set(0, 20, 0);
	camera.rotation.set(0, 0, 0);
	camera.lookAt(new THREE.Vector3(0, 20, midPosZ));

	//TO INCREMENT THINGS...
	var frameCount = 0;

	//THINK OF THIS AS YOUR UPDATE & DRAW FUNCTION
	//it runs 60 times per second
	var render = function() {
		renderStarted = true;
		//controls.update();

		//REMEMBER THAT THIS IS X,Z, NOT Z,Y
		var camRotateX = Math.sin(frameCount * rotateSpeed) * -70;
		var camRotateZ = Math.cos(frameCount * rotateSpeed) * 70;
		//old rotateSpeed was 0.001

		//var camRotateX = Math.PI*0.5;
		//var camRotateZ = Math.PI*0.5;

		//VECTOR POSITION SETTING:
		//camera.position.set(camRotateX, 30, camRotateZ + 50);
		//camera.position.set(0, 20, 0);
		//camera.lookAt( scene.position );
		//camera.lookAt(new THREE.Vector3(0, 30, midPosZ));

		//TRANSLATION / ZOOM CONTROLS
		var zoomFactor;
		if (yNormal < 0.3) {
			zoomFactor = mathMap(yNormal, 0, 0.3, -0.75, 0);
		} else if (yNormal > 0.7) {
			zoomFactor = mathMap(yNormal, 0, 0.7, 0, 0.75);
		} else {
			zoomFactor = 0;
		}

		camera.translateZ(zoomFactor);

		//ROTATION CONTROLS
		var degree = 3.14 / 180;
		var rotFactor;
		if (xNormal <= -0.3) {
			rotFactor = mathMap(xNormal, -0.3, -1, 0, degree * 1.5);
			rotFactor = -1 * rotFactor;
		} else if (xNormal >= 0.3) {
			rotFactor = mathMap(xNormal, 0.3, 1, 0, degree * 1.5);
		} else {
			rotFactor = 0;
		}
		//var rotFactor = xNormal*3.14/180;
		console.log("RotFactor: " + rotFactor);
		camera.rotation.y += rotFactor;
		console.log("Rotation: " + camera.rotation.y);

		console.log("Cam Pos: " + camera.position.x + ", " + camera.position.y + ", " + camera.position.z);

		setYearSystemPosition(camera.position.x, camera.position.y);

		var lightDistance = 15;
		var lightRotateX = Math.sin(frameCount * 0.005) * lightDistance;
		var lightRotateY = Math.cos(frameCount * 0.005) * lightDistance;
		//sunLight.position.set(lightRotateX, Math.abs(lightRotateY), Math.abs(lightRotateY));
		sunLight.position.set(0, 100, 0);
		//console.log(Math.abs(lightRotateY));

		var sunColorG = mathMap(Math.abs(lightRotateY), 0, lightDistance, 0.3, 1);
		var sunColorB = mathMap(Math.abs(lightRotateY), 0, lightDistance, 0.2, 0.8);
		sunColor = new THREE.Color(1, sunColorG, sunColorB);
		sunLight.color = sunColor;



		//---TO CHANGE SKY COLOR
		//var skyColorB = mathMap(Math.abs(lightRotateY), 0, lightDistance, 0.6, 1);
		//var skyColorG = mathMap(Math.abs(lightRotateY), 0, lightDistance, 0.2, 0.8);

		//skyColor = new THREE.Color(0.7, skyColorG, skyColorB);
		//renderer.setClearColor(skyColor, 1);

		//scene.fog = new THREE.FogExp2(skyColor, 0.08);
		var fogColor = new THREE.Color(0, 0, 0);
		scene.fog = new THREE.FogExp2(fogColor, 0.01);

		requestAnimationFrame(render);
		renderer.render(scene, camera);

		frameCount++;

	};

	function setYearSystemPosition(camX, camY) {

		for (var year in yearSystem) {
			yearSystem[year].position.x = camX;
			yearSystem[year].position.y = camY - 5;
		}
	}

	//if (loaded) {
	render();


	//}
	function onWindowResize() {

		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);

	}

	function mathMap(varToMap, varMin, varMax, mapToMin, mapToMax) {
		var mappedValue = mapToMin + (mapToMax - mapToMin) * ((varToMap - varMin) / (varMax - varMin));
		return mappedValue;
	}

	$(window).mousemove(function(e) {
		mouseX = e.pageX;
		mouseY = e.pageY;
		xNormal = mouseX / window.innerWidth;
		//xNormal = mouseX / window.innerWidth;
		xNormal = xNormal * 2 - 1;
		//console.log("Xnormal: " + xNormal);
		yNormal = mouseY / window.innerHeight;
		//console.log("MouseX: " + xNormal);

		rotateSpeed = mathMap(xNormal, 0, 1, 0.0001, 0.005);
		// if (yNormal < 0.5){
		// 	rotateSpeed *=1.1;
		// } else if (yNormal > 0.5){
		// 	camera.position.z += 2;
		// }

	});

	$(document).on('keydown', function(e) {
		if (e.which == 38) {
			console.log("keypressed Up");
			if (camera.position.y < 50) {
				camera.position.y += 0.5;
			}
		} else if (e.which == 40) {
			console.log("keypressed Down");
			if (camera.position.y > 0) {
				camera.position.y -= 0.5;
			}
		} else if (e.which == 37) {
			console.log("keypressed Left");
			camera.translateX(-0.75);
		} else if (e.which == 39) {
			console.log("keypressed right");
			camera.translateX(0.75);
		}
	});
}

//init();