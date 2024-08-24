import { canvas, requestRender, requestUpdate } from "./canvas";
import { mouse, registerKeyDown } from "./input";
import { clamp, normalize, randBool, randInt, setMagnitude, vec } from "./utils";

//let bubbleColors = [ "#E40303", "#FF8C00", "#FFED00", "#008026" ];//, "#004CFF", "#732982" ];
//let bubbleColors = [ "red", "orange", "yellow", "green", "blue", "purple" ];
let bubbleColors = [ "#5BCEFA", "#F5A9B8", "#BBBBBB" ];
const bubbleSize = 52;
const lineLen = 13;
const sideGridMargin = 39;
const bubbleGrid = [];
let gridOffsetValue = 0;
let hoveredBubbles = [];

const nextBubbles = [];
let shootBubble = null;
let shootingStartPos, shootingDir, shootMinX, shootMaxX;
const shootSpeed = 13 * 80;

const movingBubbles = [];

//#region Bubble Helpers

function createRandomBubble()
{
	let negative = randInt(0, 3) == 0;
	let value = 6.5;//negative ? -randInt(1, 7) : randInt(1, 8);
	return {
		value,
		color: randInt(0, bubbleColors.length)
	};
}

function pushRandomBubbleLine()
{
	bubbleGrid.unshift([]);
	gridOffsetValue += 1;
	for (let i = 0; i < lineLen; i++)
	{
		bubbleGrid[0].push(createRandomBubble());
	}
	visitBubbleGrid((x, y, b) =>
	{
		b.gridPos = vec(x, y);
		b.pos = gridToScreenPos(b.gridPos);
	});
}

//#endregion

//#region Grid Helpers

function gridToScreenPos(pos)
{
	// The shifting on odd lines means a slight vertical overlap on empty spaces (since balls are round)
	const sy = bubbleSize * (0.5 + pos.y * 7/8);
	// Pos = x + half to center + half if odd line
	const sx = sideGridMargin + (pos.x + 0.5 + getLineModulo(pos.y) / 2) * bubbleSize;
	return vec(sx, sy);
}

function screenPosToGrid(pos, allowOutsideGrid)
{
	const gy = Math.floor((pos.y * 8) / (bubbleSize * 7) - 4/7 + 0.5);
	const gx = Math.floor((pos.x - sideGridMargin) / bubbleSize - getLineModulo(gy) / 2);
	if (!allowOutsideGrid && (gx < 0 || gx >= lineLen || gy < 0 || gy >= bubbleGrid.length))
		return null;
	return vec(gx, gy);
}

function getBubbleFromScreenPos(pos)
{
	const gridPos = screenPosToGrid(pos);
	return gridPos == null ? null : bubbleGrid[gridPos.y][gridPos.x];
}

function distToBubble(pos, bubble)
{
	return ((pos.x - bubble.pos.x) ** 2 + (pos.y - bubble.pos.y) ** 2) ** 0.5;
}

function isInsideBubble(pos, bubble)
{
	return distToBubble(pos, bubble) <= bubbleSize / 2;
}

function getLineModulo(y)
{
	return (y + gridOffsetValue) % 2;
}

function visitBubbleGrid(cb)
{
	for (let y = 0; y < bubbleGrid.length; y++)
	{
		const bubbleRow = bubbleGrid[y];
		for (let x = 0; x < bubbleRow.length; x++)
		{
			let bubble = bubbleRow[x];
			if (bubble === null)
				continue;
			
			if (cb(x, y, bubble) === false)
				return;
		}
	}
}

function getNeighbors(bubble)
{
	let x = bubble.gridPos.x, y = bubble.gridPos.y;
	let neighbors = [];
	let yIsEven = getLineModulo(y) == 0;
	let xOffset = yIsEven ? -1 : 0;

	// Left
	if (x > 0)
	{
		neighbors.push(bubbleGrid[y][x - 1]);
	}

	// Right
	if (x < lineLen - 1)
	{
		neighbors.push(bubbleGrid[y][x + 1]);
	}

	// Top
	if (y > 0)
	{
		// Top-left
		if (x > 0 || !yIsEven)
		{
			neighbors.push(bubbleGrid[y - 1][x + xOffset]);	
		}

		// Top-right
		if (x < lineLen - 1 || yIsEven)
		{
			neighbors.push(bubbleGrid[y - 1][x + 1 + xOffset]);	
		}
	}

	// Bottom
	if (y < bubbleGrid.length - 1)
	{
		// Bottom-leftpp
		if (x > 0 || !yIsEven)
		{
			neighbors.push(bubbleGrid[y + 1][x + xOffset]);	
		}

		// Bottom-right
		if (x < lineLen - 1 || yIsEven)
		{
			neighbors.push(bubbleGrid[y + 1][x + 1 + xOffset]);	
		}
	}

	return neighbors.filter(nb => nb != null);
}

