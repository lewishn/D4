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
			} else if (options.chart === "pieChart") {
				drawPieChart(svg, data, options, element);
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
		var outerRadius = options.outerRadius / 100 || 0.9,
			innerRadius = options.innerRadius / 100 || 0,
			offsetX = options.offsetX || 0,
			offsetY = options.offsetY || 0,
			showLabels = options.showLabels || true,
			strokeColor = options.strokeColor || 'white',
			margin = options.margin || 0,
			width = options.width || d3.select(element[0]).node().offsetWidth - margin,
			height = options.height || 500,
			min = Math.min(width, height),
			color = d3.scale.category20();

		svg.attr("width", width)
			.attr("height", height);

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d){ return d.value; });
		
		var arc = d3.svg.arc()
		        .outerRadius(min / 2 * outerRadius)
		        .innerRadius(min / 2 * innerRadius);

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
	    slice.enter()
	    	.append("text")
			.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
			.attr("dy", ".5em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.data.label + "(" + d.data.value +")"});
	} 
});