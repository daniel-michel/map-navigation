import Vec2 from "./vec2.js";

export default class Mat2x2
{
	constructor(m00, m01, m10, m11)
	{
		if (m00 instanceof Array)
			this.m = m00;
		else
		{
			this.m = [
				[m00, m01],
				[m10, m11]
			];
		}
	}

	/**
	 * 
	 * @template {Vec2|Mat2x2} T
	 * @param {Mat2x2} m 
	 * @param {T} v 
	 * @returns {T}
	 */
	static multiply(m, v)
	{
		if (v instanceof Vec2)
			return new Vec2(m.m[0][0] * v.x + m.m[0][1] * v.y, m.m[1][0] * v.x + m.m[1][1] * v.y);
		else if (v instanceof Mat2x2)
		{
			let result = [];
			for (let i = 0; i < m.m.length; i++)
			{
				result[i] = [];
				for (let j = 0; j < v.m[0].length; j++)
				{
					result[i][j] = 0;
					for (let k = 0; k < m.m[i].length; k++)
						result[i][j] += m.m[i][k] * v.m[k][j];
				}
			}
			return new Mat2x2(result);
		}
	}

	static create_rotation_matrix(r)
	{
		return new Mat2x2(Math.cos(r), -Math.sin(r), Math.sin(r), Math.cos(r));
	}
}