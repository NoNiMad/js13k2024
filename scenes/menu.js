import { canvas, registerRender, registerUpdate, scenes, goToScene } from "../canvas";
import { mouse, registerKeyUp } from "../input";
import { bubbleColor, dist } from "../utils";
import { playSound, toggleMute } from "../sounds";
import * as background from "../background";

function render(ctx)
{
	ctx.fontSize(8);
	ctx.textCenter();
	ctx.fillText("13 Bubbles", canvas.width / 2, 200);

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

	ctx.fontSize(2);
	ctx.fillText("Made by @NoNiMad", canvas.width / 2, canvas.height - 60);
	ctx.fontSize(1);
	ctx.fillText("Using zzfx(m)", canvas.width / 2, canvas.height - 30);
}

function bubbleButton(ctx, x, y, radius, color, text, textSize, clickable)
{
	ctx.bubbleGradient(x, y, radius, color);
	ctx.disk(x, y, radius);

	ctx.fontSize(textSize);
	ctx.textCenter();
	ctx.fillStyle = "black";
	ctx.fillText(text, x, y);

	if (clickable === false)
		return false;

	const absolutePoint = new DOMPoint(x, y).matrixTransform(ctx.getTransform());
	const mouseOnButton = dist(absolutePoint.x, absolutePoint.y, mouse.x, mouse.y) < radius;

	if (mouseOnButton)
	{
		ctx.lineWidth = 2;
		ctx.strokeStyle = "black";
		ctx.circle(x, y, radius);

		if (mouse.up)
			return true;
	}

	return false;
}

export function onEnter()
{
	registerUpdate(background.update);
	registerRender(background.render);

	registerRender(render);

	registerKeyUp("m", () => {
		toggleMute();
	});
}

export function onLeave()
{

}