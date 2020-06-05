import Vec2 from "./vec2.js";


export default class Rect
{
	/**
	 * 
	 * @param {Vec2} center 
	 * @param {Vec2} halfSize 
	 */
	constructor(center = new Vec2(), halfSize = new Vec2())
	{
		this.center = center;
		this.halfSize = halfSize;
	}
	copy()
	{
		return new Rect(this.center.copy(), this.halfSize.copy());
	}
	get left()
	{
		return this.center.x - this.halfSize.x;
	}
	get right()
	{
		return this.center.x + this.halfSize.x;
	}
	get top()
	{
		return this.center.y + this.halfSize.y;
	}
	get bottom()
	{
		return this.center.y - this.halfSize.y;
	}
	get width()
	{
		return this.halfSize.x * 2;
	}
	get height()
	{
		return this.halfSize.y * 2;
	}
	/**
	 * 
	 * @param {number} left 
	 * @param {number} right 
	 * @param {number} bottom 
	 * @param {number} top 
	 */
	static fromBounds(left, right, bottom, top)
	{
		return new Rect(new Vec2(right + left, top + bottom).divide(2), new Vec2(right - left, top - bottom).divide(2));
	}
	/**
	 * 
	 * @param {Rect} a 
	 * @param {Rect} b 
	 */
	static overlap(a, b)
	{
		return a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;
	}
	static touch(a, b)
	{
		return a.left <= b.right && a.right >= b.left && a.bottom <= b.top && a.top >= b.bottom;
	}
	/**
	 * 
	 * @param  {...(Rect|Vec2)} rects 
	 */
	static createContaining(...rects)
	{
		let left = Infinity;
		let right = -Infinity;
		let bottom = Infinity;
		let top = -Infinity;
		for (let rect of rects)
		{
			if (rect instanceof Rect)
			{
				left = Math.min(left, rect.left);
				right = Math.max(right, rect.right);
				bottom = Math.min(bottom, rect.bottom);
				top = Math.max(top, rect.top);
			}
			else
			{
				left = Math.min(left, rect.x);
				right = Math.max(right, rect.x);
				bottom = Math.min(bottom, rect.y);
				top = Math.max(top, rect.y);
			}
		}
		return Rect.fromBounds(left, right, bottom, top);
	}
}



export class RectsShape
{
	constructor()
	{
		/**
		 * @type {Rect[]}
		 */
		this.rectangles = [];
	}
	/**
	 * 
	 * @param {Rect|RectsShape} addrect 
	 * @returns {Rect[]} the area that is actually new
	 */
	add(addrect)
	{
		/**
		 * @type {Rect[]}
		 */
		let addrects;
		if (addrect instanceof RectsShape)
			addrects = addrect.rectangles;
		else
			addrects = [addrect];
		for (let r of this.rectangles)
		{
			/**
			 * @type {Rect[]}
			 */
			let newRects = [];
			for (let rect of addrects)
			{
				newRects.push(...RectsShape.subtractRectangles(rect, r));
			}
			addrects = newRects;
		}
		this.rectangles.push(...addrects);
		//this.simplify();
		return addrects
	}
	/**
	 * 
	 * @param {Rect|RectsShape} rect 
	 */
	subtract(rect)
	{

	}

	simplify()
	{
		let replace = (a, b) =>
		{
			if (a >= b)
				throw "b has to be bigger than a";
			this.rectangles.push(Rect.fromBounds(Math.min(a.left, b.left), Math.max(a.right, b.right), Math.min(a.bottom, b.bottom), Math.max(a.top, b.top)));
			this.rectangles.splice(b, 1);
			this.rectangles.splice(a, 1);
		};
		for (let i = 0; i < this.rectangles.length; i++)
		{
			let a = this.rectangles[i];
			for (let j = i + 1; j < this.rectangles.length; j++)
			{
				let b = this.rectangles[j];
				if (a.left === b.left && a.width === b.width && (a.bottom === b.top || a.top === b.bottom))
				{
					replace(i, j);
					i = -1;
					break;
					//this.rectangles.push(Rect.fromBounds(a.left, a.right, Math.min(a.bottom, b.bottom), Math.max(a.top, b.top)));
				}
				if (a.bottom === b.bottom && a.height === b.height && (a.left === b.right || a.right === b.left))
				{
					replace(i, j);
					i = -1;
					break;
					//this.rectangles.push(Rect.fromBounds(Math.min(a.left, b.left), Math.max(a.right, b.right), a.bottom, a.top));
				}
			}
		}
	}

	/**
	 * 
	 * @param {Rect} a 
	 * @param {Rect} b 
	 */
	static addRectangles(a, b)
	{
		let rectsA = [a, ...RectsShape.subtractRectangles(b, a)];
		let rectsB = [b, ...RectsShape.subtractRectangles(a, b)];
		if (rectsA.length <= rectsB.length)
			return rectsA;
		else
			return rectsB;
	}
	/**
	 * 
	 * @param {Rect} a 
	 * @param {Rect} b 
	 */
	static subtractRectangles(a, b)
	{
		let rects = [];
		if (a.left < b.left)
		{
			rects.push(Rect.fromBounds(a.left, Math.min(a.right, b.left), Math.max(a.bottom, b.bottom), a.top));
		}
		if (a.bottom < b.bottom)
		{
			rects.push(Rect.fromBounds(a.left, Math.min(a.right, b.right), a.bottom, Math.min(a.top, b.bottom)));
		}
		if (a.top > b.top)
		{
			rects.push(Rect.fromBounds(Math.max(a.left, b.left), a.right, Math.max(a.bottom, b.top), a.top));
		}
		if (a.right > b.right)
		{
			rects.push(Rect.fromBounds(Math.max(a.left, b.right), a.right, a.bottom, Math.min(a.top, b.top)));
		}
		rects = rects.filter(rect => rect.width > 0 && rect.height > 0);
		return rects;
	}
	/**
	 * 
	 * @param {Rect} a 
	 * @param {Rect} b 
	 */
	static overlapRectangles(a, b)
	{
		let rect = Rect.fromBounds(Math.max(a.left, b.left), Math.min(a.right, b.right), Math.max(a.bottom, b.bottom), Math.min(a.top, b.top));
		if (rect.width > 0 && rect.height > 0)
			return rect;
		else
			return undefined;
	}
}


