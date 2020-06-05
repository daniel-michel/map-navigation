import OSMData from "./data.js";
import OSMElement from "./osm_element.js";

export default class OSMRelation extends OSMElement
{
	/**
	 * 
	 * @param {OSMRelationElement} relation 
	 * @param {OSMData} data 
	 */
	constructor(relation, data)
	{
		super(relation, data);
	}
}