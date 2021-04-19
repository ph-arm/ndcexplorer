
$(document).ready(function(){  


var options = {
  //data    : nestData[0].values[0].values,
  domNode : document.querySelector('#map'),
  config  : {
    // width     : 700,
    // height    : 500,
    geofolder : './geo',
    geofile   : ['province.geojson', 'district.geojson', 'commune.geojson'],
    geoCode   : [{geo:"PRO_CODE", csv:"Province_ID"},  //province level
                 {geo:"COM_CODE", csv:"CommGis"    }], //commune level
    match_object:{geo:"PRO_CODE", csv: "province_id"},
    match_value :{key:"Fam_Per_1000FAM", format:'0.0'},
	colors    : ["#EEFBFF", "#D1F2FA", "#A5E5F6", "#79D9F2", "#4DCCEE", "#21C0EB", "#45A2BC"],
	// limits    : [0, 200, 400, 600, 800, 1000],
	reversed  : false,
	responsive: true,
    breakType : "e",
    tipkeys   :[{key:"province_eng"   ,text:"Province"},
				{key:"Fam_Per_1000FAM",text:"Affected Family Per 1000", NumFormat:"0.0"},
				{key:"num_family"     ,text:"Affected Number of Family"    , NumFormat:"0,0"},
				{key:"rank"           ,text:"Rank" } ]
  }
};

//create of map object
var cambodia = new MapChart(options);


$.ajax({
	type    : 'GET',
	url     : '../request',
	dataType: "json",
	data    : { report: "hh_rank_provinces", index: 0 },
	success : function(data){ 
		data = ConvertToNumber(data);
		var nestData = d3.nest()
				.key(function(d){return d.year_id;})
				.sortKeys(d3.descending)
				.key(function(d){return d.affect_by;})
				.entries(data);

		var maxYear = d3.max(nestData.map(function(d){ return +d.key;}));
		$("#p-hint").text($("#p-hint").text().replace("maxYear", maxYear));


		//Years selectors -------------------------------------------------------------
		var sctYears = d3.select('#sctYears');
		sctYears.selectAll('option')
				.data(nestData)
				.enter().append('option')
				.attr('value',function(d,i){return i;})
				.text(function(d){return d.key});
				
		//Harzard level selectors  ----------------------------------------------------
		var sctHazard = d3.select('#sctHazard');
		sctHazard.selectAll('option')
				.data(nestData[0].values)
				.enter().append('option')
				.attr('value',function(d,i){return i;})
				.text(function(d){return d.key});

		//Harzard level selectors  ----------------------------------------------------
		var sctHazard = d3.select('#sctHazard');
		sctHazard.selectAll('option')
				.data(nestData[0].values)
				.enter().append('option')
				.attr('value',function(d,i){return i;})
				.text(function(d){return d.key});
		
		sctYears.on('change', function(d) { 
				var i1 = this.value;
				var i2 = 0; 

				sctHazard.selectAll('option').remove();
				sctHazard.selectAll('option')
					.data(nestData[i1].values)
					.enter().append('option')
					.attr('value',function(d,i){ return i;})
					.text(function(d){return d.key});
				var selectedMapData = nestData[i1].values[i2].values;
				cambodia.applyNumeric(selectedMapData);
		});

		sctHazard.on('change', function(d) { 
				var i1 = sctYears.property('value');
				var i2 = this.value;
				var selectedMapData = nestData[i1].values[i2].values;
				cambodia.applyNumeric(selectedMapData);
		});

		//Initialization, Append table to div
		cambodia.applyNumeric(nestData[0].values[0].values);
		var dataset = makeTableDataset(data);	
		tabulate("#divFlood .divTable", dataset.table.flood, "table-blue" );
		tabulate("#divStorm .divTable", dataset.table.storm, "table-orange" );
		tabulate("#divDrght .divTable", dataset.table.drought, "table-green" );
		lineChart(
			{
				domNode: "#divFlood .linechart",
				xLabel: "Province",
				yLabel: "Rank"
			},
			dataset.chart.flood
		);
		lineChart(
			{
				domNode: "#divStorm .linechart",
				xLabel: "Province",
				yLabel: "Rank"
			},
			dataset.chart.storm
		);
		lineChart(
			{
				domNode: "#divDrght .linechart",
				xLabel: "Province",
				yLabel: "Rank"
			},
			dataset.chart.drought
		);

		
		//Download Excel data
		$( "#btnDonwload" ).click(function() {
			var sheetdata_A = dataset.table.flood.head.concat(dataset.table.flood.body);
			var sheetdata_B = dataset.table.storm.head.concat(dataset.table.storm.body);
			var sheetdata_C = dataset.table.drought.head.concat(dataset.table.drought.body);
			var SheetData = [
				{sheetname : $('#divFlood > h3').text(), sheetdata : sheetdata_A},
				{sheetname : $('#divStorm > h3').text(), sheetdata : sheetdata_B},
				{sheetname : $('#divDrght > h3').text(), sheetdata : sheetdata_C}
			];
			SheetData.forEach(function(row){
				var row0 = [];
				row['sheetdata'][0].forEach(function(obj){
					if (obj.colspan) { 
						row0 = row0.concat(Array(obj.colspan).fill(obj.text));
					} else {
						row0.push(obj.text);
					}
				});
				row['sheetdata'][0] = row0;
				row['sheetdata'][1].unshift("");
				return row;
			});
			var filename = "Families affected by climate hazards - Rank Province";
			DownloadExcel(filename + '.xlsx', SheetData);
		});
	}
});

function makeTableDataset(data){ 
	//filter data to a specific province only
	var hazardTables = {};
	var hazardCharts = {};
	var TopN = 5;

	var ObjList = ["province_eng", "year_id", "rank", "Fam_Per_1000FAM"];
	
	var nestData = d3.nest()
				.key(function(d){return d.affect_by;})
				.key(function(d){return d.year_id;})
				.sortKeys(d3.ascending)
				.entries(data);
				
	nestData.forEach(function(row,index){
		var key = row.key;
		var values = row.values;
		var arrProIdTopN = values[values.length-1].values
				.sort(function(a, b) { return a[ObjList[3]] - b[ObjList[3]]; })
				.filter(function(d, i) { return d.rank <= TopN; })
				.map(function(d){ return d.province_id;});

		var Matrix = [];
		values.forEach(function(datum,i){
			datum.values.filter(function(d,i){ return arrProIdTopN.indexOf(d.province_id) !==-1;})
						.map(function(d,i){ return ObjList.map(function(o){ return d[o]; }); })
						.forEach(function(d,i){ Matrix.push(d); });
		});
		
		//Apply format number using numeral library
		Matrix.forEach(function(row){ 
			row[3] = numeral(row[3]).format("0.0"); 
		});

		var pivot = getPivotArray(Matrix, 0, 1, [2,3], " ", ['Rank','Per 1000 Families']);
		
		//sort by last year rank value
		var len = pivot.body[0].length;
		pivot.body = pivot.body.sort(function(a,b){ return a[len-2] - b[len-2]; });
		
		//Prepare chart data
		var chartData = Matrix.map(function(d,i){ 
							var obj = new Object();
							obj['Year'] = d[1];
							obj['Province'] = d[0];
							obj['Rank'] = d[2];
							return obj;
						});

		hazardTables[key.toLowerCase()] = pivot;
		hazardCharts[key.toLowerCase()] = chartData;
	});


	return {table:hazardTables, chart:hazardCharts};
}

});
