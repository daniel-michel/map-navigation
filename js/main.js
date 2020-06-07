import Rect, { RectsShape, RectGrid } from "./math/rect.js";
import Vec2 from "./math/vec2.js";
import OSMData from "./osm/data.js";
import GeoPos, { MercatorPos, MERCATOR_WORLD_SIZE, EARTH_RADIUS_AT_SEA_LEVEL, HALF_MERCATOR_WORLD_SIZE } from "./math/pos.js";
import Renderer from "./renderer.js";
import Input from "./input.js";
import Loop from "./loop.js";
import Vec3 from "./math/vec3.js";
import OSMPathfinder from "./osm/pathfinder.js";
import { StreetSection, StreetPath, DRIVEABLE_STREET_RULE } from "./osm/street.js";

/**
 * @type {HTMLCanvasElement}
 */
let canvas;
let mapData = new OSMData();
/**
 * @type {Renderer}
 */
let renderer;
/**
 * @type {Input}
 */
let userInput;
/**
 * @type {Loop}
 */
let loop;

/**
 * @type {StreetPath}
 */
let path;

let mouse_pos = new Vec2();

/**
 * @type {import("./osm/pathfinder.js").WeightingFunction}
 */
let weightingFunction = (street, forwards) =>
{
	const speedDistance = 0.4;
	if (!street.matchesRules())
		return -1;
	if ((street.element?.tags?.oneway === "yes" && !forwards) || (street.element?.tags?.oneway === "-1" && forwards))
		return -1;
	let maxspeed = +street.element?.tags?.maxspeed;
	if (isNaN(maxspeed))
		maxspeed = +street.element?.tags?.["maxspeed:" + (forwards ? "forward" : "backward")];
	if (isNaN(maxspeed))
		return 130 / 30 * speedDistance + (1 - speedDistance);
	return 130 / maxspeed * speedDistance + (1 - speedDistance);
};

window.onload = main;
async function main()
{
	canvas = document.getElementById("canvas");
	resize();
	renderer = new Renderer(canvas);
	renderer.cameraPosition = new GeoPos(51.4934, 0).getMercatorProjection();

	loop = new Loop(0, () => draw()).start();

	userInput = new Input(canvas, e =>
	{
		if (e.n === 1 || (e.n === 2 && e.type === "scale"))
		{
			let pos = renderer.cameraPosition;
			//let latitude_factor = Math.cos(pos.y / 180 * Math.PI);
			let movement = new Vec2(e.movement.x * devicePixelRatio / renderer.scale, e.movement.y * devicePixelRatio / renderer.scale);
			movement = new Vec2(Math.cos(-renderer.rotation.z) * movement.x - Math.sin(-renderer.rotation.z) * movement.y, Math.sin(-renderer.rotation.z) * movement.x + Math.cos(-renderer.rotation.z) * movement.y);
			renderer.cameraPosition.y += movement.y;
			renderer.cameraPosition.x -= movement.x;
		}
		if (e.type === "move")
		{
			if (e.n === 2)
			{
				renderer.rotation.z -= e.movement.x / 200;
				renderer.rotation.x += e.movement.y / 200;
				renderer.rotation.x = Math.max(Math.min(renderer.rotation.x, 0), -Math.PI / 2);
			}
		}
		else if (e.type === "scale")
		{
			let r = renderer.rotation.z + Math.atan2(e.touches[0].current_pos.y - e.touches[1].current_pos.y, e.touches[0].current_pos.x - e.touches[1].current_pos.x) - Math.atan2(e.touches[0].last_pos.y - e.touches[1].last_pos.y, e.touches[0].last_pos.x - e.touches[1].last_pos.x);
			renderer.rotation.z = r;
			renderer.scale *= e.scale;
		}
	});

	//draw();
	let fromCoord;
	let toCoord;
	try
	{
		let navigationObj = await (await fetch("./settings/navigation.json")).json();
		fromCoord = new GeoPos(navigationObj.from.lat, navigationObj.from.lon);
		toCoord = new GeoPos(navigationObj.to.lat, navigationObj.to.lon)
	}
	catch (e)
	{
		console.warn("Error while pathfinding", e);
		let cameraGeoCoord = GeoPos.fromMercatorProjection(renderer.cameraPosition);
		//mapData.load(new Rect(cameraGeoCoord, new GeoPos(0.001, 0.001)));
		fromCoord = cameraGeoCoord.copy().add(new GeoPos(Math.random() * 0.2, Math.random() * 0.2));
		toCoord = cameraGeoCoord.copy().add(new GeoPos(Math.random() * 0.2, Math.random() * 0.2));
	}
	let from = await mapData.getClosestStreet(fromCoord.getMercatorProjection(), 0.01, true, DRIVEABLE_STREET_RULE);
	renderer.cameraPosition = from.getMercatorPos();
	let to = await mapData.getClosestStreet(toCoord.getMercatorProjection(), 0.01, true, DRIVEABLE_STREET_RULE);
	console.log(from, to);

	{
		let pathfinder = new OSMPathfinder(mapData, from, to, { calculateWeighting: weightingFunction });
		path = await pathfinder.find();
	}
	{
		let pathfinder = new OSMPathfinder(mapData, from, to, { calculateWeighting: weightingFunction });
		path = await pathfinder.find();
	}
}

