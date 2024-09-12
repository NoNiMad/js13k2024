import { canvas, registerRender, registerUpdate, scenes, goToScene } from "../canvas";
import { mouse } from "../input";
import { bubbleColor, dist } from "../utils";

function render(ctx)
{
	ctx.font = "8em Calibri";
	ctx.textAlign = "center";
	ctx.fillText("13 Bubbles", canvas.width / 2, 200);

	ctx.save();
	ctx.translate(300, 600);
	const playBtnRadius = 130;
	bubbleButton(ctx, 0, 0, playBtnRadius, bubbleColor(180), "Play", 6);

	if (bubbleButton(ctx, playBtnRadius * 1.3, -playBtnRadius, 60, bubbleColor(90), "Easy", 2))
	{
		goToScene(scenes.game, { difficulty: 0 });
	}

	if (bubbleButton(ctx, playBtnRadius * 1.7, 0, 60, bubbleColor(50), "Normal", 2))
	{
		goToScene(scenes.game, { difficulty: 1 });
	}

	if (bubbleButton(ctx, playBtnRadius * 1.3, playBtnRadius, 60, bubbleColor(0), "Hard", 2))
	{
		goToScene(scenes.game, { difficulty: 2 });
	}

	/*
	if (bubbleButton(ctx, 0, playBtnRadius * 1.5, 40, bubbleColor(320), "Custom", 1))
	{
		console.log("Custom");
	}
	*/
	ctx.restore();
}

function bubbleButton(ctx, x, y, radius, color, text, fontSize)
{
	const gradient = ctx.createRadialGradient(x + radius / 2, y - radius / 2, radius / 13, x, y, radius);
	gradient.addColorStop(0, "white");
	gradient.addColorStop(1, color);
	ctx.fillStyle = gradient;
	ctx.disk(x, y, radius);

	ctx.font = fontSize + "em Calibri";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "black";
	ctx.fillText(text, x, y);

	if (!mouse.upThisFrame)
		return false;

	const absolutePoint = new DOMPoint(x, y).matrixTransform(ctx.getTransform());
	return dist(absolutePoint.x, absolutePoint.y, mouse.x, mouse.y) < radius;
}

export function onEnter()
{
	registerRender(render);
}

export function onLeave()
{

}