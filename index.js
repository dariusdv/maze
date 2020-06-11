const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;
const cellsH = 6;
const cellsV = 6;

const unitLengthH = width / cellsH;
const unitLengthV = height / cellsV;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

// Maze generation

const shuffle = (arr) => {
	let counter = arr.length;
	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}

	return arr;
};

const grid = Array(cellsV).fill(null).map(() => Array(cellsH).fill(false));

const verticals = Array(cellsV).fill(null).map(() => Array(cellsH - 1).fill(false));

const horizontals = Array(cellsV - 1).fill(null).map(() => Array(cellsH).fill(false));

console.log(grid);

const startRow = Math.floor(Math.random() * cellsV);
const startColumn = Math.floor(Math.random() * cellsH);

const stepThroughCell = (row, column) => {
	// If the cell is visited at [row, column], then return
	if (grid[row][column]) {
		return;
	}
	// Mark this cell as visited
	grid[row][column] = true;

	// Assemble randomly-ordered list of neighbours
	const neighbors = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);

	// For each neighbor...
	for (let neighbor of neighbors) {
		const [ nextRow, nextColumn, direction ] = neighbor;

		// See if that neighbor is out of bounds
		if (nextRow < 0 || nextRow >= cellsV || nextColumn < 0 || nextColumn >= cellsH) {
			continue;
		}

		// If that neighbor was visited continue to the next neighbor
		if (grid[nextRow][nextColumn]) {
			continue;
		}

		// Remove a wall from either verticals or horizontals arrays
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}

		stepThroughCell(nextRow, nextColumn);
		// Visit next cell
	}
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthH + unitLengthH / 2,
			rowIndex * unitLengthV + unitLengthV,
			unitLengthH,
			4,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: 'red'
				}
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthH + unitLengthH,
			rowIndex * unitLengthV + unitLengthV / 2,
			4,
			unitLengthV,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: 'red'
				}
			}
		);
		World.add(world, wall);
	});
});

// Goal

const goal = Bodies.rectangle(width - unitLengthH / 2, height - unitLengthV / 2, unitLengthH * 0.6, unitLengthV * 0.6, {
	isStatic: true,
	label: 'goal',
	render: {
		fillStyle: 'green'
	}
});
World.add(world, goal);

// Ball
const ballRadious = Math.min(unitLengthH, unitLengthV) / 4;
const ball = Bodies.circle(unitLengthH / 2, unitLengthV / 2, ballRadious, {
	label: 'ball',
	render: {
		fillStyle: 'blue'
	}
});
World.add(world, ball);

document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;
	if (event.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - 5 });
	}
	if (event.keyCode === 68) {
		Body.setVelocity(ball, { x: x + 5, y });
	}
	if (event.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + 5 });
	}
	if (event.keyCode === 65) {
		Body.setVelocity(ball, { x: x - 5, y });
	}
});

// Win Condition
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			document.querySelector('.winner').classList.remove('hidden');
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
