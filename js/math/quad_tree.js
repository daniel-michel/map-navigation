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
		else
		{
			this.children = {};
			this.childrenBounds = {
				left_bottom: Rect.fromBounds(this.area.left, this.area.center.x, this.area.bottom, this.area.center.y),
				left_top: Rect.fromBounds(this.area.left, this.area.center.x, this.area.center.y, this.area.top),
				right_bottom: Rect.fromBounds(this.area.center.x, this.area.right, this.area.bottom, this.area.center.y),
				right_top: Rect.fromBounds(this.area.center.x, this.area.right, this.area.center.y, this.area.top),
			};
		}
	}
	getChildren()
	{
		return Object.values(this.children);
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get left_bottom()
	{
		if (!this.children.left_bottom)
			this.children.left_bottom = new QuadTree(this.childrenBounds.left_bottom, this.depth - 1);
		return this.children.left_bottom;
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get left_top()
	{
		if (!this.children.left_top)
			this.children.left_top = new QuadTree(this.childrenBounds.left_top, this.depth - 1);
		return this.children.left_top;
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get right_bottom()
	{
		if (!this.children.right_bottom)
			this.children.right_bottom = new QuadTree(this.childrenBounds.right_bottom, this.depth - 1);
		return this.children.right_bottom;
	}
	/**
	 * @type {QuadTree<T>}
	 */
	get right_top()
	{
		if (!this.children.right_top)
			this.children.right_top = new QuadTree(this.childrenBounds.right_top, this.depth - 1);
		return this.children.right_top;
	}
	isEmpty()
	{
		if (this.last)
			return this.elements.length === 0;
		else
			return this.getChildren().every(child => child.isEmpty());
	}
	/**
	 * 
	 * @param {QuadTreeElement|QuadTreeElement[]} obj
	 * @param {boolean} check_containing
	 */
	add(obj, check_containing = true)
	{
		if (obj instanceof Array)
		{
			for (let element of obj)
				this.add(element, check_containing);
			return;
		}
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
				if (area.bottom < this.area.center.y && this.children.left_bottom)
					objects = objects.concat(this.left_bottom.get(area));
				if (area.top > this.area.center.y && this.children.left_top)
					objects = objects.concat(this.left_top.get(area));
			}
			if (area.right > this.area.center.x)
			{
				if (area.bottom < this.area.center.y && this.children.right_bottom)
					objects = objects.concat(this.right_bottom.get(area));
				if (area.top > this.area.center.y && this.children.right_top)
					objects = objects.concat(this.right_top.get(area));
			}
			return objects;
		}
	}
	getAll()
	{
		if (this.last)
		{
			return this.elements;
		}
		else
		{
			return this.getChildren().map(child => child.getAll()).reduce((a, b) => a.concat(b), []);
		}
	}
	/**
	 * 
	 * @param {Rect} area 
	 * @param {Rect} exclude 
	 * @returns {QuadTreeElement[]}
	 */
	getDifference(area, exclude)
	{
		if (this.last)
		{
			let objects = [];
			for (let obj of this.elements)
			{
				let obj_area = obj.area;
				if (Rect.touch(area, obj_area) && !(
					(obj_area.top > this.area.top && area.top > this.area.top) ||
					(obj_area.right > this.area.right && area.right > this.area.right)) &&
					!Rect.touch(exclude, obj_area))
					objects.push(obj);
			}
			return objects;
		}
		else
		{
			/**
			 * @type {QuadTreeElement[]}
			 */
			let objects = [];
			if (area.left < this.area.center.x)
			{
				if (area.bottom < this.area.center.y && this.children.left_bottom && !exclude.contains(this.childrenBounds.left_bottom))
					objects = objects.concat(this.left_bottom.getDifference(area, exclude));
				if (area.top > this.area.center.y && this.children.left_top && !exclude.contains(this.childrenBounds.left_top))
					objects = objects.concat(this.left_top.getDifference(area, exclude));
			}
			if (area.right > this.area.center.x)
			{
				if (area.bottom < this.area.center.y && this.children.right_bottom && !exclude.contains(this.childrenBounds.right_bottom))
					objects = objects.concat(this.right_bottom.getDifference(area, exclude));
				if (area.top > this.area.center.y && this.children.right_top && !exclude.contains(this.childrenBounds.right_top))
					objects = objects.concat(this.right_top.getDifference(area, exclude));
			}
			return objects;
		}
	}

	clear()
	{
		if (this.last)
		{
			this.elements = [];
		}
		else
		{
			delete this.children.left_bottom;
			delete this.children.left_top;
			delete this.children.right_bottom;
			delete this.children.right_top;
		}
	}

	/**
	 * 
	 * @param {Rect} area 
	 * @returns {QuadTreeElement[]}
	 */
	onlyKeepArea(area)
	{
		if (area.contains(this.area))
			return [];
		/* if (!Rect.touch(this.area, area))
		{
			this.clear();
			return;
		} */
		if (this.last)
		{
			let allElelements = this.elements;
			this.elements = [];
			let deleted = [];
			for (let element of allElelements)
			{
				if (Rect.touch(area, element.area))
					this.elements.push(element);
				else
					deleted.push(element);
			}
			return deleted;
		}
		else
		{
			/* if (area.right < this.area.center.x)
			{
				delete this.children.right_bottom;
				delete this.children.right_top;
			}
			if (area.left > this.area.center.x)
			{
				delete this.children.left_bottom;
				delete this.children.left_top;
			}
			if (area.top < this.area.center.y)
			{
				delete this.children.right_top;
				delete this.children.left_top;
			}
			if (area.bottom > this.area.center.y)
			{
				delete this.children.right_bottom;
				delete this.children.left_bottom;
			} */
			
			let deleted = this.getChildren().map(child => child.onlyKeepArea(area)).reduce((a, b) => a.concat(b), []);
			this.removeEmptyChildren();
			return deleted;
		}
	}

	/**
	 * @private
	 */
	removeEmptyChildren()
	{
		if (this.last)
		{
			console.warn("removeEmptyChildren has been called on the last object of a QuadTree!");
			return;
		}
		for (let childName in this.children)
		{
			if (this.children[childName].isEmpty())
				delete this.children[childName];
		}
	}
}