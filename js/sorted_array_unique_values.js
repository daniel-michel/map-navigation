/**
 * @template T
 */
export default class SortedArrayUniqueValues
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
			if (value === v)
				return this.array[center];
			if (value > v)
				min = center;
			else
				max = center;
		}
	}
	/**
	 * 
	 * @param {T[]} elements 
	 * @returns {T[]}
	 */
	addAll(elements)
	{
		/* let returnArray = [];
		if (elements.length === 0)
			return returnArray;
		elements = elements.sort((a, b) => this.get_value(a) - this.get_value(b));
		let elemIndex = 0;
		let elem = elements[elemIndex];
		let elemValue = this.get_value(elem);
		for (let i = 0; i < this.array.length; i++)
		{
			let val = this.get_value(this.array[i]);
			if (elemValue < val)
			{
				returnArray.push(elem);
				this.array.splice(i, 0, elem);
				if (elemIndex >= elements.length - 1)
					break;
				elem = elements[++elemIndex];
				elemValue = this.get_value(elem);
			}
			else if (elemValue === val)
			{
				if (elemIndex >= elements.length - 1)
					break;
				elem = elements[++elemIndex];
				elemValue = this.get_value(elem);
			}
		}
		for (let i = elemIndex; i < elements.length; i++)
		{
			this.array.push(elements[i]);
			returnArray.push(elements[i]);
		} */
		//return elements.filter(elem => this.add(elem));
		let returnArray = [];
		for (let elem of elements)
		{
			if (this.add(elem))
				returnArray.push(elem);
		}
		/* let returnArray = [];
		if (elements.length === 0)
			return returnArray;
		elements = elements.sort((a, b) => this.get_value(a) - this.get_value(b));
		let index = -1;
		for (let elem of elements)
		{
			let res = this.add(elem, index);
			if (res)
			{
				returnArray.push(elem);
				index = res.index;
			}
		} */
		return returnArray;
	}
	/**
	 * 
	 * @param {T} element
	 * @returns {{index: number}}
	 */
	add(element, min = -1, max = this.array.length)
	{
		let value = this.get_value(element);
		while (true)
		{
			if (max - min <= 1)
			{
				this.array.splice(max, 0, element);
				return { index: max };
			}
			let center = Math.floor((min + max) / 2);
			let v = this.get_value(this.array[center]);
			if (value === v)
				return;
			if (value > v)
				min = center;
			else
				max = center;
		}
	}
}