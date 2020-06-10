import Rect, { RectsShape, RectGrid } from "./math/rect.js";
import Vec2 from "./math/vec2.js";
import OSMData from "./osm/data.js";
import GeoPos, { MercatorPos, MERCATOR_WORLD_SIZE, EARTH_RADIUS_AT_SEA_LEVEL, HALF_MERCATOR_WORLD_SIZE } from "./math/pos.js";
import Renderer from "./renderer.js";
import Input from "./input.js";
import Loop from "./loop.js";
import OSMPathfinder from "./osm/pathfinder.js";
import { StreetPath, DRIVEABLE_STREET_RULE } from "./osm/street.js";
import MapRenderer from "./osm/map_renderer.js";
import Vec3 from "./math/vec3.js";

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
 * @type {MapRenderer}
 */
let mapRenderer;
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
	mapRenderer = new MapRenderer(renderer, mapData);
	mapRenderer.camera.position = new GeoPos(51.4934, 0).getMercatorProjection();

	loop = new Loop(0, () => draw()).start();

	userInput = new Input(canvas, e =>
	{
		if (e.n === 1 || (e.n === 2 && e.type === "scale"))
		{
			let movement = new Vec2(e.movement.x * devicePixelRatio / mapRenderer.camera.scale, e.movement.y * devicePixelRatio / mapRenderer.camera.scale);
			movement = new Vec2(Math.cos(-mapRenderer.camera.rotation.z) * movement.x - Math.sin(-mapRenderer.camera.rotation.z) * movement.y, Math.sin(-mapRenderer.camera.rotation.z) * movement.x + Math.cos(-mapRenderer.camera.rotation.z) * movement.y);
			mapRenderer.camera.position.y += movement.y;
			mapRenderer.camera.position.x -= movement.x;
		}
		if (e.type === "move")
		{
			if (e.n === 2)
			{
				mapRenderer.camera.rotation.z -= e.movement.x / 200;
				mapRenderer.camera.rotation.x += e.movement.y / 200;
				mapRenderer.camera.rotation.x = Math.max(Math.min(mapRenderer.camera.rotation.x, 0), -Math.PI / 2);
			}
		}
		else if (e.type === "scale")
		{
			let r = mapRenderer.camera.rotation.z + Math.atan2(e.touches[0].current_pos.y - e.touches[1].current_pos.y, e.touches[0].current_pos.x - e.touches[1].current_pos.x) - Math.atan2(e.touches[0].last_pos.y - e.touches[1].last_pos.y, e.touches[0].last_pos.x - e.touches[1].last_pos.x);
			mapRenderer.camera.rotation.z = r;
			mapRenderer.camera.scale *= e.scale;
		}
	});
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
		let cameraGeoCoord = GeoPos.fromMercatorProjection(mapRenderer.cameraPosition);
		fromCoord = cameraGeoCoord.copy().add(new GeoPos(Math.random() * 0.2, Math.random() * 0.2));
		toCoord = cameraGeoCoord.copy().add(new GeoPos(Math.random() * 0.2, Math.random() * 0.2));
	}
	let from = await mapData.getClosestStreet(fromCoord.getMercatorProjection(), 0.01, true, DRIVEABLE_STREET_RULE);
	if (!from)
		return;
	mapRenderer.camera.position = from.getMercatorPos();
	let to = await mapData.getClosestStreet(toCoord.getMercatorProjection(), 0.01, true, DRIVEABLE_STREET_RULE);
	console.log(from, to);
	if (!to)
		return;
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
	renderer.startFrame();
	mapRenderer.startFrame();
	let mercatorStretchFactor = 1 / Math.cos(mapRenderer.camera.position.y / MERCATOR_WORLD_SIZE * Math.PI);
	let mercatorToMeter = EARTH_RADIUS_AT_SEA_LEVEL * Math.PI / HALF_MERCATOR_WORLD_SIZE * mercatorStretchFactor;
	let meter = 1 / mercatorToMeter;

	renderer.font(undefined, {
		align: "left",
		baseline: "top"
	});
	renderer.lineProp({
		cap: "round",
		join: "round"
	})
	let skip = Math.max(1, Math.floor(1 / (mapRenderer.camera.scale / (10 * MERCATOR_WORLD_SIZE))));
	let streets = mapData.streets.get(GeoPos.rectFromMercatorProjection(mapRenderer.getCameraArea()));
	for (let street of streets)
	{
		let driveable = street.matchesRules();
		if (!driveable && meter * mapRenderer.camera.scale < 0.3)
			continue;
		mapRenderer.beginPath();
		for (let i = 0; i < street.geoCoordinates.length + skip - 1; i += skip)
		{
			let index = Math.min(i, street.geoCoordinates.length - 1);
			let mercator = street.geoCoordinates[index].getMercatorProjection();
			mapRenderer.lineTo(mercator);
		}
		mapRenderer.lineWidth(driveable ? 4 * meter : 1 * meter, driveable ? 1 : 1).stroke(driveable ? "hsla(0, 0%, 70%, 1)" : "hsla(0, 0%, 70%, 0.5)");
	}

	if (path)
	{
		let positions = path.getGeoCoordinates().map(geo => geo.getMercatorProjection());
		mapRenderer.strokeColor("hsl(230, 100%, 60%)").drawPathWithDirectionArrows(positions, 5 * meter, 7);
	}

	if (mouse_pos)
	{
		let closest = await mapData.getClosestStreet(new MercatorPos(mapRenderer.project_back_2d(mouse_pos)), 1000 * meter, false);
		if (closest)
		{
			let positions = closest.street.geoCoordinates.map(geocoord => geocoord.getMercatorProjection());
			mapRenderer.strokeColor("hsla(0, 100%, 58%, 0.8)").drawPathWithDirectionArrows(positions, 5 * meter, 5);
			mapRenderer.path([mapRenderer.project_back_2d(mouse_pos), closest.getMercatorPos()]).lineWidth(2 * meter, 2).stroke("hsla(270, 100%, 60%, 0.7)");
			let font_size = 30;
			renderer.font((font_size * 0.8) + "px Arial");
			renderer.fillText(`length = ${closest.street.getLength()}`, new Vec2(50, font_size + 0 * font_size * 0.8));
			renderer.fillText(`weight = ${weightingFunction(closest.street, true)}`, new Vec2(50, font_size + 1 * font_size * 0.8));
			let i = 2;
			for (const name in closest.street.element.tags)
			{
				let value = closest.street.element.tags[name];
				renderer.fillText(`${name} = ${value}`, new Vec2(50, font_size + i * font_size * 0.8));
				i++;
			}
			for (const res of closest.street.restrictions)
			{
				renderer.fillText(`restriction`, new Vec2(50, font_size + i * font_size * 0.8));
				i++;
				for (const name in res.element.tags)
				{
					let value = res.element.tags[name];
					renderer.fillText(`    ${name} = ${value}`, new Vec2(50, font_size + i * font_size * 0.8));
					i++;
				}
			}
		}
	}


	let bottomRight = new Vec2(canvas.width - 10, canvas.height - 10);

	let pixelsToMetersFactor = 1 / (meter * mapRenderer.camera.scale);
	let minScaleSize = 200 * devicePixelRatio;
	let minScaleMeters = minScaleSize * pixelsToMetersFactor;
	let scaleMeters = 10 ** Math.ceil(Math.log10(minScaleMeters));
	if (scaleMeters / 5 >= minScaleMeters)
		scaleMeters /= 5;
	else if (scaleMeters / 2.5 >= minScaleMeters)
		scaleMeters /= 2.5;
	else if (scaleMeters / 2 >= minScaleMeters)
		scaleMeters /= 2;
	let metersToLeft = new Vec2(-scaleMeters / pixelsToMetersFactor, 0).add(bottomRight);
	renderer.path([bottomRight, metersToLeft]).lineWidth(2).stroke("white");
	renderer.font(30 * devicePixelRatio + "px Arial");
	renderer.fillColor("white");
	renderer.fillText((scaleMeters >= 1000 ? scaleMeters / 1000 + " k" : scaleMeters + " ") + "m", new Vec2(canvas.width - 15, canvas.height - 15), {
		align: "right",
		baseline: "bottom"
	});
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
		let mousePosMercator = new MercatorPos(mapRenderer.project_back_2d(mouse_pos));
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
		mapRenderer.camera.rotation.z -= e.movementX / 200;
		mapRenderer.camera.rotation.x += e.movementY / 200;
		mapRenderer.camera.rotation.x = Math.max(Math.min(mapRenderer.camera.rotation.x, 0), -Math.PI / 2);
	}
	else
	{
		let movement = new Vec2(e.movementX / mapRenderer.camera.scale, e.movementY / mapRenderer.camera.scale);
		movement = new Vec2(Math.cos(-mapRenderer.camera.rotation.z) * movement.x - Math.sin(-mapRenderer.camera.rotation.z) * movement.y, Math.sin(-mapRenderer.camera.rotation.z) * movement.x + Math.cos(-mapRenderer.camera.rotation.z) * movement.y);
		mapRenderer.camera.position.y += movement.y;
		mapRenderer.camera.position.x -= movement.x;
	}
};
window.onwheel = e =>
{
	if (e.ctrlKey)
	{
		mapRenderer.camera.position.y -= e.deltaY / mapRenderer.camera.scale;
		mapRenderer.camera.position.x += e.deltaX / mapRenderer.camera.scale;
	}
	else
	{
		let zoom = Math.abs(e.deltaY / 1000);
		if (e.deltaY > 0)
			mapRenderer.camera.scale /= 1 + zoom;
		else
			mapRenderer.camera.scale *= 1 + zoom;
	}
};
window.onkeydown = async e =>
{
	if (e.key === "g")
	{
		let geopos = GeoPos.fromMercatorProjection(new MercatorPos(mapRenderer.cameraPosition));
		let url = `https://www.google.com/maps/@${geopos.lat},${geopos.lon},20z`;
		console.log(url);
		open(url, "_blank");
	}
	else if (e.key === "2")
	{
		mapRenderer.camera.rotation.x = 0;
		mapRenderer.camera.rotation.y = 0;
		mapRenderer.camera.rotation.z = 0;
	}
	else if (e.key === "a")
	{
		/* await mapRenderer.animateTo({ scale: 10 * renderer.width }, { duration: 1000 });
		let start = mapRenderer.camera.position.copy();
		setInterval(async () =>
		{
			// mapRenderer.animateTo({ scale: 30 * renderer.width }, { duration: 1000 });
			// await new Promise(r => setTimeout(r, 500));
			// mapRenderer.animateTo({ scale: 10 * renderer.width }, { duration: 1000 });
			// await new Promise(r => setTimeout(r, 500));
			// mapRenderer.animateTo({ scale: 30 * renderer.width }, { duration: 500 });
			// await new Promise(r => setTimeout(r, 100));
			// mapRenderer.animateTo({ scale: 10 * renderer.width }, { duration: 500 });
			// mapRenderer.animateTo({ position: new MercatorPos(start.copy().add(new MercatorPos(0.03, 0, 0))) }, { duration: 1000 });
			// await new Promise(r => setTimeout(r, 500));
			// mapRenderer.animateTo({ position: new MercatorPos(start.copy().add(new MercatorPos(0.01, 0, 0))) }, { duration: 1000 });
			// await new Promise(r => setTimeout(r, 500));
			// mapRenderer.animateTo({ position: new MercatorPos(start.copy().add(new MercatorPos(0.03, 0, 0))) }, { duration: 500 });
			// await new Promise(r => setTimeout(r, 400));
			// mapRenderer.animateTo({ position: new MercatorPos(start.copy().add(new MercatorPos(0.01, 0, 0))) }, { duration: 500 });
			mapRenderer.animateTo({ rotation: new Vec3(-30 / 180 * Math.PI, 0, 0) }, { duration: 1000 });
			await new Promise(r => setTimeout(r, 500));
			mapRenderer.animateTo({ rotation: new Vec3(-10 / 180 * Math.PI, 0, 0) }, { duration: 1000 });
			await new Promise(r => setTimeout(r, 500));
			mapRenderer.animateTo({ rotation: new Vec3(-30 / 180 * Math.PI, 0, 0) }, { duration: 500 });
			await new Promise(r => setTimeout(r, 400));
			mapRenderer.animateTo({ rotation: new Vec3(-10 / 180 * Math.PI, 0, 0) }, { duration: 500 });
		}, 5000); */
		if (path)
		{
			let geoPath = path.getGeoCoordinates();
			let mercPath = geoPath.map(geo => geo.getMercatorProjection());
			let boundingBox = Rect.createContaining(...mercPath);

			/* await mapRenderer.animateTo({ scale: renderer.width * 10 }, 500);
			mapRenderer.animateTo({ scale: renderer.width * 30 }, 6000);
			await new Promise(r => setTimeout(r, 2000));
			mapRenderer.animateTo({ scale: renderer.width * 10 }, 2000);
			await new Promise(r => setTimeout(r, 5000)); */
			let center = new MercatorPos(boundingBox.center);
			let scale = Math.min(renderer.height / boundingBox.height, renderer.width / boundingBox.width) * 0.9;
			if (mercPath.length > 1)
			{
				let curr = mercPath[0];
				let next = mercPath[1];
				let diff = next.copy().subtract(curr);
				let angle = Math.atan2(diff.y, diff.x) - Math.PI / 2;
				await mapRenderer.animateTo({ position: curr, rotation: { x: -55 / 180 * Math.PI, z: angle }, scale: 60 * renderer.height, screenFocus: { y: -0.5 } }, 4000);
				await new Promise(r => setTimeout(r, 1000));
			}
			for (let i = 0; i < geoPath.length - 1; i++)
			{
				let curr = mercPath[i];
				let next = mercPath[i + 1];
				let diff = next.copy().subtract(curr);
				let meters = Vec3.subtract(geoPath[i].get3dCoordinates(), geoPath[i + 1].get3dCoordinates()).length;
				//let meters = diff.length * 100000;
				/* if (diff.length === 0)
					continue; */
				let angle = Math.atan2(diff.y, diff.x) - Math.PI / 2;
				let time = meters * 1000 / 150;
				mapRenderer.animateTo({ position: next, rotation: { z: angle } }, time + 2000);
				await new Promise(r => setTimeout(r, time / 2));
			}
			await new Promise(r => setTimeout(r, 3000));
			await mapRenderer.animateTo({ position: center, scale, rotation: { x: 0, z: 0 }, screenFocus: { y: 0 } }, 4000);
		}
	}
}