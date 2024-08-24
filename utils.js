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