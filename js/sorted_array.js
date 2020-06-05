/**
 * @template T
 */
export default class SortedArray
{
	/**
	 * 
	 * @param {function(T):number} get_value 
	 * @param {T[]} array 
	 */
	constructor(get_value, array = [])
	{
		this.get_value = get_value;
		this.array = array;
		if (array.length > 0)
			this.sort();
	}

	sort()
	{
		this.array.sort((a, b) => this.get_value(a) - this.get_value(b));
	}
	/**
	 * 
	 * @param {number} value 
	 */
	get(value)
	{
		let min = -1;
		let max = this.array.length;
		while (true)
		{
			if (max - min <= 1)
				return null;
			let center = Math.floor((min + max) / 2);
			let v = this.get_value(this.array[center]);
			if (v === value)
				return this.array[center];
			if (value > v)
				min = center;
			else
				max = center;
		}
	}
	shift()
	{
		return this.array.shift();
	}
	pop()
	{
		return this.array.pop();
	}
	/**
	 * 
	 * @param  {...T} elements 
	 */
	push(...elements)
	{
		for (let i = 0; i < elements.length; i++)
			this.add(elements[i]);
	}
	/**
	 * 
	 * @param {T} element 
	 */
	add(element)
	{
		let min = -1;
		let max = this.array.length;
		let v = this.get_value(element);
		while (true)
		{
			if (max - min <= 1)
			{
				this.array.splice(max, 0, element);
				return;
			}
			let center = Math.floor((min + max) / 2);
			if (v > this.get_value(this.array[center]))
				min = center;
			else
				max = center;
		}
	}

	static push(array, get_value, ...elements)
	{
		for (let i = 0; i < elements.length; i++)
			SortedArray.add(array, get_value, elements[i]);
	}

	static add(array, get_value, element)
	{
		let min = -1;
		let max = array.length;
		let v = get_value(element);
		while (true)
		{
			if (max - min <= 1)
			{
				array.splice(max, 0, element);
				return;
			}
			let center = Math.floor((min + max) / 2);
			if (v > get_value(array[center]))
				min = center;
			else
				max = center;
		}
	}

	static get(array, get_value, value)
	{
		let min = -1;
		let max = array.length;
		while (true)
		{
			if (max - min <= 1)
				return null;
			let center = Math.floor((min + max) / 2);
			let v = get_value(array[center]);
			if (v === value)
				return array[center];
			if (value > v)
				min = center;
			else
				max = center;
		}
	}
}