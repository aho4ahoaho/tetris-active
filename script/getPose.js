const videoElement = document.createElement("video");
async function startCamera() {
	const cameraStream = await navigator.mediaDevices.getUserMedia({
		video: {
			width: { min: 320, ideal: 480, max: 1920 },
			height: { min: 240, ideal: 320, max: 1080 },
		},
		audio: false,
	});
	videoElement.autoplay = true;
	videoElement.srcObject = cameraStream;
	/*document.body.append(videoElement);
	videoElement.addEventListener("resize", () => {
		videoElement.width = videoElement.videoWidth;
		videoElement.height = videoElement.videoHeight;
	});*/
	await sleep(500);
	(async () => {
		while (true) {
			getPose();
			await sleep(200 - record_line * 3);
		}
	})();
}
let now_tetrimino = [];
let now_key = "blank";
function onResults(results) {
	if (!results.poseLandmarks) {
		return;
	}

	//ctx.drawImage(results.segmentationMask,0,0,canvas.width,canvas.height)
	let boneGrid = getBoneGrid(results.poseWorldLandmarks);
	formingGrid = grid_filter(boneGrid);
	[now_tetrimino, now_key] = getTetrimino(formingGrid);
	switch (gamemode) {
		case "spawn":
			bonedraw();
			break;
		case "drop":
			if (boneGrid[0][1] && boneGrid[0][3]);
			else if (boneGrid[0][1]) block_shift(0, -1);
			else if (boneGrid[0][3]) block_shift(0, 1);
			break;
	}
}

const pose = new Pose({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
	},
});
pose.setOptions({
	modelComplexity: 1,
	smoothLandmarks: true,
	enableSegmentation: true,
	smoothSegmentation: true,
	minDetectionConfidence: 0.5,
	minTrackingConfidence: 0.5,
});
pose.onResults(onResults);

const getPose = async (event) => {
	pose.send({ image: videoElement });
};

const getBoneGrid = (pose) => {
	const half_point = (points) => {
		let x = 0;
		let y = 0;
		for (p of points) {
			x += p["x"];
			y += p["y"];
		}
		x /= -points.length;
		y /= points.length;
		return [x, y];
	};
	const flag_grid = (position, xscale = 1, yscale = 1) => {
		let x = Math.floor(position[0] * 2.5 * xscale + 2.5);
		let y = Math.floor(position[1] * 2.5 * yscale + 2.5);
		if (x < 0) x = 0;
		else if (x > 4) x = 4;
		if (y < 0) y = 0;
		else if (y > 4) y = 4;
		grid[y][x] = 1;
	};

	let grid = new Array(5);
	for (let i = 0; i < 5; i++) {
		grid[i] = new Array(5).fill(0);
	}
	data = {
		nose: [-pose["0"]["x"], pose["0"]["y"]],
		leftWrist: [-pose["15"]["x"], pose["15"]["y"]],
		rightWrist: [-pose["16"]["x"], pose["16"]["y"]],
		neck: half_point([pose["11"], pose["12"]]),
		leftAnkle: [-pose["27"]["x"], pose["27"]["y"]],
		rightAnkle: [-pose["28"]["x"], pose["28"]["y"]],
	};

	grid[2][2] = 1; //腰
	flag_grid(data["leftWrist"]);
	flag_grid(data["rightWrist"]);
	flag_grid(data["leftAnkle"], 1, 0.7);
	flag_grid(data["rightAnkle"], 1, 0.7);
	flag_grid(data["neck"]);
	flag_grid(half_point([pose["27"], pose["28"], { x: 0, y: 0 }]), 0.7);

	return grid;
};

const bonedraw = () => {
	const canvas = document.getElementById("gameView");
	const ctx = canvas.getContext("2d");
	const matrix_size = now_tetrimino.length;
	const horizontalCenter = window_width / 2;
	const verticalCenter = window_height / 3;
	const rectSize = (window_width * 0.7) / matrix_size;

	const origin_x = horizontalCenter + rectSize * -(matrix_size / 2);
	const origin_y = verticalCenter + rectSize * -(matrix_size / 2);
	const popup_size = rectSize * matrix_size;
	ctx.fillStyle = "white";
	ctx.fillRect(
		origin_x,
		origin_y,
		rectSize * matrix_size,
		rectSize * matrix_size,
	);

	ctx.fillStyle = "red";
	for (let i = 0; i < matrix_size; i++) {
		for (let j = 0; j < matrix_size; j++) {
			if (now_tetrimino[i][j]) {
				let x = horizontalCenter + rectSize * (j - matrix_size / 2);
				let y = verticalCenter + rectSize * (i - matrix_size / 2);
				ctx.fillRect(x, y, rectSize, rectSize);
			}
		}
	}

	ctx.lineWidth = 3;
	ctx.strokeStyle = "black";
	const draw = (start, end) => {
		ctx.moveTo(
			horizontalCenter + (start[0] * popup_size) / 2,
			verticalCenter + (start[1] * popup_size) / 2,
		);
		ctx.lineTo(
			horizontalCenter + (end[0] * popup_size) / 2,
			verticalCenter + (end[1] * popup_size) / 2,
		);
	};
	draw([0, 0], data["leftAnkle"]);
	draw([0, 0], data["rightAnkle"]);
	draw([0, 0], data["neck"]);
	draw(data["neck"], data["leftWrist"]);
	draw(data["neck"], data["rightWrist"]);

	ctx.lineWidth = 3;
	for (let i = 0; i <= matrix_size; i++) {
		let offset = (popup_size / matrix_size) * i;
		ctx.moveTo(origin_x, origin_y + offset);
		ctx.lineTo(origin_x + popup_size, origin_y + offset);
		ctx.moveTo(origin_x + offset, origin_y);
		ctx.lineTo(origin_x + offset, origin_y + popup_size);
	}
	ctx.stroke();
	ctx.beginPath();
};

