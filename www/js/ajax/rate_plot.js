/* rate_hist file */
// set components of application
App.Models = {};
App.Views = {};
App.Collections = {};
App.Funcs = {};

////////////////////////////////////////////////////////////////////
// declare functions
App.Funcs = {

	myCallback: function (recevedData) {
		$("#procc_container").append(recevedData);
		$("#procc_container").on('submit', '#client_params', App.Funcs.get_plots_data);
	},

	get_plots_data: function (eventObj) {
		eventObj.preventDefault();
		$(this).fadeOut(500);
		var query = $(this).serialize();
	
		var query_data = {
			'processing_node_id': App.processing_node_id,
			'registrated_path_id':App.registrated_path_id,
			'parent_processing_node_id':App.parent_processing_node_id,
			'record_id': App.record_id,
			'regime': 'processing',
		};
	
		query += "&" + $.param(query_data);
		var url =  App.server_script + "?"+ query;
		$.ajax ({
			url: url,
			type: 'GET',
			cache: false,
			dataType: "json",
			success: App.Funcs.make_plots,
		});

		App.params.plots_params = App.Funcs.getFormData($(this));

	},

	getFormData: function ($form){
	    var unindexed_array = $form.serializeArray();
	    var indexed_array = {};
	    $.map(unindexed_array, function(n, i){
	        indexed_array[n['name']] = n['value'];
	    });

	    return indexed_array;
	},

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
				
		var template =  $("#procc_container #template_for_one_neuron");
		var template_html = $(template).html();
		var processing_code_div = $("#procc_container #proccessing_code");

		App.params.channels = new Array(); // Add to models to send to server

		var neuron_number = 1;

		
		for (var i=0; i<recevedData.length; i++) {    
			// cycle for channels
			var ch_data = recevedData[i].plots;
			
			App.params.channels[i] = new Array ();


			for (var j=0; j<ch_data.length; j++) {
				// cycle for each neuron in channel
				/* 

					Для каждого нейрона создаем 
					1. Модель с данными для построния интегралки по бинам
					2. Модель с данными для построния графика мгновенной скорости
					3. Модель с данными для одной пары границ эффекта
					4. Коллекция моделей границ эффектов
					5. Вид модели 1.
					6. Вид модели 2
					7, Вид коллекции границ (4)
					8. Вид добавления новых эффектов

				*/ 


				$(processing_code_div).append(template_html);             // Вставляем код шаблона для обработки нейрона
				var inserted_el = $("#proccessing_code .one_neuron:last");

				
				var svg_contaner = $(inserted_el).find(".svg_container");

				var bnd = new App.Collections.BoundsCol ([                                   // create collection of bounds
					{
						name: "Effect 1",
						lowbound: 1,
						upperbound:2,
						color: App.Funcs.getRandomColor(),
						neuron_number: neuron_number,
					},
					{
						name: "Effect 2",
						lowbound: 12,
						upperbound:23,
						color: App.Funcs.getRandomColor(),
						neuron_number: neuron_number,
					},
					{
						name: "Effect 3",
						lowbound: 5,
						upperbound:6,
						color: App.Funcs.getRandomColor(),
						neuron_number: neuron_number,
					},


				]);                                 
				
				var bnd_view = new App.Views.Bounds ({                                        // create view of collection bnd
					collection: bnd,
					el: $(inserted_el).find("table.boundTable"),
					neuron_number: neuron_number,
				});                     


				var add_new_bnd = new App.Views.AddBound({                                    // view of addition bounds
					collection:bnd,
					el: $(inserted_el).find("form.add_bounds"),
					neuron_number: neuron_number,
				});    

				if (typeof (ch_data[j].rate_by_bins) !== 'undefined' ) {
					var plot_by_bins = new App.Models.RatePlot (ch_data[j].rate_by_bins);   // Создаем модель интегралки по бинам
					plot_by_bins.set("channel_ind", i);
					plot_by_bins.set("neuron_ind", j);
					
        
        			$(svg_contaner).append("<div class=\"one_plot\"></div>");
					var new_el = $(inserted_el).find(".one_plot:last");
					var plot_by_bins_view = new App.Views.RatePlot({                        // Создаем вид этой модели
						model: plot_by_bins,
						el: $(new_el),
						effects_collection: bnd,
					}); 					
				}
				
				if (typeof (ch_data[j].momentary_rate) !== 'undefined' ) {
					var moment_plot = new App.Models.RatePlot (ch_data[j].momentary_rate);   // Создаем модель интегралки мгновенной скорости
					moment_plot.set("channel_ind", i);
					moment_plot.set("neuron_ind", j);
										
					
					$(svg_contaner).append("<div class=\"one_plot\"></div>");
					var new_el = $(svg_contaner).find(".one_plot:last");
					
					// Создаем вид этой модели
					var moment_plot_view = new App.Views.RatePlot({
						model:moment_plot,
						el: $(new_el),
						effects_collection: bnd,
					});    
				}


				App.params.channels[i][j] = bnd;
				neuron_number++;
			
			} 
		}


	},




};
///////////////////////////////////////////////////////////////////////
// declare model for plot data
App.Models.RatePlot = Backbone.Model.extend({
	defaults: {
		plot_label: 'Plot',
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
App.Collections.RatePlots = Backbone.Collection.extend({
	model: App.Models.RatePlot,
});

// view of RatePlot model
App.Views.RatePlot = Backbone.View.extend({

	events: {
		"click .toStart": "rePlot",
		"click .toEnd": "rePlot",
		"click .upScale": "reScale",
		"click .downScale": "reScale",
		"click .rePlotByUserScale": "rePlotByUserScale",
	
		"click .upY": "rePlotY",
		"click .downY": "rePlotY",
	
		"click .downScaleY": "reScaleY",
		"click .upScaleY": "reScaleY",
		"click .reZoomingByUserY": "reZoomingByUserY",

		"mousedown .outSVG": "set_drag_bound",
		"mousemove .outSVG": "change_bound",
		"mouseup .outSVG": "drop_bound",

       
	},


	initialize: function(options) {
		this.effects_collection = options.effects_collection;
	
		this.render();
	
		this.model.on('change', this.renderPlot, this);
		this.effects_collection.on('change:lowbound change:upperbound', this.renderBounds, this);
		this.effects_collection.on('remove', this.removeEffeft, this);
		this.effects_collection.on('add', this.addEffeft, this);

		this.svg_el = this.$el.find("div.svg_wrapper");
		this.minYvalue = this.$el.find(".minYvalue");
		this.maxYvalue = this.$el.find(".maxYvalue");
		this.navigationX = this.$el.find(".stepNavigation");
		this.scalingCoef = this.$el.find(".scalingCoef");
		this.startX = this.$el.find(".startTimeWindow");
		this.endX = this.$el.find(".endTimeWindow");
		this.navigationY = this.$el.find(".stepY");
		this.scalingCoefY = this.$el.find(".scalingCoefY");

		this.dragable_bound = false;
		this.side = undefined;


	},
	set_drag_bound: function (eventObj) {
		
		var shiftX = App.globalPlotProperties.shiftX;
		var shiftY = App.globalPlotProperties.shiftY
		var width = App.globalPlotProperties.width;
		var height = App.globalPlotProperties.height;

		var xClick = eventObj.pageX - $(eventObj.currentTarget).offset().left - shiftX;
	    var yClick = eventObj.pageY - $(eventObj.currentTarget).offset().top - shiftY;  

	    if ( xClick<0 || xClick>width || yClick<0 || yClick>height) {
	    	return;
	    };

	    var minX = this.model.get("minX");
		var maxX = this.model.get("maxX");
		

		this.effects_collection.each(function(effect) {
			
			if ( effect.get("current") ) {
			
				var lowboundSvg = this.plot_to_svg_x( parseFloat( effect.get( "lowbound" ) ), width, minX, maxX);
				var upperboundSvg = this.plot_to_svg_x( parseFloat( effect.get( "upperbound" ) ), width, minX, maxX);

				if ( Math.abs(xClick - lowboundSvg) < 6 ) { // 6px is area around current bound for dragable
					this.side = "low";
					this.dragable_bound = true;
				}

				if ( Math.abs(xClick - upperboundSvg) < 6 ) { // 6px is area around current bound for dragable
					this.side = "upper";
					this.dragable_bound = true;
				}
			
			};
			
		}, this);
		
		return this;
	},

	drop_bound: function (eventObj) {
		this.dragable_bound = false;
		this.side = undefined;

		return this;
	},



	change_bound: function(eventObj) {
		if ( !(this.dragable_bound) ) { return; }
		var shiftX = App.globalPlotProperties.shiftX;
		var shiftY = App.globalPlotProperties.shiftY
		var width = App.globalPlotProperties.width;
		var height = App.globalPlotProperties.height;

		var xClick = eventObj.pageX - $(eventObj.currentTarget).offset().left - shiftX; // 
	    var yClick = eventObj.pageY - $(eventObj.currentTarget).offset().top - shiftY;  

	    if ( xClick<0 || xClick>width || yClick<0 || yClick>height) {
	    	this.dragable_bound = false;
			this.side = undefined;
	    	return;
	    };
		
		var minX = parseFloat( this.model.get("minX") );
		var maxX = parseFloat( this.model.get("maxX") );



		var plotX = this.svg_to_plot_x(xClick, width, minX, maxX);

		this.effects_collection.each(function(effect) {
			
			if ( effect.get("current") ) {
			
				if (this.side == "low") {
					effect.set( {"lowbound": plotX, }, {validate: true} );
				}

				if (this.side == "upper") {
					effect.set( {"upperbound": plotX, }, {validate: true} );
				}
			
			};
			
		}, this);
		
		return this;
	},

	addEffeft: function(eventObj) {
		
		var $innerSvg = this.$el.find(".innerSvg");

		var width  = App.globalPlotProperties.width;
		var height = App.globalPlotProperties.height;
		var minX = this.model.get("minX");
		var maxX = this.model.get("maxX");

		var lowboundSvg = this.plot_to_svg_x( parseFloat( eventObj.get( "lowbound") ), width, minX, maxX );
		var upperboundSvg = this.plot_to_svg_x( parseFloat( eventObj.get("upperbound") ), width, minX, maxX );

		

		var new_bounds_on_plot = $(document.createElementNS("http://www.w3.org/2000/svg", "rect")).attr({
            "x": lowboundSvg,
            "y": 0,
            "width": (upperboundSvg - lowboundSvg),
            "height": height,
            "stroke": "#000",
            "stroke-width": "3" ,
            "fill":  eventObj.get("color"),
            "style": 'fill-opacity: ' + eventObj.get("opacity"),
            "class": eventObj.cid,
        });

		$innerSvg.append(new_bounds_on_plot);

		return this;
	}, 

	removeEffeft: function (eventObj) {
		var bounds = this.$el.find("." + eventObj.cid);
		$(bounds).remove();
		return this;
	},

	renderBounds: function(eventObj) {

		var $model_rects = this.$el.find("." + eventObj.cid);
		var lowbound = parseFloat( eventObj.get("lowbound") );
		var upperbound = parseFloat( eventObj.get("upperbound") );

		var minX = parseFloat( this.model.get("minX") );
		var maxX = parseFloat( this.model.get("maxX") );
		var width = App.globalPlotProperties.width;

		var lowboundSvg = this.plot_to_svg_x(lowbound, width, minX, maxX);
		var upperboundSvg = this.plot_to_svg_x(upperbound, width, minX, maxX);
		$model_rects.attr("x", lowboundSvg);
		$model_rects.attr("width", (upperboundSvg - lowboundSvg) );
	},

	render: function() {
		var svg_code = this.getSVGplot();
		var template_zoomY = $("#templateZoomY").html();
		var template_zoomX = $("#templateZoomX").html();
		this.$el.html(template_zoomY + "<div class=\"svg_wrapper\">" + svg_code + "</div>" + "<div class=\"clear\"></div>" + template_zoomX + "<div class=\"clear\"></div>");
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


	renderBoundsonPlots: function(effect, width, minX, maxX, height) {
			var lowbound = parseFloat( effect.get( "lowbound") );
			var upperbound = parseFloat( effect.get("upperbound") );

			if ( lowbound > maxX ) {
				return " ";
			}

			if ( upperbound < minX ) {
				return " ";
			}
			
			if (lowbound < minX && upperbound < maxX) {
				lowbound = minX;
			}

			if (lowbound > minX && upperbound > maxX) {
				upperbound = maxX;
			}



			
			var lowboundSvg = this.plot_to_svg_x(lowbound, width, minX, maxX );
			var upperboundSvg = this.plot_to_svg_x(upperbound, width, minX, maxX );

			var width_bounds = upperboundSvg - lowboundSvg;
			var bounds_effects = '<rect x="' + lowboundSvg + '" y="' + 0 + '" width="' + width_bounds + '" height="' + height + '" fill="' + effect.get("color");
			bounds_effects += '"  style="fill-opacity: ' + effect.get("opacity") + '" stroke="#000" stroke-width="3" class="' + effect.cid + '""></rect>';
			return bounds_effects;
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
		//
		var bounds_effects = "";
		
		this.effects_collection.each(function(effect) {
			bounds_effects += this.renderBoundsonPlots(effect, width, minX, maxX, height);
		}, this);

				

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
		svg += "<text x=" + (shiftX + (width + this.model.attributes.plot_label.length)/2) + " y=" + (shiftY - 30) + " class=\"plotTitle\" >" + this.model.attributes.plot_label + "</text> \n";
		
		// add inside svg
		svg += "<svg x=\"" + shiftX + "px\" y=\"" + shiftY + "px\" width=\"" + width + "px\" height=\"" + height + "px\" viewBox=\"0 0 " + width + " " + height + "\"  class=\"innerSvg\" > \n";
		svg += "<rect x=0 y=0 width=" + width + " height=" + height + " class=\"frame\" /> \n";
		svg += "<polyline points=\"" + points + "\" class=\"linePlot\" /> \n ";
		svg += gridX + gridY;
		svg += bounds_effects;
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


}); 



///////////////////////////////////////////////////////////////////////
// declare model for one paire of bounds
App.Models.Bounds = Backbone.Model.extend({
	defaults: {
		name: 'Unnamed effect',
		lowbound: 0,
		upperbound: 1,
		color: "rgd(255, 255, 255)",
		opacity: 0.2,
		current: false,
		my_id: "0",
		neuron_number: 0,
	},
			
	validate: function(attrs) {
	// console.log(attrs);
		if ( attrs.lowbound > attrs.upperbound ) {
			alert("Not valid!");
			return "Not valid";
		};
				
		if ( ! $.trim(attrs.name) ) {
			alert("Not valid name of effect!");
			return "Not valid";
		};
	},
});

////////////////////////////////////////////////////////////////////
// declare view of one paire of bounds
App.Views.Bound = Backbone.View.extend({	
	tagName: 'tr',

	id_template: "#bound_template",	
	
	initialize: function() {
		this.model.set("my_id", this.model.cid);
	
		this.model.on('change', this.render, this); 
		this.model.on('destroy', this.deleteBoundFromView, this);

		this.template = _.template( $("#bound_template").html() );

	},

	
	render: function() {
		
		var color = this.model.get("color");
		var opacity = this.model.get("opacity");
		color = color.substring(0,  color.length-1) + ", " + opacity + ")";
		this.$el.css("background-color", color); 
		
		var lowbound = App.Funcs.roundPlus( parseFloat( this.model.get("lowbound") ), 1 );
		var upperbound = App.Funcs.roundPlus( parseFloat( this.model.get("upperbound") ), 1 );

		this.model.set({
			"lowbound": lowbound,
			"upperbound": upperbound,
		}, {silent: true} );


		this.$el.html( this.template( this.model.toJSON() ) );

		// var radio = this.$el.find("input[type=\"radio\"]");

		// console.log( this.model.toJSON() );
		
		// if ( this.model.get("current") ) {
			// $(radio).prop( "checked", true );
		// }

		return this;
	},

	events: {
		'click .edit_effect': 'editName',
		'click .delete_effect': 'destroy',
	},

	editName: function() {
		var title = prompt("Название границ", this.model.get("name"));
		this.model.set("name", title, {validate: true});
	},

	destroy: function() {
		this.model.destroy();
	}, 

	deleteBoundFromView: function() {
		this.$el.remove();
	},

});

////////////////////////////////////////////////////////////////////
// declare collection of models of bounds
App.Collections.BoundsCol = Backbone.Collection.extend({
	model: App.Models.Bounds, 
});

// declar view of collection of models of bounds
App.Views.Bounds = Backbone.View.extend({
	tagName: 'tbody', 

	events: {
		'change input[type=radio]': 'change_current_effect',
	},

	initialize: function() {
		this.render();
		this.collection.on('add', this.addOne, this);
	},
	render: function() {
		this.collection.each(function(bounds) {
			this.addOne(bounds);
		}, this);
	 	return this;
	},
	addOne: function(model_one_eleemnt) {
	// создаем новый дочерний вид
	    var view_one_element = new App.Views.Bound({ model: model_one_eleemnt });
	// добавляем его в корневой элемент
    	this.$el.append(view_one_element.render().el);
	},

	change_current_effect: function(eventObj) {
		var effect_id = $(eventObj.currentTarget).val();
		this.collection.each(function(model) {
			
			if (model.cid == effect_id) {
				model.set( { current: true, }, {silent: true} );
			} else {
				model.set( { current: false, }, {silent: true} );
			}

		}, this); 
		return this;
	},

});

// View of addition of new bounds in collection
App.Views.AddBound = Backbone.View.extend({
	
	initialize: function(options) {
		//console.log('initialize view of collection!');
		this.neuron_number = options.neuron_number;
		this.$effect_name = this.$el.find("input[name=\"effect_name\"]");
		this.$lowbound = this.$el.find("input[name=\"lowbound\"]");
		this.$upperbound = this.$el.find("input[name=\"upperbound\"]");
	},

	events: {
		'click .buttonForm': 'addBound',
	},
		
	addBound: function(eventObj) {
		eventObj.preventDefault();
		var name = this.$effect_name.val();
		var lowbound = parseFloat( this.$lowbound.val() );
		var upperbound = parseFloat( this.$upperbound.val() );
		var color = App.Funcs.getRandomColor();
		
		if ( isNaN (lowbound) ) {
			lowbound = Math.random() * 10;
		}

		if ( isNaN (upperbound) ) {
			upperbound  = lowbound + Math.random() * 10;
		}


		var new_bound = new App.Models.Bounds({
			"name": name,
			"lowbound": lowbound,
			"upperbound": upperbound,
			"color": color,
			"neuron_number": this.neuron_number,
		}, {validate: true});
		
		this.collection.add(new_bound);
		
	},
});

// set global properties for plots
App.globalPlotProperties = {  
	width: 850,    // длинна оси X в пикселях
	height: 200,   // длинна оси Y в пикселях
	shiftX: 50,    // оступ оси Х от левого и правого края в пикселях
	shiftY: 50,    // отступ оси Y от верхнего и нижнего края в пикселях
}

////////////////////////////////////////////////////////////////////////
$(document).ready(function() {

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
		success: App.Funcs.myCallback,
		error: function (recevedData) {
			alert ("Ajax query error! More details in console");
			console.log(recevedData);
		},
	});

});

