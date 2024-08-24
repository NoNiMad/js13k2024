import { registerDrawUtils } from "./drawUtils";
import { mouse, registerInput } from "./input";
import { init as bubbleInit } from "./bubbles";

export const canvas = {};
let ctx;

const targetFps = 144, targetFrameDuration = 1000 / targetFps;
let time, lastFrame;
function loop()
{
	let oldTime = time;
	time = performance.now();
	let delta = time - oldTime;
	update(delta / 1000);

	if (time - lastFrame >= targetFrameDuration)
	{
		render();
		lastFrame = time;
	}
	
	requestAnimationFrame(loop);
}

let renderers = [];
let updaters = [];

export function requestRender(cb)
{
	renderers.push(cb);
}

export function clearRenderers()
{
	renderers = [];
}

export function requestUpdate(cb)
{
	updaters.push(cb);
}

export function clearUpdaters()
{
	updaters.clear();
}

function render()
{
	ctx.save();

	// Clear screen
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// FPS Counter
	ctx.fillStyle = "black";
	ctx.fillText(Math.floor(1000 / (time - lastFrame)), 10, 20);

	renderers.forEach(renderer => renderer(ctx));

	ctx.restore();
}

function update(delta)
{
	updaters.forEach(updater => updater(delta));

	mouse.upThisFrame = false;
	mouse.downThisFrame = false;
}

export function init()
{
	const el = document.querySelector("canvas");
	canvas.element = el;
	canvas.boundingRect = el.getBoundingClientRect();
	canvas.width = el.width;
	canvas.height = el.height;
	ctx = el.getContext("2d");

	registerInput();
	registerDrawUtils(ctx);

	time = performance.now();
	lastFrame = time - targetFrameDuration;

	bubbleInit();

	loop();
}