/* js script of start processing */

// set components of application
App.Models = {};
App.Views = {};
App.Collections = {};
App.Routers = {};
App.Funcs = {};

// set global properties of plot
App.globalPlotProperties = {
	width: 1200,    // длинна оси X в пикселях
	height: 200,   // длинна оси Y в пикселях
	shiftX: 50,    // оступ оси Х от левого и правого края в пикселях
	shiftY: 50,    // отступ оси Y от верхнего и нижнего края в пикселях
}

// start script
$(document).ready(function() {

	var my_router = new App.Routers.MyRout(); // Создаём контроллер
	Backbone.history.start();  // Запускаем HTML5 History push 


});
/////////////////////////////
// Routers
App.Routers.MyRout = Backbone.Router.extend({

    routes: {
        "": "start",                        // Пустой hash-тэг
        "start_page": "start",              // Блок получения параметров от пользователя 
        "load_plots": "get_data_plots",     // Блок отрисовки графиков
    
    },

    start: function () {

    	console.log(" Hello from start_page! ");
    	$("#load_data").fadeIn();

    },

    get_data_plots: function () {

    	console.log(" Hello from load_plots! ");

    	$("#load_data").fadeOut();


    	var query_data = {
			'processing_node_id': App.processing_node_id,
			'registrated_path_id': App.registrated_path_id,
			'parent_processing_node_id': App.parent_processing_node_id,
			'record_id': App.record_id,
			'regime': 'read',
			'load' : 'start',
		};
	
		var url =  App.server_script;
		$.ajax ({
			url: url,
			type: 'GET',
			data: query_data,
			cache: false,
			dataType: "json",
			success: App.Funcs.make_plots,
		});


    
    },
});