function getSameColorZone(bubble)
{
	let found = new Set();
	let toExplore = [ bubble ];

	while (toExplore.length != 0)
	{
		toExplore = toExplore.flatMap(ex => {
			found.add(ex);
			return getNeighbors(ex).filter(nb => nb.color === bubble.color && !found.has(nb));
		});
	}

	return [ ...found ];
}

function getUnattachedBubbles()
{
	const unexplored = new Set(bubbleGrid.flatMap(row => row.filter(b => b != null)));
	
	for (let firstRowBubble of bubbleGrid[0])
	{
		if (firstRowBubble == null || !unexplored.has(firstRowBubble))
			continue;

		let toExplore = [ firstRowBubble ];
		while (toExplore.length != 0)
		{
			toExplore = toExplore.flatMap(ex => {
				unexplored.delete(ex);
				return getNeighbors(ex).filter(n => unexplored.has(n));
			});
		}
	}

	return [ ...unexplored ];
}

//#endregion

//#region Render

function render(ctx)
{
	// Grid side lines
	ctx.lineWidth = 2;
	ctx.line(sideGridMargin, 0, sideGridMargin, canvas.height);
	ctx.line(canvas.width - sideGridMargin, 0, canvas.width - sideGridMargin, canvas.height);

	// Render grid
	ctx.font = "30px Calibri";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	visitBubbleGrid((x, y, bubble) => {
		renderBubble(ctx, bubble.pos, bubble);
	});

	// Display hovered bubbles sum
	if (hoveredBubbles.length > 0)
	{
		let sum = 0, maxY = 0, xSum = 0;
		hoveredBubbles.forEach(bubble => {
			sum += bubble.value;
			xSum += bubble.pos.x;
			maxY = Math.max(maxY, bubble.pos.y);
		});
		let textPos = { x: xSum / hoveredBubbles.length, y: maxY + bubbleSize };

		ctx.fillStyle = "black";
		ctx.disk(textPos.x, textPos.y, bubbleSize / 2);

		ctx.fillStyle = "white";
		ctx.fillText(sum, textPos.x, textPos.y);
	}

	// Guide line
	ctx.lineWidth = 2;
	ctx.lineDir(shootingStartPos.x, shootingStartPos.y, shootingDir, bubbleSize * 2);

	// Next bubbles
	renderBubble(ctx, shootingStartPos, nextBubbles[0]);
	for (let i = 1; i < nextBubbles.length; i++)
	{
		renderBubble(ctx, vec(canvas.width / 2 + i * (bubbleSize + 13), canvas.height - bubbleSize / 2), nextBubbles[i]);
	}

	// Shooting bubble
	if (shootBubble)
	{
		renderBubble(ctx, shootBubble.pos, shootBubble);
	}

	movingBubbles.forEach(b => renderBubble(ctx, b.pos, b));

	for (const pos of debugPos)
	{
		ctx.fillStyle = "#FF000077";
		ctx.disk(pos.x, pos.y, bubbleSize / 2);
	}
}

function renderBubble(ctx, pos, bubble)
{
	const gradient = ctx.createRadialGradient(pos.x + 13, pos.y - 13, bubbleSize / 13, pos.x, pos.y, bubbleSize / 2);
	gradient.addColorStop(0, "white");
	gradient.addColorStop(1, bubbleColors[bubble.color]);
	ctx.fillStyle = gradient;
	ctx.disk(pos.x, pos.y, bubbleSize / 2);

	if (hoveredBubbles.includes(bubble))
	{
		ctx.lineWidth = 2;
		ctx.strokeStyle = "black";
		ctx.circle(pos.x, pos.y, bubbleSize / 2 - 1);
	}

	ctx.fillStyle = "black";
	ctx.fillText(bubble.value, pos.x, pos.y);
}

//#endregion

//#region Update
const gravity = 13 * 50;

function update(delta)
{
	for (let i = movingBubbles.length - 1; i >= 0; i--)
	{
		const bubble = movingBubbles[i];

		if (bubble.pos.x < -bubbleSize || bubble.pos.x > canvas.width + bubbleSize
			|| bubble.pos.y > canvas.height + bubbleSize)
		{
			movingBubbles.splice(i, 1);
			continue;
		}

		bubble.speed.y += gravity * delta;
		bubble.pos.x += bubble.speed.x * delta;
		bubble.pos.y += bubble.speed.y * delta;
	}

	shootingDir = normalize(mouse.x - shootingStartPos.x, Math.min(mouse.y, shootingStartPos.y - 13) - shootingStartPos.y);
	updateShootBubble(delta);

	updateHoveredBubbles();
}

