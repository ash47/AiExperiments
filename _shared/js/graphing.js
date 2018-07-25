class ChartManager {
    constructor({
        element,
        title
    }) {
        this.element = element;
        this.title = title || '';

        this.chartData = {
            labels: [],
            datasets: [{
                name: 'Max',
                values: []
            }, {
                name: 'Average',
                values: []
            }, {
                name: 'Min',
                values: []
            }]
        };

        this.chart = new Chart(this.element, {
	        title: this.title,
	        type: 'line',
	        height: 128,
	        data: this.chartData
	    });
    }

    updateChart(generationNumber, max, avg, min) {
	    this.chartData.labels.push(generationNumber.toString())
	    this.chartData.datasets[0].values.push(Math.round(max))
	    this.chartData.datasets[1].values.push(Math.round(avg))
	    this.chartData.datasets[2].values.push(Math.round(min))

	    if (this.chartData.labels.length > 15) {
	        this.chartData.labels.shift()
	        this.chartData.datasets.forEach(d => d.values.shift())
	    }

	    this.chart.update(this.chartData)
	}
}