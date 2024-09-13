export const mouse = {
	x: 0,
	y: 0,
	down: false,
	up: false,
	pressed: false,
	wheel: 0
};

export let keyboard = [];

export function registerInput(el)
{
	el.addEventListener("mousedown", (e) => {
		mouse.x = e.offsetX;
		mouse.y = e.offsetY;
		mouse.down = true;
		mouse.pressed = true;
	});

	el.addEventListener("mouseup", (e) => {
		mouse.x = e.offsetX;
		mouse.y = e.offsetY;
		mouse.up = true;
		mouse.pressed = false;
	});

	el.addEventListener("mousemove", (e) => {
		mouse.x = e.offsetX;
		mouse.y = e.offsetY;
	});

	el.addEventListener("wheel", (e) => {
		mouse.wheel = e.deltaY;
	});

	el.addEventListener("keydown", (e) => {
		if (!keyboard[e.key])
			keyboard[e.key] = {};

		keyboard[e.key].down = true;
		keyboard[e.key].pressed = true;
		const cb = listeners.keyDown[e.key];
		if (cb)
		{
			cb();
		}
	});

	el.addEventListener("keyup", (e) => {
		keyboard[e.key].up = true;
		keyboard[e.key].pressed = false;
		const cb = listeners.keyUp[e.key];
		if (cb)
		{
			cb();
		}
	});
}

export function inputAfterLoop()
{
	mouse.up = false;
	mouse.down = false;
	mouse.wheel = 0;

	for (const key of keyboard)
	{
		key.up = false;
		key.down = false;
	}
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