window.onresize = resize;
function resize()
{
	canvas.width = window.innerWidth * devicePixelRatio;
	canvas.height = window.innerHeight * devicePixelRatio;
}

async function draw()
{
	let mercatorStretchFactor = 1 / Math.cos(renderer.cameraPosition.y / MERCATOR_WORLD_SIZE * Math.PI);
	let mercatorToMeter = EARTH_RADIUS_AT_SEA_LEVEL * Math.PI / HALF_MERCATOR_WORLD_SIZE * mercatorStretchFactor;
	let meter = 1 / mercatorToMeter;

	//renderer.lineWidth(1 * meter);
	renderer.context.textAlign = "left";
	renderer.context.textBaseline = "top";
	renderer.context.lineCap = "round";
	renderer.context.lineJoin = "round";
	//let skipprecise = 1 / (renderer.scale / 20000000);
	let skip = Math.max(1, Math.floor(1 / (renderer.scale / (10 * MERCATOR_WORLD_SIZE))));
	//let wholeWorld = new Rect(new GeoPos(0, 0), new GeoPos(90, 180));
	//let streets = mapData.streets.get(wholeWorld);
	//let streets = mapData.streets.get(new Rect(GeoPos.fromMercatorProjection(renderer.cameraPosition), new GeoPos(0.025, 0.025)));
	let streets = mapData.streets.get(GeoPos.rectFromMercatorProjection(renderer.getCameraArea()));
	renderer.startFrame();
	for (let street of streets)
	{
		renderer.beginPath();
		for (let i = 0; i < street.geoCoordinates.length + skip - 1; i += skip)
		{
			let index = Math.min(i, street.geoCoordinates.length - 1);
			let mercator = street.geoCoordinates[index].getMercatorProjection();
			renderer.lineTo(mercator);
		}
		renderer.lineWidth(street.matchesRules() ? 4 * meter : 1 * meter).stroke(street.matchesRules() ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 100%, 0.2)");
		/* let positions = street.geoCoordinates.map(geocoord => geocoord.getMercatorProjection());
		positions = positions.filter((point, i) => i % skip === 0 || i === positions.length - 1);
		renderer.path(positions).lineWidth(street.matchesRules() ? 0.0000005 : 0.00000025).stroke(street.matchesRules() ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 100%, 0.2)"); */
	}

	if (path)
	{
		let positions = path.getGeoCoordinates().map(geo => geo.getMercatorProjection());
		renderer.path(positions).lineWidth(5 * meter).stroke("hsl(230, 100%, 60%)");
	}

	if (mouse_pos)
	{
		let closest = await mapData.getClosestStreet(new MercatorPos(renderer.project_back_2d(mouse_pos)), 100 * meter, false);
		//console.log(closest);
		if (closest)
		{
			let positions = closest.street.geoCoordinates.map(geocoord => geocoord.getMercatorProjection());
			renderer.path(positions).lineWidth(5 * meter).stroke("hsla(0, 100%, 58%, 0.8)");
			renderer.path([renderer.project_back_2d(mouse_pos), closest.getMercatorPos()]).lineWidth(2 * meter).stroke("hsla(270, 100%, 60%, 0.7)");
			let font_size = 30;
			renderer.context.font = (font_size * 0.8) + "px Arial";
			renderer.context.fillText(`length = ${closest.street.getLength()}`, 50, font_size * 1 + 0 * font_size * 0.8);
			renderer.context.fillText(`weight = ${weightingFunction(closest.street, true)}`, 50, font_size * 1 + 1 * font_size * 0.8);
			/* let prevJunction = (await closest.getNextJunctions()).previous;
			if (prevJunction)
			{
				//let section = (await prevJunction.node.getConnectionsToNeighbors()).filter(connection => connection.street === closest.street)[0]?.section;
				let section = prevJunction.section;
				if (section)
				{
					renderer.path(section.getGeoCoordinates().map(geoPos => geoPos.getMercatorProjection())).lineWidth(0.0000005).stroke("hsla(60, 100%, 58%, 0.8)");
					renderer.context.fillText(`length = ${section.getLength()}`, 50, font_size * 1 + 1 * font_size * 0.8);
				}
			} */
			let i = 2;
			for (const name in closest.street.element.tags)
			{
				let value = closest.street.element.tags[name];
				renderer.context.fillText(`${name} = ${value}`, 50, font_size * 1 + i * font_size * 0.8);
				//renderer.context.fillText(`${name} = ${value}`, 110, font_size * 6 + i * font_size * 0.8 + 5);
				i++;
			}
			for (const res of closest.street.restrictions)
			{
				renderer.context.fillText(`restriction`, 50, font_size * 1 + i * font_size * 0.8);
				i++;
				console.log(res.element);
				for (const name in res.element.tags)
				{
					let value = res.element.tags[name];
					renderer.context.fillText(`    ${name} = ${value}`, 50, font_size * 1 + i * font_size * 0.8);
					i++;
				}
			}
		}
	}


	renderer.context.textBaseline = "top";
	renderer.context.font = "50px Arial";
	renderer.fillColor("white");
	renderer.context.fillText(skip + "", 0, 0);


	let bottomRight = new MercatorPos(renderer.project_back_2d(new Vec2(canvas.width - 10, canvas.height - 10)));

	let pixelsToMetersFactor = 1 / (meter * renderer.scale);
	let minScaleSize = 200 * devicePixelRatio;
	let minScaleMeters = minScaleSize * pixelsToMetersFactor;
	let scaleMeters = 10 ** Math.ceil(Math.log10(minScaleMeters));
	if (scaleMeters / 5 >= minScaleMeters)
		scaleMeters /= 5;
	else if (scaleMeters / 2.5 >= minScaleMeters)
		scaleMeters /= 2.5;
	else if (scaleMeters / 2 >= minScaleMeters)
		scaleMeters /= 2;
	//let scale_size = scale_meters;
	let metersToLeft = new MercatorPos(-scaleMeters * meter, 0).add(bottomRight);
	renderer.path([bottomRight, metersToLeft]).lineWidth(5 / renderer.scale).stroke("white");
	renderer.context.font = 30 * devicePixelRatio + "px Arial";
	renderer.context.textAlign = "right";
	renderer.context.textBaseline = "bottom";
	renderer.context.fillText((scaleMeters >= 1000 ? scaleMeters / 1000 + " k" : scaleMeters + " ") + "m", canvas.width - 15, canvas.height - 15);
}






