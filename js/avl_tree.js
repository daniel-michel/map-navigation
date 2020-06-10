/**
 * A wrapper for objects in a doubly linked list
 * @template DataType
 */
class DoubleLink
{
	/**
	 * Create a new wrapped object
	 * @param {DataType} data the object that is being wrapped
	 * @param {DoubleLink<DataType>} [last] the previous object in the list
	 * @param {DoubleLink<DataType>} [next] the next object in the list
	 */
	constructor(data, last, next)
	{
		/**
		 * the wrapped object
		 * @type {DataType}
		 */
		this.data = data;
		/**
		 * the previous object in the list
		 * @type {DoubleLink<DataType>}
		 */
		this.last = last;
		/**
		 * the next object in the list
		 * @type {DoubleLink<DataType>}
		 */
		this.next = next;
	}
}
/**
 * A doubly linked list
 * @template DataType
 */
class DoublyLinkedList
{
	/**
	 * Constructs a new doubly linked list
	 * @param {any[]} [elems] the elements to insert into this list
	 */
	constructor(...elems)
	{
		if (elems.length == 1 && (elems[0] instanceof Array))
		{
			elems = elems[0];
		}
		/**
		 * the number of elements in this list
		 * @type {number}
		 */
		this.length = 0;
		/**
		 * the first element in the list
		 * @type {DoubleLink<DataType>}
		 */
		this.first = null;
		/**
		 * the last element in the list
		 * @type {DoubleLink<DataType>}
		 */
		this.last = null;
		if (elems.length > 0)
		{
			this.length = elems.length;
			this.first = new DoubleLink(elems[0], null, null);
			let cur = this.first;
			for (let i = 1; i < this.length; i++)
			{
				cur.next = new DoubleLink(elems[i], cur, null);
				cur = cur.next;
			}
			this.last = cur;
		}
	}

	/**
	 * Get an element at a specific index
	 * @param {number} idx the index
	 * @return {DataType} the element at the specified index
	 */
	get(idx)
	{
		if (idx < 0) throw new RangeError('DoublyLinkedList: index ' + idx + ' is out of bounds '
			+ 'length is ' + this.length + '.');
		if (idx >= this.length) throw new RangeError('DoublyLinkedList: index ' + idx + ' is out of bounds '
			+ 'length is ' + this.length + '.');
		let cur = this.first;
		for (let i = 0; i < this.length; i++)
		{
			if (i == idx)
			{
				return cur.data;
			}
			cur = cur.next;
		}
	}

	/**
	 * Remove an element at a specific index
	 * @param {number} idx the index
	 */
	removeIdx(idx)
	{
		if (idx < 0) throw new RangeError('DoublyLinkedList: index ' + idx + ' is out of bounds '
			+ 'length is ' + this.length + '.');
		if (idx >= this.length) throw new RangeError('DoublyLinkedList: index ' + idx + ' is out of bounds '
			+ 'length is ' + this.length + '.');
		if (idx == 0)
		{
			this.first = this.first.next;
			if (this.first !== null) this.first.last = null;
		} else
		{
			let last = this.first;
			let cur = this.first.next;
			for (let i = 1; i < this.length; i++)
			{
				if (i == idx)
				{
					last.next = cur.next;
					if (cur.next !== null) cur.next.last = last;
					else this.last = last;
					break;
				}
				last = cur;
				cur = cur.next;
			}
		}
		this.length--;
	}

	/**
	 * Remove a specific element
	 * @param {DataType} obj the element
	 * @return {boolean} true if the element was contained in this list
	 */
	removeObj(obj)
	{
		let found = false;
		if (obj === this.first.data)
		{
			this.first = this.first.next;
			if (this.first !== null) this.first.last = null;
			found = true;
		} else
		{
			let last = this.first;
			let cur = this.first.next;
			for (let i = 1; i < this.length; i++)
			{
				if (obj === cur.data)
				{
					last.next = cur.next;
					if (cur.next !== null) cur.next.last = last;
					else this.last = last;
					found = true;
					break;
				}
				last = cur;
				cur = cur.next;
			}
		}
		if (found) this.length--;
		return found;
	}

