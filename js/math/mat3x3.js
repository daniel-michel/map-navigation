import Vec3 from "./vec3.js";

export default class Mat3x3
{
	/**
	 * 
	 * @param {number | number[][]} m00 
	 * @param {number} m01 
	 * @param {number} m02 
	 * @param {number} m10 
	 * @param {number} m11 
	 * @param {number} m12 
	 * @param {number} m20 
	 * @param {number} m21 
	 * @param {number} m22 
	 */
	constructor(m00 = 0, m01 = 0, m02 = 0, m10 = 0, m11 = 0, m12 = 0, m20 = 0, m21 = 0, m22 = 0)
	{
		if (m00 instanceof Array)
			this.m = m00;
		else
		{
			this.m = [
				[m00, m01, m02],
				[m10, m11, m12],
				[m20, m21, m22]
			];
		}
	}
	/**
	 * 
	 * @param {Mat3x3} m 
	 * @param {Mat3x3 | Vec3} v 
	 * @returns {Mat3x3 | Vec3}
	 */
	static multiply(m, v)
	{
		if (v instanceof Vec3)
		{
			return new Vec3(
				m.m[0][0] * v.x + m.m[0][1] * v.y + m.m[0][2] * v.z,
				m.m[1][0] * v.x + m.m[1][1] * v.y + m.m[1][2] * v.z,
				m.m[2][0] * v.x + m.m[2][1] * v.y + m.m[2][2] * v.z);
		}
		else if (v instanceof Mat3x3)
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
			return new Mat3x3(result)
		}
	}
	/**
	 *
	 * @param {Mat3x3} m
	 * @param {Vec3} v
	 * @returns {Vec3}
	 */
	static multiply_vector(m, v)
	{
		return new Vec3(
			m.m[0][0] * v.x + m.m[0][1] * v.y + m.m[0][2] * v.z,
			m.m[1][0] * v.x + m.m[1][1] * v.y + m.m[1][2] * v.z,
			m.m[2][0] * v.x + m.m[2][1] * v.y + m.m[2][2] * v.z);
	}

	static createRotationMatrix(x, y, z)
	{
		if (x instanceof Vec3)
			// @ts-ignore
			return Mat3x3.multiply(Mat3x3.multiply(Mat3x3.createXRotationMatrix(x.x), Mat3x3.createYRotationMatrix(x.y)), Mat3x3.createZRotationMatrix(x.z));
		else
			// @ts-ignore
			return Mat3x3.multiply(Mat3x3.multiply(Mat3x3.createXRotationMatrix(x), Mat3x3.createYRotationMatrix(y)), Mat3x3.createZRotationMatrix(z));
	}
	static create_reverse_rotation_matrix(x, y, z)
	{
		if (x instanceof Vec3)
			// @ts-ignore
			return Mat3x3.multiply(Mat3x3.multiply(Mat3x3.createZRotationMatrix(-x.z), Mat3x3.createYRotationMatrix(-x.y)), Mat3x3.createXRotationMatrix(-x.x));
		else
			// @ts-ignore
			return Mat3x3.multiply(Mat3x3.multiply(Mat3x3.createZRotationMatrix(-z), Mat3x3.createYRotationMatrix(-y)), Mat3x3.createXRotationMatrix(-x));
	}

	static createXRotationMatrix(r)
	{
		let m = [
			[1, 0, 0],
			[0, Math.cos(r), -Math.sin(r)],
			[0, Math.sin(r), Math.cos(r)]
		];
		return new Mat3x3(m);
	}

	static createYRotationMatrix(r)
	{
		let m = [
			[Math.cos(r), 0, Math.sin(r)],
			[0, 1, 0],
			[-Math.sin(r), 0, Math.cos(r)]
		];
		return new Mat3x3(m);
	}

	static createZRotationMatrix(r)
	{
		let m = [
			[Math.cos(r), -Math.sin(r), 0],
			[Math.sin(r), Math.cos(r), 0],
			[0, 0, 1]
		];
		return new Mat3x3(m);
	}
}