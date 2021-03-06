import OSMData from "./data.js";

export default class OSMElement
{
	/**
	 * 
	 * @param {OSMRawElement} elem 
	 * @param {OSMData} data
	 */
	constructor(elem, data)
	{
		this.element = elem;
		this.data = data;
		/**
		 * @type {import("./restriction.js").default[]}
		 */
		this.restrictions = [];
	}
}