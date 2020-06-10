export default class OSMRequest
{
	constructor()
	{
		//this.baseUrl = "https://overpass-api.de/api/";
		this.baseUrl = "https://overpass.kumi.systems/api/";
		this.statusUrl = this.baseUrl + "status";
		this.apiUrl = this.baseUrl + "interpreter?data=";
		this.minTimeout = 100;

		this.totalLoadingTime = 0;

		this.requests = [];
		this.lastRequestTime = Date.now();


		this.waitingForFreeSlot = undefined;
	}

	async request(code)
	{
		let startTime = performance.now();
		while (true)
		{
			let timer_id = Math.floor(Math.random() * 0x1000000).toString(16);
			try
			{
				console.time("fetch time " + timer_id);
				let res = await fetch(this.apiUrl + encodeURIComponent(code));
				let json = await res.json();
				console.timeEnd("fetch time " + timer_id);
				let endTime = performance.now();
				let time = endTime - startTime;
				this.totalLoadingTime += time;
				return json;
			}
			catch (e)
			{
				console.warn("request failed!", e);
				await wait(5000);
				console.log("trying again...");
			}
		}
	}
}

async function wait(time)
{
	return new Promise(resolve => setTimeout(resolve, time));
}