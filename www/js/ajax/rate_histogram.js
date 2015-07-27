/* myjs file */
window.App = {
	Models:{},
	Views:{},
	Collections:{},
};

App.Models.Bounds = Backbone.Model.extend({
		
		defaults: {
			name: 'Unnamed bounds',
			lowbound: 0,
			upperbound: 1,
		},
		
		validate: function(attrs) {
			console.log(attrs);
			if ( attrs.lowbound > attrs.upperbound ) {
				alert("Not valid!");
				return "Not valid";
			}
			
			if ( ! $.trim(attrs.name) ) {
				alert("Not valid name of effect!");
				return "Not valid";
			}
			
		},
});
////////////////////////////////////////////////////////////////////
// объявляем вид
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
// объявляем коллецию моделей
App.Collections.BoundsCol = Backbone.Collection.extend({
	model: App.Models.Bounds, 
});
// Оюъявляем вид коллекции границ
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

// Вид добавления новых границ
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
	xmlns: "http://www.w3.org/2000/svg",
	initialize: function() {
		console.log('initialize plot view of collection!');
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

////////////////////////////////////////////////////////////////////////
$(document).ready(function() {
	////////////////////////////////////////////////////////////////////
	// после того как все объявили пишем немного кода ))
	var b = new App.Collections.BoundsCol ([
		{name:"Effect 1", lowbound: 0.5, upperbound: 3},
		{name:"Effect 2", lowbound: 5, upperbound: 8},
		{name:"Effect 3", lowbound: 9.78, upperbound: 10.98},
	]);
	var b_view = new App.Views.Bounds ({
		collection:b, 
		// id_template: "bound_template",

	});
	b_view.render();
	$("table").append(b_view.el);
	
	var add_new_b = new App.Views.AddBound({collection:b});
	var plot_view_bounds = new App.Views.BoundsPlot({collection:b});

});
