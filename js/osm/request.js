export default class OSMRequest
{
	constructor()
	{
		this.baseUrl = "https://overpass-api.de/api/";
		//this.baseUrl = "https://overpass.kumi.systems/api/";
		this.statusUrl = this.baseUrl + "status";
		this.apiUrl = this.baseUrl + "interpreter?data=";
		this.minTimeout = 100;

		this.totalLoadingTime = 0;

		this.requests = [];
		this.lastRequestTime = Date.now();


		this.waitingForFreeSlot = undefined;
	}

	async freeSlot()
	{
		let callbackobj = {};
		if (!this.waitingForFreeSlot)
		{
			this.waitingForFreeSlot = callbackobj;
		}
		else
		{
			let obj = this.waitingForFreeSlot;
			this.waitingForFreeSlot = callbackobj;
			await new Promise(r => obj.callback = r);
			await wait(100);
		}

		let text;
		let waitTime = 0;
		do
		{
			waitTime = 0;
			try
			{
				let status_res = await fetch(this.statusUrl + "?ran=" + Math.floor(Math.random() * (36 ** 10)).toString(36) + "_" + Date.now());
				text = await status_res.text();
				if (/slots available now/.test(text))
					waitTime = -1;
				else
				{
					let times = [];
					let regex = /in (\d+) seconds/g;
					let res;
					while (res = regex.exec(text))
					{
						times.push(+res[1] * 1000 + 500);
					}
					if (times.length > 0)
						waitTime = Math.min(...times);
				}
			}
			catch (e)
			{
				console.warn("Error while waiting for free slot:", e);
			}
			if (waitTime > 0)
				await wait(waitTime);
			else
				await wait(5000);
		} while (waitTime >= 0);

		if (callbackobj.callback)
			callbackobj.callback();
		else
			this.waitingForFreeSlot = undefined;
	}

	async request(code)
	{
		let startTime = performance.now();
		while (true)
		{
			let timer_id = Math.floor(Math.random() * 0x1000000).toString(16);
			console.time("waiting for free slot " + timer_id);
			await this.freeSlot();
			console.timeEnd("waiting for free slot " + timer_id);
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