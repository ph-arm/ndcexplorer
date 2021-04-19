/*
PlotBarchart({
    domNode: document.querySelector('#divid'),
    data   : data,
    config : {
        width  : 800,
        height : 350,
        margin : {top: 20, right: 50, bottom: 70, left: 50},
        colors : ["#2FB773", "#FAA634", "#58595B", "#45A2BC"].reverse(),
        object: [{key:"province_name", text:"Province", format:""},
					{key:"amount_usd"   , text:"Amount"  , format:"0,0 $"}],
        padding: 0.5,
        xaxis  : { wrap: false, rotate:45 },
        yaxis  : { showGrid: true, numTicks: 10 },
        legend : { show: true },
        NumFormat: "0 $"
    }
});

var objBar = new Barchart(config);
objBar.render(data);




*/



class BarChart {
    // load in arguments from config object
    constructor(params) {
        this.config  = params.config;
        // if(this.config.width = this.domNode.offsetWidth;
        if (typeof(this.config.width) === 'undefined' || typeof(this.config.height) === 'undefined') { 
            this.config.width = this.domNode.offsetWidth;
            this.config.height = this.config.width * 0.75;
        }

        // create the chart
        if(params.data){
			this.render(params.data);
		}
	}

	render(data) {
		var config    = this.config;
		var domNode   = config.domNode;
		var svgWidth  = config.width;
		var svgHeight = config.height;
		var margin    = config.margin;
		var keys      = config.objects ? config.objects.map(function(d){ return d.key;}) : Object.keys(data[0]); 
		var colors    = config.colors ? config.colors : d3.schemeCategory20c;
		var padding   = config.padding || 0.5;
		var	width     = config.width - config.margin.left - config.margin.right;
		var height    = config.height - config.margin.top - config.margin.bottom;
		var showTitle = config.title ? config.title.show : false;

		d3.select(domNode).selectAll('div').remove();
		d3.select(domNode).selectAll('svg').remove();
		
		this.tooltip = d3.select(domNode)
			.append('div')
			.attr("id","tooltip")
			.style("display","none");

		this.svg = d3.select(domNode).append('svg');
		if (config.responsive){
			this.svg.attr("preserveAspectRatio", "xMidYMid")
				.attr("viewBox", "0 0 " + svgWidth + " " + svgHeight);
		} else {
			this.svg.attr('width',svgWidth)
				.attr('height',svgHeight);
		}
		
		this.feature = this.svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		//Chart title
		if (showTitle){
			var gTitle = this.svg.append("g")
				.attr('class','chart-title')
				.attr("transform", "translate(" + [svgWidth/2, margin.top/2] + ")");

			gTitle.append('text')
				.attr('dy','0.5em')
				.text(config.title.text)
				.style("text-anchor", 'middle')
				.style('font-size',16)
				.style('font-weight','bold');
		}
		//preparing scales ------------------------------------------------------------
		var xScale = d3.scaleBand()
					.domain(data.map(function(d) { return d[keys[0]];} ))
					.range([0, width])
					.padding(padding)
					//.align(0.1)
					;

		// var ymax = d3.max(data, function(d) { return d3.sum(Object.values(d).slice(1));});
		var ymax = d3.max(data, function(d) { return d3.sum(keys.slice(1).map(function(k){ return d[k];}));});

		var yScale = d3.scaleLinear()
					.domain([0, ymax])
					.range([height, 0]);

		var stack = d3.stack()
					//.offset(d3.stackOffsetExpand)
					.keys(keys.slice(1))
					(data);

		
		//Generate axes -------------------------------------------------------------
		//x-axis: 
		this.feature.append("g")
			.attr("class", "axis x-axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(xScale));

		if (config.xaxis.wrap === true){
			feature.selectAll(".tick text")
				.call(wrap, xScale.bandwidth());
		}

		if(typeof(config.xaxis.rotate) !== "undefined"){ 
			this.feature.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", ".15em")
				.attr("transform", function(d){	return `rotate(-${config.xaxis.rotate})`; });
				;
		}

		//y-axis: 
		var yAxis = d3.axisLeft(yScale)
			.ticks(config.yaxis.numTicks, "s");

		this.feature.append("g")
			.attr("class", "axis y-axis")
			.call(yAxis);

		//gridline:
		if(config.yaxis.showGrid === true){
			this.feature.append("g")
				.attr("class", "grid")
				.call( yAxis.tickFormat("").tickSize(-width) );
		}

		//series of bars -----------------------------------------------------------------
		this.feature.selectAll(".serie").remove();

		var serie = this.feature.selectAll(".serie")
			.data(stack)
			.enter().append("g")
			.attr("class", "serie")
			.attr("order",function(d,i){ return i; })
			.attr("fill", function(d,i){ return colors[i]; });

		var rects = serie.selectAll("rect")
			.data(function(d) { return d; })
			.enter().append("rect")
			.attr("x", function(d) { return xScale(d.data[keys[0]]); })
			.attr("y", function(d) { return yScale(d[1]); })
			.attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
			.attr("width", xScale.bandwidth());


		//Show total above rects
		if(typeof(config.lebels) !== 'undefined' && config.lebels.show){
			this.feature.append("g")
				.attr("class", "top-text")	
				.selectAll("text")
				.data(stack[stack.length-1])
				.enter().append("text")
				.attr("x", function(d) { return xScale(d.data[keys[0]]) + xScale.bandwidth()/2; })
				.attr("y", function(d) { return yScale(d[1]) - 5; })
				// .attr('dy','0.3em')
				.text(function(d) { return numeral(d[1]).format(config.NumFormat); })
				.style('text-anchor','middle')
				.style('font-size', 12)
				.style('fill', 'black');
		}

		//Generate legend -----------------------------------------------------------------
		if (config.legend && config.legend.show === true){ 
			var legendTexts = config.objects ? config.objects.map(function(d){ return d.text;}).slice(1) : keys.slice(1);

			if (config.legend.orient==2){ //vertical legend
				// legendTexts = legendTexts.reverse();
				var legend = this.feature.append("g")
					.attr('class','legend')
					.attr("text-anchor", "start")
					.attr("transform", "translate("+ [width*1.01, 0] + ")" )
					.selectAll("g")
					.data(legendTexts)
					.enter().append("g")
					.attr("transform", function(d, i) { return "translate("+ [0, (legendTexts.length-1-i)*height/(keys.length)] + ")"; });
					
			} else { //horizontal legend
				var legend = this.feature.append("g")
					.attr('class','legend')
					.attr("text-anchor", "start")
					.attr("transform", "translate("+ [0, height+margin.bottom/2] + ")" )
					.selectAll("g")
					.data(legendTexts)
					.enter().append("g")
					.attr("transform", function(d, i) { return "translate("+ [(i+1)*width/(keys.length), 0] + ")"; });
			}
			legend.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width" , 15)
				.attr("height", 15)
				.attr("fill", function(d,i){ return colors[i]; });

			legend.append("text")
				.attr("x", 0 + 15 + 2)
				.attr("y", 0 + 9)
				.attr("dy", "0.32em")
				.text(function(d) { return d; });
		}
		
		//Display tooltips ------------------------------------------------
		var self = this;
		rects.on("mouseover", function(datum) { 
				var i = +d3.select(this.parentNode).attr("order");
				if (config.objects){ 
					var text1 = "<b>" + config.objects[0].text + "</b>: " + datum.data[keys[0]]; 
					var text2 = "<b>" + config.objects[i+1].text + "</b>: " + numeral(datum.data[keys[i+1]]).format(config.NumFormat);
				} else {
					var text1 = "<b>" + keys[0]       + "</b>: " + datum.data[keys[0]]; 
					var text2 = "<b>" + keys[i+1] + "</b>: " + numeral(datum.data[keys[i+1]]).format(config.NumFormat);
				}
				var content = text1 + '<br />' + text2;
				self.tooltip.style("display", "block").html(content);
			})
			.on("mousemove", function() {
				// tip positioning
				// var mouse = d3.mouse(this); //on svg
                // var mouse = [d3.event.pageX, d3.event.pageY]; //on page
				var mouse = [event.clientX, event.clientY]; //on screen
                var dim = self.tooltip.node().getBoundingClientRect();
				var x = mouse[0] - dim.width/2;
				var y = mouse[1] - dim.height - 5;
				self.tooltip.attr("style", "left:" + x + "px; top:" + y + "px");
			})
			.on("mouseout", function() {
				self.tooltip.style("display", "none");
			});
				
	}
}

function PlotBarchart(params) { 
	
	var data      = params.data;
	var config    = params.config;
	var domNode   = config.domNode;
	var svgWidth  = config.width;
	var svgHeight = config.height;
	var margin    = config.margin;
    var keys      = config.objects ? config.objects.map(function(d){ return d.key;}) : Object.keys(data[0]); 
	var colors    = config.colors ? config.colors : d3.schemeCategory20c;
	var padding   = config.padding || 0.5;
	var chartType = config.type == 2 ? 2 : 1; //1=stacked, 2=grouped

    d3.select(domNode).selectAll('div').remove();
    d3.select(domNode).selectAll('svg').remove();
        
	var tooltip = d3.select(domNode)
        .append('div')
        .attr("id","tooltip")
        .style("display","none");

	var	svg = d3.select(domNode).append('svg');
	if (config.responsive){
		svg.attr("preserveAspectRatio", "xMidYMid")
			.attr("viewBox", "0 0 " + svgWidth + " " + svgHeight);
	} else {
		svg.attr('width',svgWidth)
			.attr('height',svgHeight);
	}
	
	var	width  = svgWidth - margin.left - margin.right,
		height = svgHeight - margin.top - margin.bottom;
		
	var feature = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	//preparing scales ------------------------------------------------------------
	var xScale = d3.scaleBand()
				.domain(data.map(function(d) { return d[keys[0]];} ))
				.range([0, width])
    			.padding(padding)
				//.align(0.1)
				;

	var xScale1 = d3.scaleBand()
				.domain(keys.slice(1))
				.range([0, xScale.bandwidth()])
    			.padding(0.1)
				//.align(0.1)
				;
				
	if (chartType == 1){
		var ymax = d3.max(data, function(d) { return d3.sum(keys.slice(1).map(function(k){ return d[k];}));});
	} else {
		var ymax = d3.max(data, function(d) { return d3.max(Object.values(d).slice(1));});
	}
	var yScale = d3.scaleLinear()
				.domain([0, ymax])
				.range([height, 0]);


	var stack = d3.stack()
				//.offset(d3.stackOffsetExpand)
				.keys(keys.slice(1))
				(data);


	//Generate axes -------------------------------------------------------------
	//x-axis: 
	feature.append("g")
		.attr("class", "axis x-axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(xScale));

	if (config.xaxis.wrap === true){
		feature.selectAll(".tick text")
			.call(wrap, xScale.bandwidth());
	}

	if(typeof(config.xaxis.rotate) !== "undefined") { 
		feature.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", function(d){	return `rotate(-${config.xaxis.rotate})`; });
			;
	}

	//y-axis: 
	var yAxis = d3.axisLeft(yScale)
		.ticks(config.yaxis.numTicks, "s");

	feature.append("g")
		.attr("class", "axis y-axis")
		.call(yAxis);

	//gridline:
	if(config.yaxis.showGrid === true){
		feature.append("g")
			.attr("class", "grid")
			.call( yAxis.tickFormat("").tickSize(-width) );
	}

	//series of bars -----------------------------------------------------------------
	if (chartType == 1){

		var serie = feature.selectAll(".serie")
			.data(stack)
			.enter().append("g")
			.attr("class", "serie")
			.attr("order",function(d,i){ return i; })
			.attr("fill", function(d,i){ return colors[i]; });

		var rects = serie.selectAll("rect")
			.data(function(d) { return d; })
			.enter().append("rect")
			.attr("x", function(d) { return xScale(d.data[keys[0]]); })
			.attr("y", function(d) { return yScale(d[1]); })
			.attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
			.attr("width", xScale.bandwidth());

		//Show total above rects
		if(typeof(config.lebels) !== 'undefined' && config.lebels.show){
			feature.append("g")
				.attr("class", "top-text")	
				.selectAll("text")
				.data(stack[stack.length-1])
				.enter().append("text")
				.attr("x", function(d) { return xScale(d.data[keys[0]]) + xScale.bandwidth()/2; })
				.attr("y", function(d) { return yScale(d[1]) - 5; })
				// .attr('dy','0.3em')
				.text(function(d) { return numeral(d[1]).format(config.NumFormat); })
				.style('text-anchor','middle')
				.style('font-size', 12)
				.style('fill', 'black');
		}
	} else if(chartType == 2){

		var serie = feature.selectAll(".serie")
			.data(data)
			.enter().append("g")
			.attr("class", "serie")
			.attr("order",function(d,i){ return i; })
			.attr("transform",function(d) { return "translate(" + xScale(d[keys[0]]) + ",0)"; });
			
		var rects = serie.selectAll("rect")
			.data(function(d) { return keys.map(function(e) { return {x:e, y:d[e]}; }).slice(1); })
			.enter().append("rect")
			.attr("x", function(d,) { return xScale1(d.x); })
			.attr("y", function(d,i) { return yScale(d.y); })
			.attr("width", xScale1.bandwidth())
			.attr("height", function(d,i) { return height - yScale(d.y); })
			.attr("fill", function(d,i){ return colors[i]; });
	}

	//Generate legend -----------------------------------------------------------------
	if (config.legend && config.legend.show === true){ 
		var legendTexts = config.objects ? config.objects.map(function(d){ return d.text;}).slice(1) : keys.slice(1);

		if (config.legend.orient==2){ //vertical legend
			// legendTexts = legendTexts.reverse();
			var legend = feature.append("g")
				.attr('class','legend')
				.attr("text-anchor", "start")
				.attr("transform", "translate("+ [width*1.01, 0] + ")" )
				.selectAll("g")
				.data(legendTexts)
				.enter().append("g")
				.attr("transform", function(d, i) { return "translate("+ [0, (legendTexts.length-1-i)*height/(keys.length)] + ")"; });
				
		} else { //horizontal legend
			var legend = feature.append("g")
				.attr('class','legend')
				.attr("text-anchor", "start")
				.attr("transform", "translate("+ [0, height+margin.bottom/2] + ")" )
				.selectAll("g")
				.data(legendTexts)
				.enter().append("g")
				.attr("transform", function(d, i) { return "translate("+ [(i+1)*width/(keys.length), 0] + ")"; });
		}

		legend.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width" , 15)
			.attr("height", 15)
			.attr("fill", function(d, i) { return colors[i]});

		legend.append("text")
			.attr("x", 0 + 15 + 2)
			.attr("y", 0 + 9)
			.attr("dy", "0.32em")
			.text(function(d) { return d; });
	}
	
    //Display tooltips ------------------------------------------------
    rects.on("mouseover", function(datum, idx) { 
			var order = +d3.select(this.parentNode).attr("order"); 
			if (chartType==1){
				var i = order;
				var value1 = datum.data[keys[0]];
				var value2 = numeral(datum.data[keys[i+1]]).format(config.NumFormat);
			} else {
				var i = idx;
				var value1 = data[order][keys[0]];
				var value2 = numeral(datum.y).format(config.NumFormat);
			}
			if (config.objects){ 
				var content1 = "<b>" + config.objects[0].text + "</b>: " + value1; 
				var content2 = "<b>" + config.objects[i+1].text + "</b>: " + value2;
			} else {
				var content1 = "<b>" + keys[0]       + "</b>: " + value1;
				var content2 = "<b>" + keys[i+1] + "</b>: " + value2;
			}
			var content = content1 + '<br />' + content2;
			tooltip.style("display", "block").html(content);
        })
        .on("mousemove", function() {
            // tip positioning
            // var mouse = d3.mouse(this); //on svg
			// var mouse = [d3.event.pageX, d3.event.pageY]; //on page
			var mouse = [event.clientX, event.clientY]; //on screen
			var dim = tooltip.node().getBoundingClientRect();
            var x = mouse[0] - dim.width/2;
            var y = mouse[1] - dim.height - 5;
            tooltip.attr("style", "left:" + x + "px; top:" + y + "px");
        })
        .on("mouseout", function() {
			tooltip.style("display", "none");
        });
              
}

function BarLinechart(params) {
	
	var data      = params.data;
	var config    = params.config;
	var domNode   = config.domNode;
	var svgWidth  = config.width;
	var svgHeight = config.height;
	var margin    = config.margin;
    var keys      = config.objects ? config.objects.map(function(d){ return d.key;}) : Object.keys(data[0]); 
    var keysline  = config.objline ? config.objline.map(function(d){ return d.key;}) : Object.keys(data[0]); 
	var colors    = config.colors ? config.colors : d3.schemeCategory20c;
	var padding   = config.padding || 0.5;

    d3.select(domNode).selectAll('div').remove();
    d3.select(domNode).selectAll('svg').remove();
        
	var tooltip = d3.select(domNode)
        .append('div')
        .attr("id","tooltip")
        .style("display","none");

	var	svg = d3.select(domNode).append('svg');
	if (config.responsive){
		svg.attr("preserveAspectRatio", "xMidYMid")
			.attr("viewBox", "0 0 " + svgWidth + " " + svgHeight);
	} else {
		svg.attr('width',svgWidth)
			.attr('height',svgHeight);
	}
	
	var	width  = svgWidth - margin.left - margin.right,
		height = svgHeight - margin.top - margin.bottom;
		
	var feature = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					
	//preparing scales ------------------------------------------------------------
	var xScale = d3.scaleBand()
				.domain(data.map(function(d) { return d[keys[0]];} ))
				.range([0, width])
    			.padding(padding)
				//.align(0.1)
				;

	// var ymax = d3.max(data, function(d) { return d3.sum(Object.values(d).slice(1));});
	var ymax = d3.max(data, function(d) { return d3.sum(keys.slice(1,3).map(function(k){ return d[k];}));});
	var yScale = d3.scaleLinear()
				.domain([0, ymax])
				.range([height, 0]);

	var yScale1 = d3.scaleLinear()
				.range([height, 0]);

    var line = d3.line()
                 .x(function(d) { return xScale(d[keys[0]]) + xScale.bandwidth()/2; })
				 .y(function(d) { return yScale1(d[keysline[0]]); });

	var stack = d3.stack()
				//.offset(d3.stackOffsetExpand)
				.keys(keys.slice(1))
				(data);

	
	//Generate axes -------------------------------------------------------------
	//x-axis: 
	var gxAxis = feature.append("g")
		.attr("class", "axis x-axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(xScale));

	if (config.xaxis.wrap === true){
		feature.selectAll(".tick text")
			.call(wrap, xScale.bandwidth());
	}

	if(typeof(config.xaxis.rotate) !== "undefined"){ 
		feature.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", function(d){	return `rotate(-${config.xaxis.rotate})`; });
			;
	}

	//y-axis: 
	var yAxis = d3.axisLeft(yScale)
		.ticks(config.yaxis.numTicks, "s");
		// .tickFormat(function(d){ return yFormat(d); });

	var gyAxis = feature.append("g")
		.attr("class", "axis y-axis")
		.call(yAxis);

	//Edit y axis tick number format
	gyAxis.selectAll('.tick text')
		.each(function(d,i){
			var self = d3.select(this);
			var text = self.text().replace('G','B');
			self.text(text);
		});

	// text label for the y axis
	// svg.append("text")
	// 	.attr("transform", "rotate(-90)")
	// 	.attr("y", 0)
	// 	.attr("x", - height / 2)
	// 	.attr("dy", "1em")
	// 	.style("text-anchor", "middle")
	// 	.text("Value");      

	feature.append("g")
		.attr("class", "axis y-axis")
      	.attr("transform", "translate( " + width + ", 0 )")
		.call(d3.axisRight(yScale1).ticks(5, "%"));

	//gridline:
	if(config.yaxis.showGrid === true){
		feature.append("g")
			.attr("class", "grid")
			.call( yAxis.tickFormat("").tickSize(-width) );
	}

	//series of bars -----------------------------------------------------------------
	var serie = feature.selectAll(".serie")
		.data(stack)
		.enter().append("g")
		.attr("class", "serie")
		.attr("order",function(d,i){ return i; })
		.attr("fill", function(d,i){ return colors[i]; });

	var rects = serie.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
		.attr("x", function(d) { return xScale(d.data[keys[0]]); })
		.attr("y", function(d) { return yScale(d[1]); })
		.attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
		.attr("width", xScale.bandwidth());

	//append line
	feature.append("g")
		.attr("class", "line")
		.append('path')
		.attr('d', line(data))
		.style('fill', 'none')
		.style('stroke-width', '1.5px')
		.style("stroke", function(d,i){ return colors[i + keys.length-1]; });
		
	//Generate legend -----------------------------------------------------------------
	if (config.legend && config.legend.show === true){ 
		var legendTexts = config.objects ? config.objects.map(function(d){ return d.text;}).slice(1) : keys.slice(1);
		if(config.objline){
			var legendLine = config.objline ? config.objline.map(function(d){ return d.text;}) : keysline;
			legendTexts = legendTexts.concat(legendLine);
		}
		var legend = feature.append("g")
			.attr('class','legend')
			.attr("text-anchor", "start")
			.attr("transform", "translate("+ [0, height+margin.bottom/2] + ")" )
			.selectAll("g")
			.data(legendTexts)
			.enter().append("g")
			.attr("transform", function(d, i) { return "translate("+ [(i+1)*width/(legendTexts.length+1), 0] + ")"; });

		legend.append("rect")
			.attr("x", 0)
			.attr("y" , function(d, i) { 
				return (i > legendTexts.length-legendLine.length-1) ? 8 : 0;
			})
			.attr("width", 15)
			.attr("height" , function(d, i) { 
				return (i > legendTexts.length-legendLine.length-1) ? 2 : 15;
			})
			.attr("fill", function(d, i) { return colors[i]; });

		legend.append("text")
			.attr("x", 0 + 15 + 2)
			.attr("y", 0 + 9)
			.attr("dy", "0.32em")
			.text(function(d) { return d; });
	}
	
    //Display tooltips ------------------------------------------------
    rects.on("mouseover", function(datum) { 
			var i = +d3.select(this.parentNode).attr("order");
			if (config.objects){ 
				var text1 = "<b>" + config.objects[0].text + "</b>: " + datum.data[keys[0]]; 
				var text2 = "<b>" + config.objects[i+1].text + "</b>: " + numeral(datum.data[keys[i+1]]).format(config.NumFormat);
			} else {
				var text1 = "<b>" + keys[0]       + "</b>: " + datum.data[keys[0]]; 
				var text2 = "<b>" + keys[i+1] + "</b>: " + numeral(datum.data[keys[i+1]]).format(config.NumFormat);
			}
			var content = text1 + '<br />' + text2;
			tooltip.style("display", "block").html(content);
        })
        .on("mousemove", function() {
            // tip positioning
            // var mouse = d3.mouse(this); //on svg
			// var mouse = [d3.event.pageX, d3.event.pageY]; //on page
			var mouse = [event.clientX, event.clientY]; //on screen
			var dim = tooltip.node().getBoundingClientRect();
            var x = mouse[0] - dim.width/2;
            var y = mouse[1] - dim.height - 5;
            tooltip.attr("style", "left:" + x + "px; top:" + y + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
              
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
