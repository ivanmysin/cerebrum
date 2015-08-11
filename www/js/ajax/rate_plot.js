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
			'registrated_node_id':App.registrated_node_id,
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

		//console.log(JSON.stringify(recevedData));

		//var plotsCollections = new App.Collections.RatePlots([]);

		var main_arr = new Array();     // Массив все данных о всех нейронах

		var i=0; //for (var i=0; i<recevedData.length-1; i++) {    
			// cycle for channels
			var ch_data = recevedData[i].plots;
			var j=0; //for (var j=0; j<ch_data.legth-1; j++) {
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
				var neuron_struct = {};                                   // Структура, которая содержит все данные о нейроне на данном канале
				
				var svg_contaner = $(inserted_el).find(".svg_container");

				var bnd = new App.Collections.BoundsCol ([                                   // create collection of bounds
					{
						name: "Effect 1",
						lowbound: 1,
						upperbound:2,
						color: App.Funcs.getRandomColor(),
					},
					{
						name: "Effect 2",
						lowbound: 12,
						upperbound:23,
						color: App.Funcs.getRandomColor(),
					},
					{
						name: "Effect 3",
						lowbound: 5,
						upperbound:6,
						color: App.Funcs.getRandomColor(),
					},


				]);                                 
				
				var bnd_view = new App.Views.Bounds ({                                        // create view of collection bnd
					collection: bnd,
					el: $(inserted_el).find("table.boundTable"),
				});                     


				var add_new_bnd = new App.Views.AddBound({                                    // view of addition bounds
					collection:bnd,
					el: $(inserted_el).find("form.add_bounds"),
				});    




				if (typeof (ch_data[j].rate_by_bins) !== 'undefined' ) {
					var plot_by_bins = new App.Models.RatePlot (ch_data[j].rate_by_bins);   // Создаем модель интегралки по бинам
					plot_by_bins.set("channel_ind", i);
					plot_by_bins.set("neuron_ind", j);
					neuron_struct.plot_by_bins = plot_by_bins;                              // Добавляем эту модель в набор данных о нейроне 
        
        			$(svg_contaner).append("<div class=\"one_plot\"></div>");
					var new_el = $(inserted_el).find(".one_plot:last");
					var plot_by_bins_view = new App.Views.RatePlot({                        // Создаем вид этой модели
						model: plot_by_bins,
						el: $(new_el),
						effects_collection: bnd,
					}); 

					neuron_struct.plot_by_bins_view = plot_by_bins_view;                    // Добавляем этот вид в набор данных о нейроне 
					
				}
				
				if (typeof (ch_data[j].momentary_rate) !== 'undefined' ) {
					var moment_plot = new App.Models.RatePlot (ch_data[j].momentary_rate);   // Создаем модель интегралки мгновенной скорости
					moment_plot.set("channel_ind", i);
					moment_plot.set("neuron_ind", j);
					neuron_struct.moment_plot = moment_plot;                                 // Добавляем эту модель в набор данных о нейроне 
					
					
					$(svg_contaner).append("<div class=\"one_plot\"></div>");
					var new_el = $(svg_contaner).find(".one_plot:last");
					
					// Создаем вид этой модели
					var moment_plot_view = new App.Views.RatePlot({
						model:moment_plot,
						el: $(new_el),
						effects_collection: bnd,
					});    

					neuron_struct.moment_plot_view = moment_plot_view;                       // Добавляем этот вид в набор данных о нейроне 
				}


				// var plot_view_bounds = new App.Views.BoundsPlot({collection:bnd});         // plot view of collection

//				neuron_struct.bnd = bnd;
//				neuron_struct.bnd_view = bnd_view;
//				neuron_struct.add_new_bnd= add_new_bnd;
				main_arr.push(neuron_struct);   // Добавляем данные о нейроне в общий массив
			//}; 
		//};
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
		"click .outSVG": "change_bound",
       
	},


	initialize: function(options) {
		this.effects_collection = options.effects_collection;
		
		this.render();
		this.model.on('change', this.renderPlot, this);
		this.effects_collection.on('change', this.renderBounds, this);


		this.svg_el = this.$el.find("div.svg_wrapper");
		this.minYvalue = this.$el.find(".minYvalue");
		this.maxYvalue = this.$el.find(".maxYvalue");
		this.navigationX = this.$el.find(".stepNavigation");
		this.scalingCoef = this.$el.find(".scalingCoef");
		this.startX = this.$el.find(".startTimeWindow");
		this.endX = this.$el.find(".endTimeWindow");
		this.navigationY = this.$el.find(".stepY");
		this.scalingCoefY = this.$el.find(".scalingCoefY");
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
	change_bound: function(eventObj) {
		
		var shiftX = App.globalPlotProperties.shiftX;
		var width = App.globalPlotProperties.width;
		var minX = parseFloat( this.model.get("minX") );
		var maxX = parseFloat( this.model.get("maxX") );


		var xClick = eventObj.pageX - $(eventObj.currentTarget).offset().left - shiftX; // 
	    var yClick = eventObj.pageY - $(eventObj.currentTarget).offset().top - App.globalPlotProperties.shiftY;  //
		
		var plotX = this.svg_to_plot_x(xClick, width, minX, maxX);

		this.effects_collection.each(function(effect) {
			
			if ( effect.get("current") ) {
			
				effect.set( {"lowbound": plotX, } );
			
			};
			
		}, this);


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
			
			var lowboundSvg = this.plot_to_svg_x( parseFloat( effect.get( "lowbound") ), width, minX, maxX );
			var upperboundSvg = this.plot_to_svg_x( parseFloat( effect.get("upperbound") ), width, minX, maxX );

			bounds_effects += '<rect x="' + lowboundSvg + '" y="' + 0 + '" width="' + (upperboundSvg - lowboundSvg) + '" height="' + height + '" fill="' + effect.get("color");
			bounds_effects += '"  style="fill-opacity: ' + effect.get("opacity") + '" stroke="#000" stroke-width="3" class="' + effect.cid + '""></rect>';
				
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
//	el: '#addBound',
	
	initialize: function() {
		//console.log('initialize view of collection!');
		this.$effect_name = this.$el.find("input[name=\"effect_name\"]");
		this.$lowbound = this.$el.find("input[name=\"lowbound\"]");
		this.$upperbound = this.$el.find("input[name=\"upperbound\"]");
	},

	events: {
		'click .buttonForm': 'addBound',
	},
		
	addBound: function(eventObj) {
		var name = this.$effect_name.val();
		var lowbound = this.$lowbound.val();
		var upperbound = this.$upperbound.val();
	
		var new_bound = new App.Models.Bounds({name: name, lowbound: lowbound, upperbound: upperbound}, {validate: true});
		this.collection.add(new_bound);
		
		eventObj.preventDefault();
	},
});
// Вид для отрисовки границ на графике
App.Views.BoundsPlot = Backbone.View.extend({
	//el: $("#outSvg"),
	initialize: function() {
		//console.log('initialize plot view of collection!');
		//this.collection.on('add', this.addOne, this);
	},
	events: {
		'click': 'getNewBoundsVals',
	},
	getNewBoundsVals: function (eventObj) {
		var x_svg = eventObj.offsetX;
		this.collection.at(0).set("upperbound", x_svg);
		console.log(x_svg);
		// alert ("Клик по внешнему SVG!");
			
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
		'registrated_node_id':App.registrated_node_id,
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

