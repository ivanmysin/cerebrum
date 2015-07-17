// script for mannual discrimination interface

// set some global variables
App.globalPlotProperties = {
	width: 900,    // длинна оси X в пикселях
	height: 200,   // длинна оси Y в пикселях
	shiftX: 50,    // оступ оси Х от левого и правого края в пикселях
	shiftY: 50,    // отступ оси Y от верхнего и нижнего края в пикселях
	
	
};

App.params.st_threshold_line = new Array();
App.params.sp_threshold_line1 = new Array();
App.params.sp_threshold_line2 = new Array();

App.add_new_threshold = {  // Добавляем или нет новый порог
	add: false,
	side: 'top'
}
//////////////////////////////////////////////////////////////////////////
$(document).ready(function(){
	
	var data = {
		'processing_node_id': App.processing_node_id, 
		'registrated_node_id':App.registrated_node_id, 
		'parent_processing_node_id':App.parent_processing_node_id, 
		'regime': 'read',
		}; 
	$.ajax({
		url: App.server_script,  
		type: "GET",
		data: data,
		cache: false,
		dataType: "json",   
		success: myCallback,
	});
		
		
		
		
});
//////////////////////////////////////////////////////////////////////////
function myCallback(returnedData) {

	//$("#procc_container").html(returnedData);

	App.plotData = returnedData;
	var nchs = App.plotData.length;
	var mainDivContainer = $("#procc_container");
	var svgContainer = $(mainDivContainer).children(".svg_container:first");
	var svgContainerCode = $(svgContainer).clone();
	var currentSvg = svgContainer;
	

	
	for (var i=0; i<nchs; i++) {
		var st_threshold_line_example = { // Переменная, в которой сохраняем данные о порогах стимуляции
			t: [],                     // В этой переменной сохраняем моменты времени, в которые порог менялся!! 
			level: [Math.random()],    // В этой переменной сохраняем значения уровня порога, значений порога должно быть на 1 больше !! 
			side: ['top'],             // Эти значения соответствуют по элементно во времени значениям в переменной level
		};
		
		App.params.st_threshold_line.push(st_threshold_line_example);
		
		// добавляем линии дискриминации спайков
		var sp_line = {
			t: [], 
			level: [Math.random()],
		};
		App.params.sp_threshold_line1.push (sp_line);
		
		sp_line = {
			t: [], 
			level: [Math.random()],
		};
		App.params.sp_threshold_line2.push (sp_line);
		
		
		var svg = getSVGplot(returnedData[i], i);
		if (i==0) {
			$(currentSvg).append(svg);
		} else {
			$(currentSvg).after(svgContainerCode);
			currentSvg = $(mainDivContainer).children(".svg_container:last");
			$(currentSvg).append(svg);
		}
		
		var table = getThresholdsTable(i, App.params.sp_threshold_line1);
		var current_threshold_container = $(currentSvg).children(".add_threshold");
		$(current_threshold_container).append("</br>  <input type=\"radio\" name=\"thresholds" + i + "\" value=\"spLevel1\" class=\"radioSelectLevel\" checked> Уровень 1 для дискриминации спайков");
		$(current_threshold_container).append("</br>  <input type=\"radio\" name=\"thresholds" + i + "\" value=\"spLevel2\" class=\"radioSelectLevel\"> Уровень 2 для дискриминации спайков");
		$(current_threshold_container).append("</br>  <input type=\"radio\" name=\"thresholds" + i + "\" value=\"stLevel\"  class=\"radioSelectLevel\"> Уровень для дискриминации стимуляций");
		
		$(current_threshold_container).append("</br>" + table);
	}


	 
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
	
	$(mainDivContainer).on('click', ".top_threshold", change_threshold);
	$(mainDivContainer).on('click', ".low_threshold", change_threshold);
	
	$(mainDivContainer).on('click', ".outSVG", change_threshold);
	
	$(mainDivContainer).on('change', ".radioSelectLevel", change_current_threshold);
	
}
////////////////////////////////////////////////////////////////////////
function change_current_threshold (event) {
	var target = event.currentTarget.defaultValue;
	var inputName = event.currentTarget.name;
	var index = parseInt(inputName[inputName.length-1]);

	var table;
	switch (target) {
		case ("spLevel1"):
			table = getThresholdsTable(index, App.params.sp_threshold_line1);
			break;
		case ("spLevel2"):
		    table = getThresholdsTable(index, App.params.sp_threshold_line2);
			break;
		case ("stLevel"):
			table = getThresholdsTable(index, App.params.st_threshold_line);
			break;
		 default:
			table = "Ошибка! Не могу определить порог, который надо отобразить";
			break;
	}
	var container = $("#procc_container .svg_container table.thresholdTable")[index];
	$(container).html(table);
	
	var heightTable = $(container).height();
	if (heightTable > 170) {
		$("#procc_container .svg_container").eq(index).height(heightTable + 150);
	}
}
///////////////////////////////////////////////////////////////////////
function getThresholdsTable(index, threshold_type) {
	var threshold = threshold_type[index];
	var table = "<table class=\"thresholdTable\" >";
	
	table += "<tr>";
	if (threshold.side !== undefined) {
		table += "<th> Начало </th> <th> Конец </th> <th> Уровень порога </th> <th> Сторона порога </th> <th> Удалить порог </th>";
	} else {
		table += "<th> Начало </th> <th> Конец </th> <th> Уровень порога </th> <th> Удалить порог </th>";
	}
	
	
	table += "</tr>";
		
	for (var i = 0; i < threshold.level.length; i++) {
		
		table += "<tr>";
		var low_t;
		var high_t;
		
		var delete_button = " - ";
		if (i == 0) {
			low_t = 0;
		} else {
			low_t = roundPlus(threshold.t[i-1], 3);
		}
		if (i == threshold.level.length-1) {
			high_t = App.plotData[index].x[App.plotData[index].x.length-1]; 
		} else {
			high_t = roundPlus(threshold.t[i], 3);
		}
		
		
		if (i == threshold.level.length-1 && i != 0) {
			delete_button =  "<button class=\"delete_button_level btn btn-red\"> X </button>"; 
			
		}
		
		if (threshold.side !== undefined) {
			table += "<td>" + roundPlus(low_t, 2) + "</td> <td>" + roundPlus(high_t, 2) + "</td> <td> " + roundPlus(threshold.level[i], 2) + " </td> <td>" + threshold.side[i] + "</td> <td>" + delete_button + "</td>";
		} else {
			table += "<td>" + roundPlus(low_t, 2) + "</td> <td>" + roundPlus(high_t, 2) + "</td> <td> " + roundPlus(threshold.level[i], 2) + " </td> <td>" + delete_button + "</td>";
		}
		table += "</tr>";
	}	
	table += "</table>";
	return table; 
}
////////////////////////////////////////////////////////////////////////
function delete_threshold (event) {
	// Тут мы удаляем последний порог в массиве 
	var container = $(this).parent().parent().parent().parent().parent().parent();
	var index = $("#procc_container .svg_container").index(container);
	
	var radioSelected = $('#procc_container .svg_container input.radioSelectLevel:checked').eq(index).val();
	var currentTh;
	var threshold;
	switch (radioSelected) {
		case ("spLevel1"):
			currentTh = App.params.sp_threshold_line1;
			threshold = $("#procc_container .svg_container .innerSvg .sp_threshold_line1").eq(index);
			break;
		case ("spLevel2"):
		    currentTh = App.params.sp_threshold_line2;
		    threshold = $("#procc_container .svg_container .innerSvg .sp_threshold_line2").eq(index);
			break;
		case ("stLevel"):
			currentTh = App.params.st_threshold_line;
			threshold = $("#procc_container .svg_container .innerSvg .st_threshold_line").eq(index);
			break;
		 default:
			return;
	}
	
	//console.log(currentTh[index]);
	if (currentTh[index].level.length > 1 && currentTh[index].t.length > 0) {
		currentTh[index].level.pop();
		currentTh[index].t.pop();
		if (currentTh[index].side !== undefined) {
			currentTh[index].side.pop();
		}
	} else {
		return;
	}
	
	
	// И обновляем все данные на страничке
	

	var newPoints = getThresholdPoints (App.globalPlotProperties.width, App.plotData[index].minX, App.plotData[index].maxX, App.globalPlotProperties.height, App.plotData[index].minY, App.plotData[index].maxY, index, currentTh);
	$(threshold).attr("points", newPoints);
	var tableThresholds = getThresholdsTable(index, currentTh);
	
	var tableObj = $(this).parent().parent().parent().parent();
	$(tableObj).html(tableThresholds);
	$(tableObj).off("click", ".delete_button_level", delete_threshold); // При каждом клике по графику таблица пересоздается и делегируется обработчик, поэтому необходимо удалить предыдущий обработчик 
	// иначе функция выполнится столько раз, сколько был делегирован обработчик
	// В принципе можно проверять если обработчик на кнопке и весить его, если обработчик не установлен, но код будет больше, поэтому решено было оставить так!! 
	$(tableObj).on('click', ".delete_button_level", delete_threshold);  // Делегируем новый обработчик
	var heightTable = $(tableObj).height();
	if (heightTable > 170) {
		$(container).height(heightTable + 150);
	}
	App.add_new_threshold.add = false;
	App.add_new_threshold.side = 'top';
	
}
////////////////////////////////////////////////////////////////////////
// Функция меняет линию порога на графике
function change_threshold (event) {
	
	if ($(this).attr("class").indexOf('top_threshold') >= 0) {
		App.add_new_threshold.add = true;
		App.add_new_threshold.side = 'top';
		return;
	}
		
		
	if ($(this).attr("class").indexOf('low_threshold') >= 0) {
		App.add_new_threshold.add = true;
		App.add_new_threshold.side = 'low';
		return;
	}
	
	var container = $(this).parent(); // this is container for svg and other components of plot 
	var index = $("#procc_container .svg_container").index(container);
	
	var xClick = event.pageX - $(this).offset().left - App.globalPlotProperties.shiftX; // 
	var yClick = event.pageY - $(this).offset().top - App.globalPlotProperties.shiftY;  //
	
	
	var radioVal = $(this).siblings(".add_threshold").children("input.radioSelectLevel:checked").val();
	
	var threshold_line_class = ".st_threshold_line";
	var current_threshold = App.params.st_threshold_line;
	if (radioVal == "spLevel1") {
		threshold_line_class = ".sp_threshold_line1";
		current_threshold = App.params.sp_threshold_line1;
	} 
	if (radioVal == "spLevel2") {
		threshold_line_class = ".sp_threshold_line2";
		current_threshold = App.params.sp_threshold_line2;
	}
	
	
	var threshold = $(this).children(".innerSvg").children(threshold_line_class);
		

	var newLevel = svg_to_plot_y (yClick, App.globalPlotProperties.height, App.plotData[index].minY, App.plotData[index].maxY); //
	
	if (App.add_new_threshold.add) {
		var len = current_threshold[index].t.length;
		var newT = svg_to_plot_x(xClick, App.globalPlotProperties.width, App.plotData[index].minX, App.plotData[index].maxX);
		if (len > 0 && current_threshold[index].t[len-1] > newT) {
			alert ("Новый порог не может быть установлен по времени меньше предыдущего!");
			return false;
		}
		current_threshold[index].level.push(newLevel);
		current_threshold[index].t.push(newT);
		if (current_threshold[index].side !== undefined) {
			current_threshold[index].side.push(App.add_new_threshold.side);
		}
		
	} else {
		var last_ind = current_threshold[index].level.length-1;
		current_threshold[index].level[last_ind] = newLevel; 
	}
	
	var newPoints = getThresholdPoints (App.globalPlotProperties.width, App.plotData[index].minX, App.plotData[index].maxX, App.globalPlotProperties.height, App.plotData[index].minY, App.plotData[index].maxY, index, current_threshold);
	$(threshold).attr("points", newPoints);
	

	var tableThresholds = getThresholdsTable(index, current_threshold);
	var tableObj = $(this).siblings(".add_threshold").children(".thresholdTable");
	$(tableObj).html(tableThresholds);
	$(tableObj).off("click", ".delete_button_level", delete_threshold); // При каждом клике по графику таблица пересоздается и делегируется обработчик, поэтому необходимо удалить предыдущий обработчик 
	// иначе функция выполнится столько раз, сколько был делегирован обработчик
	// В принципе можно проверять если обработчик на кнопке и весить его, если обработчик не установлен, но код будет больше, поэтому решено было оставить так!! 
	$(tableObj).on('click', ".delete_button_level", delete_threshold);  // Делегируем новый обработчик
	
	
	var heightTable = $(tableObj).height();
	if (heightTable > 170) {
		$(container).height(heightTable + 150);
	}
	
	App.add_new_threshold.add = false;
	App.add_new_threshold.side = 'top';
	
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
		
		var svg = getSVGplot(App.plotData[i], i);
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
		
		var newSvg = getSVGplot(App.plotData[i], i);
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

		var newSvg = getSVGplot(App.plotData[i], i);
		$(this).children("svg").remove();
		$(this).append(newSvg);
	});
}
////////////////////////////////////////////////////////////////////////
function getSVGplot (data, index) {
	var width = window.App.globalPlotProperties.width;
	var height = window.App.globalPlotProperties.height;
	var shiftX = window.App.globalPlotProperties.shiftX;
	var shiftY = window.App.globalPlotProperties.shiftY;
	
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
	
	svg += "<svg x=\"" + shiftX + "px\" y=\"" + shiftY + "px\" width=\"" + width + "px\" height=\"" + height + "px\" viewBox=\"0 0 " + width + " " + height + "\"  class=\"innerSvg\" > \n";
	svg += "<rect x=0 y=0 width=" + width + " height=" + height + " class=\"frame\" /> \n";
	svg += "<polyline points=\"" + points + "\" class=\"linePlot\" /> \n ";
	svg += gridX + gridY;
	
	// level of simulation threshold
	var threshold_line_points = getThresholdPoints (width, minX, maxX, height, minY, maxY, index, App.params.st_threshold_line);
	var threshold = "<polyline class=\"st_threshold_line\" points=\"" + threshold_line_points + "\" />";
	svg += threshold;
	
	// add two leveles of spikes
	threshold_line_points = getThresholdPoints (width, minX, maxX, height, minY, maxY, index, App.params.sp_threshold_line1);
	threshold = "<polyline class=\"sp_threshold_line1\" points=\"" + threshold_line_points + "\" />";
	svg += threshold;
	
	// add two leveles of spikes
	threshold_line_points = getThresholdPoints (width, minX, maxX, height, minY, maxY, index, App.params.sp_threshold_line2);
	threshold = "<polyline class=\"sp_threshold_line2\" points=\"" + threshold_line_points + "\" />";
	svg += threshold;
	
	
	
	svg += "</svg>\n";
	svg += "<text x=" + (shiftX + (width + data.Xtitle.length)/2) + " y=" + (height + shiftY + 35) + "  class=\"Xtitle\" > " + data.Xtitle + "</text> \n";
	svg += "<text x=" + 2 + " y=" + (shiftY - 10) + " class=\"Ytitle\"> " + data.Ytitle + " </text> \n"; //
	svg += labeleGridX;
	svg += labeleGridY;
	svg += "</svg>";
	return svg;
}
/////////////////////////////////////////////////////////////////////////////////////////////
function getThresholdPoints (width, minX, maxX, height, minY, maxY, index, type_line) {
	
	if (type_line[index].t.length == 0) {
		var level = plot_to_svg_y (type_line[index].level[0], height, minY, maxY);  
		var points = "0, " + level + " " + width + ", " + level;
		return points;
	}
	
	var levels = plot_to_svg_y (type_line[index].level, height, minY, maxY);  
	var xPoints = plot_to_svg_x (type_line[index].t, width, minX, maxX);
	
	
	
	if (levels.length != xPoints.length+1) {
		alert ("Ошибка!!");
		return false;
	}
	var points = "0, " + levels[0] + " ";

	for (var i=1; i<levels.length; i++) {
		points += xPoints[i-1] + ", " + levels[i-1] + " ";
		points += xPoints[i-1] + ", " + levels[i] + " ";
	}
	points += width + ", " + levels[levels.length-1];
	return points;
}
////////////////////////////////////////////////////////////////////////////////////////////
// Эта функция занимается тем что выводит коордитаты мыши на графике (в координатах графика, а не SVG)
//  в определенном контейнере
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
		return Math.round(height - (y - minY) * height/(maxY - minY));    
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
	var newSvg = getSVGplot(App.plotData[i], i);
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
		
	if (direction.indexOf("downScaleY") >= 0) {
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
		var newSvg = getSVGplot(App.plotData[i], i);
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
	var newSvg = getSVGplot(App.plotData[i], i);
	$(container).children("svg").remove();
	$(container).append(newSvg);

} 

//////////////////////////////////////////////////////////////////////////////////////////////
