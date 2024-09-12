import { canvas, goToScene, registerRender, registerUpdate, scenes } from "../canvas";
import { keyboard, mouse, registerKeyDown } from "../input";
import { bubbleColor, clamp, normalize, randBool, randInt, setMagnitude, vec } from "../utils";

const bubbleSize = 52;
const lineLen = 13;
const sideGridMargin = 39;
const delayBetweenShots = 0.39;
const shootSpeed = 13 * 80;
const gravity = 13 * 50;

//let bubbleColors = [ "#E40303", "#FF8C00", "#FFED00", "#008026" ];//, "#004CFF", "#732982" ];
let gameConfig, bubbleColors;
let bubbleGrid, gridOffsetValue, hoveredBubbles, movingBubbles;
let nextValues, shootBubbles, shootColor, timeSinceLastShot, shotCount;
let shootingStartPos, shootingDir, shootMinX, shootMaxX;
let gameOver, score, scoreMultiplier;

//#region Bubble Helpers

function pickRandomValue()
{
	let negative = randInt(0, 3) == 0;
	return negative ? -randInt(1, 7) : randInt(1, 8);
}

function createRandomBubble()
{
	return {
		value: pickRandomValue(),
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

		let toExplore = new Set([ firstRowBubble ]);
		let exploring;
		let neighbors;
		while (toExplore.size != 0)
		{
			exploring = toExplore.values().next().value;
			unexplored.delete(exploring);
			toExplore.delete(exploring);

			neighbors = getNeighbors(exploring);
			for (let i = 0; i < neighbors.length; i++)
			{
				if (unexplored.has(neighbors[i]))
				{
					toExplore.add(neighbors[i]);
				}
			}
		}
	}

	return [ ...unexplored ];
}

//#endregion

//#region Render

function render(ctx)
{
	// Grid side lines
	const leftSideGradient = ctx.createLinearGradient(sideGridMargin, 0, 0, 0);
	leftSideGradient.addColorStop(0, "#00000000");
	leftSideGradient.addColorStop(1, bubbleColors[shootColor]);
	ctx.fillStyle = leftSideGradient;
	ctx.fillRect(0, 0, sideGridMargin, canvas.height);

	const rightSideGradient = ctx.createLinearGradient(canvas.width - sideGridMargin, 0, canvas.width, 0);
	rightSideGradient.addColorStop(0, "#00000000");
	rightSideGradient.addColorStop(1, bubbleColors[shootColor]);
	ctx.fillStyle = rightSideGradient;
	ctx.fillRect(canvas.width - sideGridMargin, 0, canvas.width, canvas.height);

	ctx.lineWidth = 1;
	ctx.line(sideGridMargin - 1, 0, sideGridMargin - 1, canvas.height);
	ctx.line(canvas.width - sideGridMargin + 1, 0, canvas.width - sideGridMargin + 1, canvas.height);

	// Render grid
	ctx.font = "30px Calibri";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	visitBubbleGrid((x, y, bubble) => {
		renderBubble(ctx, bubble.pos, bubble);
	});

	if (gameOver)
	{
		ctx.fillStyle = "#FFFFFFBB";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = "black";
		ctx.font = "8em Calibri";
		ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 100);

		ctx.font = "4em Calibri";
		ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2);

		ctx.font = "1em Calibri";
		ctx.fillText("Press Escape to go back to the main menu", canvas.width / 2, canvas.height / 2 + 200);
		if (keyboard["Escape"])
		{
			goToScene(scenes.menu);
		}
	}
	else
	{
		// Guide line
		ctx.lineWidth = 2;
		ctx.lineDir(shootingStartPos.x, shootingStartPos.y, shootingDir, bubbleSize * 2);

		// Next bubbles
		if (nextValues[0] != null)
		{
			renderBubble(ctx, shootingStartPos, {
				value: nextValues[0],
				color: shootColor
			});
		}
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height);
		for (let i = 1; i < nextValues.length; i++)
		{
			ctx.fillStyle = "black";
			ctx.fillText(nextValues[i], i * (bubbleSize + 13), -bubbleSize / 2);
		}
		ctx.restore();

		// Shooting bubbles
		for (let shootBubble of shootBubbles)
		{
			renderBubble(ctx, shootBubble.pos, shootBubble);
		}
		movingBubbles.forEach(b => renderBubble(ctx, b.pos, b));

		ctx.textAlign = "left";
		ctx.fillStyle = "black";
		ctx.fillText("Score: " + score, sideGridMargin * 1.5, canvas.height - bubbleSize / 2);

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

			ctx.font = "30px Calibri";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			const mod13 = sum % 13;
			if (mod13 > 0)
			{
				ctx.fillText(`${sum - mod13} < ${sum - mod13 + 13}`, textPos.x, textPos.y + bubbleSize);
			}
			else if (mod13 < 0)
			{
				ctx.fillText(`${sum - mod13 - 13} < ${sum - mod13}`, textPos.x, textPos.y + bubbleSize);
			}

			
			ctx.fillStyle = "white";
			ctx.fillText(sum, textPos.x, textPos.y);
		}
	}
}

