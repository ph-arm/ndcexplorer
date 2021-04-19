class MapChart {
    // load in arguments from config object
    constructor(options) {
        this.data    = options.data;
        this.domNode = options.domNode;
        this.config  = options.config;

        if (typeof(this.config.width) === 'undefined' || typeof(this.config.height) === 'undefined') { 
            this.config.width = this.domNode.offsetWidth;
            this.config.height = this.config.width * 0.75;
        }

        // create the chart
        this.render();
    }

    render() {
        this.path = d3.geoPath().projection(matrix(1, [0, 0])); 

        d3.select(this.domNode).selectAll('div').remove();
        d3.select(this.domNode).selectAll('svg').remove();

        this.tooltip = d3.select(this.domNode)
            .append('div')
            .attr("id","tip")
            .style("display","none");

        this.svg = d3.select(this.domNode).append("svg");
        if (this.config.responsive){
            this.svg
                .attr("preserveAspectRatio", "xMidYMid")
                .attr("viewBox", "0 0 " + this.config.width + " " + this.config.height);
        } else {
            this.svg
                .attr("width", this.config.width)
                .attr("height", this.config.height);
        }

        this.background = this.svg.append('rect')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.config.width)
            .attr("height", this.config.height)
            .style('fill','white')
            .style('opacity',0);

        this.mapFeature = this.svg.append('g').attr('class','features');

        this.gLegend = this.svg.append('g')
            .attr('id','legend')
            .attr('transform','translate('+[this.config.width-160, this.config.height-200]+')');

        var self = this;
        var geodir = this.config.geofolder + "/" + this.config.geofile[0];
        
        d3.json(geodir, function(error, geodata) { 
            if (error) throw error;

            self.centerZoom(geodata);
            self.drawSubUnits(geodata);
            // self.drawPlaces(geo);
            // self.drawOuterBoundary(geo);

            if (self.data){ self.applyNumeric(self.data); }
        });


    // Define the zoom and attach it to the map
    // var zoom = d3.zoom()
    //     .scaleExtent([1, 10])
    //     .on('zoom', doZoom);
    // svg.call(zoom);

        //window.addEventListener("resize", resize);

        // function resize(){
        //     var width = window.innerWidth,
        //         height = window.innerHeight;

        //     svg.attr("width", width).attr("height", height);

        //     centerZoom(geo, width, height);

        //     svg.selectAll("path").attr("d", path);
        //     svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });
        // }

    }

    applyNumeric(data){ 
        var match_value = this.config.match_value;
        var breakType = this.config.breakType;
        var breakCount = this.config.colors.length; 
        if (typeof(this.config.limits) === 'undefined') { 
            var limits = chroma.limits(data.map(function(d) {
                return +d[match_value.key];
            }), breakType, breakCount);
        } else {
            var limits = this.config.limits;
        }
		
        this.data = data;
        this.fillSubUnits(data,limits);
        if (typeof(this.config.legend) === 'undefined') { 
            if(this.config.legend){
                this.drawLegend(limits);
            }
        } 
        this.drawTooltip(data);
    }

    drawLegend(limits) { 
        var gLegend = this.gLegend;
        var match_value = this.config.match_value;
		var colors = this.config.colors;
		var self = this;
		//var i = (self.config.reversed === true) ? colors.length - j : j;
		
        gLegend.selectAll('g').remove();
        gLegend.selectAll('text').remove();

        gLegend.append('text')
            .text('Legend')
            .style('font-weight','bold');

        var LegItem = gLegend.selectAll('g')  
            .data(colors) 
            .enter().append('g')
            .attr("class", "legend-item")
            .attr('transform',function(d,j){ 
				var i = (self.config.reversed === true) ? colors.length-j-1 : j;
				return 'translate('+[0,(i+1)*25]+')';
			});

        LegItem.append('rect')
            .attr('x',0)
            .attr('y',0)
            .attr('width',20)
            .attr('height',20)
            .style('fill',function(d,i){ return d;});

        LegItem.append('text')
            .attr('x',25)
            .attr('y',10)
            .attr('dy','0.5em')
            .text(function(d,i){ 				
                if (match_value.format){
                    var fm = match_value.format;
                    return numeral(limits[i]).format(fm) + " to " + numeral(limits[i+1]).format(fm);
                } else {
                    return limits[i] + " to " + limits[i+1];
                }
            });
		
    }

    fillSubUnits(data, limits) { 
        var match_value = this.config.match_value;
        var self = this;
        this.mapFeature.selectAll(".subunit")
            .style("fill", function(d, i) { 
                var match = self.matchData(d, data); 
                if (match){ //match is defined then return a color
                    var return_color = [];
                    for(var j=0; j<limits.length-1; j++){
                        if (+match[match_value.key] >= limits[j] && +match[match_value.key] <= limits[j + 1]) {
                            return_color.push(self.config.colors[j]);
                        }
                    };
                    return return_color[0];
                } else {
                    //return self.config.colors[0]; 
                    return null;
                }
            });
    }

    drawTooltip(data) {
        var self = this;
        this.mapFeature.selectAll(".subunit")
            .on("mouseover", function(d) { 
                var match = self.matchData(d, data);
                if (typeof(match) !== 'undefined') { 
                    // make the content
                    // var keys = Object.keys(match); 
                    var content = self.config.tipkeys.map(function(d) { 
                        var tipValue = d.NumFormat ? numeral(match[d.key]).format(d.NumFormat) : match[d.key];
                        return "<b>" + d.text + "</b>: " + tipValue;
                    }).join("<br />");
                    d3.select(this).classed("hover", true).moveToFront();
                    self.tooltip.style("display", "block").html(content);
                    self.svg.selectAll(".place").moveToFront();
                    self.svg.selectAll(".place-label").moveToFront();
                }
            })
            .on("mousemove", function() {
                // tip positioning
                // var mouse = d3.mouse(this); //on svg
                // var mouse = [d3.event.pageX, d3.event.pageY]; //on page
                var mouse = [event.clientX, event.clientY]; //on screen
                var dim = self.tooltip.node().getBoundingClientRect();
                var x = mouse[0] - dim.width/2;
                var y = mouse[1] - dim.height - 5;
                // self.tooltip.attr("style", "left:" + x + "px; top:" + y + "px");
                self.tooltip.style("left", x).style("top", y);
            })
            .on("mouseout", function() {
                self.tooltip.style("display", "none");
                d3.selectAll(".subunit").classed("hover", false);
                // d3.select(".subunit-boundary").moveToFront();
                d3.select(".subunit.selected").moveToFront();
            })
            .on("click", function(d) { 
                var match = self.matchData(d, data);
                var thisClass = d3.select(this).attr('class');
                if (thisClass.indexOf('selected')!==-1){ //.includes('selected')
                    d3.select(this).classed("selected", false);
                } else {
                    self.svg.select('.subunit.selected').classed("selected", false);
                    d3.select(this).classed("selected", true).moveToFront();
                }
            });
            // .on("dblclick", function(d) { 
            //     console.clear();
            // });

        this.background.on('click',function(){
            d3.select('.subunit.selected').classed("selected", false);
        });
    }

    matchData(d, data) { 
        var match_object = this.config.match_object;
        return data.filter(function(e) {
            return d.properties[match_object.geo] == e[match_object.csv];
        })[0];
    }

    centerZoom(data) {//path, data, dim
        // Apply scale, center and translate paramenters.
        var dim = {};
        dim.width = this.config.width;
        dim.height = this.config.height;
        var ScaleCenter = calculateScaleCenter(this.path, data, dim);
        this.path.projection(matrix(ScaleCenter.scale, ScaleCenter.translation)); //Set scale and translation
        // projection.fitSize([width, height], topojson.feature(data, data.objects.polygons));
    }

    drawOuterBoundary(data) { //not working yet
        var boundary = topojson.mesh(data, data.features, function(a, b) { return a === b; });
        mapFeature.append("path")
            .datum(boundary)
            .attr("d", path)
            .attr("class", "subunit-boundary");
    }

    drawPlaces(data) {
        mapFeature.append("path")
            .datum(topojson.feature(data, data.objects.places))
            .attr("d", path)
            .attr("class", "place");

        mapFeature.selectAll(".place-label")
            .data(topojson.feature(data, data.objects.places).features)
            .enter().append("text")
            .attr("class", "place-label")
            .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
            .attr("dy", ".35em")
            .attr("x", function(d) {  return projection(d.geometry.coordinates)[0] <= width / 2 ? -6 : 6;})
            .style("text-anchor", function(d) {  return projection(d.geometry.coordinates)[0] <= width / 2 ? "end" : "start";})
            .text(function(d) {  return d.properties.name; });
    }

    drawSubUnits(data) { 
        this.mapFeature.selectAll(".subunit")
            .data(data.features)
            .enter().append("path")
            .attr("class", function(d) { return "subunit "; })
            .attr("d", this.path);
    }
}

