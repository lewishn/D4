'use strict';

angular.module('d4', []).directive('d4', function($window) {
	return {
		link: link,
		restrict: "E",
		scope: {
			data: '=',
			options: '='
		}
	}

	function link(scope, element, attr) {
		var svg = d3.select(element[0])
			.append("svg")
			.style('width', '100%');
		
		scope.render = function(data, options) {
			// remove all previous items before render
			svg.selectAll('*').remove();
			
			if (options.chart === "horizontalBar") {
				drawHorizontalBarChart(svg, data, options, element);
			} else if (options.chart === "pie") {
				drawPieChart(svg, data, options, element);
			} else if (options.chart === "bubble") {
				drawBubbleChart(svg, data, options, element);
			}
		}

        scope.$watch('data', function(newValues, oldValues) {
        	return scope.render(newValues, scope.options);
		}, true);

       // Browser resize event
		window.onresize = function() {
			scope.$apply();
		}

		// Watch for resize event
		scope.$watch(function() {
			return angular.element($window)[0].innerWidth;
		}, function() {
			scope.render(scope.data, scope.options);
		});
	}

	function drawHorizontalBarChart(svg, data, options, element) {
		// if no data passed, exit
		if (!data) return;
		
		// set up variables
		var barHeight = options.barHeight || 30,
			barPadding = options.barPadding || 10,
			margin = options.margin || 10,
			fontSize = options.fontSize || 16,
			textPadding = options.textPadding || 5,
			width = options.width || d3.select(element[0]).node().offsetWidth - margin,
			height = options.height || fontSize + data.length * (fontSize + textPadding + barHeight + barPadding),
			color = d3.scale.category20(),
			xScale = d3.scale.linear()
				.domain([0, d3.max(data, function(d) { return d.value; })])
				.range([0, width]);

		svg.attr('height', height);

		// create the rectangles for the bar chart
		var bar = svg.selectAll('rect').data(data);
		bar.enter().append('rect')
			.attr('height', barHeight)
			.attr('width', function(d) { return xScale(d.value); })
			.attr('x', Math.round(margin/2))
			.attr('y', function(d,i) { return textPadding + fontSize + i * (fontSize + textPadding + barHeight + barPadding);})
			.attr('fill', function(d) { return color(d.label) });
		
		bar.enter().append("text")
			.attr('x', Math.round(margin/2))
			.attr('y', function(d,i) { return fontSize + i * (fontSize + textPadding + barHeight + barPadding);})
			.style("font-size", fontSize)
			.text(function(d) { return d.label + " (" + d.value +" votes)"});
	}

	function drawPieChart(svg, data, options, element) {
		// if no data passed, exit
		if (!data) return;
		
		// set up variables
		var outerRadius = options.outerRadius / 100 || 0.7,
			innerRadius = options.innerRadius / 100 || 0,
			textRadius = options.textRadius || 1.1,
			offsetX = options.offsetX || 0,
			offsetY = options.offsetY || 0,
			showLabels = options.showLabels || true,
			strokeColor = options.strokeColor || 'white',
			margin = options.margin || 0,
			fontSize = options.fontSize || 16,
			textFormat = options.textFormat || function(l, k) { return l + "(" + k + ")";},
			width = options.width || d3.select(element[0]).node().offsetWidth - margin,
			height = options.height || 500,
			radius = Math.min(width, height) / 2,
			color = d3.scale.category20();

		svg.attr("width", width)
			.attr("height", height);

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d){ return d.value; });
		
		var arc = d3.svg.arc()
		        .outerRadius(radius * outerRadius)
		        .innerRadius(radius * innerRadius);
		var textArc = d3.svg.arc()
				.outerRadius(radius * outerRadius * 2 * textRadius)
				.innerRadius(radius * innerRadius * 2 * textRadius);

		var g = svg.append('g')
			.attr('transform', 'translate(' + (width / 2 + offsetX) + ',' + (height / 2 + offsetY) + ')');

		// add the paths for each arc slice
		var slice = g.selectAll('path')
			.data(pie(data));

		slice.enter()
			.append('path')
			.attr('d', arc)
			.style('stroke', strokeColor)
	    	.style('fill', function(d, i){ return color(i) });

	    // pie labels
	    var labels = g.selectAll("text")
	    	.data(pie(data));

		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}

	    labels.enter()
	    	.append("text")
			.attr("dy", "0.3em")
			.style("font-size", fontSize)
			.text(function(d) { 
				return textFormat(d.data.label, d.data.value);
			})
			.attr("transform", function(d) {
				var pos = textArc.centroid(d);
				pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
				return "translate(" + textArc.centroid(d) + ")";
			})
			.style("text-anchor", function(d) {
				return midAngle(d) < Math.PI ? "start" : "end";
			});
	} 

	function drawBubbleChart(svg, data, options, element) {
		// set up variables
		var padding = options.padding || 0,
			fontSize = options.fontSize || 16,
			fitHeight = options.fitHeight || false,
			width = options.width || d3.select(element[0]).node().offsetWidth,
			height = options.height || width,
			showLabels = options.showLabels || true,
			color = d3.scale.category20();

		svg.attr("width", width)
			.attr("height", height);

		var pack = d3.layout.pack()
			.size([width, height])
			.padding(5);

		var nodes = pack.nodes({children: angular.copy(data)});
		// remove root
		nodes.shift();
		var top = fitHeight ? d3.min(nodes, function(d) { return d.y - d.r; }) : 0;
		if (fitHeight) {
			var bottom = d3.max(nodes, function(d) { return d.y + d.r; });
			svg.attr("height", bottom - top);
		}

		var node = svg.selectAll(".node")
			.data(nodes).enter()
				.append("g")
				.attr("class", "node")
				.attr("transform", function(d) {return "translate(" + d.x + "," + (d.y - top) + ")";});

		node.append("circle")
			.attr("fill", function(d) { return (d.children) ? "none" : color(d.label);})
			.attr("r", function(d) { return d.r; });

		if (showLabels) {
			node.append("text")
		      .attr("dy", ".3em")
		      .style("font-size", fontSize)
		      .style("text-anchor", "middle")
		      .text(function(d) { return d.label.substring(0, 5) || d.label});
	 	}
	}

	function drawHeatTable(svg, data, options, element) {
		var colorScale = d3.scale.linear()
			.domain([d3.min(data, function (d) { return d.value; }), d3.max(data, function (d) { return d.value; })])
			.range(["#1A237E", "#D50000"])
			.interpolate(d3.interpolateHcl);

		// transform data to table style
		var tableData = [], rowData = [];
		for (var i = 0; i < data.length; i++) {
			if (i != 0 && i % col.length === 0) {
				tableData.push(rowData);
				rowData = [];
			}
			rowData.push(data[i]);
		}

		var table = d3.select(element[0]).append("table")
			.attr("class", "table");
		var thead = table.append("thead");
		var tbody = table.append("tbody");

		// append column headers
		var headRow = thead.append("tr");
		headRow.append("th");
		headRow.selectAll("th.col").data(col)
			.enter().append("th")
				.text(function(d) { return d; });

		// append row headers
		var tr = tbody.selectAll("tr").data(tableData)
			.enter().append("tr")
				.append("th")
				.text(function(d, i) {return row[i];});

		tbody.selectAll("tr").each(function(data, i) {
			d3.select(this).selectAll("td").data(data)
				.enter().append("td")
				.style("background-color", function(d) { return colorScale(d.value); })
				.style("color", "#FFFFFF")
				.text(function(d){ return d.value });
		});
	}
});