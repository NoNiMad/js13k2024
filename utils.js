export function randInt(a, b)
{
	return Math.floor(Math.random() * (b - a) + a);
}

export function randBool()
{
	return Math.random() < 0.5;
}

export function clamp(x, a, b)
{
	return x < a ? a : (x > b ? b : x);
}

export function vec(x, y)
{
	return { x, y };
}

export function mag(vec)
{
	return (vec.x ** 2 + vec.y ** 2) ** (1/2);
}

export function dist(x1, y1, x2, y2)
{
	return mag(vec(x2 - x1, y2 - y1));
}

export function normalize(x, y)
{
	if (typeof(x) == "object")
	{
		y = x.y;
		x = x.y;
	}

	if (x == 0 || y == 0)
		return vec(0, 0);
	const len = Math.sqrt(x * x + y * y);
	return vec(x / len, y / len);
}

export function setMagnitude(vec, magnitude)
{
	const normalized = normalize(vec.x, vec.y);
	switch (typeof(magnitude))
	{
		case "object":
			return { x: normalized.x * magnitude.x, y: normalized.y * magnitude.y };
		case "number":
			return { x: normalized.x * magnitude, y: normalized.y * magnitude };
		default:
			return null;
	}
}

export function bubbleColor(hue)
{
	return `hsla(${hue}, 100%, 80%, 1)`;
}