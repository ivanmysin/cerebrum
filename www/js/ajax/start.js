
App.globalPlotProperties = {
	width: 1200,    // длинна оси X в пикселях
	height: 200,   // длинна оси Y в пикселях
	shiftX: 50,    // оступ оси Х от левого и правого края в пикселях
	shiftY: 50,    // отступ оси Y от верхнего и нижнего края в пикселях
}
//////////////////////////////////////////////////////////////////////////
$(document).ready(function(){
	
	
	$("#uploadData").click(function(){
		var data = {
			'processing_node_id': App.processing_node_id,
			'registrated_path_id':App.registrated_path_id,
			'parent_processing_node_id':App.parent_processing_node_id,
			'record_id': App.record_id,
			'regime': 'read',
			}; 
		$.ajax({
			url: App.server_script,  
			type: "GET",
			data: data,
			cache: false,
			dataType: "json",   
			success: myCallback,
			error: function (returned) {
				console.log("Error: " + returned);
			}
		});
		
		
	});

	
});
//////////////////////////////////////////////////////////////////////////
function myCallback(returnedData) {
	$("#uploadData").remove();
	
	console.log(returnedData);
	
	App.plotData = returnedData;
	var nchs = App.plotData.length;
	var mainDivContainer = $("#procc_container");
	
	var svgContainer = $(mainDivContainer).children(".svg_container:first");
	var svgContainerCode = $(svgContainer).clone();
	var currentSvg = svgContainer;
	for (var i=0; i<nchs; i++) {
		var svg = getSVGplot(returnedData[i]);
		if (i==0) {
			$(svgContainer).append(svg);
		} else {
			$(currentSvg).after(svgContainerCode);
			currentSvg = $(mainDivContainer).children(".svg_container:last");
			$(currentSvg).append(svg);
		}
	}
	// Добавляем динамически расчитанный width для контейнера с svg, иначе все поедет
	// Расчитывает исходя из величины globalPlotProperties
	var svgContainerWidth = App.globalPlotProperties.width + 2 * App.globalPlotProperties.shiftX + 200;
	var svgStyleWidth = "<style> #procc_container .svg_container {width:" + svgContainerWidth +"px}</style>";
	$("#procc_container").prepend(svgStyleWidth); 
	
	
	// $(container).on('mousemove', ".outSVG", displayCoords);
	$(mainDivContainer).on('click', ".toStart", rePlot);
	$(mainDivContainer).on('click', ".toEnd", rePlot);
	$(mainDivContainer).on('click', ".upScale", reScale);
	$(mainDivContainer).on('click', ".downScale", reScale);
	$(mainDivContainer).on('click', ".rePlotByUserScale", rePlotByUserScale);
	
	$(mainDivContainer).on('click', ".upY", rePlotY);
	$(mainDivContainer).on('click', ".downY", rePlotY);
	
	$(mainDivContainer).on('click', ".downScaleY", reScaleY);
	$(mainDivContainer).on('click', ".upScaleY", reScaleY);
	
	$(mainDivContainer).on('click', ".reZoomingByUserY", reZoomingByUserY);

}
////////////////////////////////////////////////////////////////////////
function rePlotByUserScale (event) {
	var container = $(this).parent(); // this is container for svg and other components of plot 
	var startTimeWindow = $(container).children(".startTimeWindow").val();
	startTimeWindow = parseFloat (startTimeWindow);
	
	var endTimeWindow = $(container).children(".endTimeWindow").val();
	endTimeWindow = parseFloat (endTimeWindow);
	if ((endTimeWindow - startTimeWindow) < 0) {
		return;
	}
	
	$("#procc_container .svg_container").each(function(i) {
		App.plotData[i].minX = startTimeWindow;
		App.plotData[i].maxX = endTimeWindow;
		
		if (App.plotData[i].minX < 0) {
			App.plotData[i].minX = 0;
			$(container).children(".startTimeWindow").val(0);
		}
		
		if (App.plotData[i].maxX > App.plotData[i].x[App.plotData[i].x.length-1]) {
			App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
			$(container).children(".endTimeWindow").val(App.plotData[i].maxX);
		}
		
		var svg = getSVGplot(App.plotData[i]);
		var svgObj = $(this).children("svg");
		svgObj.remove();
		$(this).append(svg);
	});
}
////////////////////////////////////////////////////////////////////////
function rePlot (event) {
	var container = $(this).parent(); // this is container for svg and other components of plot 
	var stepNavigation = $(container).children(".stepNavigation").val();
	stepNavigation = parseFloat (stepNavigation);
	var direction = $(this).attr("class");
	
	$("#procc_container .svg_container").each(function(i) {
		
		if (direction.indexOf("toStart") >= 0) {
			App.plotData[i].minX -= stepNavigation;
			App.plotData[i].maxX -= stepNavigation;
		}
		
		if (direction.indexOf("toEnd") >= 0) {
			App.plotData[i].minX += stepNavigation;
			App.plotData[i].maxX += stepNavigation;
		}
		
		if (App.plotData[i].minX < 0) {
			var dif = App.plotData[i].maxX - App.plotData[i].minX;
			App.plotData[i].minX = 0;
			App.plotData[i].maxX = dif;
		}
		
		if (App.plotData[i].maxX > App.plotData[i].x[App.plotData[i].x.length-1]) {
			var dif = App.plotData[i].maxX - App.plotData[i].minX;
			App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
			App.plotData[i].minX = App.plotData[i].maxX - dif;
		}
		
		var newSvg = getSVGplot(App.plotData[i]);
		$(this).children("svg").remove();
		$(this).append(newSvg);
	});

}
////////////////////////////////////////////////////////////////////////
function reScale (event) {
	var container = $(this).parent(); // this is container for svg and other components of plot 
	var scalingCoef = $(container).children(".scalingCoef").val();
	scalingCoef = parseFloat (scalingCoef);
	if (scalingCoef == 0) {
		return
	};
	
	if (scalingCoef < 1) {
		scalingCoef = 1 / scalingCoef;
		$(container).children(".scalingCoef").val(scalingCoef);
	};
	
	
	
	var direction = $(this).attr("class");

	
	$("#procc_container .svg_container").each(function(i) {
		
		var dif = App.plotData[i].maxX - App.plotData[i].minX;
		var middle = App.plotData[i].minX + 0.5*dif;
		
		if (direction.indexOf("upScale") >= 0)  {
			dif = dif * scalingCoef;
		}
		
		if (direction.indexOf("downScale") >=0) {
			dif = dif / scalingCoef;
		}

		App.plotData[i].minX = middle - 0.5*dif;
		App.plotData[i].maxX = middle + 0.5*dif;
		
		if (App.plotData[i].minX < 0) {
			App.plotData[i].minX = 0;
			App.plotData[i].maxX = dif;
		}
		
		if (App.plotData[i].maxX > App.plotData[i].x[App.plotData[i].x.length-1]) {
			App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
			App.plotData[i].minX = App.plotData[i].maxX - dif;
		}
		
		if ((App.plotData[i].minX <= 0) && (App.plotData[i].maxX >= App.plotData[i].x[App.plotData[i].x.length-1])) {
			App.plotData[i].minX = 0;
			App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
		}

		var newSvg = getSVGplot(App.plotData[i]);
		$(this).children("svg").remove();
		$(this).append(newSvg);
	});
}
////////////////////////////////////////////////////////////////////////
function getSVGplot (data) {
	var width = App.globalPlotProperties.width;
	var height = App.globalPlotProperties.height;
	var shiftX = App.globalPlotProperties.shiftX;
	var shiftY = App.globalPlotProperties.shiftY;
	
	var minX = data.minX;
	var maxX = data.maxX;
	var minY = data.minY;
	var maxY = data.maxY;
	var x = data.x;
	var y = data.y;
	var points = "";
	var nGridDigits = 2;
	
	var svgx = plot_to_svg_x (x, width, minX, maxX);
	var svgy = plot_to_svg_y (y, height, minY, maxY);
	
	var dsvgobject = downSampling (svgy, svgx);
	svgx = dsvgobject.sequenceX;
	svgy = dsvgobject.sequenceY;
	
	for (var i=0; i<svgx.length; i++) {
		if ((svgx[i] <= width) && (svgy[i] <= height)) {
			points += svgx[i] + ", " + svgy[i] + " ";
		}
	}

	var gridX = "<path d=\"";
	var gridY = "<path d=\"";
	var noteGridX = "";
	var noteGridY = "";
	
	var labeleGridX = "";
	var labeleGridY = "";

	var ngridX = (maxX - minX) / data.binGridX;
	var grid_x = minX; // !!! Тут можно сделать так, чтоб grid_x начиналась с ближайшего (минимума - шаг решетки)
	for (var i=0; i<ngridX; i++) {
		var xSVG = plot_to_svg_x(grid_x, width, minX, maxX);         // (grid_x - minX)*width/(maxX - minX);
		gridX += " M " + xSVG + " " + height + " ";
		gridX += " V " + (height - 5);
		labeleGridX += "<text x=\"" + (xSVG + shiftX - 3) + "\" y=\"" + (height + shiftY + 18) + "\" class=\"notesY\" >" + grid_x.toFixed(nGridDigits) + "</text> \n";
		grid_x += data.binGridX;
		noteGridX += grid_x;
	}
	gridX += "\"  class=\"gridDash\" />\n ";
	var ngridY = (maxY - minY) / data.binGridY;
	var grid_y = minY;
	for (var i=0; i<=ngridY; i++) {
		var ySVG = (height - (grid_y - minY) * height/(maxY - minY));
		gridY += " M 0 " + ySVG;
		gridY += " H 5 ";
		labeleGridY += "<text x=\"" + (shiftX - 25) + "\" y=\"" + (ySVG + shiftY + 3) + "\" class=\"notesY\" >" + grid_y.toFixed(nGridDigits) + "</text> \n"
		grid_y += data.binGridY;
	}
	gridY += " \" class=\"gridDash\" />\n ";
		
	var svg = "<svg width=\"" + (width + 2*shiftX) + "px\" height=\"" + (height + 2*shiftY) + "px\" class=\"outSVG\"> \n";
	svg += "<text x=" + (shiftX + (width + data.title.length)/2) + " y=" + (shiftY - 30) + " class=\"plotTitle\" >" + data.title + "</text> \n";
	
	svg += "<svg x=\"" + shiftX + "px\" y=\"" + shiftY + "px\" width=\"" + width + "px\" height=\"" + height + "px\" viewBox=\"0 0 " + width + " " + height + "\"> \n";
	svg += "<rect x=0 y=0 width=" + width + " height=" + height + " class=\"frame\" /> \n";
	svg += "<polyline points=\"" + points + "\" class=\"linePlot\" /> \n ";
	svg += gridX + gridY;
	svg += "</svg>\n";
	svg += "<text x=" + (shiftX + (width + data.Xtitle.length)/2) + " y=" + (height + shiftY + 35) + "  class=\"Xtitle\" > " + data.Xtitle + "</text> \n";
	svg += "<text x=" + 2 + " y=" + (shiftY - 10) + " class=\"Ytitle\"> " + data.Ytitle + " </text> \n"; //
	svg += labeleGridX;
	svg += labeleGridY;
	svg += "</svg>";
	// console.log(svg);
	return svg;
}
/////////////////////////////////////////////////////////////////////////////////////////////

