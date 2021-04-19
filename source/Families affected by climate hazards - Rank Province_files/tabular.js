function tabulate(target, tableData, tblClass) { 
	var div   = d3.select(target);
		div.select('table').remove();
	var table = div.append('table');  

	if (tblClass){ table.attr('class',tblClass); }

    // append the header row
	if (tableData.head){
		var headData = tableData.head;
		var thead = table.append("thead");			
		thead.selectAll("tr")
			.data(headData)
			.enter().append("tr")
			.selectAll("th")
			.data(function(d) { return d; })
			.enter().append("th")
			.attr('rowspan',function(d) { if(d.rowspan){ return d.rowspan; }})
			.attr('colspan',function(d) { if(d.colspan){ return d.colspan; }})
			.text(function(d) { return d.text ? d.text : d; });
	}
    
    // create a row for each object in the data
	if (tableData.body){
		var bodyData = tableData.body;
        var tbody = table.append("tbody");
		tbody.selectAll("tr")
			.data(bodyData)
			.enter()
			.append("tr")
			.selectAll("td")
			.data(function(d) {return d;})
			.enter()
			.append("td")
			//.attr('class',function(d,i) { if (i===0 && isNaN(d)){ return d;} })
			.html(function(d) { return d; });
	}

	// create a row for each object in the data
	if (tableData.foot){
		var footData = tableData.foot;
        var tfoot = table.append("tfoot");
		tfoot.selectAll("tr")
			.data(footData)
			.enter()
			.append("tr")
			.selectAll("td")
			.data(function(d) {return d;})
			.enter()
			.append("td")
			// .attr('class',function(d,i) { if (i===0 && isNaN(d)){ return d;} })
			.html(function(d) { return d; });
	}

}

function getPivotArray(dataArray, rowIndex, colIndex, dataIndexes, cornerTitle, subtitle) {
	//Code from https://techbrij.com
	var result = {}, 
		output = {},
		newCols = [];

	for (var i = 0; i < dataArray.length; i++) {

		if (!result[dataArray[i][rowIndex]]) {
			result[dataArray[i][rowIndex]] = {};
		}
		result[dataArray[i][rowIndex]][dataArray[i][colIndex]] = //dataArray[i][dataIndex];
			dataArray[i].filter(function(d,i){ return dataIndexes.includes(i); });
		
		//To get column names
		if (newCols.indexOf(dataArray[i][colIndex]) == -1) {
			newCols.push(dataArray[i][colIndex]);
		}
	}

	// newCols.sort();
	var item = [];

	//Add Header Row
	output.head = [];
	if (subtitle){
		item.push({ rowspan: 2,	text: cornerTitle });
		item.push.apply(item, newCols.map(function(d){ return { colspan: dataIndexes.length, text: d }; }));
		output.head.push(item);

		var subheader = [];
		for (var i=1; i<item.length; i++){
			for (var j=0; j<dataIndexes.length; j++){
				subheader.push(subtitle[j]);
			}
		}
		output.head.push(subheader);
	} else {
		item.push(cornerTitle);
		item.push.apply(item, newCols);
		output.head.push(item);
	}

	//Add content 
	output.body = []
	for (var key in result) { 
		item = [];
		item.push(key);
		for (var i = 0; i < newCols.length; i++) {
			(result[key][newCols[i]]).forEach(function(d){
				// item.push(d || "-");
				item.push(d);
			});
		}
		output.body.push(item);
	}
	return output;
}
