
function DownloadExcel(filename, data) {
	// var filename = 'undp.xlsx';
	var wb = XLSX.utils.book_new();
	wb.Props = {
			Title: "Excel Extract",
			Subject: "Downloaded Data",
			Author: "UNDP",
			CreatedDate: new Date()
	};
	
	data.forEach(function(d,i) {
		var ShName = d.sheetname ? d.sheetname : "Sheet"+(i+1).toString()
		wb.SheetNames.push(ShName);
		wb.Sheets[ShName] = XLSX.utils.aoa_to_sheet(d.sheetdata);
	});

	// var ws1 = XLSX.utils.aoa_to_sheet(ws_data1); //ws_data is array 2D
	// wb.SheetNames.push("Sheet 1");
	// wb.Sheets["Sheet 1"] = ws1;

	var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
	function s2ab(s) {
		var buf = new ArrayBuffer(s.length);
		var view = new Uint8Array(buf);
		for (var i=0; i<s.length; i++) { 
			view[i] = s.charCodeAt(i) & 0xFF;
		}
		return buf;
	}
	saveAs(new Blob([s2ab(wbout)], {type:"application/octet-stream"}), filename);
}