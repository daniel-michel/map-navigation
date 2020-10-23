
export default class Vec2
{
	/**
	 * 
	 * @param {number | Vec2} x 
	 * @param {number} y 
	 */
	constructor(x = 0, y = 0)
	{
		if (x instanceof Vec2)
		{
			this.x = x.x;
			this.y = x.y;
		}
		else
		{
			this.x = x;
			this.y = y;
		}
	}
	get heading()
	{
		return Math.atan2(this.y, this.x);
	}
	get length()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	set length(length)
	{
		let l = this.length;
		this.multiply(length / this.length);
	}
	copy()
	{
		return new Vec2(this);
	}
	/**
	 * @returns {[number, number]}
	 */
	toArray()
	{
		return [this.x, this.y];
	}
	/**
	 * 
	 * @param {Vec2} v 
	 */
	equals(v)
	{
		return this.x === v.x && this.y === v.y;
	}
	/**
	 * 
	 * @param {number} s 
	 */
	divide(s)
	{
		this.x /= s;
		this.y /= s;
		return this;
	}
	/**
	 * 
	 * @param {Number} s 
	 */
	multiply(s)
	{
		this.x *= s;
		this.y *= s;
		return this;
	}


	normalize()
	{
		this.divide(this.length);
		return this;
	}
	/**
	 * 
	 * @param {Vec2} v 
	 */
	add(v)
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	/**
	 * 
	 * @param {Vec2} v 
	 */
	subtract(v)
	{
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	rotate90DegRight()
	{
		[this.x, this.y] = [this.y, -this.x];
		return this;
	}
	rotate90DegLeft()
	{
		[this.x, this.y] = [-this.y, this.x];
	}
	/**
	 * 
	 * @param {Vec2} v 
	 */
	dotProduct(v)
	{
		return this.x * v.x + this.y * v.y;
	}

	/**
	 * 
	 * @param {number} angle the angle in radians
	 * @param {number} length 
	 */
	static fromAngle(angle, length = 1)
	{
		return new Vec2(Math.cos(angle), Math.sin(angle)).multiply(length);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 */
	static squaredDistance(a, b)
	{
		return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 */
	static distance(a, b)
	{
		return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 * @returns {number}
	 */
	static dotProduct(a, b)
	{
		return a.x * b.x + a.y * b.y;
	}

	static crossProduct(a, b)
	{
		return (a.x * b.y) - (a.y * b.x);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 * @returns {Vec2}
	 */
	static add(a, b)
	{
		return new Vec2(a.x + b.x, a.y + b.y);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 */
	static subtract(a, b)
	{
		return new Vec2(a.x - b.x, a.y - b.y);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 * @param {number} t 
	 */
	static interpolate(a, b, t)
	{
		return Vec2.add(a.copy().multiply(1 - t), b.copy().multiply(t));
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 * @param {Vec2} c 
	 */
	static isCollinear(a, b, c, tolerance = 0.001) // might not be the best approach. it depends on the scale whether it actually looks collinear.
	{
		return Math.abs(this.area(a, b, c)) < tolerance;
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 * @param {Vec2} c 
	 */
	static area(a, b, c)
	{
		return a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y);
	}
	/**
	 * Calculates for two line segments the point of intersection as well as whether they intersect in the given segments.
	 * @param {Vec2} a0 Start of first line segment.
	 * @param {Vec2} a1 End of first line segment.
	 * @param {Vec2} b0 Start of second line segment.
	 * @param {Vec2} b1 End of second line segment.
	 * @returns {{intersect: boolean, point: Vec2}} The point of intersection and whether they intersect. The point will be undefined if the lines are parallel to each other.
	 */
	static lineIntersect(a0, a1, b0, b1)
	{
		let x1 = a0.x, x2 = a1.x, x3 = b0.x, x4 = b1.x;
		let y1 = a0.y, y2 = a1.y, y3 = b0.y, y4 = b1.y;
		let denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (denominator === 0)
			return { intersect: false, point: undefined };
		let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
		let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
		let p = new Vec2(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
		return { intersect: (0 <= t && t <= 1) && (0 <= u && u <= 1), point: p };
	}

	/**
	 * The closest point to p on a line going from ls to le.
	 * @param {Vec2} ls the start of the line
	 * @param {Vec2} le the end of the line
	 * @param {Vec2} p
	 */
	static closestPointOnLine(ls, le, p)
	{
		let point = Vec2.closestPointOnInfiniteLine(ls, le, p);
		let lineLength = Vec2.distance(ls, le);
		let distFromStart = Vec2.distance(point, ls);
		let t = distFromStart / lineLength;
		let clamped = false;
		let distToEnd = Vec2.distance(point, le);
		if (distToEnd > lineLength || distFromStart > lineLength)
		{
			if (distToEnd > distFromStart)
			{
				point = ls;
				t = 0;
				clamped = true;
			}
			else
			{
				point = le;
				t = 1;
				clamped = true;
			}
		}
		return { point, clamped, t };
	}

	/**
	 * The closest point to p on an infinite line going through ls and le.
	 * @param {Vec2} ls first point the line goes through
	 * @param {Vec2} le second point the line goes through
	 * @param {Vec2} p 
	 * @returns {Vec2}
	 */
	static closestPointOnInfiniteLine(ls, le, p)
	{
		if (ls.y === le.y)
		{
			if (ls.x === le.x)
				return new Vec2(ls);
			return new Vec2(p.x, ls.y);
		}
		if (ls.x === le.x)
			return new Vec2(ls.x, p.y);

		// function going through the points ls and le:
		// y = slope * x + b
		let slope = (ls.y - le.y) / (ls.x - le.x);
		// b = y - slope * x
		let b = ls.y - slope * ls.x;

		// perpendicular function to (normal of) the line ls, le going through point p:
		// y = normalSlope * x + b
		let normalSlope = -1 / slope;
		// normalb = y - normalSlope * x
		let normalb = p.y - normalSlope * p.x;

		// calculate intersection of the line and the normal going through p
		// slope * x + b = normalSlope * x + normalb | -normalSlope * x; -b
		// slope * x - normalSlope * x = normalb - b
		// x * (slope - normalSlope) = normalb - b   | /(slope - normalSlope)
		// x = (normalb - b) / (slope - normalSlope)
		let x = (normalb - b) / (slope - normalSlope);
		let y = slope * x + b;
		return new Vec2(x, y);
	}
}