function calculateScaleCenter(path,features,dim) {
	// Get the bounding box of the paths (in pixels!) and calculate a
	// scale factor based on the size of the bounding box and the map
    // size.
    var width = dim.width;
    var height = dim.height;
	var bbox_path = path.bounds(features),
		scale = 0.95 / Math.max(  //90% from svg border
				(bbox_path[1][0] - bbox_path[0][0]) / width,
				(bbox_path[1][1] - bbox_path[0][1]) / height ),
		translation = [(width - scale * (bbox_path[1][0] + bbox_path[0][0])) / 2,
						(height - scale * (bbox_path[1][1] + bbox_path[0][1])) / 2],
		center = [(bbox_path[1][0] + bbox_path[0][0]) / 2,
				(bbox_path[1][1] + bbox_path[0][1]) / 2];
	return {
		'scale': scale,
		'center': center,
		'translation' : translation
	};
}

function matrix(s, t) { //(a, b, c, d, tx, ty)
    //https://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
    var a = s,
        b = 0,
        tx = t[0],
        c = 0,
        d = -s,
        ty = t[1];
    return d3.geoTransform({
        point: function(x, y) {
            this.stream.point(a * x + b * y + tx, c * x + d * y + ty);
        }
    });
}

function doZoom() {
	var x = d3.event.transform.x;
	var y = d3.event.transform.y;
	var k = d3.event.transform.k;
	mapFeature.attr('transform', 'translate(' + [x, y] + ') scale(' + k + ')')
			.style("stroke-width", 0.5 / d3.event.scale + "px");
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
};