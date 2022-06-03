<script>
	let canvas, resultCanvas, graphCanvas;
	import Plot from "./plot.js";

	let pixels, segments = undefined;
	const canvasSize = 400;

	let toggle_original = 1, toggle_graph = 1, toggle_outline = 1;

	let dataURI1 = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rhombus_black%28cs2%29.svg/249px-Rhombus_black%28cs2%29.svg.png";
	let dataURI2 = "https://static.thenounproject.com/png/35330-200.png";

	const template = [[1, -1], [1, 0], [1, 1], [-1, -1], [-1, 0], [-1, 1]];
	const neighbors = template.map(z => (z[0] * canvasSize + z[1]) * 4);
	const dist = (_a, _b) => Math.hypot(_b[0] - _a[0], _b[1] - _a[1]);

	function render(URI) {
		const ctx = canvas.getContext("2d");

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let img = new Image;

		img.onload = () => {
			ctx.drawImage(img, 0, 0);
			renderPerimeter();
		}

		img.src = URI + '?' + new Date().getTime();
		img.setAttribute('crossOrigin', '');
	}

	function renderPerimeter() {
		const ctx = canvas.getContext("2d");

		const rctx = resultCanvas.getContext("2d");
		rctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

		const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imgData.data;

		let i = 0;
		pixels = 0;
		let temp = Array.from(Array(400), () => new Array(400))

		for (i = 0; i < data.length; i += 4) {
			const a = data[i + 3];

			if (a != 0) {
				pixels++;
				let y = Math.floor((i / 4) / canvas.width);
				let x = (i / 4) - y * canvas.width;

				let free = 0;
				let nindex = 0;

				for (nindex = 0; nindex < neighbors.length; nindex++) {
					const n = neighbors[nindex];
					const a = data[i + n + 3];
					if (!a) {
						free = 1; 
						break;
					}
				}

				if (free) {
					temp[x][y] = 1 + (nindex <= 2);
				}
			}
		}

		for (let x = 0; x < canvasSize; x += 1) {
			for (let y = 0; y < canvasSize; y += 1) {
				if (temp[x][y]) {

					let green = (temp[x][y] == 2);

					for (let nindex = 0; nindex < template.length; nindex++) {
						let n = temp[Math.min(Math.max(0, template[nindex][1] + x), 300)][Math.min(Math.max(0, template[nindex][0] + y), 300)];
						if (n == 2) {
							green++;
						} else if (n == 1) {
							green -= 6;
						}
					}

					green = (green > 0);

					const size = 2;

					rctx.fillStyle = `rgba(${255 * (!green)}, ${255 * (green)}, 0, 1)`;
					rctx.fillRect(x, y, size, size);
				}
			}
		}

		dividePerimeter();

	}

	function dividePerimeter() {
		
		const rctx = resultCanvas.getContext("2d");

		const gctx = graphCanvas.getContext("2d");
		gctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

		const imgData = rctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
		const data = imgData.data;

		let i = 0;
		let mem = [[], []]; // r, g

		for (i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];

			if (r != 0 || g != 0) {
				let offset = (r != 0) ? 0 : 1;

				let y = Math.floor((i / 4) / resultCanvas.width);
				let x = (i / 4) - y * resultCanvas.width;

				let near = 0;
				let nindex = 0;

				for (nindex = 0; nindex < neighbors.length; nindex++) {
					const n = neighbors[nindex];
					const c = data[i + n + (1 - offset)];
					if (c) {
						near = 1; 
						break;
					}
				}

				let free = 1;
				const _distance = (near ? 5 : 20);

				for (let j = 0; j < mem[offset].length; j++) {
					const e = mem[offset][j];
					if (dist(e, [x, y]) < _distance) {
						free = 0;
						break;
					}
				}

				if (free) {
					mem[offset].push([x, y]);
					gctx.fillStyle = `rgba(${(offset) * 255}, 0, 255, 1)`;
					gctx.fillRect(x - 1, y - 1, 4, 4);
				}

				Plot((x) => x, [0, 1, 0, 1], graphCanvas);
			}
		}

		let totalMinDist = 100_100;
		let point = [0, 0];

		for (let i = 0; i < mem[0].length; i++) {
			const e = mem[0][i];
			let minDist = 100_000;

			for (let j = 0; j < mem[1].length; j++) {
				const f = mem[1][j];
				const d = dist(e, f);
				if (d < minDist) {
					minDist = d;
				}
			}

			if (minDist < totalMinDist) {
				totalMinDist = minDist;
				point = e;
			}
		}

		//gctx.fillStyle = `rgba(255, 255, 0, 1)`;
		//gctx.fillRect(point[0], point[1], 5, 5);
	}

	
</script>

<main>
	<div id="wrap">
		<div style="position: relative; display: flex;">
			<div id="cborder">
				<canvas hidden={!toggle_original} id="canv" bind:this={canvas} width={canvasSize} height={canvasSize}></canvas>
				<canvas hidden={!toggle_outline} id="rcanv" bind:this={resultCanvas} width={canvasSize} height={canvasSize}></canvas>
				<canvas hidden={!toggle_graph} id="rcanv" bind:this={graphCanvas} width={canvasSize} height={canvasSize}></canvas>
				<div id="graph"></div>
			</div>
			<div>
				<div class="co">Pixel count: {pixels}</div>
				<div class="co">Segment count: {segments}</div>
				<div style="padding: 10px; background-color: #eee;">
					<div>Original image: <input type=checkbox bind:checked={toggle_original}></div>
					<div>Outline: <input type=checkbox bind:checked={toggle_outline}></div>
					<div>Graph: <input type=checkbox bind:checked={toggle_graph}></div>
				</div>
			</div>
		</div>
		<button on:click={() => render("shape1.png")}>Shape1</button>
		<button on:click={() => render("shape2.png")}>Shape2</button>
		<button on:click={() => render("shape3.png")}>Shape3</button>
		<button on:click={() => render("shape4.png")}>Shape4</button>
		<button on:click={() => render(dataURI1)}>Render1</button>
		<button on:click={() => render(dataURI2)}>Render2</button>
		<button on:click={() => render("img2.png")}>Render3</button>
		<button on:click={() => render("img.png")}>Render4</button>
		<button on:click={() => render("img3.png")}>Render5</button>
	</div>
</main>

<style>
	.co {
		text-align: center; width: 200px;
	}
	#wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-top: 200px;
	}
	#cborder {
		min-width: 400px;
		min-height: 400px;
		border: 1px solid #000000;
	}
	#rcanv {
		position: absolute;
		top: 1px;
		left: 1px;
	}
</style>