	/**
	 * Remove a specific element from this list
	 * @param {DoubleLink<DataType>} lnk the element to remove (its wrapper)
	 */
	removeLink(lnk)
	{
		if (this.length == 0) throw new RangeError('DoublyLinkedList: cannot remove element from empty list.');
		if (lnk.last == null && lnk.next == null)
		{
			if (this.first != lnk || this.length != 1)
				throw new Error('DoublyLinkedList: cannot remove link that is not part of the list');
			this.first = this.last = null;
		} else if (lnk.last == null)
		{
			if (this.first != lnk)
				throw new Error('DoublyLinkedList: cannot remove link that is not part of the list');
			this.first = lnk.next;
			lnk.next.last = null;
		} else if (lnk.next == null)
		{
			if (this.last != lnk)
				throw new Error('DoublyLinkedList: cannot remove link that is not part of the list');
			this.last = lnk.last;
			lnk.last.next = null;
		} else
		{
			const ne = lnk.next, la = lnk.last;
			ne.last = la; la.next = ne;
		}
		this.length--;
	}

	/**
	 * Add an element after a specific element
	 * @param {DoubleLink<DataType>} lnk the element after which to add the new element
	 * @param {any} obj the element to add
	 * @return {DoubleLink<DataType>} the added element's wrapper
	 */
	insertAfter(lnk, obj)
	{
		const ne = lnk.next;
		if (ne == null)
		{
			if (this.last != lnk)
				throw new Error('DoublyLinkedList: cannot add element after link that is not part of the list');
			return this.pushBack(obj);
		}
		const ret = lnk.next = ne.last = new DoubleLink(obj, lnk, ne);
		this.length++;
		return ret;
	}

	/**
	 * Add an element before a specific element
	 * @param {DoubleLink<DataType>} lnk the element before which to add the new element
	 * @param {any} obj the element to add
	 * @return {DoubleLink<DataType>} the added element's wrapper
	 */
	insertBefore(lnk, obj)
	{
		const la = lnk.last;
		if (la == null)
		{
			if (this.first != lnk)
				throw new Error('DoublyLinkedList: cannot add element before link that is not part of the list');
			return this.pushFront(obj);
		}
		const ret = lnk.last = la.next = new DoubleLink(obj, la, lnk);
		this.length++;
		return ret;
	}

	/**
	 * Add an element after a specific element
	 * @param {DoubleLink<DataType>} lnk the element after which to add the new element
	 * @param {DoubleLink<DataType>} obj the wrapper of the element to add
	 * @return {DoubleLink<DataType>} the added element's wrapper
	 */
	insertLinkAfter(lnk, obj)
	{
		const ne = lnk.next;
		if (ne == null)
		{
			if (this.last != lnk)
				throw new Error('DoublyLinkedList: cannot add element after link that is not part of the list');
			this.last = obj; this.last.next = null; this.last.last = lnk; lnk.next = this.last;
			this.length++;
			return obj;
		}
		const ret = lnk.next = ne.last = obj;
		obj.last = lnk; obj.next = ne;
		this.length++;
		return ret;
	}

	/**
	 * Add an element before a specific element
	 * @param {DoubleLink<DataType>} lnk the element before which to add the new element
	 * @param {DoubleLink<DataType>} obj the wrapper of the element to add
	 * @return {DoubleLink<DataType>} the added element's wrapper
	 */
	insertLinkBefore(lnk, obj)
	{
		const la = lnk.last;
		if (la == null)
		{
			if (this.first != lnk)
				throw new Error('DoublyLinkedList: cannot add element before link that is not part of the list');
			this.first = obj; this.first.last = null; this.first.next = lnk; lnk.last = this.first;
			this.length++;
			return obj;
		}
		const ret = lnk.last = la.next = obj;
		obj.last = la; obj.next = lnk;
		this.length++;
		return ret;
	}

