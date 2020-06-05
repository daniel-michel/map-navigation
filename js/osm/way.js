import OSMElement from "./osm_element.js";
import OSMData from "./data.js";

export default class OSMWay extends OSMElement
{
	/**
	 * 
	 * @param {OSMWayElement} way 
	 * @param {OSMData} data 
	 */
	constructor(way, data)
	{
		super(way, data);
		/**
		 * @type {OSMWayElement}
		 */
		this.element;
	}
}