import { canvas, registerRender, registerUpdate, scenes, goToScene, scale } from "../canvas";
import { mouse, registerKeyUp } from "../input";
import { bubbleColor, dist } from "../utils";
import { isMuted, playSound, toggleMute } from "../sounds";
import * as background from "../background";

let time;

export function onEnter()
{
	registerUpdate(background.update);
	registerRender(background.render);

	registerRender(render);
	registerUpdate(update);

	registerKeyUp("m", () => {
		toggleMute();
	});

	time = 0;
}

function update(delta)
{
	time += delta;
}

function render(ctx)
{
	ctx.save();
	ctx.translate(canvas.width / 2, 200);

	const titleBubbleSize = canvas.width / 13;
	for (let i = 0; i < 13; i++)
	{
		const x = i * titleBubbleSize - canvas.width / 2 + titleBubbleSize / 2;
		const y = Math.floor(Math.cos(i - time) * titleBubbleSize);
		ctx.bubbleGradient(x, y, titleBubbleSize, bubbleColor(i * 360/13));
		ctx.disk(x, y, titleBubbleSize);
	}

	ctx.fontSize(8);
	ctx.textCenter();
	ctx.fillStyle = bubbleColor((time * 50) % 360);
	ctx.fillText("13 Bubbles", 5, 5);

	ctx.fillStyle = "black";
	ctx.fillText("13 Bubbles", 0, 0);

	ctx.restore();

	ctx.save();
	ctx.translate(300, 600);
	const playBtnRadius = 130;
	bubbleButton(ctx, 0, 0, playBtnRadius, bubbleColor(180), "Play", 6, false);

	if (bubbleButton(ctx, playBtnRadius * 1.3, -playBtnRadius, 60, bubbleColor(90), "Easy", 2))
	{
		playSound("interact");
		goToScene(scenes.game, { difficulty: 0 });
	}

	if (bubbleButton(ctx, playBtnRadius * 1.7, 0, 60, bubbleColor(50), "Normal", 2))
	{
		playSound("interact");
		goToScene(scenes.game, { difficulty: 1 });
	}

	if (bubbleButton(ctx, playBtnRadius * 1.3, playBtnRadius, 60, bubbleColor(0), "Hard", 2))
	{
		playSound("interact");
		goToScene(scenes.game, { difficulty: 2 });
	}
	ctx.restore();

	if (bubbleButton(ctx, canvas.width - 50, canvas.height - 50, 40, bubbleColor(270), "Sound " + (isMuted() ? "off" : "on"), 1))
	{
		toggleMute();
	}

	ctx.fontSize(2);
	ctx.fillText("Made by @NoNiMad", canvas.width / 2, canvas.height - 60);
	ctx.fontSize(1);
	ctx.fillText("Using zzfx(m)", canvas.width / 2, canvas.height - 30);
}

function bubbleButton(ctx, x, y, radius, color, text, textSize, interactable, interactionCheck)
{
	ctx.bubbleGradient(x, y, radius, color);
	ctx.disk(x, y, radius);

	ctx.fontSize(textSize);
	ctx.textCenter();
	ctx.fillStyle = "black";
	ctx.fillText(text, x, y);

	if (interactable === false)
		return false;

	const absolutePoint = new DOMPoint(x, y).matrixTransform(ctx.getTransform());
	const mouseOnButton = dist(absolutePoint.x, absolutePoint.y, mouse.x, mouse.y) < radius * scale;

	if (mouseOnButton)
	{
		ctx.lineWidth = 2;
		ctx.strokeStyle = "black";
		ctx.circle(x, y, radius);

		if (interactionCheck?.() || mouse.up)
			return true;
	}

	return false;
}