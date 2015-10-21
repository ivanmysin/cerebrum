/* hists of inretspikes inervals js file */

// set components of application
App.Models = {};
App.Views = {};
App.Collections = {};
App.Routers = {};
App.Funcs = {};

////////////////////////////////////////////////////////////////////
// declare functions
App.Funcs = {



	in_arr: function (val, arr) {

		for (var i=0; i<arr.length-1; i++) {
			if (val == arr[i]) {
				return true;
			}
		};
		return false;
	},

	getRandomColor: function () {
    	/*var letters = '0123456789ABCDEF'.split('');
    	var color = '#';
    	for (var i = 0; i < 6; i++ ) {
        	color += letters[Math.floor(Math.random() * 16)];
    	}
    	return color;
    	*/
    	var r = Math.floor(Math.random() * 255);
    	var g = Math.floor(Math.random() * 255);
    	var b = Math.floor(Math.random() * 255);
    	var color = "rgb(" + r + ", " + g + ", " + b + ")";
    	return color;
	}, 

	roundPlus: function (x, n) { //x - число, n - количество знаков
	  if(isNaN(x) || isNaN(n)) return false;
	  var m = Math.pow(10,n);
	  return Math.round(x*m)/m;
	},

	make_plots: function (recevedData) {


    	var plots_div = $("#procc_container #proccessing_code #plots"); // get div for all plots
    	$(plots_div).html("");                                          // and clear its content

		var template_html =  $("#procc_container #template_for_one_neuron").html(); // get template html
		
		for (var i=0; i<recevedData.length; i++) { // cicle by channels
			var channel_data = recevedData[i];

			$(plots_div).append('<div class="channels"> <span class="channel_name"> Канал ' + channel_data.channel_name + '</span> </div>');   // append new div for all neurons in one channels
			var channels_div = $(plots_div).find(".channels:last"); // get inserted div

			for (var j=0; j<channel_data.neurons.length; j++) {     // circle by neurons
				
				var neuron_data = channel_data.neurons[j];



				$(channels_div).append('<div class="neuron"> <div class="general_zoming"></div> </div>');   // append new div for all effect in one neuron
				var neuron_div = $(channels_div).find(".neuron:last");   // get inserted div
				var general_zoming_div = $(neuron_div).find(".general_zoming");

				var effects_collection = new App.Collections.HistPlots();

				
				for (var k=0; k<neuron_data.length; k++) {  // cycle by effects
					var effect_data = neuron_data[k];

					$(neuron_div).append('<div class="effect"> </div>');
					var effect_div = $(neuron_div).find(".effect:last");

					var hist_model = new App.Models.HistPlot(effect_data);
					var hist_view = new App.Views.HistPlot({
						model:hist_model,
						el: $(effect_div),
					});
					effects_collection.add(hist_model);

				};

				var general_zoming_view = new App.Views.Zooming({
					collection: effects_collection,
					el: $(general_zoming_div),

				});
				
				$(neuron_div).append('<div class="clear"> </div>');

			};
		};
	},
};


///////////////////////////////////////////////////////////////////////
// declare model for plot data
App.Models.HistPlot = Backbone.Model.extend({
	defaults: {
		effect_name: 'Some effect',
		y_labels: 'Y vals',
		x_labels: 'X vals',
		x_vals: [],
		y_vals: [],
		minX: 0,
		maxX: 10,
		minY: 0, 
		maxY: 10,
		binGridX: 10,
		binGridY: 1,
		
		neuron_ind: 0,
		channel_ind: 0,
		channel_name: "channel",
	},
});

// Collection of plots models
App.Collections.HistPlots = Backbone.Collection.extend({
	model: App.Models.HistPlot,
});

// view of zooming in same scalee

