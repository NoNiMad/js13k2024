import { canvas } from "./canvas";
import { bubbleColor, randInt } from "./utils";

let bubbles = [];

function createBubble(atTop)
{
	const size = randInt(30, 200);
	bubbles.push({
		x: randInt(0, canvas.width),
		y: atTop ? -size : randInt(0, canvas.height),
		size,
		hue: randInt(0, 360),
		speed: randInt(20, 150)
	});
}

export function render(ctx)
{
	for (let i = 0; i < bubbles.length; i++)
	{
		const bubble = bubbles[i];
		ctx.bubbleGradient(bubble.x, bubble.y, bubble.size, bubbleColor(bubble.hue));
		ctx.disk(bubble.x, bubble.y, bubble.size);
	}

	ctx.fillStyle = "#FFFFFFCC";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function update(delta)
{
	for (let i = bubbles.length - 1; i > 0; i--)
	{
		const bubble = bubbles[i];
		bubble.y += bubble.speed * delta;
		if (bubble.y > canvas.height + bubble.size)
		{
			bubbles.splice(i, 1);
		}
	}

	if (Math.random() < 0.05)
	{
		createBubble(true);
	}
}