import { canvas } from "./canvas";

export const mouse = {
	x: 0,
	y: 0,
	downThisFrame: false,
	upThisFrame: false,
	pressed: false
};

export function registerInput()
{
	const el = canvas.element;

	el.addEventListener("mousedown", (e) => {
		mouse.x = e.offsetX;
		mouse.y = e.offsetY;
		mouse.pressed = true;
		mouse.downThisFrame = true;
	});

	el.addEventListener("mouseup", (e) => {
		mouse.x = e.offsetX;
		mouse.y = e.offsetY;
		mouse.pressed = false;
		mouse.upThisFrame = true;
	});

	el.addEventListener("mousemove", (e) => {
		mouse.x = e.offsetX;
		mouse.y = e.offsetY;
	});

	el.addEventListener("keydown", (e) => {
		const cb = listeners.keyDown[e.key];
		if (cb)
		{
			cb();
		}
	});

	el.addEventListener("keyup", (e) => {
		const cb = listeners.keyUp[e.key];
		if (cb)
		{
			cb();
		}
	});
}

const listeners = {
	keyDown: {},
	keyUp: {}
};

export function registerKeyDown(key, cb)
{
	listeners.keyDown[key] = cb;
}

export function registerKeyUp(key, cb)
{
	listeners.keyUp[key] = cb;
}