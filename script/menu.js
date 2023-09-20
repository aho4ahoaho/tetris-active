const titleView = () => {
	const canvas = document.getElementById("gameView");
	canvas.width = window_width;
	canvas.height = window_height;
	const ctx = canvas.getContext("2d");

	resetView();

	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.font = `${canvas.width / 8}px sans-serif`;
	ctx.fillText("Tetris Active", canvas.width / 2, (canvas.height / 5) * 2);
	ctx.font = `${canvas.width / 16}px sans-serif`;
	ctx.fillText("Tap to Start", canvas.width / 2, (canvas.height / 3) * 2);
	ctx.moveTo(0, canvas.height - canvas.width / 8);
	ctx.lineTo(canvas.width, canvas.height-canvas.width / 8);
	ctx.stroke();
	ctx.beginPath();
	ctx.fillText("Help", canvas.width / 2, canvas.height-canvas.width/16);
	const gameStart = (event) => {
		if (canvas.height-canvas.width/8 < event.clientY) {
			window.open("help.html")
		} else {
			canvas.removeEventListener("click", gameStart);
			resetView();

			ctx.fillStyle = "black";
			ctx.fillText("Now Loading...", canvas.width / 2, canvas.height / 2);

			gameInitialize();
		}
	};
	canvas.addEventListener("click", gameStart);
};

const sizeReset = () => {
	window_height = Math.floor(window.innerHeight / 2);
	window_width = window.innerWidth;
	if (window_height < window_width) {
		window_width = window_height;
		window_height *= 2;
	} else {
		window_height = window_width * 2;
	}
};

const resetView = () => {
	const canvas = document.getElementById("gameView");
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "black";

	ctx.strokeStyle = "black";
	ctx.lineWidth = 3;
	ctx.moveTo(0, 0);
	ctx.lineTo(canvas.width, 0);
	ctx.lineTo(canvas.width, canvas.height);
	ctx.lineTo(0, canvas.height);
	ctx.lineTo(0, 0);
	ctx.stroke();
	ctx.beginPath();
};

const resultView = () => {
	const canvas = document.getElementById("gameView");
	const ctx = canvas.getContext("2d");
	resetView();
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	const myFontUnit = canvas.width / 16;
	ctx.font = `${myFontUnit * 1.3}px sans-serif`;
	ctx.fillText("Record", canvas.width / 2, canvas.height / 2 - myFontUnit * 2);
	ctx.font = `${myFontUnit * 2}px sans-serif`;
	ctx.fillText(`${record_line} lines`, canvas.width / 2, canvas.height / 2);
	ctx.font = `${myFontUnit}px sans-serif`;
	ctx.fillText("Tap to Title", canvas.width / 2, (canvas.height / 3) * 2);
	const returnTitle = () => {
		canvas.removeEventListener("click", returnTitle);
		titleView();
	};
	canvas.addEventListener("click", returnTitle);
};

window.onload = () => {
	sizeReset();
	titleView();
};