export class RectGrid
{
	constructor()
	{
		this.columns = [0];
		this.rows = [0];
		this.filled = [];
	}

	/**
	 * 
	 * @param {Rect} rect 
	 */
	addRectangle(rect)
	{
		let column_start = this.addColumn(rect.left);
		let column_end = this.addColumn(rect.right);
		let row_start = this.addRow(rect.bottom);
		let row_end = this.addRow(rect.top);
		this.setArea(column_start, column_end, row_start, row_end, true);
		this.simplify();
	}
	/**
	 * 
	 * @param {Rect} rect 
	 */
	subtractRectangle(rect)
	{
		let column_start = this.addColumn(rect.left);
		let column_end = this.addColumn(rect.right);
		let row_start = this.addRow(rect.bottom);
		let row_end = this.addRow(rect.top);
		this.setArea(column_start, column_end, row_start, row_end, false);
		this.simplify();
	}
	getRects(filled = true)
	{
		let rects = [];
		for (let i = 0; i < this.columns.length - 1; i++)
		{
			for (let j = 0; j < this.rows.length - 1; j++)
			{
				if (this.filled[i][j] === filled)
				{
					rects.push(Rect.fromBounds(this.columns[i], this.columns[i + 1], this.rows[j], this.rows[j + 1]));
				}
			}
		}
		return rects;
	}
	/**
	 * 
	 * @param {number} cs 
	 * @param {number} ce 
	 * @param {number} rs 
	 * @param {number} re 
	 * @param {boolean} value 
	 */
	setArea(cs, ce, rs, re, value)
	{
		for (let column = cs; column < ce; column++)
		{
			for (let row = rs; row < re; row++)
			{
				this.filled[column][row] = value;
			}
		}
	}
	addColumn(pos)
	{
		let index = RectGrid.addToSortedArray(this.columns, pos);
		if (this.columns.length > this.filled.length + 1)
		{
			if (index === 0 || index === this.columns.length - 1)
				this.filled.splice(index, 0, new Array(this.rows.length - 1).fill(false));
			else
				this.filled.splice(index, 0, this.filled[index - 1].map(v => v));
		}
		return index;
	}
	addRow(pos)
	{
		let index = RectGrid.addToSortedArray(this.rows, pos);
		if (this.rows.length > this.filled[0].length + 1)
		{
			if (index === 0 || index === this.rows.length - 1)
				for (let i = 0; i < this.columns.length - 1; i++)
					this.filled[i].splice(index, 0, false);
			else
				for (let i = 0; i < this.columns.length - 1; i++)
					this.filled[i].splice(index, 0, this.filled[i][index - 1]);
		}
		return index;
	}
	uniteColumns(column)
	{
		this.columns.splice(column + 1, 1);
		this.filled.splice(column + 1, 1);
	}
	uniteRows(row)
	{
		this.rows.splice(row + 1, 1);
		for (let column = 0; column < this.columns.length - 1; column++)
			this.filled[column].splice(row + 1, 1);
	}

	simplify()
	{
		//columns
		for (let column = 0; column < this.columns.length - 2; column++)
		{
			let same = true;
			for (let row = 0; row < this.rows.length - 1; row++)
			{
				if (this.filled[column][row] !== this.filled[column + 1][row])
				{
					same = false;
					break;
				}
			}
			if (same)
			{
				this.uniteColumns(column);
				column--;
			}
		}
		//rows
		for (let row = 0; row < this.rows.length - 2; row++)
		{
			let same = true;
			for (let column = 0; column < this.columns.length - 1; column++)
			{
				if (this.filled[column][row] !== this.filled[column][row + 1])
				{
					same = false;
					break;
				}
			}
			if (same)
			{
				this.uniteRows(row);
				row--;
			}
		}
	}



	static addToSortedArray(array, num)
	{
		if (array.length === 0)
		{
			array[0] = num;
			return 0;
		}
		else
		{
			let min = -1;
			let max = array.length;
			while (true)
			{
				if (max - min <= 1)
				{
					array.splice(max, 0, num);
					return max;
				}
				let center = Math.floor((min + max) / 2);
				if (num === array[center])
					return center;
				if (num > array[center])
					min = center;
				else
					max = center;
			}
		}
	}

	/**
	 * 
	 * @param {RectsShape} rectShape 
	 */
	static simplifyRectShape(rectShape)
	{
		let rectGrid = new RectGrid();
		for (let rect of rectShape.rectangles)
			rectGrid.addRectangle(rect);
		return rectGrid.getRects();
	}
}