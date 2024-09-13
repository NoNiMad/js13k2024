import { registerDrawUtils } from "./drawUtils";
import { registerInput, inputAfterLoop, clearListeners } from "./input";

import * as menuScene from "./scenes/menu";
import * as gameScene from "./scenes/game";
import * as customGameScene from "./scenes/customGame";

export const canvas = {};
let ctx;
let scale = 1;

export function init()
{
	const el = document.querySelector("canvas");
	canvas.element = el;
	canvas.boundingRect = el.getBoundingClientRect();
	canvas.width = el.width;
	canvas.height = el.height;
	ctx = el.getContext("2d");

	registerInput(el);
	registerDrawUtils(ctx);

	time = performance.now();
	lastFrame = time - targetFrameDuration;

	window.addEventListener("resize", resize);
	resize();

	goToScene(scenes.menu);

	loop();
}

function resize()
{
	scale = Math.min(window.innerHeight / 1280, 1);
	canvas.element.width = 720 * scale;
	canvas.element.height = 1280 * scale;
}

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
	
	inputAfterLoop();

	requestAnimationFrame(loop);
}

function render()
{
	ctx.save();
	ctx.scale(scale, scale);

	// Clear screen
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// FPS Counter
	ctx.fillStyle = "black";
	ctx.fillText(Math.floor(1000 / (time - lastFrame)), 10, 20);

	renderers.forEach(renderer => {
		ctx.save();
		renderer(ctx);
		ctx.restore();
	});

	ctx.restore();
}

function update(delta)
{
	updaters.forEach(updater => updater(delta));
}

let renderers = [];
let updaters = [];

export function registerRender(cb)
{
	renderers.push(cb);
}

export function registerUpdate(cb)
{
	updaters.push(cb);
}

//#region Scenes

export const scenes = {
	menu: menuScene,
	game: gameScene,
	customGame: customGameScene
};
let currentScene = null;

export function goToScene(scene, context)
{
	currentScene?.onLeave?.();

	renderers = [];
	updaters = [];
	clearListeners();

	currentScene = scene;
	currentScene.onEnter(context);
}

//#endregion