function updateHoveredBubbles()
{
	const bubbleAtMouse = getBubbleFromScreenPos(vec(mouse.x, mouse.y));
	hoveredBubbles = bubbleAtMouse != null ? getSameColorZone(bubbleAtMouse) : [];
}

function updateShootBubble(delta)
{
	if (shootBubble == null)
	{
		if (mouse.downThisFrame)
		{
			shootBubble = nextBubbles.shift();
			shootBubble.pos = { ...shootingStartPos };
			shootBubble.speed = vec(shootingDir.x * shootSpeed, shootingDir.y * shootSpeed);
			nextBubbles.push(createRandomBubble());
		}
		return;
	}

	shootBubble.pos.x += shootBubble.speed.x * delta;
	shootBubble.pos.y += shootBubble.speed.y * delta;

	if (shootBubble.pos.x < shootMinX)
	{
		shootBubble.pos.x = shootMinX;
		shootBubble.speed.x = -shootBubble.speed.x;
	}

	if (shootBubble.pos.x > shootMaxX)
	{
		shootBubble.pos.x = shootMaxX;
		shootBubble.speed.x = -shootBubble.speed.x;
	}

	if (shootBubble.pos.y < bubbleSize / 2)
	{
		//debugPos.push(shootBubble.pos);
		const distToRewind = bubbleSize / 2 - shootBubble.pos.y;
		const dirToRewind = normalize(shootBubble.speed);
		const rewindedPos = vec(
			shootBubble.pos.x - dirToRewind.x * distToRewind,
			shootBubble.pos.y - dirToRewind.y * distToRewind
		);
		//debugPos.push(rewindedPos);
		handleBubbleCollision(rewindedPos);
	}
	else
	{
		visitBubbleGrid((x, y, bubble) => {
			const dist = distToBubble(shootBubble.pos, bubble);
			if (dist <= bubbleSize)
			{
				//debugPos.push(shootBubble.pos);
				const distToRewind = bubbleSize - dist;
				const dirToRewind = normalize(shootBubble.speed);
				const rewindedPos = vec(
					shootBubble.pos.x - dirToRewind.x * distToRewind,
					shootBubble.pos.y - dirToRewind.y * distToRewind
				);
				//debugPos.push(rewindedPos);
				handleBubbleCollision(rewindedPos);
				return false;
			}
		});
	}
}

function handleBubbleCollision(pos)
{
	const gridPos = screenPosToGrid(pos, true);
	if (gridPos.y > 25)
	{
		// TODO - LOST
		shootBubble = null;
		return;
	}

	gridPos.x = clamp(gridPos.x, 0, lineLen - 1);
	gridPos.y = clamp(gridPos.y, 0, bubbleGrid.length);
	if (gridPos.y == bubbleGrid.length)
	{
		bubbleGrid.push(new Array(lineLen).fill(null));
	}
	shootBubble.gridPos = gridPos;
	bubbleGrid[gridPos.y][gridPos.x] = shootBubble;

	const newPos = gridToScreenPos(gridPos);
	shootBubble.pos = newPos;

	const newZone = getSameColorZone(shootBubble);
	const zoneSum = newZone.reduce((acc, b) => acc + b.value, 0);
	if (zoneSum % 13 == 0)
	{
		newZone.forEach(b => {
			bubbleGrid[b.gridPos.y][b.gridPos.x] = null;
			b.speed = b == shootBubble
				? setMagnitude(b.speed, vec(130, 260))
				: setMagnitude(vec(b.pos.x - newPos.x, b.pos.y - newPos.y), vec(130, 260));
		});
		movingBubbles.push(...newZone);

		const unattachedBubbles = getUnattachedBubbles();
		unattachedBubbles.forEach(b => {
			bubbleGrid[b.gridPos.y][b.gridPos.x] = null
			b.speed = vec(0, 260);
		});
		movingBubbles.push(...unattachedBubbles);
	}

	shootBubble = null;
}

//#endregion

let debugPos = [];
export function init()
{
	requestRender(render);
	requestUpdate(update);

	registerKeyDown("l", () => {
		pushRandomBubbleLine();
	});

	registerKeyDown("c", () => {
		debugPos = [];
		console.log(bubbleGrid);
	});

	shootingStartPos = vec(canvas.width / 2, canvas.height - bubbleSize);
	shootMinX = sideGridMargin + bubbleSize / 2;
	shootMaxX = canvas.width - sideGridMargin - bubbleSize / 2;
	
	for (let i = 0; i < 5; i++)
	{
		nextBubbles.push(createRandomBubble());
		pushRandomBubbleLine();
	}
}