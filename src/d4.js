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
});