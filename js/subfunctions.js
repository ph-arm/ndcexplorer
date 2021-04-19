function ConvertToNumber(data){
	var columns = Object.keys(data[0]);
	data.forEach(function(d,i){
		for(var j=0; j<columns.length; j++){
			var value = d[columns[j]];              
			if (isNaN(+value)===false ){
				d[columns[j]] = +value;
			}
			//else if (value.indexOf('%')!==-1){
			//	d[columns[j]] = parseFloat(value)/100;
			//}
		} 
		return d;
	});
	return data;
}