App.Views.Zooming = Backbone.View.extend({

	events: {
		"click .rePlotAll": "rePlotAll",
	},

	initialize: function() {
		this.render();


		this.minYvalue = this.$el.find(".minYvalue");
		this.maxYvalue = this.$el.find(".maxYvalue");

		this.minXvalue = this.$el.find(".minXvalue");
		this.maxXvalue = this.$el.find(".maxXvalue");

	},

	render: function() {
		var template_html = $("#general_zoom_template").html();
		this.$el.html(template_html);

		return this;
	},


	rePlotAll: function(eventObj) {
		var minX = parseFloat( $(this.minXvalue).val() );
		var maxX = parseFloat( $(this.maxXvalue).val() );

		var minY = parseFloat( $(this.minYvalue).val() );
		var maxY = parseFloat( $(this.maxYvalue).val() );

		this.collection.each(function(model) {
			model.set({
				minX: minX,
				maxX: maxX,
				minY: minY,
				maxY: maxY,
			});
		});

		return this;
	},


});

// view of HistPlot model
App.Views.HistPlot = Backbone.View.extend({

	events: {
		// "click .toStart": "rePlot",
		// "click .toEnd": "rePlot",
		// "click .upScale": "reScale",
		// "click .downScale": "reScale",
	
		// "click .upY": "rePlotY",
		// "click .downY": "rePlotY",
	
		//"click .downScaleY": "reScaleY",
		// "click .upScaleY": "reScaleY",

		"click .rePlotByUserScale": "rePlotByUserScale",
		"click .reZoomingByUserY": "reZoomingByUserY",
      
	},


	initialize: function(options) {
	
		this.render();
	
		this.model.on('change', this.renderPlot, this);

		this.svg_el = this.$el.find("div.svg_wrapper");
		this.minYvalue = this.$el.find(".minYvalue");
		this.maxYvalue = this.$el.find(".maxYvalue");
		//this.navigationX = this.$el.find(".stepNavigation");
		//this.scalingCoef = this.$el.find(".scalingCoef");
		this.startX = this.$el.find(".startTimeWindow");
		this.endX = this.$el.find(".endTimeWindow");
		//this.navigationY = this.$el.find(".stepY");
		//this.scalingCoefY = this.$el.find(".scalingCoefY");



	},
	

	render: function() {
		var svg_code = this.getSVGplot();
		var template_zoomY = $("#templateZoomY").html();
		var template_zoomX = $("#templateZoomX").html();
		var statCode = '<div class="statistics"> Kv = ' + this.model.get("kv") + '</div>'; // code for statistics by data on plot
		this.$el.html(template_zoomY + "<div class=\"svg_wrapper\">" + svg_code + "</div>" + statCode + "<div class=\"clear\"></div>" + template_zoomX + "<div class=\"clear\"></div>");
		return this;
	},

	renderPlot: function() {
		var new_svg_code = this.getSVGplot();
		this.svg_el.html(new_svg_code);
		return this;
	},


	rePlot: function(eventObj) {
		var stepNavigation = parseFloat ( this.navigationX.val() );
		
		var direction = eventObj.currentTarget.classList;
	
		var minX = parseFloat( this.model.get("minX") );
		var maxX = parseFloat( this.model.get("maxX") );

		if ( App.Funcs.in_arr("toStart", direction) ) {
			minX -= stepNavigation;
			maxX -= stepNavigation;
		}
		
		if ( App.Funcs.in_arr("toEnd", direction) ) {
			minX += stepNavigation;
			maxX += stepNavigation;
		}
		this.model.set({
			"minX": minX,
			"maxX": maxX,
		});
		return this;
	},

	reScale: function(eventObj) {
		
		var sCoef = parseFloat( this.scalingCoef.val() );
		var minX = parseFloat( this.model.get("minX") );
		var maxX = parseFloat( this.model.get("maxX") );
		
		if (sCoef == 0) {
			return;
		};
		
		if (sCoef < 1) {
			sCoef = 1 / sCoef;
			this.scalingCoef.val(sCoef);
		};
		
		var direction = eventObj.currentTarget.classList;
		var dif = maxX - minX;
		var middle = minX + 0.5*dif;
			
		if ( App.Funcs.in_arr("upScale", direction) )  {
			dif = dif * sCoef;
		}
			
		if ( App.Funcs.in_arr("downScale", direction) ) {
			dif = dif / sCoef;
		}

		minX = middle - 0.5*dif;
		maxX = middle + 0.5*dif;
		
		this.model.set({
			"minX": minX,
			"maxX": maxX,
		});			

		return this;
	},

	rePlotByUserScale: function(eventObj) {
			 
		var startXval = parseFloat ( this.startX.val() );
		var endXval =  parseFloat ( this.endX.val() );
		
		if (( endXval - startXval ) < 0) {
			return;
		}
	
		this.model.set({
			"minX": startXval,
			"maxX": endXval,
		});
		return this;
	},

	rePlotY: function(eventObj) {
		
		var step = parseFloat( this.navigationY.val() );
		var direction = eventObj.currentTarget.classList;	
		
		var minY = parseFloat( this.model.get("minY") );
		var maxY = parseFloat( this.model.get("maxY") );
		
		if ( App.Funcs.in_arr("downY", direction) ) {
			minY -= step;
			maxY -= step;
		}
			
		if ( App.Funcs.in_arr("upY", direction) ) {
			minY += step;
			maxY += step;
		}
		
		this.model.set({
			"minY": minY,
			"maxY": maxY,
		});

		return this;
	},

	reScaleY: function(eventObj) {
		 
		var sCoef = parseFloat ( this.scalingCoefY.val() );
		
		if (sCoef == 0) {
			return;
		};
		
		if (sCoef < 1) {
			sCoef = 1 / sCoef;
			this.scalingCoefY.val(sCoef);
		};
			
		var direction = eventObj.currentTarget.classList;
		
		var minY = parseFloat( this.model.get("minY") );
		var maxY = parseFloat( this.model.get("maxY") );
	
			
		var dif = maxY - minY;
		var middle = minY + 0.5*dif;
			
		if ( App.Funcs.in_arr("upScaleY", direction) )  {
			dif = dif * sCoef;
		}
			
		if ( App.Funcs.in_arr("downScaleY", direction) ) {
			dif = dif / sCoef;
		}

		minY = middle - 0.5*dif;
		maxY = middle + 0.5*dif;
			
		this.model.set({
			"minY": minY,
			"maxY": maxY,
		});
		return this;
	},

	reZoomingByUserY: function(eventObj) {
		var startWindow = parseFloat( this.minYvalue.val() ); 
		var endWindow = parseFloat( this.maxYvalue.val() ); 
		if ((endWindow - startWindow) < 0) {
			return;
		};
		this.model.set({
			"minY": startWindow,
			"maxY": endWindow,
		});
		return this;
	},


	getSVGplot: function  () {
		// Перкладываем все переменные в локальные для удобства
		var width  = App.globalPlotProperties.width;
		var height = App.globalPlotProperties.height;
		var shiftX = App.globalPlotProperties.shiftX;
		var shiftY = App.globalPlotProperties.shiftY;
		
		var minX = this.model.get("minX");
		var maxX = this.model.get("maxX");
		var minY = this.model.get("minY");
		var maxY = this.model.get("maxY");
		var x = this.model.get("x_vals");
		var y = this.model.get("y_vals");
		var binGridX = parseFloat(this.model.get("binGridX"));
		var binGridY = parseFloat(this.model.get("binGridY"));


		var points = "";
		var nGridDigits = 1;


		// calculate x and y to svg coordinates 
		var svgx = this.plot_to_svg_x (x, width, minX, maxX);
		var svgy = this.plot_to_svg_y (y, height, minY, maxY);
		// downsampling svg coordinates
		var dsvgobject = this.downSampling (svgy, svgx);
		svgx = dsvgobject.sequenceX;
		svgy = dsvgobject.sequenceY;
		
		// delete points outside plot
		for (var i=0; i<svgx.length; i++) {
			if ((svgx[i] <= width) && (svgy[i] <= height)) {
				points += svgx[i] + ", " + svgy[i] + " ";
			}
		}
				

		// declare vars for grids on plot
		var gridX = "<path d=\"";
		var gridY = "<path d=\"";
		var noteGridX = "";
		var noteGridY = "";
		
		var labeleGridX = "";
		var labeleGridY = "";

		var ngridX = (maxX - minX) / binGridX;
		var grid_x = minX; // !!! Тут можно сделать так, чтоб grid_x начиналась с ближайшего (минимума - шаг решетки)
		for (var i=0; i<ngridX; i++) {
			var xSVG = this.plot_to_svg_x(grid_x, width, minX, maxX);         // (grid_x - minX)*width/(maxX - minX);
			gridX += " M " + xSVG + " " + height + " ";
			gridX += " V " + (height - 5);
			labeleGridX += "<text x=\"" + (xSVG + shiftX - 3) + "\" y=\"" + (height + shiftY + 18) + "\" class=\"notesY\" >" + grid_x.toFixed(nGridDigits) + "</text> \n";
			grid_x += binGridX;
			noteGridX += grid_x;
		}
		gridX += "\"  class=\"gridDash\" />\n ";
		var ngridY = (maxY - minY) / binGridY;
		var grid_y = minY;
		for (var i=0; i<=ngridY; i++) {
			var ySVG = this.plot_to_svg_y (grid_y, height, minY, maxY);   //(height - (grid_y - minY) * height/(maxY - minY));
			gridY += " M 0 " + ySVG;
			gridY += " H 5 ";
			labeleGridY += "<text x=\"" + (shiftX - 25) + "\" y=\"" + (ySVG + shiftY + 3) + "\" class=\"notesY\" >" + grid_y.toFixed(nGridDigits) + "</text> \n"
			grid_y += binGridY;
		}
		gridY += " \" class=\"gridDash\" />\n ";
		
		// form svg code
		var svg = "<svg width=\"" + (width + 2*shiftX) + "px\" height=\"" + (height + 2*shiftY) + "px\" class=\"outSVG\"> \n";
		svg += "<text x=" + (shiftX + (width + this.model.get("effect_name").length)/4) + " y=" + (shiftY - 30) + " class=\"plotTitle\" >" + this.model.get("effect_name") + "</text> \n";
		
		// add inside svg
		svg += "<svg x=\"" + shiftX + "px\" y=\"" + shiftY + "px\" width=\"" + width + "px\" height=\"" + height + "px\" viewBox=\"0 0 " + width + " " + height + "\"  class=\"innerSvg\" > \n";
		svg += "<rect x=0 y=0 width=" + width + " height=" + height + " class=\"frame\" /> \n";
		svg += "<polyline points=\"" + points + "\" class=\"linePlot\" /> \n ";
		svg += gridX + gridY;
		svg += "</svg>\n";

		// add labels
		svg += "<text x=" + (shiftX + (width + this.model.get("x_labels").length)/2) + " y=" + (height + shiftY + 35) + "  class=\"Xtitle\" > " + this.model.get("x_labels") + "</text> \n";
		svg += "<text x=" + 2 + " y=" + (shiftY - 10) + " class=\"Ytitle\"> " + this.model.get("y_labels") + " </text> \n";
		svg += labeleGridX;
		svg += labeleGridY;
		svg += "</svg>";
		return svg;
	},
	plot_to_svg_x:	function (x, width, minX, maxX) {
		if (typeof(x) == 'number') {
			return Math.round((x - minX)*width/(maxX - minX));     
		}
		var svgX = new Array ();
		for (var i=0; i<x.length; i++) {
			svgX[i] = Math.round((x[i] - minX)*width/(maxX - minX));               // roundPlus(((x[i] - minX)*width/(maxX - minX)), 1);  //  Math.round
		}

		return svgX;
	},

	plot_to_svg_y: function (y, height, minY, maxY) {
		if (typeof(y) == 'number') {
			return Math.round(height - (y - minY) * height/(maxY - minY));    
		}
		
		var svgY = new Array ();
		for (var i=0; i<y.length; i++) {
			svgY[i] = Math.round(height - (y[i] - minY) * height/(maxY - minY));  //roundPlus((height - (y[i] - minY) * height/(maxY - minY)), 0);      //  Math.round 
		}

		return svgY;
	},
	//////////////////////////////////////////////////////////////////////////////////////////////
	svg_to_plot_x: function (svgX, width, minX, maxX) {
		if (typeof(svgX) == 'number') {
			return (svgX*(maxX-minX)/width) + minX;
		}
		
		var x = new Array ();
		for (var i=0; i<svgX.length; i++) {
			x[i] = (svgX*(maxX-minX)/width) + minX;
		}
		return x;
	},

	svg_to_plot_y: function (svgY, height, minY, maxY) {
		if (typeof(svgY) == 'number') {
			return minY + ((height - svgY)*(maxY - minY) / height);
		}
		
		var y = new Array ();
		for (var i=0; i<svgY.length; i++) {
			y[i] = minY + ((height - svgY)*(maxY - minY) / height);
		}
		return y;
	},
	//////////////////////////////////////////////////////////////////////////////////////////////

	downSampling: function (ySequence, xSequence) {
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
	},


}); 

