window.game = {
	key: {},
	config: {
		grid: {
			width: 32,
			height: 32,
			canvasWidth: 640,
			canvasHeight: 480,
			numWide: 32,
			numHigh: 24
		},
		allowedKeys: [
			65, // left
			68, // right
			87, // up
			83 // down
		],
		el: {
			canvas: "game-canvas"
		}
	},
	init: function () {
		game.cacheImages();
		game.loadLevel("example2", 3, 6);
	},
	loadLevel: function (level, x, y) {
		game.level = level;
		game.stopMainLoop();
		game.setGrid();
		game.resetPlayer(x, y);
		game.resetCamera();
		game.cacheLevel(level);
		game.setBindings();
		game.initCanvas();
		game.getSizes();
		game.startMainLoop();
		game.moveCamera();
	},
	resetPlayer: function (x, y) {
		game.config.player = {
			x: 0,
			y: 32,
			targetX: 0,
			targetY: 32,
			width: 32,
			height: 64,
			baseHeight: 8,
			speed: 4,
			path: [],
			xp: 0,
			facing: "stand",
			walking: false,
			canMove: true,
			velocity: {
				x: 0,
				y: 0
			}
		};
		if (x === 0 || x) {
			game.config.player.x = x * game.config.grid.width;
			game.config.player.y = y * game.config.grid.height;
		}
	},
	resetCamera: function () {
		game.config.camera = {
			x: 0,
			y: 0,
			currentOffsetX: 0,
			currentOffsetY: 0
		};
	},
	setBindings: function () {
		$('body').on('keydown', function (e) {
			if (game.config.player && game.config.player.canMove) {
				if (game.config.allowedKeys.indexOf(e.which) !== -1) {
					game.key[e.which] = true;
				}
			}
		});
		$('body').on('keyup', function (e) {
			if (game.config.allowedKeys.indexOf(e.which) !== -1) {
				delete game.key[e.which];
				game.logged = false;
			}
		});
	},
	setGrid: function () {
		var $gameCanvas = $('#game-canvas');
		game.config.grid = {
			width: gameLevels[game.level].tileheight,
			height: gameLevels[game.level].tilewidth,
			canvasWidth: $gameCanvas.width(),
			canvasHeight: $gameCanvas.height(),
			numWide: gameLevels[game.level].width,
			numHigh: gameLevels[game.level].height
		};
	},
	getSizes: function () {
		var canvas = $('#game-canvas');
		game.config.camera.screenMiddleX = canvas.width() / 2;
		game.config.camera.screenMiddleY = (canvas.height() / 2) - (game.config.grid.width / 2);
		game.config.camera.obj = $('.levelCanvas');
	},
	initCanvas: function () {
		game.canvas = document.getElementById(game.config.el.canvas);
		game.ctx = game.canvas.getContext("2d");
		game.ctx.imageSmoothingEnabled = false;
		game.ctx.mozImageSmoothingEnabled = false;
		game.ctx.operaImageSmoothingEnabled = false;
		game.ctx.webkitImageSmoothingEnabled = false;
	},
	startMainLoop: function () {
		var last = new Date();
		function gameLoop() {
			var now = new Date(),
			elapsedSeconds = (now - last) / 1000;
			last = now;
			game.checkForMovement(elapsedSeconds);
			game.doMainDraw();
		}
		game.loopStarted = true;
		game.loop = window.setInterval(gameLoop, 1000 / 60);
	},
	stopMainLoop: function () {
		if (game.loop) {
			window.clearInterval(game.loop);
		}
		game.loopStarted = false;
	},
	cacheImages: function () {
		game.images = {};
		$('.game-image').each(function () {
			var $this = $(this);
			game.images[$this.prop('id')] = $this.get(0);
		});
	},
	cacheLevel: function () {
		var canvas = document.createElement("canvas"),
			ctx = canvas.getContext("2d"),
			width = game.config.grid.numWide * game.config.grid.width,
			height = game.config.grid.numHigh * game.config.grid.height,
			pxWidth = game.config.grid.width,
			pxHeight = game.config.grid.height,
			layer,
			tile,
			coords,
			tilesetWidth = gameLevels[game.level].tilesets[0].imagewidth / game.config.grid.width,
			img = game.images['tiles1'],
			topCanvas = document.createElement("canvas"),
			topCtx = topCanvas.getContext("2d");
		canvas.width = width;
		canvas.height = height;
		canvas.id = "levelCanvas";
		canvas.className = "levelCanvas";
		topCanvas.width = width;
		topCanvas.height = height;
		topCanvas.id = "levelTopCanvas";
		topCanvas.className = "levelCanvas";
		for (l = 0; l < gameLevels[game.level].layers.length; l += 1) {
			layer = gameLevels[game.level].layers[l];
			for (i = 0; i < layer.data.length; i += 1) {
				tile = layer.data[i] - 1;
				if (tile >= 0) {
					tileCoords = game.utility.get2dCoord(tile, tilesetWidth);
					coords = game.utility.get2dCoord(i);
					if (layer.name !== "top") {
						ctx.drawImage(img, tileCoords.x * pxWidth, tileCoords.y * pxHeight, pxWidth, pxHeight, coords.x * pxWidth, coords.y * pxHeight, pxWidth, pxHeight);
					} else {
						topCtx.drawImage(img, tileCoords.x * pxWidth, tileCoords.y * pxHeight, pxWidth, pxHeight, coords.x * pxWidth, coords.y * pxHeight, pxWidth, pxHeight);
					}
				}
			}
		}
		game.levelImageCanvas = canvas;
		$('#game-area').find('.levelCanvas').remove();
		$('#game-area').prepend(game.levelImageCanvas).append(topCanvas);
	},
	doMainDraw: function () {
		game.ctx.clearRect(0, 0, game.config.grid.canvasWidth, game.config.grid.canvasHeight);
		game.draw.player();
	},
	draw: {
		player: function () {
			game.ctx.fillStyle = "black";
			game.ctx.fillRect(game.config.player.x + game.config.camera.x, game.config.player.y + game.config.camera.y - (game.config.player.height / 2), game.config.player.width, game.config.player.height);
		}
	},
	checkForMovement: function () {
		if ("65" in game.key) {
			// 65 left
			game.config.player.velocity.x = -game.config.player.speed;
		}
		if ("68" in game.key) {
			// 68 right
			game.config.player.velocity.x = game.config.player.speed;
		}
		if ("87" in game.key) {
			// 87 up
			game.config.player.velocity.y = -game.config.player.speed;
		}
		if ("83" in game.key) {
			// 83 down
			game.config.player.velocity.y = game.config.player.speed;
		}
		game.checkCollision();
	},
	checkCollision: function () {
		var changeX = game.config.player.velocity.x,
			changeY = game.config.player.velocity.y,
			potentialLocX =  game.config.player.x + changeX,
			potentialLocY = game.config.player.y + changeY,
			currentLeft = Math.floor(game.config.player.x / game.config.grid.width),
			currentRight = Math.floor((game.config.player.x + game.config.player.width) / game.config.grid.width),
			currentBottom = Math.floor((game.config.player.y + (game.config.player.height / 2)) / game.config.grid.height),
			left = Math.floor(potentialLocX / game.config.grid.width),
			right = Math.floor((potentialLocX + game.config.player.width) / game.config.grid.width),
			bottom = Math.floor((potentialLocY + (game.config.player.height / 2)) / game.config.grid.height),
			top = Math.floor((potentialLocY + (game.config.player.height / 2) - game.config.player.baseHeight) / game.config.grid.height);
		if (game.config.player.velocity.x > 0 && game.isUnwalkable(right, currentBottom)) {
			changeX = (right * game.config.grid.width) - 0.00000001 - (game.config.player.x + game.config.player.width);
		}
		if (game.config.player.velocity.x < 0 && game.isUnwalkable(left, currentBottom)) {
			changeX = (((left * game.config.grid.width) + game.config.grid.width) - game.config.player.x);
		}
		if (game.config.player.velocity.y > 0 && (game.isUnwalkable(currentLeft, bottom) || game.isUnwalkable(currentRight, bottom))) {
			changeY = ((bottom * game.config.grid.height) - 0.00000001) - (game.config.player.y + (game.config.player.height / 2));
		}
		if (game.config.player.velocity.y < 0 && (game.isUnwalkable(currentLeft, top) || game.isUnwalkable(currentRight, top))) {
			changeY = ((top * game.config.grid.height) - 0.00000001) - (game.config.player.y - game.config.player.baseHeight);
		}
		game.config.player.velocity.x = 0;
		game.config.player.velocity.y = 0;
		game.config.player.x += changeX;
		game.config.player.y += changeY;
		game.moveCamera();
	},
	isUnwalkable: function (x, y) {
		var tile = game.utility.get1dCoord(x, y, game.config.grid.numWide);
		tile = gameLevels[game.level].layers[0].data[tile];
		return tile - 1 in gameLevels[game.level].tilesets[0].tileproperties;
	},
	moveCamera: function () {
		var mapWidth = game.config.grid.numWide * game.config.grid.width,
			mapHeight = game.config.grid.numHigh * game.config.grid.height;
		if (game.config.player.x > game.config.camera.screenMiddleX) {
			game.config.camera.x = Math.floor(game.config.camera.screenMiddleX - game.config.player.x);
		}
		if (game.config.player.x > mapWidth - game.config.camera.screenMiddleX) {
			game.config.camera.x = -(mapWidth - (game.config.camera.screenMiddleX * 2));
		}
		if (game.config.player.y > game.config.camera.screenMiddleY) {
			game.config.camera.y = Math.floor(game.config.camera.screenMiddleY - game.config.player.y);
		}
		if (game.config.player.y > mapHeight - game.config.camera.screenMiddleY - game.config.grid.height) {
			game.config.camera.y = -(mapHeight - (game.config.camera.screenMiddleY * 2) - 32);
		}
		if (game.config.camera.x !== game.config.camera.currentOffsetX) {
			game.config.camera.obj.css("left", game.config.camera.x);
			game.config.camera.currentOffsetX = game.config.camera.x;
		}
		if (game.config.camera.y !== game.config.camera.currentOffsetY) {
			game.config.camera.obj.css("top", game.config.camera.y);
			game.config.camera.currentOffsetY = game.config.camera.y;
		}
	},
	utility: {
		get2dCoord: function (index, size) {
			var width = size || game.config.grid.numWide;
			return {
				x: index % width,
				y: Math.floor(index / width)
			};
		},
		get1dCoord: function (x, y, size) {
			var width = size || game.config.grid.numWide;
			return (y * width) + x;
		},
		randomiseArray: function (array) {
			var i = array.length, j, temp;
			if ( i === 0 ) return false;
			while ( --i ) {
				j = Math.floor( Math.random() * ( i + 1 ) );
				temp = array[i];
				array[i] = array[j];
				array[j] = temp;
			}
		},
		getRandomArrayItem: function (array, keyOnly) {
			var key = Math.floor(Math.random() * array.length),
				arrayItem = array[key];
			if (!keyOnly) {
				return arrayItem;
			}
			return key;
		}
	}
};
$(window).load(function() {
	game.init();
});