function renderBubble(ctx, pos, bubble)
{
	const gradient = ctx.createRadialGradient(pos.x + bubbleSize / 4, pos.y - bubbleSize / 4, bubbleSize / 13, pos.x, pos.y, bubbleSize / 2);
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

	ctx.font = "30px Calibri";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "black";
	ctx.fillText(bubble.value, pos.x, pos.y);
}

//#endregion

//#region Update

function update(delta)
{
	if (gameOver)
	{
		return;
	}

	for (let i = movingBubbles.length - 1; i >= 0; i--)
	{
		const bubble = movingBubbles[i];

		if (bubble.pos.x < -bubbleSize || bubble.pos.x > canvas.width + bubbleSize
			|| bubble.pos.y > canvas.height + bubbleSize)
		{
			movingBubbles.splice(i, 1);
			scoreBubble(bubble);
			continue;
		}

		bubble.speed.y += gravity * delta;
		bubble.pos.x += bubble.speed.x * delta;
		bubble.pos.y += bubble.speed.y * delta;
	}

	shootingDir = normalize(mouse.x - shootingStartPos.x, Math.min(mouse.y, shootingStartPos.y - 13) - shootingStartPos.y);
	updateShootBubbles(delta);
	updateHoveredBubbles();
}

function updateHoveredBubbles()
{
	const bubbleAtMouse = getBubbleFromScreenPos(vec(mouse.x, mouse.y));
	hoveredBubbles = bubbleAtMouse != null ? getSameColorZone(bubbleAtMouse) : [];
}

function updateShootBubbles(delta)
{
	if (mouse.wheelThisFrame != 0)
	{
		let change = mouse.wheelThisFrame > 0 ? -1 : 1;
		let newValue = shootColor + change;
		if (newValue >= bubbleColors.length)
		{
			newValue = 0;
		}
		else if (newValue < 0)
		{
			newValue = bubbleColors.length - 1;
		}
		shootColor = newValue;

		zzfx(...[.4,0,55,.03,.01,.03,4,2,,6,-353,.11,,,,,,.55,.03,,-604]);
	}

	if (timeSinceLastShot > delayBetweenShots)
	{
		if (nextValues[0] == null)
		{
			nextValues.shift();
			nextValues.push(pickRandomValue());
		}

		if (mouse.downThisFrame)
		{
			shootBubbles.push({
				value: nextValues[0],
				color: shootColor,
				pos: { ...shootingStartPos },
				speed: vec(shootingDir.x * shootSpeed, shootingDir.y * shootSpeed),
			});
			nextValues[0] = null;
			timeSinceLastShot = 0;
			shotCount++;
	
			if (shotCount % 5 == 0)
			{
				pushRandomBubbleLine();
				if (bubbleGrid.length == 26)
				{
					loose();
				}
			}
	
			zzfx(...[,,354,,,0,,3.6,-6,5,,,,,,,,0,.19]);
		}
	}
	else
	{
		timeSinceLastShot += delta;
	}

	for (let shootBubble of shootBubbles)
	{
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
			const distToRewind = bubbleSize / 2 - shootBubble.pos.y;
			const dirToRewind = normalize(shootBubble.speed);
			const rewindedPos = vec(
				shootBubble.pos.x - dirToRewind.x * distToRewind,
				shootBubble.pos.y - dirToRewind.y * distToRewind
			);
			handleBubbleCollision(shootBubble, rewindedPos);
		}
		else
		{
			visitBubbleGrid((x, y, bubble) => {
				const dist = distToBubble(shootBubble.pos, bubble);
				if (dist <= bubbleSize)
				{
					const distToRewind = bubbleSize - dist;
					const dirToRewind = normalize(shootBubble.speed);
					const rewindedPos = vec(
						shootBubble.pos.x - dirToRewind.x * distToRewind,
						shootBubble.pos.y - dirToRewind.y * distToRewind
					);
					handleBubbleCollision(shootBubble, rewindedPos);
					return false;
				}
			});
		}
	}
}