	/**
	 * Check whether an element is contained in this list
	 * @param {DataType} obj the element
	 * @return {boolean} true if the element is contained in this list
	 */
	contains(obj)
	{
		let cur = this.first;
		for (let i = 0; i < this.length; i++)
		{
			if (obj === cur.data)
			{
				return true;
			}
			cur = cur.next;
		}
		return false;
	}

	/**
	 * Add an element to the end of this list
	 * @param {DataType} obj the element to add
	 * @return {DoubleLink} the element's wrapper
	 */
	pushBack(obj)
	{
		let ret;
		if (this.length == 0)
		{
			ret = this.last = this.first = new DoubleLink(obj, null, null);
		} else
		{
			ret = this.last.next = new DoubleLink(obj, this.last, null);
			this.last = this.last.next;
		}
		this.length++;
		return ret;
	}

	/**
	 * Get the last element of this list
	 * @return {DataType} the last element
	 */
	getBack()
	{
		if (this.length == 0) throw new RangeError('DoublyLinkedList: cannot get last element from empty list.');
		return this.last.data;
	}

	/**
	 * Get and remove the last element of this list
	 * @return {DataType} the last element
	 */
	popBack()
	{
		if (this.length == 0) throw new RangeError('DoublyLinkedList: cannot pop last element from empty list.');
		const ret = this.last.data;
		this.last = this.last.last;
		if (this.last !== null) this.last.next = null;
		else this.first = null;
		this.length--;
		return ret;
	}

	/**
	 * Add an element to the beginning of this list
	 * @param {DataType} obj the element to add
	 * @return {DoubleLink} the element's wrapper
	 */
	pushFront(obj)
	{
		let ret;
		if (this.length == 0)
		{
			ret = this.last = this.first = new DoubleLink(obj, null, null);
		} else
		{
			ret = this.first.last = new DoubleLink(obj, null, this.first);
			this.first = this.first.last;
		}
		this.length++;
		return ret;
	}

	/**
	 * Get the first element of this list
	 * @return {DataType} the first element
	 */
	getFront()
	{
		if (this.length == 0) throw new RangeError('DoublyLinkedList: cannot get first element from empty list.');
		return this.first.data;
	}

	/**
	 * Get and remove the first element of this list
	 * @return {DataType} the first element
	 */
	popFront()
	{
		if (this.length == 0) throw new RangeError('DoublyLinkedList: cannot pop first element from empty list.');
		const ret = this.first.data;
		this.first = this.first.next;
		if (this.first !== null) this.first.last = null;
		else this.last = null;
		this.length--;
		return ret;
	}

	/**
	 * Converts this list into an array
	 * @return {DataType[]} the array with the list elements
	 */
	toArray()
	{
		const ret = [];
		let cur = this.first;
		for (let i = 0; i < this.length; i++)
		{
			ret.push(cur.data);
			cur = cur.next;
		}
		return ret;
	}

	/**
	 * Returns whether or not this list is empty
	 * @return {boolean} true if the list is empty
	 */
	isEmpty()
	{
		return this.length == 0;
	}

	/**
	 * Converts this list into a string
	 * @return {string} the string representation
	 */
	toString()
	{
		let ret = "DoublyLinkedList: [";
		let cur = this.first;
		for (let i = 0; i < this.length; i++)
		{
			if (i > 0) ret += ", ";
			ret += cur.data;
			cur = cur.next;
		}
		ret += "]";
		return ret;
	}
}






























/**
 * An AVL tree
 * @template CompareType The types beeing compared
 * @template {CompareType} DataType
 */
class AVLTreeNode
{
	/**
	 * Construct a new AVLTreeNode
	 * @param {(a: CompareType, b: CompareType) => number} cmpFct the comparison function
	 * @param {DoubleLink} key the wrapper of the key / element to insert into this tree
	 */
	constructor(cmpFct, key)
	{
		this._cmpFct = cmpFct;
		/**
		 * the height of this AVL tree
		 * @type {number}
		 */
		this.h = 0;
		/**
		 * the wrapper of the key / element of this node
		 * @type {DoubleLink<DataType>}
		 */
		this.key = key;
		/**
		 * the balance of the subtrees of this node
		 * @type {number}
		 */
		this.balance = 0;
		/**
		 * the left child of this node
		 * @type {AVLTreeNode<CompareType, DataType>}
		 */
		this.left = null;
		/**
		 * the right child of this node
		 * @type {AVLTreeNode<CompareType, DataType>}
		 */
		this.right = null;
	}

