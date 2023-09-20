//ステージを表す二次元配列を用意、1の位が固定済ブロックを表し、10の位は移動中ブロック
stage = new Array(24);

//ウインドウサイズの指定、比率は1:2で固定
window_width = 400;
window_height = window_width * 2;

//消したライン数の計測
record_line = 0;

//ゲームの状態を記録
gamemode = "menu";

//配列の中身を描画する
function stage_load() {
	const canvas = document.getElementById("gameView");
	const ctx = canvas.getContext("2d");

	//背景塗りつぶし
	ctx.fillStyle = "#0F0F0F";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//ブロックを描写
	color = [
		"red",
		"green",
		"purple",
		"yellow",
		"orange",
		"blue",
		"lightblue",
		"black",
	];
	for (let y = 0; y < 20; y++) {
		for (let x = 0; x < 10; x++) {
			if (stage[y + 4][x] != 0) {
				let n = (stage[y + 4][x] % 10) + Math.floor(stage[y + 4][x] / 10);
				ctx.fillStyle = color[n - 1];
				ctx.fillRect(
					(window_width / 10) * x,
					(window_height / 20) * y,
					window_width / 10,
					window_height / 20,
				);
			}
		}
	}
	//グリッド引く
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#303030";
	for (let i = 0; i <= 10; i++) {
		const x = (window_width / 10) * i;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, window_height);
		ctx.stroke();
	}
	for (let i = 0; i <= 20; i++) {
		const y = (window_height / 20) * i;
		ctx.moveTo(0, y);
		ctx.lineTo(window_width, y);
		ctx.stroke();
	}
	ctx.beginPath();
}

//配列を座標へ変換する。
function array_to_position(grid) {
	let block = [];
	for (let y = 0; y < 5; y++) {
		for (let x = 0; x < 5; x++) {
			if (grid[y][x] != 0) {
				block.push([y, x - 1]);
			}
		}
	}
	//行列の一番上で使われていなければ一つ詰める
	//ブロックがあればフラグを立てる
	let flag = false;
	for (b of block) {
		if (b[0]) flag = true;
	}
	//ブロックがあれば詰めずに返す
	if (flag) return block;
	//ブロックがなければ全てのy座標を一つ減らす。
	for (let i = 0; i < block.length; i++) {
		block[i][0] -= 1;
	}
	return block;
}
//テトリミノをスポーンさせる
function spawn_tm() {
	//現在の認識結果を使える形に変換する。
	select = array_to_position(now_tetrimino);

	//配列に書き込む
	for (b of select) {
		stage[0 + b[0]][4 + b[1]] =
			(Object.keys(tetriminos).indexOf(now_key) + 1) * 10;
	}
	//画面更新
	stage_load();
}

//ブロックの移動を行う関数、上昇は非対応
function block_shift(shift_y = 0, shift_x = 0) {
	//縦移動、横移動が不可能かを表すフラグ
	let fixed_flag = false;
	let shift_flag = false;
	//右下からスキャン
	for (let y = 23; y >= 0; y--) {
		for (let x = 9; x >= 0; x--) {
			//移動中ブロックの場合、移動先が移動可能化を調べる
			if (stage[y][x] >= 10) {
				//ステージからはみ出ないかを判定
				if (x + shift_x < 0 || 9 < x + shift_x) {
					shift_flag = true;
					break;
				}
				if (y + shift_y < 0 || 23 < y + shift_y) {
					fixed_flag = true;
					break;
				}
				//移動先にブロックがある場合、移動方向を取得してフラグを立てる
				if (stage[y + shift_y][x + shift_x] % 10 != 0) {
					if (shift_y) fixed_flag = true;
					if (shift_x) shift_flag = true;
				}
			}
			//移動不可能な事がわかった場合、スキャン終了
			if (fixed_flag || shift_flag) {
				break;
			}
		}
	}

	//移動を行ったか記録する
	let shift_report = false;
	//移動可能であれば実際に移動を行う
	if (fixed_flag == false && shift_flag == false) {
		//縦のループ
		for (let y = 23; y >= 0; y--) {
			//横のループは右シフトと左シフトで条件分岐
			if (shift_x >= 0) {
				//横のループ
				for (let x = 9; x >= 0; x--) {
					//移動中ブロックのみ処理
					if (stage[y][x] >= 10) {
						//移動させるので記録
						shift_report = true;
						//移動先へコピーして移動元を削除
						stage[y + shift_y][x + shift_x] = stage[y][x];
						stage[y][x] = 0;
					}
				}
			} else {
				for (let x = 0; x <= 9; x++) {
					if (stage[y][x] >= 10) {
						shift_report = true;
						stage[y + shift_y][x + shift_x] = stage[y][x];
						stage[y][x] = 0;
					}
				}
			}
		}
	}
	//下にブロックがある場合は固定フラグが立っている
	if (fixed_flag) {
		//ブロックを書き換えるので記録
		shift_report = true;
		//右下よりスキャン
		for (let y = 23; y >= 0; y--) {
			for (let x = 9; x >= 0; x--) {
				//移動中のブロックを10で割り固定
				if (stage[y][x] >= 10) {
					stage[y][x] /= 10;
				}
			}
		}
	}
	stage_load();
	return shift_report;
}

//揃っている列が無いかチェックする
function remove_line() {
	//全てのラインを走査する
	for (let y = 0; y <= 23; y++) {
		//フラグを立てる
		let flag = true;
		for (let x = 0; x <= 9; x++) {
			//ブロックのない場所があればフラグを消す
			if (!stage[y][x]) flag = false;
		}
		//フラグが残っていたらラインの消去に入る
		if (flag) {
			//記録を増やす
			record_line++;
			//消えたラインより上を全て1ブロック詰める
			for (let ny = y; ny > 0; ny--) {
				for (let nx = 0; nx <= 9; nx++) {
					stage[ny][nx] = stage[ny - 1][nx];
				}
			}
			//一番上は0にする
			for (let nx = 0; nx <= 9; nx++) {
				stage[0][nx] = 0;
			}
		}
	}
	stage_load();
}
//画面をはみ出たブロックが無いか確認する
function detect_gameover() {
	//画面外に当たる上から4ラインを走査する
	for (let y = 0; y < 4; y++) {
		for (let x = 0; x <= 9; x++) {
			//4ライン中にブロックが存在すればtrueを返して終了
			if (stage[y][x]) return true;
		}
	}
	//なければfalseを返す
	return false;
}

async function gameHandler() {
	startCamera();
	keyControl();

	while (now_tetrimino.length == 0) await sleep(100);
	for (let i = 0; i < 24; i++) {
		stage[i] = new Array(10).fill(0);
	}
	stage_load();
	console.log("gamestart");
	while (true) {
		if (detect_gameover()) break;
		gamemode = "spawn";
		await sleep(5000);
		spawn_tm();
		gamemode = "drop";
		while (true) {
			await sleep(300 - record_line * 5);
			if (!block_shift(1, 0)) break;
		}
		remove_line();
	}
	console.log("gameover");
	gamemode = "menu";
	resultView();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function keyControl() {
	document.addEventListener("keydown", (event) => {
		if (gamemode == "drop") {
			if (event.key === "ArrowLeft") {
				block_shift(0, -1);
			} else if (event.key === "ArrowRight") {
				block_shift(0, 1);
			} else if (event.key === "ArrowDown") {
				block_shift(1, 0);
			} else if (event.key === "ArrowUp") {
				while (true) if (!block_shift(1, 0)) break;
			}
		}
	});
}

function gameInitialize() {
	gameHandler();
}