function handleBubbleCollision(movingBubble, pos)
{
	shootBubbles.splice(shootBubbles.indexOf(movingBubble), 1);

	const gridPos = screenPosToGrid(pos, true);
	if (gridPos.y > 25)
	{
		loose();
		return;
	}

	gridPos.x = clamp(gridPos.x, 0, lineLen - 1);
	gridPos.y = clamp(gridPos.y, 0, bubbleGrid.length);
	if (gridPos.y == bubbleGrid.length)
	{
		bubbleGrid.push(new Array(lineLen).fill(null));
	}
	movingBubble.gridPos = gridPos;
	bubbleGrid[gridPos.y][gridPos.x] = movingBubble;

	const newZone = getSameColorZone(movingBubble);
	const zoneSum = newZone.reduce((acc, b) => acc + b.value, 0);
	if (zoneSum % 13 == 0)
	{
		newZone.forEach(b => {
			bubbleGrid[b.gridPos.y][b.gridPos.x] = null;
			b.speed = b == movingBubble
				? setMagnitude(b.speed, vec(130, 260))
				: setMagnitude(vec(b.pos.x - movingBubble.pos.x, b.pos.y - movingBubble.pos.y), vec(130, 260));
			delete b.gridPos;
		});
		movingBubbles.push(...newZone);

		const unattachedBubbles = getUnattachedBubbles();
		unattachedBubbles.forEach(b => {
			bubbleGrid[b.gridPos.y][b.gridPos.x] = null
			b.speed = setMagnitude(vec(b.pos.x - movingBubble.pos.x, b.pos.y - movingBubble.pos.y), vec(10, 260));
			delete b.gridPos;
		});
		movingBubbles.push(...unattachedBubbles);

		zzfx(...[.3,.3,,.02,.27,.41,,3.7,7,,,,.21,,,.3,,.4,.27]);
	}
	else
	{
		movingBubble.pos = gridToScreenPos(gridPos);
	}
}

function scoreBubble(bubble)
{
	score += Math.abs(bubble.value);
}

function loose()
{
	gameOver = true;
	hoveredBubbles = [];
}

//#endregion

//#region Scene Setup

export function onEnter(context)
{
	registerRender(render);
	registerUpdate(update);

	registerKeyDown("l", () => {
		pushRandomBubbleLine();
	});

	const music = zzfxM(...[[[,0,400]],[[[,6,,8,,10,,,,12,,,,8,,,14,,,,]]],[0,0],,{"title":"s","instruments":["0"],"patterns":["0"]}]);

	registerKeyDown("m", () => {
		gameOver = true;
		zzfxP(...music);
	});

	bubbleGrid = [];
	hoveredBubbles = [];
	movingBubbles = [];
	gridOffsetValue = 0;

	shootBubbles = [];
	shootColor = 0;
	shotCount = 0;
	timeSinceLastShot = delayBetweenShots;

	shootingStartPos = vec(canvas.width / 2, canvas.height - bubbleSize);
	shootMinX = sideGridMargin + bubbleSize / 2;
	shootMaxX = canvas.width - sideGridMargin - bubbleSize / 2;

	gameOver = false;
	score = 0;
	scoreMultiplier = 1;
	
	if (context.difficulty !== undefined)
	{
		switch (context.difficulty)
		{
			case 0:
				gameConfig = {
					initialLines: 3,
					numberOfColors: 2,
					nextValuesCount: 5
				};
				break;
			case 1:
				gameConfig = {
					initialLines: 5,
					numberOfColors: 3,
					nextValuesCount: 4
				};
				break;
			case 2:
				gameConfig = {
					initialLines: 7,
					numberOfColors: 4,
					nextValuesCount: 3
				};
				break;
		}
	}
	else
	{
		gameConfig = context.gameConfig;
	}
	
	bubbleColors = [];
	const colorStart = randInt(0, 360);
	for (let i = 0; i < gameConfig.numberOfColors; i++)
	{
		bubbleColors.push(bubbleColor(colorStart + i * 360 / gameConfig.numberOfColors));
	}

	for (let i = 0; i < gameConfig.initialLines; i++)
	{
		pushRandomBubbleLine();
	}

	nextValues = [];
	for (let i = 0; i < gameConfig.nextValuesCount; i++)
	{
		nextValues.push(pickRandomValue());
	}
}

//#endregion