	/**
	 * Get the height of this AVL tree
	 * @return {number} the height of this AVL tree (in edges)
	 */
	height()
	{
		return this.h;
	}

	_leftHeight()
	{
		if (this.left == null) return 0;
		else return this.left.height() + 1;
	}

	_rightHeight()
	{
		if (this.right == null) return 0;
		else return this.right.height() + 1;
	}

	_heightDiff()
	{
		return this.balance = this._rightHeight() - this._leftHeight();
	}

	/**
	 * Search for a key / element in this tree
	 * @param {CompareType} key the key / element to search for
	 * @return {DataType} true if the key / element was found
	 */
	find(key)
	{
		if (this._cmpFct(key, this.key.data) == 0) return this.key.data;
		if (this._cmpFct(key, this.key.data) > 0)
		{
			if (this.right != null) return this.right.find(key);
			else return;
		} else
		{
			if (this.left != null) return this.left.find(key);
			else return;
		}
	}

	/**
	 * Search for the rightmost node in this tree
	 * @param {AVLTreeNode} parent the root / parent node
	 * @param {boolean} rightChild should be true if this node is the right child of the parent node
	 * @param {boolean} removeChild whether to remove the rightmost node
	 * @return {AVLTreeNode} the rightmost node
	 */
	findRightChild(parent, rightChild, removeChild)
	{
		if (this.right != null)
		{
			const ret = this.right.findRightChild(this, true, removeChild);
			if (removeChild)
			{
				this.h = Math.max(this._leftHeight(), this._rightHeight());
				this._heightDiff();
				if (parent == null) throw new Error("Can't rebalance tree without knowing the parent node");
				if (rightChild)
					parent.right = this.checkForValidity();
				else
					parent.left = this.checkForValidity();
			}
			return ret;
		} else
		{
			const ret = this;
			if (removeChild)
			{
				if (parent == null) throw new Error("Can't remove node without knowing the parent node");
				if (this.left != null)
				{
					if (rightChild) parent.right = this.left;
					else parent.left = this.left;
					this.left = null; this.right = null;
				} else
				{
					if (rightChild) parent.right = null;
					else parent.left = null;
					this.left = null; this.right = null;
				}
				this.h = 0;
			}
			return ret;
		}
	}

	/**
	 * Search for the leftmost node in this tree
	 * @return {DataType} the value of the leftmost node
	 */
	findLeftChild()
	{
		if (this.left != null)
		{
			return this.left.findLeftChild();
		} else
		{
			return this.key.data;
		}
	}

	/**
	 * Insert a new key / element into this tree
	 * @param {DoubleLink} key the wrapper of the key / element to insert
	 * @param {DoublyLinkedList} list the list with all the keys / elements
	 */
	insert(key, list)
	{
		const r = this.insertHelper(key, list);
		if (r != this) { throw new Error("Insert requested a parent node change. Use insertHelper instead."); }
	}

	/**
	 * Remove a key / element from this tree
	 * @param {any} key the key / element to remove
	 * @param {DoublyLinkedList} list the list with all the keys / elements
	 */
	remove(key, list)
	{
		const r = this.removeHelper(key, list);
		if (r != this) { throw new Error("Remove requested a parent node change. Use removeHelper instead."); }
	}