/////////////////////////////
// functions
App.Funcs = {
	make_plots: function(loaded_data) {

		// console.log(loaded_data);
		var procc_container = $("#procc_container");

		var channels_collection = new App.Collections.TYPlots();
		for (var i=0; i<loaded_data.length; i++) {
			// объявляем модель данных одного канала
			var channel_data_model = new App.Models.TYPlot(loaded_data[i]);
			// console.log( channel_data_model.toJSON() );
			// add new div to procc_container
			$(procc_container).append('<div class="channel"><div>');

			var channel_data_view = new App.Views.ChannelPlot ({
				model: channel_data_model,
				el: $(procc_container).find('.channel :last'),
			});

			// добавляем модель в коллекцию
			channels_collection.add(channel_data_model);

		}

		$(procc_container).append('<div class="xnavigation"><div>');
		var xnavigation = new App.Views.XaxisView({
			collection: channels_collection,
			el: $(procc_container).find('.xnavigation :last'),
		});


	},

	in_arr: function (val, arr) {

		for (var i=0; i<arr.length-1; i++) {
			if (val == arr[i]) {
				return true;
			}
		};
		return false;
	},



}
/////////////////////////////
// models
// declare model for plot of time sequenses
App.Models.TYPlot = Backbone.Model.extend({
	defaults: {
		effect_name: 'channel',
		y_labels: 'Y vals',
		x_labels: 't, time',
		// x_vals: [], // !!!!
		y_vals: [],
		// minX: 0,  // !!!!
		// maxX: 10, // !!!!
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
App.Collections.TYPlots = Backbone.Collection.extend({
	model: App.Models.TYPlot,
});

/////////////////////////
// views
App.Views.ChannelPlot = Backbone.View.extend({
	events: {
		"click .downY" : "up_downYaxis", 
		"click .upY" : "up_downYaxis", 
		"click .downScaleY" : "reScaleY",
		"click .upScaleY" : "reScaleY",
		"click .replotByUserYminmax" : "replotByUserYminmax",
	},

	initialize: function() {
		this.render();

		this.minYvalue = this.$el.find(".minYvalue");
		this.maxYvalue = this.$el.find(".maxYvalue");
		this.stepY = this.$el.find(".stepY");
		this.scalingCoefY = this.$el.find(".scalingCoefY");

		this.svgContainer = this.$el.find(".svg_container");
		var svg_code = this.getSvgTYPlot();
		$(this.svgContainer).html(svg_code);

		this.model.on('change', this.renderPlot, this);

	},

	render: function() {
		var template_html = $("#channel_template").html();
		this.$el.html(template_html);

		return this;
	},

	renderPlot: function() {
		var new_svg_code = this.getSvgTYPlot();
		$(this.svgContainer).html(new_svg_code);
		return this;
	},


	test: function () {
		alert("Hello");
	}, 

	getSvgTYPlot: function() {
		// Перкладываем все переменные в локальные для удобства
		var width  = App.globalPlotProperties.width;
		var height = App.globalPlotProperties.height;
		var shiftX = App.globalPlotProperties.shiftX;
		var shiftY = App.globalPlotProperties.shiftY;
		
		var minX = this.model.get("minX");
		var maxX = this.model.get("maxX");
		var minY = this.model.get("minY");
		var maxY = this.model.get("maxY");
		
		// начать работать отсюда!!!!!
		// нужно переделать, чтобы массив х рассчитавался тута на стороне клиента!!!!
		var fd = this.model.get("fd"); 
		
		var y = this.model.get("y_vals");
		var x = this.fd2Xarray(fd, minX, y.length);

		var binGridX = parseFloat(this.model.get("binGridX"));
		var binGridY = parseFloat(this.model.get("binGridY"));


		var points = "";
		var nGridDigits = 3;


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
			var xSVG = this.plot_to_svg_x(grid_x, width, minX, maxX);  
			gridX += " M " + xSVG + " " + height + " ";
			gridX += " V " + (height - 5);
			labeleGridX += "<text x=\"" + (xSVG + shiftX - 3) + "\" y=\"" + (height + shiftY + 18) + "\" class=\"notesY\" >" + grid_x.toFixed(nGridDigits) + "</text> \n";
			grid_x += binGridX;
			noteGridX += grid_x;
		}
		gridX += ' " class="gridDash" /> ';
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
		// svg += "<text x=" + (shiftX + (width + this.model.get( ("plot_label").length)/2) + " y=" + (shiftY - 30) + " class=\"plotTitle\" >" + this.model.attributes.plot_label + "</text> \n";
		
		// add inside svg
		svg += "<svg x=\"" + shiftX + "px\" y=\"" + shiftY + "px\" width=\"" + width + "px\" height=\"" + height + "px\" viewBox=\"0 0 " + width + " " + height + "\"  class=\"innerSvg\" > \n";
		svg += "<rect x=0 y=0 width=" + width + " height=" + height + " class=\"frame\" /> \n";
		svg += "<polyline points=\"" + points + "\" class=\"linePlot\" /> \n ";
		svg += gridX + gridY;
		svg += "</svg>\n";

		// add labels
		svg += "<text x=" + (shiftX + (width + this.model.attributes.x_labels.length)/2) + " y=" + (height + shiftY + 35) + "  class=\"Xtitle\" > " + this.model.attributes.x_labels + "</text> \n";
		svg += "<text x=" + 2 + " y=" + (shiftY - 10) + " class=\"Ytitle\"> " + this.model.attributes.y_labels + " </text> \n"; //
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

	fd2Xarray: function(fd, minX, ylength) {
		var x = [minX];
		var xt = minX;
		var delta_t = 1/fd;
		for (var i = 0; i < ylength; i++) {
			xt += delta_t;
			x.push(xt);
		}
		return x;
	},

	up_downYaxis: function(eventObj) {
		
		var step = parseFloat( this.stepY.val() );
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

	replotByUserYminmax: function(eventObj) {
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


});
///////////////////////////////
// view of collection 
App.Views.XaxisView = Backbone.View.extend({

	events: {
		'click .toStartX': 'toStartEndX',
		'click .toEndX': 'toStartEndX', 

		'click .upScaleX': 'reScaleY', 
		'click .downScaleX': 'reScaleY', 

		'click .replotByUserXminmax': 'replotByUserXminmax',  
	},

	initialize: function() {
		this.render();

		this.minXvalue = this.$el.find(".minXvalue");
		this.maxXvalue = this.$el.find(".maxXvalue");
		this.stepX = this.$el.find(".stepNavigation");
		this.scalingCoefX = this.$el.find(".scalingCoefX");

		// this.model.on('change', this.renderPlot, this);
		return this;

	},

	render: function() {
		var template_html = $("#zoomingX").html();
		this.$el.html(template_html);
		return this;
	},

	test: function() {
		alert("Hello");
	},



	toStartEndX: function(eventObj) {
		var stepNavigation = parseFloat ( this.stepX.val() );
		
		var direction = eventObj.currentTarget.classList;
	
		var minX = parseFloat( this.collection.at(0).get("minX") );
		var maxX = parseFloat( this.collection.at(0).get("maxX") );

		if ( App.Funcs.in_arr("toStartX", direction) ) {
			minX -= stepNavigation;
			maxX -= stepNavigation;
		}
		
		if ( App.Funcs.in_arr("toEndX", direction) ) {
			minX += stepNavigation;
			maxX += stepNavigation;
		}

		this.loadNewData(minX, maxX);

		return this;
	},

	reScaleY: function(eventObj) {
		
		var sCoef = parseFloat( this.scalingCoefX.val() );
		var minX = parseFloat( this.collection.at(0).get("minX")  );
		var maxX = parseFloat( this.collection.at(0).get("maxX") );
		
		if (sCoef == 0) { return; };
		
		if (sCoef < 1) {
			sCoef = 1 / sCoef;
			this.scalingCoef.val(sCoef);
		};
		
		var direction = eventObj.currentTarget.classList;
		var dif = maxX - minX;
		var middle = minX + 0.5*dif;
			
		if ( App.Funcs.in_arr("upScaleX", direction) )  {
			dif = dif * sCoef;
		}
			
		if ( App.Funcs.in_arr("downScaleX", direction) ) {
			dif = dif / sCoef;
		}

		minX = middle - 0.5*dif;
		maxX = middle + 0.5*dif;
		
		this.loadNewData(minX, maxX);
		return this;
	},
	replotByUserXminmax: function(eventObj) {
			 
		var minX = parseFloat ( this.minXvalue.val() );
		var maxX =  parseFloat ( this.maxXvalue.val() );
		
		if ( maxX < minX ) { return; }
	
		this.loadNewData(minX, maxX);
		return this;
	},


	loadNewData: function(minX, maxX) {

		// тут нужно написать получение и обработку данных от сервера !!!
    	var query_data = {
			'processing_node_id': App.processing_node_id,
			'registrated_path_id': App.registrated_path_id,
			'parent_processing_node_id': App.parent_processing_node_id,
			'record_id': App.record_id,
			'regime': 'read',
			'load' : 'continue',
			'minX' : minX,
			'maxX' : maxX,
		};
	
		var url =  App.server_script;
		$.ajax ({
			url: url,
			type: 'GET',
			data: query_data,
			cache: false,
			dataType: "json",
			context: this,
			success: function(loaded) {
				this.collection.each(function(model, ind){
					var new_channels_data = {
						"minX": minX,
						"maxX": maxX,
						"y_vals" : loaded[ind].y_vals,
					};
					model.set(new_channels_data);
				});
			}
		});
		return this;

	},



});