export const mouse = {
	x: 0,
	y: 0,
	downThisFrame: false,
	upThisFrame: false,
	pressed: false,
	wheelThisFrame: 0
};

export let keyboard = [];

export function registerInput(el)
{
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

	el.addEventListener("wheel", (e) => {
		mouse.wheelThisFrame = e.deltaY;
	});

	el.addEventListener("keydown", (e) => {
		keyboard[e.key] = true;
		const cb = listeners.keyDown[e.key];
		if (cb)
		{
			cb();
		}
	});

	el.addEventListener("keyup", (e) => {
		keyboard[e.key] = false;
		const cb = listeners.keyUp[e.key];
		if (cb)
		{
			cb();
		}
	});
}

export function inputAfterLoop()
{
	mouse.upThisFrame = false;
	mouse.downThisFrame = false;
	mouse.wheelThisFrame = 0;
}

let listeners = {};

export function registerKeyDown(key, cb)
{
	listeners.keyDown[key] = cb;
}

export function registerKeyUp(key, cb)
{
	listeners.keyUp[key] = cb;
}

export function clearListeners()
{
	listeners = {
		keyDown: {},
		keyUp: {}
	};
}
clearListeners();