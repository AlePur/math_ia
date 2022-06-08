<script>
	let canvas, resultCanvas, graphCanvas = Array(10);
	import Plot from "./plot.js";

	let pixels, segments = [];
	let rotate = 0;
	const canvasSize = 400;
	const plotDimentions = 20;

	let toggle_original = 1, toggle_graph = 1, toggle_plot = Array(plotDimentions).fill(1), toggle_outline = 1;

	let dataURI1 = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rhombus_black%28cs2%29.svg/249px-Rhombus_black%28cs2%29.svg.png";
	let dataURI2 = "https://static.thenounproject.com/png/35330-200.png";

	const template = [1, -1].map(a => [1, 0, -1].map(b => [a, b])).flat();
	const neighbors = template.map(a => (a[0] * canvasSize + a[1]) * 4);
	const neighborArray = template;// template.concat(template.map(a => [a[0] * 2, a[1] * 2]))

	const dist = (_a, _b) => Math.hypot(_b[0] - _a[0], _b[1] - _a[1]);

	function render(URI) {
		const ctx = canvas.getContext("2d");

		let img = new Image;

		img.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			ctx.setTransform(1, 0, 0, 1, canvasSize/2, canvasSize/2);
			if (rotate) {
				ctx.rotate(Math.PI / 2);
			}
			ctx.drawImage(img, -img.width / 2, -img.height / 2);
			ctx.setTransform(1,0,0,1,0,0);
			
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

		let j = 0;

		const iter = 4;

		while (j < (iter + 1)) {

			for (let x = 0; x < canvasSize; x += 1) {
				for (let y = 0; y < canvasSize; y += 1) {
					if (temp[x][y]) {

						let green = (temp[x][y] == 2);

						for (let nindex = 0; nindex < neighborArray.length; nindex++) {
							let n = temp[Math.min(Math.max(0, neighborArray[nindex][1] + x), 300)][Math.min(Math.max(0, neighborArray[nindex][0] + y), 300)];
							if (n == 2) {
								green++;
							} else if (n == 1) {
								green -= 2;
							}
						}

						green = (green > 0);
						
						if (j < iter) {
							temp[x][y] = green + 1;
						} else {
							const size = 2;
							rctx.fillStyle = `rgba(${255 * (!green)}, ${255 * (green)}, 0, 1)`;
							rctx.fillRect(x, y, size, size);
						}
					}
				}
			}
			j++;

		}

		dividePerimeter();

	}

	function dividePerimeter() {
		
		const rctx = resultCanvas.getContext("2d");

		const imgData = rctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
		const data = imgData.data;

		let i = 0;
		let mem = [[], [], []]; // r, g, total
		segments.length = [];

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
				const distance = 10;

				for (let j = 0; j < mem[offset].length; j++) {
					const e = mem[offset][j];
					const d = dist(e, [x, y]);
					if (d < distance) {
						free = 0;
						break;
					}
				}
				
				if (free) {
					mem[offset].push([x, y]);
				}

				if (near) { // make the YELLOW dot (dividing dot)
					let _free = 1;
					for (let j = 0; j < mem[2].length; j++) {
						const e = mem[2][j];
						if (dist(e, [x, y]) < 10) {
							_free = 0;
							break;
						}
					}

					if (_free) {
						mem[2].push([x, y]);
						rctx.fillStyle = `rgba(255, 255, 0, 1)`;
						rctx.fillRect(x - 2, y - 2, 6, 6);
					}
				}
			}
		}

		const addPoint = (cpoint, col) => {
			const candidates = [];
			for (let k = 0; k < mem[col].length; k++) {
				const e2 = mem[col][k];

				if (cpoint == e2) continue;

				const d = dist(cpoint, e2);

				if (d < 20) {
					candidates.push([d, k]);
				}
			}

			if (candidates.length) {
				candidates.sort((a, b) => a[0] - b[0]);
				return mem[col].splice(candidates[0][1], 1)[0]; //splice is [Array]
			}

			return 0;
		}

		for (let j = 0; j < mem[2].length; j++) {
			for (let t = 0; t < 2; t++) { // t is either green or red
				let s = [mem[2][j]]; // first point is the dividing point
				let newPoint = s[0];

				while (1) {
					newPoint = addPoint(newPoint, t);
					if (newPoint == 0) {
						break;
					}
					s.push(newPoint);
				}

				if (s.length < 2) continue;
				segments.push(s);
			}
		}

		graphCanvas.forEach(c => {
			const gctx = c.getContext("2d");
			gctx.clearRect(0, 0, canvasSize, canvasSize);
		});

		segments.forEach((z, j) => {
			z.sort((a, b) => a[0] - b[0]);
			//let f = (x) => x + z[0][0];

			const gctx = graphCanvas[j].getContext("2d");

			for (let i = 0; i < z.length; i++) {
				gctx.fillStyle = `rgba(${((j + 1)/segments.length) * 255}, 0, 255, 1)`;
				gctx.fillRect(z[i][0] - 1, z[i][1] - 1, 4, 4);
			}

			//Plot(f, [0, canvasSize, 0, canvasSize], graphCanvas);
		})
		console.log(segments);
	}

	
</script>

<main>
	<div id="wrap">
		<div style="position: relative; display: flex;">
			<div id="cborder">
				<canvas hidden={!toggle_original} id="canv" bind:this={canvas} width={canvasSize} height={canvasSize}></canvas>
				<canvas hidden={!toggle_outline} id="rcanv" bind:this={resultCanvas} width={canvasSize} height={canvasSize}></canvas>
				{#each [...Array(plotDimentions).keys()] as i}
					<canvas hidden={!toggle_plot[i] || !toggle_graph} id="rcanv" bind:this={graphCanvas[i]} width={canvasSize} height={canvasSize}></canvas>
				{/each}
				<div id="graph"></div>
			</div>
			<div>
				<div class="co">Pixel count: {pixels}</div>
				<div class="co">Segment count: {segments.length}</div>
				<div style="padding: 10px; background-color: #eee;">
					<div>Original image: <input type=checkbox bind:checked={toggle_original}></div>
					<div>Outline: <input type=checkbox bind:checked={toggle_outline}></div>
					<div>Graph: <input type=checkbox bind:checked={toggle_graph}></div>
					{#each segments as seg, _i}
						<div>segment_{_i}: <input type=checkbox bind:checked={toggle_plot[_i]}></div>
					{/each}
				</div>
				<div><input type=checkbox bind:checked={rotate}> Rotate</div>
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