App.Routers.MyRout = Backbone.Router.extend({

    routes: {
        "": "get_params",           // Пустой hash-тэг
        "get_params": "get_params", // Блок получения параметров от пользователя 
        "plots": "get_data_plots",      // Блок отрисовки графиков
    
    },

    get_params: function () {
    	
    	$("#procc_container #proccessing_code").fadeOut();
    	$("#procc_container #getparams").fadeIn();
    	
    	var data_for_ajax = {
		'processing_node_id': App.processing_node_id,
		'registrated_path_id':App.registrated_path_id,
		'parent_processing_node_id':App.parent_processing_node_id,
		'record_id': App.record_id,
		'regime': 'read',
		}; 

		$.ajax({
			url: App.server_script,  
			type: "GET",
			data: data_for_ajax,
			cache: false,
			dataType: "html",   
			success: function(recevedData) {
				$("#procc_container #getparams").html(recevedData);
			},

			error: function (recevedData) {
				alert ("Ajax query error! More details in console");
				console.log(recevedData);
			},

		});



    	console.log(" Hello from get_params! ");
    },

    get_data_plots: function () {

    	var form = $("form#client_params");
		var query_data = {
			'processing_node_id': App.processing_node_id,
			'registrated_path_id': App.registrated_path_id,
			'parent_processing_node_id': App.parent_processing_node_id,
			'record_id': App.record_id,
			'regime': 'processing',
		};

		var query = $(form).serialize();
	
	
		query += "&" + $.param(query_data);

		var url = App.server_script + "?"+ query;
		$.ajax ({
			url: url,
			type: 'GET',
			cache: false,
			dataType: "json",
			success: App.Funcs.make_plots,
			error: function (recevedData) {
				alert ("Error ajax query!");
				console.log(recevedData);
			}
		});
		App.params.bin = $(form).find("input[name=bin]").val();
		App.params.order = $(form).find("input[name=order]").val();


		$("#procc_container #getparams").fadeOut();
		$("#procc_container #proccessing_code").fadeIn();
    
    },
});



// set global properties for plots
App.globalPlotProperties = {  
	width: 200,    // длинна оси X в пикселях
	height: 200,   // длинна оси Y в пикселях
	shiftX: 50,    // оступ оси Х от левого и правого края в пикселях
	shiftY: 50,    // отступ оси Y от верхнего и нижнего края в пикселях
}



$(document).ready(function() {

	var my_router = new App.Routers.MyRout(); // Создаём контроллер
	Backbone.history.start();  // Запускаем HTML5 History push 


});