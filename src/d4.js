'use strict';
app.directive("d4", function($window) {
	return {
		link: link,
		restrict: "E",
		scope: {
			data: '=',
			options: '=',
			images: '='
		}
	}

	function link(scope, element, attr) {
		var svg = d3.select(element[0])
			.append("svg")
			.style('width', '100%');
		
		scope.render = function(data, options) {
			// remove all previous items before render
			svg.selectAll('*').remove();
			var ops = setupOptions(options, element);
			
			//draw primary
			drawHorizontalBarChart(svg, data, ops, false);

			//draw secondary
			if (ops.secondary === 'horizontalBar') {
				drawHorizontalBarChart(svg, data, ops, true);
			} else if (ops.secondary === 'pie') {
				drawPieChart(svg, data, ops, true);
			} else if (ops.secondary === 'bubble') {
				drawBubbleChart(svg, data, ops, true);
			}
		}

        scope.$watch('data', function(newValues, oldValues) {
        	return scope.render(newValues, scope.options);
		}, true);
		scope.$watchCollection('options', function(newValues, oldValues) {
        	return scope.render(scope.data, newValues);
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

	function drawHorizontalBarChart(svg, data, options, isSecondary) {
		// if no data passed, exit
		if (!data) return;

		// set svg height
		var height = options.fontSize + data.length * (options.fontSize + options.textPadding + options.barHeight + options.barPadding);
		options.height = (options.height) ? Math.max(options.height, height) : height;
		svg.attr('height', options.height);

		var	color = d3.scale.category20(),
			xScale = d3.scale.linear()
				.domain([0, d3.max(data, function(d) { return d.value; })])
				.range([0, options.width - options.margin]);

		var g = svg.append("g");
		// create the rectangles for the bar chart
		var bar = g.selectAll('rect').data(data);
		bar.enter().append('rect')
			.attr('height', options.barHeight)
			.attr('width', function(d) { return xScale(d.value); })
			.attr('x', Math.round(options.margin/2))
			.attr('y', function(d,i) { return options.textPadding + options.fontSize + i * (options.fontSize + options.textPadding + options.barHeight + options.barPadding);})
			.attr('fill', function(d) { return color(d.label) });
		
		bar.enter().append("text")
			.attr('x', Math.round(options.margin/2))
			.attr('y', function(d,i) { return options.fontSize + i * (options.fontSize + options.textPadding + options.barHeight + options.barPadding);})
			.style("font-size", options.fontSize)
			.text(function(d) { return d.label + " (" + d.value +" votes)"});

		var translateX = isSecondary ? options.width : 0;
		g.attr('transform', 'translate(' + translateX + ', 0)');
	} 

	function drawPieChart(svg, data, options, isSecondary) {
		// if no data passed, exit
		if (!data) return;
		
		// set up variables
		var textRadius = options.textRadius || 1.1,
			width = options.width - options.margin,
			height = Math.min(width, 400),
			radius = Math.min(width, height) / 2,
			color = d3.scale.category20();

		if (options.height) {
			svg.attr("height", Math.max(options.height, height));
		}

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d){ return d.value; });
		
		var arc = d3.svg.arc()
		        .outerRadius(radius * options.outerRadius - options.margin)
		        .innerRadius(radius * options.innerRadius - options.margin);
		var textArc = d3.svg.arc()
				.outerRadius(radius * options.outerRadius * 2 * textRadius - options.margin)
				.innerRadius(0 - options.margin);

		var translateX = (width / 2 + options.offsetX) + (isSecondary ? width : 0);
		var g = svg.append('g')
			.attr('transform', 'translate(' + translateX + ',' + (height / 2 + options.offsetY) + ')');

		// add the paths for each arc slice
		var slice = g.selectAll('path')
			.data(pie(data));

		slice.enter()
			.append('path')
			.attr('d', arc)
			.style('stroke', options.strokeColor)
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
			.style("font-size", options.fontSize)
			.text(function(d) { 
				return d.data.value > 0 ? d.data.label : "" ;
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

	function drawBubbleChart(svg, data, options, isSecondary) {
		var color = d3.scale.category20();
		var height = Math.min(options.width, 400);
		var pack = d3.layout.pack()
			.size([options.width, height])
			.padding(5);

		var nodes = pack.nodes({children: angular.copy(data)});
		// remove root
		nodes.shift();
		var top = options.fitHeight ? d3.min(nodes, function(d) { return d.y - d.r; }) : 0;
		if (options.fitHeight) {
			var bottom = d3.max(nodes, function(d) { return d.y + d.r; });
			var h = options.height || height;
			svg.attr("height", Math.max(h, bottom - top));
		}

		var g  = svg.append("g");
		var node = g.selectAll(".node")
			.data(nodes).enter()
				.append("g")
				.attr("class", "node")
				.attr("transform", function(d) {return "translate(" + d.x + "," + (d.y - top) + ")";});

		node.append("circle")
			.attr("fill", function(d) { return (d.children) ? "none" : color(d.label);})
			.attr("r", function(d) { return d.r; });

		node.append("text")
		    .attr("dy", ".3em")
		    .style("font-size", options.fontSize)
		    .style("text-anchor", "middle")
		    .text(function(d) { return d.label.substring(0, 5) || d.label});

		if (isSecondary) {
			g.attr("transform", "translate(" + options.width + ",0 )");
		}
	}

	function setupOptions(options, element) {
		var svgWidth = d3.select(element[0]).node().offsetWidth;
		// Setup options
		options.fontSize = options.fontSize || 16;
		options.strokeColor = options.strokeColor || "white";
		options.strokeWidth = options.strokeWidth || 2;
		options.color = options.color || "steelblue";
		// horizontal bar
		options.barHeight = options.barHeight || 30;
		options.barPadding = options.barPadding || 10;
		options.textPadding = options.textPadding || 5;
		options.margin = options.margin || 10;
		// pie / donut
		options.outerRadius = options.outerRadius || 0.9;
		options.innerRadius = options.innerRadius || 0;
		options.offsetX = options.offsetX || 0;
		options.offsetY = options.offsetY || 0;
		// bubble
		options.padding = options.padding || 0;
		options.fitHeight = options.fitHeight || true;
		// heat table
		console.log(options.secondary);
		options.heatColor = options.heatColor || ["#1A237E" , "#DD2C00"];
		options.width = (options.secondary) ? svgWidth / 2 : svgWidth;
		return options;
	}
});