const grid_filter = (old_grid) => {
	let new_grid = new Array(5);
	for (let i = 0; i < 5; i++) {
		new_grid[i] = new Array(5).fill(0);
	}
	const whilelist = [
		[0, 2],
		[1, 1],
		[1, 2],
		[1, 3],
		[2, 0],
		[2, 1],
		[2, 2],
		[2, 3],
		[2, 4],
		[3, 1],
		[3, 2],
		[3, 3],
	];
	for ([y, x] of whilelist) {
		new_grid[y][x] = old_grid[y][x];
	}
	return new_grid;
};

const tetriminos = {
	Z: [
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 1, 1, 0, 0],
		[0, 0, 1, 1, 0],
		[0, 0, 0, 0, 0],
	],
	S: [
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 1, 1, 0],
		[0, 1, 1, 0, 0],
		[0, 0, 0, 0, 0],
	],
	T: [
		[0, 0, 0, 0, 0],
		[0, 1, 1, 1, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
	],
	O: [
		[0, 0, 0, 0, 0],
		[0, 1, 1, 0, 0],
		[0, 1, 1, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
	],
	L: [
		[0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 1, 0],
		[0, 0, 0, 0, 0],
	],
	J: [
		[0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 1, 1, 0, 0],
		[0, 0, 0, 0, 0],
	],
	I: [
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 0, 0],
	],

	blank: [
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
	],
};
const getTetrimino = (boneGrid) => {
	let matchCount = {};
	let max = 0;
	for (k of Object.keys(tetriminos)) {
		matchCount[k] = [0, 0, 0, 0];
		for (let i = 0; i < 4; i++) {
			matchCount[k][i] = matchGrid(rotateMatrix(tetriminos[k], i), boneGrid);
			if (matchCount[k][i] > max) {
				max = matchCount[k][i];
			}
		}
	}
	/*
	console.log(boneGrid.join("\n"));
	console.log(rotateMatrix(boneGrid, 1).join("\n"));
	console.log(rotateMatrix(boneGrid, 2).join("\n"))
	console.log(rotateMatrix(boneGrid, 3).join("\n"))*/

	let [rk, ri] = (() => {
		for (k of Object.keys(matchCount)) {
			for (let i = 0; i < 4; i++) {
				if (matchCount[k][i] == max) {
					return [k, i];
				}
			}
		}
	})();
	return [rotateMatrix(tetriminos[rk], ri), rk];
};

const matchGrid = (first_grid, second_grid) => {
	if (first_grid.length !== second_grid.length) {
		console.log("return", first_grid.length, second_grid.length);
		return;
	}
	const grid_size = first_grid.length - 1;
	let count = 0;
	for (let i = 0; i <= grid_size; i++) {
		for (let j = 0; j <= grid_size; j++) {
			if (first_grid[i][j] && second_grid[i][j]) count++;
		}
	}
	return count;
};

const rotateMatrix = (matrix, rotate) => {
	if (rotate === 0) {
		return matrix;
	}
	const matrix_size = matrix.length;
	let new_grid = new Array(matrix_size);
	for (let i = 0; i < matrix_size; i++) {
		new_grid[i] = new Array(matrix_size).fill(0);
	}

	for (let i = 0; i < matrix_size; i++) {
		for (let j = 0; j < matrix_size; j++) {
			switch (rotate) {
				case 0:
					new_grid[i][j] = matrix[i][j];
					break;
				case 1:
					new_grid[i][j] = matrix[matrix_size - j - 1][i];
					break;
				case 2:
					new_grid[i][j] = matrix[matrix_size - i - 1][matrix_size - j - 1];
					break;
				case 3:
					new_grid[i][j] = matrix[j][matrix_size - i - 1];
					break;
			}
		}
	}
	return new_grid;
};