	/**
	 * Insert a new key / element into this tree
	 * @param {DoubleLink} key the wrapper of the key / element to insert
	 * @param {DoublyLinkedList} list the list with all the keys / elements
	 * @return {AVLTreeNode} the new root node of this tree
	 */
	insertHelper(key, list)
	{
		if (this._cmpFct(key.data, this.key.data) == 0) return this;
		if (this._cmpFct(key.data, this.key.data) > 0)
		{
			if (this.right != null)
			{
				this.right = this.right.insertHelper(key, list);
			} else
			{
				list.insertLinkAfter(this.key, key);
				this.right = new AVLTreeNode(this._cmpFct, key);
			}
		} else
		{
			if (this.left != null)
			{
				this.left = this.left.insertHelper(key, list);
			} else
			{
				list.insertLinkBefore(this.key, key);
				this.left = new AVLTreeNode(this._cmpFct, key);
			}
		}
		this.h = Math.max(this._leftHeight(), this._rightHeight());
		this._heightDiff();
		return this.checkForValidity();
	}

	/**
	 * Remove a key / element from this tree
	 * @param {any} key the key / element to remove
	 * @param {DoublyLinkedList} list the list with all the keys / elements
	 * @return {AVLTreeNode} the new root node of this tree
	 */
	removeHelper(key, list)
	{
		if (this._cmpFct(key, this.key.data) == 0)
		{
			list.removeLink(this.key);
			if (this.left != null && this.right != null)
			{
				const nRoot = this.left.findRightChild(this, false, true);
				nRoot.left = this.left; nRoot.right = this.right;
				nRoot.h = Math.max(nRoot._leftHeight(), nRoot._rightHeight());
				nRoot._heightDiff();
				return nRoot.checkForValidity();
			}
			if (this.left != null) return this.left;
			if (this.right != null) return this.right;
			return null;
		}
		if (this._cmpFct(key, this.key.data) > 0)
		{
			if (this.right != null)
			{
				this.right = this.right.removeHelper(key, list);
			}
		} else
		{
			if (this.left != null)
			{
				this.left = this.left.removeHelper(key, list);
			}
		}
		this.h = Math.max(this._leftHeight(), this._rightHeight());
		this._heightDiff();
		return this.checkForValidity();
	}

	/**
	 * Check whether this is a valid AVL tree and roatate if necessary
	 * @return {AVLTreeNode} the new root node of this tree
	 */
	checkForValidity()
	{
		if (Math.abs(this._heightDiff()) <= 1) return this;
		let tmp_right = this.right;
		let swappedLR = false; let swapMult = 1;
		if (this._heightDiff() < 0)
		{
			tmp_right = this.left;
			swappedLR = true;
			swapMult = -1;
		}
		if (tmp_right._heightDiff() * swapMult >= 0)
		{ // single rotation
			const lc = tmp_right.left;
			const rc = tmp_right.right;
			if (swappedLR)
			{
				const o_left = this.left;
				this.left = rc;
				this.h = Math.max(this._leftHeight(), this._rightHeight()); this._heightDiff();
				o_left.left = lc;
				o_left.right = this;
				o_left.h = Math.max(o_left._leftHeight(), o_left._rightHeight()); o_left._heightDiff();
				return o_left;
			} else
			{
				const o_right = this.right;
				this.right = lc;
				this.h = Math.max(this._leftHeight(), this._rightHeight()); this._heightDiff();
				o_right.left = this;
				o_right.right = rc;
				o_right.h = Math.max(o_right._leftHeight(), o_right._rightHeight()); o_right._heightDiff();
				return o_right;
			}
		} else
		{ // double rotation
			const lc = tmp_right.left;
			const rc = tmp_right.right;
			if (swappedLR)
			{
				const o_left = this.left;
				const rlc = rc.left;
				const rrc = rc.right;
				this.left = rrc;
				this.h = Math.max(this._leftHeight(), this._rightHeight()); this._heightDiff();
				o_left.right = rlc;
				o_left.h = Math.max(o_left._leftHeight(), o_left._rightHeight()); o_left._heightDiff();
				rc.left = o_left;
				rc.right = this;
				rc.h = Math.max(rc._leftHeight(), rc._rightHeight()); rc._heightDiff();
				return rc;
			} else
			{
				const o_right = this.right;
				const llc = lc.left;
				const lrc = lc.right;
				this.right = llc;
				this.h = Math.max(this._leftHeight(), this._rightHeight()); this._heightDiff();
				o_right.left = lrc;
				o_right.h = Math.max(o_right._leftHeight(), o_right._rightHeight()); o_right._heightDiff();
				lc.left = this;
				lc.right = o_right;
				lc.h = Math.max(lc._leftHeight(), lc._rightHeight()); lc._heightDiff();
				return lc;
			}
		}
	}

