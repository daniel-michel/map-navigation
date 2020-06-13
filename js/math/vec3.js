import Vec2 from "./vec2.js";

export default class Vec3 extends Vec2
{
	/**
	 * 
	 * @param {number|Vec2|Vec3} x 
	 * @param {number} y 
	 * @param {number} z 
	 */
	constructor(x = 0, y = 0, z = 0)
	{
		if (x instanceof Vec3)
		{
			super(x);
			this.z = x.z;
		}
		else if (x instanceof Vec2)
		{
			super(x);
			this.z = 0;
		}
		else
		{
			super(x, y);
			this.z = z;
		}
	}
	/**
	 * @returns {Vec3}
	 */
	copy()
	{
		return new Vec3(this);
	}
	vec2()
	{
		return new Vec2(this.x, this.y);
	}

	multiply(s)
	{
		this.x *= s;
		this.y *= s;
		this.z *= s;
		return this;
	}
	divide(s)
	{
		this.x /= s;
		this.y /= s;
		this.z /= s;
		return this;
	}
	add(v)
	{
		this.x += v.x;
		this.y += v.y;
		if (v.z !== undefined)
			this.z += v.z;
		return this;
	}
	subtract(v)
	{
		this.x -= v.x;
		this.y -= v.y;
		if (v.z !== undefined)
			this.z -= v.z;
		return this;
	}





	static get i()
	{
		return new Vec3(1, 0, 0);
	}
	static get j()
	{
		return new Vec3(0, 1, 0);
	}
	static get k()
	{
		return new Vec3(0, 0, 1);
	}

	/**
	 * @template T
	 * @param {T} a
	 * @param {T} b
	 * @returns {T}
	 */
	static add(a, b)
	{
		//@ts-ignore
		return a.copy().add(b);
	}
	/**
	 * 
	 * @template T
	 * @param {T} a 
	 * @param {T} b 
	 * @param {number} t 
	 * @returns {T}
	 */
	static interpolate(a, b, t)
	{
		// @ts-ignore
		return Vec3.add(a.copy().multiply(1 - t), b.copy().multiply(t));
	}

	/**
	 * 
	 * @param {Vec3} a 
	 * @param {Vec3} b 
	 * @returns {Vec3}
	 */
	static crossProduct3d(a, b)
	{
		return new Vec3(
			a.y * b.z - a.z * b.y,
			a.z * b.x - a.x * b.z,
			a.x * b.y - a.y * b.x
		);
	}
	static dotProduct(a, b)
	{
		return a.x * b.x + a.y * b.y + a.z * b.z;
	}
}