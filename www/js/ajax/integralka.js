// Intergral plot js file


$(document).ready(function() {
	$("#load_form").click(function(){
		var data = {
			'processing_node_id': App.processing_node_id,
			'registrated_node_id':App.registrated_node_id,
			'parent_processing_node_id':App.parent_processing_node_id,
			'record_id': App.record_id,
			'regime': 'read',
			}; 
		$.ajax({
			url: App.server_script,  
			type: "GET",
			data: data,
			cache: false,
			dataType: "text",   
			success: function(returned){
				$("#procc_container").append(returned);
			},
			error: function (returned) {
				console.log("Error: " + returned);
			}
		});
		
		$("#procc_container").on('submit', '#client_params', get_plots_data);
		
		
	});
	
});

function get_plots_data (eventObj) {
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
		dataType: "text",
		success: function(data){
			console.log ("Data Loaded: " + data);
		}
	});
	console.log(url);
	//console.log ("Random var: " + Math.random());
	
	
}
