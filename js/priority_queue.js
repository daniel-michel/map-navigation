
/**
 * @template DataType
 */
export default class PriorityQueue
{
	/**
	 * 
	 * @param {(a: DataType, b: DataType) => number} [cmpFct] the comparison function
	 */
	constructor(cmpFct = (a, b) => a - b)
	{
		/**
		 * @private
		 * @type {DataType[]}
		 */
		this._data = [];
		this.cmpFct = cmpFct;
		/**
		 * the number of elements in this heap
		 * @type {number}
		 */
		this.length = 0;
	}

	/**
	 * 
	 * @private
	 * @param {number} i 
	 * @param {number} j 
	 */
	_swap(i, j)
	{
		let tmp = this._data[i];
		this._data[i] = this._data[j];
		this._data[j] = tmp;
	}

	/**
	 * 
	 * @private
	 * @param {number} i 
	 */
	_siftUp(i)
	{
		while (i > 0 && this.cmpFct(this._data[Math.floor((i - 1) / 2)], this._data[i]) > 0)
		{
			this._swap(i, Math.floor((i - 1) / 2));
			i = Math.floor((i - 1) / 2);
		}
	}

	/**
	 * 
	 * @private
	 * @param {number} i 
	 */
	_siftDown(i)
	{
		let m;
		while (2 * i + 1 < this.length)
		{
			if (2 * i + 2 >= this.length)
				m = 2 * i + 1;
			else
			{
				if (this.cmpFct(this._data[2 * i + 1], this._data[2 * i + 2]) < 0) m = 2 * i + 1;
				else m = 2 * i + 2;
			}
			if (this.cmpFct(this._data[i], this._data[m]) <= 0) return;
			this._swap(i, m); i = m;
		}
	}

	/**
	 * Get the minimum element (as specified by the custom comparison function) in this heap
	 * @return {DataType} the minimum element
	 */
	min()
	{
		if (this.length == 0) throw new RangeError('BinaryHeap: can\'t call min() on an empty heap.');
		return this._data[0];
	}

	/**
	 * Get and delete the minimum element (as specified by the custom comparison function) in this heap
	 * @return {DataType} the minimum element
	 */
	deleteMin()
	{
		let ret = this._data[0];
		this.length--;
		this._data[0] = this._data[this.length];
		let gone = this._data.pop();
		this._siftDown(0);
		return ret;
	}

	/**
	 * Insert a new element / key into this heap
	 * @param {DataType} key the new element / key
	 */
	insert(key)
	{
		this._data[this.length] = key;
		this._siftUp(this.length);
		this.length++;
	}

	/**
	 * Returns whether or not this heap is empty
	 * @return {boolean} true if the heap is empty
	 */
	isEmpty()
	{
		return this.length == 0;
	}
}