	/**
	 * Convert this AVL tree into a string (Graphviz format)
	 * @return {string} the string representation
	 */
	toString()
	{
		return this._dotNode(0)[0];
	}

	_dotNode(idx)
	{
		let ret = '\t' + idx + ' [label="' + this.key.data + ', b=' + this.balance + '"];\n';
		let next = idx + 1;
		if (this.left != null)
		{
			const [r, n] = this.left._dotLink(idx, next, "l");
			ret += r; next = n;
		}
		if (this.right != null)
		{
			const [r, n] = this.right._dotLink(idx, next, "r");
			ret += r; next = n;
		}
		return [ret, next];
	}

	_dotLink(idx, next, label)
	{
		let ret = '\t' + idx + ' -> ' + next + ' [label="' + label + '"];\n';
		const [r, n] = this._dotNode(next);
		ret += r; next = n;
		return [ret, next];
	}
}

/**
 * An AVL tree
 * @template CompareType The types beeing compared 
 * @template {CompareType} DataType
 */
export default class AVLTree
{
	/**
	 * Create a new AVL tree
	 * @param {(a: CompareType, b: CompareType) => number} [cmpFct] the comparison function
	 */
	constructor(cmpFct = (a, b) => a - b)
	{
		this._cmpFct = cmpFct;
		/**
		 * @type {AVLTreeNode<CompareType, DataType>}
		 */
		this._root = null;
		this._list = new DoublyLinkedList();
	}

	/**
	 * the number of elements in this AVL tree
	 * @type {number}
	 */
	get length()
	{
		return this._list.length;
	}

	/**
	 * Insert a new key / element into this AVL tree
	 * @param {DataType} key the key / element to be inserted
	 */
	insert(key)
	{
		if (this._root == null)
		{
			const dbl = this._list.pushBack(key);
			this._root = new AVLTreeNode(this._cmpFct, dbl);
		} else
		{
			const dbl = new DoubleLink(key, null, null);
			this._root = this._root.insertHelper(dbl, this._list);
		}
	}
	/**
	 * 
	 * @param  {DataType[]} keys 
	 */
	addAll(keys)
	{
		let newKeys = [];
		for (let key of keys)
		{
			if (!this.contains(key))
			{
				newKeys.push(key);
				this.insert(key);
			}
		}
		return newKeys;
	}

	/**
	 * Remove a key / element from this AVL tree
	 * @param {CompareType} key the key / element to be removed
	 */
	remove(key)
	{
		if (this._root == null) return;
		if (this.length == 1)
		{
			if (this._root.key.data == key)
			{
				this._list.popBack();
				this._root = null;
			}
		} else
		{
			this._root = this._root.removeHelper(key, this._list);
		}
	}

	/**
	 * Search for a key / element in this AVL tree
	 * @param {CompareType} key the key / element to search for
	 * @return {DataType} true if the key / element was found
	 */
	find(key)
	{
		if (this._root == null) return;
		else return this._root.find(key);
	}

	/**
	 * Check whether a key / element is contained in this AVL tree
	 * @param {CompareType} key the key / element to search for
	 * @return {boolean} true if the key / element was found
	 */
	contains(key)
	{
		return !!this.find(key);
	}

	/**
	 * Converts this AVL tree into an array
	 * @return {DataType[]} the array with the tree elements
	 */
	toArray()
	{
		return this._list.toArray();
	}

	/**
	 * Convert this AVL tree into a string (Graphviz format)
	 * @return {string} the string representation
	 */
	toString()
	{
		let ret = 'digraph {\n';
		if (this._root != null)
			ret += this._root.toString();
		ret += '}';
		return ret;
	}

	/**
	 * Returns whether or not this AVL tree is empty
	 * @return {boolean} true if the AVL tree is empty
	 */
	isEmpty()
	{
		return this.length == 0;
	}
}