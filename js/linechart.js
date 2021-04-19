
function lineChart(config, data ) { 
	var domNode = config.domNode;
	var svgWidth = 800;
	var svgHeight = 250;
	var keys = config.keys || Object.keys(data[0]); 
	var xLabel = config.xLabel || "";
	var yLabel = config.yLabel || "";
	
	d3.select(domNode).selectAll('div').remove();
	d3.select(domNode).selectAll('svg').remove();
		
	var tooltip = d3.select(domNode)
		.append('div')
		.attr("id","tooltip")
		.style("display","none");
	
	var svg = d3.select(domNode)
		.append('svg')
		// .attr('width',800)
		// .attr('height',250),				
		.attr("preserveAspectRatio", "xMidYMid")
		.attr("viewBox", "0 0 " + svgWidth + " " + svgHeight);

    var margin = {top: 20, right: 80, bottom: 30, left: 50},
		width  = svgWidth - margin.left - margin.right,
		height = svgHeight - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	var Years = data.map(function(d) { return d.Year; })
					.sort(function(a, b) { return a-b;})
					.filter(function(item, pos, arr) { return arr.indexOf(item) === pos; });

	var Provinces = data.map(function(d) { return d[keys[1]]; })
					.filter(function(item, pos, arr) { return arr.indexOf(item) === pos; });
	
  	var chartData = Years.map(function(year) {
						return {
							key: year,
							value: data.filter(function(d){ return d.Year == year; })
										.map(function(d,i,arr) { 
											for(var j=0; j<arr.length; j++){
												if(arr[j][keys[1]]==Provinces[i]){
													return {x: arr[j][keys[1]], y: arr[j][keys[2]] }; 
													break;
												}
											}
										})						   
						};
					});

	var xScale = d3.scaleBand()
				.domain(Provinces)
				.range([0, width]);

	var yScale = d3.scaleLinear()
				.domain([0, d3.max(data, function(d) { return d[keys[2]];}) ])
				.range([height, 0]);

	var Color = d3.scaleOrdinal(d3.schemeCategory10)
				.domain(chartData.map(function(d) { return d.key; }))
				;

	var line = d3.line()
				//.curve(d3.curveBasis)
				.x(function(d) { return xScale(d.x) + xScale.bandwidth()/2; })
				.y(function(d) { return yScale(d.y); });

	g.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(xScale))
		.append("text")
		.attr("transform", "translate(" + [width, -height*0.1] + ")")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("fill", "#000")
		.text(xLabel)
		.style('text-anchor','end');
		
	g.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(yScale))
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("fill", "#000")
		.text(yLabel);

	//gridline:
	g.append("g")
		.attr("class", "grid")
		.call( d3.axisLeft(yScale).tickFormat("").tickSize(-width) );

	var gLine = g.selectAll(".gLine")
		.data(chartData)
		.enter().append("g")
		.attr("class", "gLine");


	var aLine = gLine.append("path")
		.attr("class", "line")
		.attr("d", function(d) { return line(d.value); })
		.style("stroke", function(d) { return Color(d.key); })
		.style("fill",'none');

    var legend = g.selectAll(".legend")
        .data(Color.domain())
        .enter().append("g")
        .classed("legend", true)
        .attr("transform", function(d, i) {
			var ty = i * 20 + margin.top;
            return "translate(" + [width,ty] + ")";
		});
	
    legend.append("rect")
        .attr("x", 0 )
        .attr("width", 20)
        .attr("height", 2)
        .style("fill", Color);
	
	legend.append("text")
        .attr("x", 26)
        .attr("dy", ".45em")
		.text(function(d) { return d; });

	// aLine.on("mouseover", function(datum, idx) { 
	// 		var content1 = "<b>" + "text1" + "</b>: " + "value1"; 
	// 		var content2 = "<b>" + "text2" + "</b>: " + "value2";	
	// 		var content = content1 + '<br />' + content2;
	// 		tooltip.style("display", "block").html(content);
	// 	})
	// 	.on("mousemove", function() {
	// 		// tip positioning
	// 		// var mouse = d3.mouse(this); //on svg
	// 		// var mouse = [d3.event.pageX, d3.event.pageY]; //on page
	// 		var mouse = [event.clientX, event.clientY]; //on screen
	// 		var dim = tooltip.node().getBoundingClientRect();
	// 		var x = mouse[0] - dim.width/2;
	// 		var y = mouse[1] - dim.height - 5;
	// 		tooltip.attr("style", "left:" + x + "px; top:" + y + "px");
	// 	})
	// 	.on("mouseout", function() {
	// 		tooltip.style("display", "none");
	// 	});
}


