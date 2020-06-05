import Rect from "./rect.js";



/**
 * @template T
 */
export default class QuadTree
{
	/**
	 * @typedef {{area: Rect, elem: T}} QuadTreeElement
	 */
	/**
	 * 
	 * @param {Rect} area
	 */
	constructor(area, depth = 0)
	{
		this.area = area;
		this.depth = depth;
		this.last = depth <= 0;
		if (this.last)
		{
			/**
			 * @type {QuadTreeElement[]}
			 */
			this.elements = [];
			return;
		}
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get left_bottom()
	{
		if (!this.left_bottom_var)
			this.left_bottom_var = new QuadTree(Rect.fromBounds(this.area.left, this.area.center.x, this.area.bottom, this.area.center.y), this.depth - 1);
		return this.left_bottom_var;
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get left_top()
	{
		if (!this.left_top_var)
			this.left_top_var = new QuadTree(Rect.fromBounds(this.area.left, this.area.center.x, this.area.center.y, this.area.top), this.depth - 1);
		return this.left_top_var;
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get right_bottom()
	{
		if (!this.right_bottom_var)
			this.right_bottom_var = new QuadTree(Rect.fromBounds(this.area.center.x, this.area.right, this.area.bottom, this.area.center.y), this.depth - 1);
		return this.right_bottom_var;
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get right_top()
	{
		if (!this.right_top_var)
			this.right_top_var = new QuadTree(Rect.fromBounds(this.area.center.x, this.area.right, this.area.center.y, this.area.top), this.depth - 1);
		return this.right_top_var;
	}
	/**
	 * 
	 * @param {QuadTreeElement} obj
	 * @param {boolean} check_containing
	 */
	add(obj, check_containing = true)
	{
		if (check_containing)
		{
			let area = obj.area;
			if (!Rect.touch(area, this.area))
				return false;
		}
		if (this.last)
		{
			this.elements.push(obj);
			return;
		}

		let area = obj.area;
		if (area.left < this.area.center.x)
		{
			if (area.bottom < this.area.center.y)
				this.left_bottom.add(obj, false);
			if (area.top > this.area.center.y)
				this.left_top.add(obj, false);
		}
		if (area.right > this.area.center.x)
		{
			if (area.bottom < this.area.center.y)
				this.right_bottom.add(obj, false);
			if (area.top > this.area.center.y)
				this.right_top.add(obj, false);
		}
	}
	/**
	 * 
	 * @param {Rect} area 
	 * @returns {T[]}
	 */
	get(area)
	{
		if (this.last)
		{
			let objects = [];
			for (let obj of this.elements)
			{
				let obj_area = obj.area;
				if (Rect.touch(area, obj_area) && !(
					(obj_area.top > this.area.top && area.top > this.area.top) ||
					(obj_area.right > this.area.right && area.right > this.area.right)))
					objects.push(obj.elem);
			}
			return objects;
		}
		else
		{
			/**
			 * @type {T[]}
			 */
			let objects = [];
			if (area.left < this.area.center.x)
			{
				if (area.bottom < this.area.center.y && this.left_bottom_var)
					objects = objects.concat(this.left_bottom.get(area));
				if (area.top > this.area.center.y && this.left_top_var)
					objects = objects.concat(this.left_top.get(area));
			}
			if (area.right > this.area.center.x)
			{
				if (area.bottom < this.area.center.y && this.right_bottom_var)
					objects = objects.concat(this.right_bottom.get(area));
				if (area.top > this.area.center.y && this.right_top_var)
					objects = objects.concat(this.right_top.get(area));
			}
			return objects;
		}
	}
}