let mouse_pressed = false;
let shift_pressed = false;

window.onmousedown = e =>
{
	mouse_pos = new Vec2(e.clientX, e.clientY);
	if (e.button === 0)
	{
		mouse_pressed = true;
		shift_pressed = e.shiftKey;
	}
	else if (e.button === 1)
	{
		let mousePosMercator = new MercatorPos(renderer.project_back_2d(mouse_pos));
		mapData.load(new Rect(mousePosMercator.getGeographicCoordinates()));
	}
};
window.onmouseup = e =>
{
	if (e.button === 0)
		mouse_pressed = false;
};
window.onmousemove = e =>
{
	mouse_pos = new Vec2(e.clientX, e.clientY);
	if (!mouse_pressed)
		return;
	if (shift_pressed)
	{
		renderer.rotation.z -= e.movementX / 200;
		renderer.rotation.x += e.movementY / 200;
		renderer.rotation.x = Math.max(Math.min(renderer.rotation.x, 0), -Math.PI / 2);
	}
	else
	{
		let movement = new Vec2(e.movementX / renderer.scale, e.movementY / renderer.scale);
		movement = new Vec2(Math.cos(-renderer.rotation.z) * movement.x - Math.sin(-renderer.rotation.z) * movement.y, Math.sin(-renderer.rotation.z) * movement.x + Math.cos(-renderer.rotation.z) * movement.y);
		renderer.cameraPosition.y += movement.y;
		renderer.cameraPosition.x -= movement.x;
	}
};
window.onwheel = e =>
{
	if (e.ctrlKey)
	{
		renderer.cameraPosition.y -= e.deltaY / renderer.scale;
		renderer.cameraPosition.x += e.deltaX / renderer.scale;
	}
	else
	{
		let zoom = Math.abs(e.deltaY / 1000);
		if (e.deltaY > 0)
			renderer.scale /= 1 + zoom;
		else
			renderer.scale *= 1 + zoom;
	}
};
window.onkeydown = async e =>
{
	if (e.key === "g")
	{
		let geopos = GeoPos.fromMercatorProjection(new MercatorPos(renderer.cameraPosition));
		let url = `https://www.google.com/maps/@${geopos.lat},${geopos.lon},20z`;
		console.log(url);
		open(url, "_blank");
	}
	else if (e.key === "2")
	{
		renderer.rotation.x = 0;
		renderer.rotation.y = 0;
		renderer.rotation.z = 0;
	}
}