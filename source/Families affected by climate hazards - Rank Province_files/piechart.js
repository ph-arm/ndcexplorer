'use strict';

function PlotPieChart(config, data) { 
	var domNode   = config.domNode;
	var svgWidth  = config.width;
	var svgHeight = config.height;
	var margin    = config.margin;
	var keys      = config.objects ? config.objects.map(function(d){ return d.key;}) : Object.keys(data); 
	var colors    = config.colors ? config.colors : d3.schemeCategory20c;
	var padding   = config.padding || 0.5;

    d3.select(domNode).selectAll('div').remove();
    d3.select(domNode).selectAll('svg').remove();
        
	var tooltip = d3.select(domNode)
        .append('div')
        .attr("id","tooltip")
        .style("display","none");

    var	svg = d3.select(domNode)
        .append('div')
        .attr('class','row justify-content-center')
        .append('svg')
        .attr('width',svgWidth)
        .attr('height',svgHeight);
	
    var divTitle = d3.select(domNode)
        .append('div')
        .attr('class','pie-title')
        .text(data[0].type + " Project");

	var	width  = svgWidth - margin.left - margin.right,
		height = svgHeight - margin.top - margin.bottom;
		
	var gFeature = svg.append("g").attr("transform", "translate(" + [width/2,height/2] + ")");
	// var gTitle = svg.append("g");
    
    
    var radius = Math.min(width, height) * 0.45;

    var arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(0);

    var labelArc = d3.arc()
        .outerRadius(radius * 0.5)
        .innerRadius(radius * 0.5);

    var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.percentage; });

    var g = gFeature.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d,i) { return colors[i]; });

    g.append("text")
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) { return numeral(d.data.percentage).format(config.NumFormat); })
        .style('text-anchor', 'middle');


        
    //Display tooltips ------------------------------------------------
    // g.on("mouseover", function(d, idx) { 
    //         console.clear();
    //         console.log(idx,d);
    //         var value1 = d.data[config.tooltip.keys[0]];
    //         var value2 = numeral(d.data[config.tooltip.keys[1]]).format(config.NumFormat);
	// 		if (typeof(config.objects)!=='undefined'){ 
	// 			var content1 = "<b>" + config.objects[0].text + "</b>: " + value1; 
	// 			var content2 = "<b>" + config.objects[i+1].text + "</b>: " + value2;
	// 		} else {
	// 			var content1 = "<b>" + keys[0]       + "</b>: " + value1;
	// 			var content2 = "<b>" + keys[i+1] + "</b>: " + value2;
	// 		}
	// 		var content = content1 + '<br />' + content2;
	// 		tooltip.style("display", "block").html(content);
    //     })
    //     .on("mousemove", function() {
    //         // tip positioning
    //         // var mouse = d3.mouse(this); //on svg
	// 		// var mouse = [d3.event.pageX, d3.event.pageY]; //on page
	// 		var mouse = [event.clientX, event.clientY]; //on screen
	// 		var dim = tooltip.node().getBoundingClientRect();
    //         var x = mouse[0] - dim.width/2;
    //         var y = mouse[1] - dim.height - 5;
    //         tooltip.attr("style", "left:" + x + "px; top:" + y + "px");
    //     })
    //     .on("mouseout", function() {
	// 		tooltip.style("display", "none");
    //     });
              
}


function wrap(text, width) {
	text.each(function() {
	  var text = d3.select(this),
		  words = text.text().split(/\s+/).reverse(),
		  word,
		  line = [],
		  lineNumber = 0,
		  lineHeight = 1.1, // ems
		  y = text.attr("y"),
		  dy = parseFloat(text.attr("dy")),
		  tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	  while (word = words.pop()) {
		line.push(word);
		tspan.text(line.join(" "));
		if (tspan.node().getComputedTextLength() > width) {
		  line.pop();
		  tspan.text(line.join(" "));
		  line = [word];
		  tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		}
	  }
	});
}