function displayCoords (event) {
	var disp = $('#coordsDisplay');
	var offset = $(this).offset();
	var svgX = event.pageX - offset.left - shiftX;
	var svgY = event.pageY - offset.top - shiftY;
	var x = svg_to_plot_x (svgX, width, App.plotData.minX, App.plotData.maxX);
	var y = svg_to_plot_y (svgY, height, App.plotData.minY, App.plotData.maxY);
	x = roundPlus(x, 2);
	y = roundPlus(y, 2); 
	if (x > App.plotData.minX && x < App.plotData.maxX && y > App.plotData.minY && y < App.plotData.maxY) {
		disp.text("X: " + x + " | Y: " + y);
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////
function downSampling (ySequence, xSequence) {
	var newSequence = new Array ();
	var newSequenceX = new Array ();
	newSequence.push(ySequence[0]);
	newSequenceX.push(xSequence[0]);
	
	for (var i=0; i<ySequence.length; i++) {
				
		if (Math.abs(newSequence[newSequence.length-1] - ySequence[i]) > 2) {
			newSequence.push(ySequence[i]);
			newSequenceX.push(xSequence[i]);
		}
	}

	var result = new Object ();
	result.sequenceY = newSequence;
	result.sequenceX = newSequenceX;
	return (result);
}
//////////////////////////////////////////////////////////////////////////////////////////////
function plot_to_svg_x (x, width, minX, maxX) {
	if (typeof(x) == 'number') {
		return Math.round((x - minX)*width/(maxX - minX));     
	}
	var svgX = new Array ();
	for (var i=0; i<x.length; i++) {
		svgX[i] = Math.round((x[i] - minX)*width/(maxX - minX));               // roundPlus(((x[i] - minX)*width/(maxX - minX)), 1);  //  Math.round
	}

	return svgX;
} 

function plot_to_svg_y (y, height, minY, maxY) {
	if (typeof(y) == 'number') {
		return Math.round(height - (y[i] - minY) * height/(maxY - minY));    
	}
	
	var svgY = new Array ();
	for (var i=0; i<y.length; i++) {
		svgY[i] = Math.round(height - (y[i] - minY) * height/(maxY - minY));  //roundPlus((height - (y[i] - minY) * height/(maxY - minY)), 0);      //  Math.round 
	}

	return svgY;
} 
//////////////////////////////////////////////////////////////////////////////////////////////
function svg_to_plot_x (svgX, width, minX, maxX) {
	if (typeof(svgX) == 'number') {
		return (svgX*(maxX-minX)/width) + minX;
	}
	
	var x = new Array ();
	for (var i=0; i<svgX.length; i++) {
		x[i] = (svgX*(maxX-minX)/width) + minX;
	}
	return x;
}

function svg_to_plot_y (svgY, height, minY, maxY) {
	if (typeof(svgY) == 'number') {
		return minY + ((height - svgY)*(maxY - minY) / height);
	}
	
	var y = new Array ();
	for (var i=0; i<svgY.length; i++) {
		y[i] = minY + ((height - svgY)*(maxY - minY) / height);
	}
	return y;
}
//////////////////////////////////////////////////////////////////////////////////////////////
function roundPlus(x, n) { //x - число, n - количество знаков
  if(isNaN(x) || isNaN(n)) return false;
  var m = Math.pow(10,n);
  return Math.round(x*m)/m;
}	
//////////////////////////////////////////////////////////////////////////////////////////////
function rePlotY(event) {
	
	
	var container = $(this).parent().parent().parent(); // this is container for svg and other components of plot 
	
	var stepNavigation = $(this).siblings(".stepY").val();
	
	stepNavigation = parseFloat (stepNavigation);
	var direction = $(this).attr("class");
	
	
	var i = $("#procc_container .svg_container").index(container);

		
	if (direction.indexOf("downY") >= 0) {
		App.plotData[i].minY -= stepNavigation;
		App.plotData[i].maxY -= stepNavigation;
	}
		
	if (direction.indexOf("upY") >= 0) {
		App.plotData[i].minY += stepNavigation;
		App.plotData[i].maxY += stepNavigation;
	}
		
/*
	if (App.plotData[i].minX < 0) {
		var dif = App.plotData[i].maxX - App.plotData[i].minX;
		App.plotData[i].minX = 0;
		App.plotData[i].maxX = dif;
	}
		
	if (App.plotData[i].maxX > App.plotData[i].x[App.plotData[i].x.length-1]) {
		var dif = App.plotData[i].maxX - App.plotData[i].minX;
		App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
		App.plotData[i].minX = App.plotData[i].maxX - dif;
	}
*/		
	var newSvg = getSVGplot(App.plotData[i]);
	$(container).children("svg").remove();
	$(container).append(newSvg);



} 
//////////////////////////////////////////////////////////////////////////////////////////////
function reScaleY(event) {
	var container = $(this).parent().parent().parent(); // this is container for svg and other components of plot 
	var scalingCoef = $(this).siblings(".scalingCoefY").val();
	scalingCoef = parseFloat (scalingCoef);
	if (scalingCoef == 0) {
		return
	};
	
	if (scalingCoef < 1) {
		scalingCoef = 1 / scalingCoef;
		$(container).children(".scalingCoef").val(scalingCoef);
	};
		
	var direction = $(this).attr("class");
	
	var i = $("#procc_container .svg_container").index(container);
		
	var dif = App.plotData[i].maxY - App.plotData[i].minY;
	var middle = App.plotData[i].minY + 0.5*dif;
		
	if (direction.indexOf("upScaleY") >= 0)  {
		dif = dif * scalingCoef;
	}
		
	if (direction.indexOf("downScaleY") >=0) {
		dif = dif / scalingCoef;
	}

	App.plotData[i].minY = middle - 0.5*dif;
	App.plotData[i].maxY = middle + 0.5*dif;
		
	if (App.plotData[i].minY < 0) {
		App.plotData[i].minY = 0;
		App.plotData[i].maxY = dif;
	}
/*		
	if (App.plotData[i].maxX > App.plotData[i].x[App.plotData[i].x.length-1]) {
		App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
		App.plotData[i].minX = App.plotData[i].maxX - dif;
	}
		
	if ((App.plotData[i].minX <= 0) && (App.plotData[i].maxX >= App.plotData[i].x[App.plotData[i].x.length-1])) {
		App.plotData[i].minX = 0;
		App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
	}
*/
		var newSvg = getSVGplot(App.plotData[i]);
		$(container).children("svg").remove();
		$(container).append(newSvg);

} 
//////////////////////////////////////////////////////////////////////////////////////////////
function reZoomingByUserY(event) {
	var container = $(this).parent().parent().parent(); // this is container for svg and other components of plot 
	
	var startWindow = $(this).siblings(".minYvalue").val();  
	startWindow = parseFloat (startWindow);
	
	var endWindow = $(this).siblings(".maxYvalue").val(); 
	endWindow = parseFloat (endWindow);
	if ((endWindow - startWindow) < 0) {
		return;
	}
//alert (startWindow);
	
	var i = $("#procc_container .svg_container").index(container);
		
	App.plotData[i].minY = startWindow;
	App.plotData[i].maxY = endWindow;
		
/*		
    if (App.plotData[i].minX < 0) {
		App.plotData[i].minX = 0;
		$(container).children(".startTimeWindow").val(0);
	}
		
	if (App.plotData[i].maxX > App.plotData[i].x[App.plotData[i].x.length-1]) {
		App.plotData[i].maxX = App.plotData[i].x[App.plotData[i].x.length-1];
		$(container).children(".endTimeWindow").val(App.plotData[i].maxX);
	}
*/		
	var newSvg = getSVGplot(App.plotData[i]);
	$(container).children("svg").remove();
	$(container).append(newSvg);

} 

//////////////////////////////////////////////////////////////////////////////////////////////
