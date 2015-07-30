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

	make_plots: function (recevedData) {
		$("#procc_container .svg_container").css("display", "inline");

		//console.log(JSON.stringify(recevedData));

		var plotsCollections = new App.Collections.RatePlots([]);


		for (var i=0; i<recevedData.length-1; i++) {    
			// cycle for channels
			var ch_data = recevedData[i].plots;
			for (var j=0; j<ch_data.legth-1; j++) {
				// cycle for each neoron in channel
				if (typeof (ch_data[j].rate_by_bins) !== 'undefined' ) {
					var plot_by_bins = new App.Models.RatePlot (ch_data[j].rate_by_bins);
					plot_by_bins.set("channel_ind", i);
					plot_by_bins.set("neuron_ind", j);
					plotsCollections.add(plot_by_bins);

				}
				
				if (typeof (ch_data[j].momentary_rate) !== 'undefined' ) {
					var moment_plot = new App.Models.RatePlot (ch_data[j].momentary_rate);
					moment_plot.set("channel_ind", i);
					moment_plot.set("neuron_ind", j);
					plotsCollections.add(moment_plot);
				}
			}; 
		};


		var bnd = new App.Collections.BoundsCol ([]);           // collection of bounds

		var bnd_view = new App.Views.Bounds ({                  // view of collection bnd
			collection: bnd, 
			
		});

		// bnd_view.render();   // render collection bnd
		// $("table").append(bnd_view.el);  // and add it to html code
		
		var add_new_bnd = new App.Views.AddBound({collection:bnd}); // view of addition bound
		var plot_view_bounds = new App.Views.BoundsPlot({collection:bnd}); // plot view of collection

	},




};
///////////////////////////////////////////////////////////////////////
// declare model for plot data
App.Models.RatePlot = Backbone.Model.extend({
	defaults: {
		plot_label: 'Plot',
		y_labele: 'Y vals',
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
App.Collections.RatePlots = Backbone.Model.extend({
	model: App.Models.RatePlot,
});


App.Views.RatePlot = Backbone.View.extend({

	events: {},
	$el: ".outSvg",
	initialize: function() {
		this.model.on('change', this.render, this); 
	},

	render: function() {
		var svg_code = this.getSVGplot();
		this.$el.html(svg_code);
		return this;
	},
	getSVGplot: function  () {

		// Перкладываем все переменные в локальные для удобства
		var width  = App.globalPlotProperties.width;
		var height = App.globalPlotProperties.height;
		var shiftX = App.globalPlotProperties.shiftX;
		var shiftY = App.globalPlotProperties.shiftY;
		
		var minX = this.minX;
		var maxX = this.maxX;
		var minY = this.minY;
		var maxY = this.maxY;
		var x = this.x_vals;
		var y = this.y_vals;
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

		var ngridX = (maxX - minX) / this.binGridX;
		var grid_x = minX; // !!! Тут можно сделать так, чтоб grid_x начиналась с ближайшего (минимума - шаг решетки)
		for (var i=0; i<ngridX; i++) {
			var xSVG = plot_to_svg_x(grid_x, width, minX, maxX);         // (grid_x - minX)*width/(maxX - minX);
			gridX += " M " + xSVG + " " + height + " ";
			gridX += " V " + (height - 5);
			labeleGridX += "<text x=\"" + (xSVG + shiftX - 3) + "\" y=\"" + (height + shiftY + 18) + "\" class=\"notesY\" >" + grid_x.toFixed(nGridDigits) + "</text> \n";
			grid_x += this.binGridX;
			noteGridX += grid_x;
		}
		gridX += "\"  class=\"gridDash\" />\n ";
		var ngridY = (maxY - minY) / this.binGridY;
		var grid_y = minY;
		for (var i=0; i<=ngridY; i++) {
			var ySVG = (height - (grid_y - minY) * height/(maxY - minY));
			gridY += " M 0 " + ySVG;
			gridY += " H 5 ";
			labeleGridY += "<text x=\"" + (shiftX - 25) + "\" y=\"" + (ySVG + shiftY + 3) + "\" class=\"notesY\" >" + grid_y.toFixed(nGridDigits) + "</text> \n"
			grid_y += this.binGridY;
		}
		gridY += " \" class=\"gridDash\" />\n ";
		
		// form svg code
		var svg = "<svg width=\"" + (width + 2*shiftX) + "px\" height=\"" + (height + 2*shiftY) + "px\" class=\"outSVG\"> \n";
		svg += "<text x=" + (shiftX + (width + this.title.length)/2) + " y=" + (shiftY - 30) + " class=\"plotTitle\" >" + this.title + "</text> \n";
		
		// add inside svg
		svg += "<svg x=\"" + shiftX + "px\" y=\"" + shiftY + "px\" width=\"" + width + "px\" height=\"" + height + "px\" viewBox=\"0 0 " + width + " " + height + "\"  class=\"innerSvg\" > \n";
		svg += "<rect x=0 y=0 width=" + width + " height=" + height + " class=\"frame\" /> \n";
		svg += "<polyline points=\"" + points + "\" class=\"linePlot\" /> \n ";
		svg += gridX + gridY;
		svg += "</svg>\n";

		// add labels
		svg += "<text x=" + (shiftX + (width + this.Xtitle.length)/2) + " y=" + (height + shiftY + 35) + "  class=\"Xtitle\" > " + this.Xtitle + "</text> \n";
		svg += "<text x=" + 2 + " y=" + (shiftY - 10) + " class=\"Ytitle\"> " + this.Ytitle + " </text> \n"; //
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
	roundPlus: function (x, n) { //x - число, n - количество знаков
	  if(isNaN(x) || isNaN(n)) return false;
	  var m = Math.pow(10,n);
	  return Math.round(x*m)/m;
	},
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

	/* Тут нужно вставить другие функции работы с графиками (масштабирование и т.д.) */



}); 



///////////////////////////////////////////////////////////////////////
// declare model for one paire of bounds
App.Models.Bounds = Backbone.Model.extend({
	defaults: {
		name: 'Unnamed bounds',
		lowbound: 0,
		upperbound: 1,
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

	initialize: function() {
		this.model.on('change', this.render, this); 
		this.model.on('destroy', this.deleteBoundFromView, this);
	},

	id_template: "#bound_template",	
	render: function() {
		var template = _.template( $(this.id_template).html() );
		//this.$el.html( this.template( this.model.toJSON() ) );
		this.$el.html(template( this.model.toJSON() ));
		return this;
	},

	events: {
		'click .edit': 'editName',
		'click .delete': 'destroy',
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
	//	className: 'bound_table',
	//	id: 'some-bound',	
		
	initialize: function() {
		//console.log('initialize view of collection!');
		this.collection.on('add', this.addOne, this);
	},
	render: function() {
		this.collection.each(function(bounds) {
			this.addOne(bounds);
			// var boundsView = new App.Views.Bound ({model: bounds});
			// this.$el.append(boundsView.render().el);
		}, this);
	 	return this;
	},
	addOne: function(model_one_eleemnt) {
	 // создаем новый дочерний вид
	    var view_one_element = new App.Views.Bound({ model: model_one_eleemnt });
	// добавляем его в корневой элемент
    	this.$el.append(view_one_element.render().el);
	},
});

// View of addition of new bounds in collection
App.Views.AddBound = Backbone.View.extend({
	el: '#addBound',

	events: {
		'click .buttonForm': 'addBound',
	},
		
	addBound: function(eventObj) {
		var effect_name = $(eventObj.currentTarget).siblings("input[name=\"name\"]").val();
		var lowbound = $(eventObj.currentTarget).siblings("input[name=\"lowbound\"]").val();
		var upperbound = $(eventObj.currentTarget).siblings("input[name=\"upperbound\"]").val();
	
		var new_bound = new App.Models.Bounds({name: effect_name, lowbound: lowbound, upperbound: upperbound}, {validate: true});
		this.collection.add(new_bound);
		eventObj.preventDefault();
	},
});
// Вид для отрисовки границ на графике
App.Views.BoundsPlot = Backbone.View.extend({
	el: $("#outSvg"),
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
	width: 1200,    // длинна оси X в пикселях
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

