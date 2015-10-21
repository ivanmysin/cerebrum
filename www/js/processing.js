// processing js
$(document).ready(function() {

	$(".save_processed_node").submit( function (eventObj) {
		eventObj.preventDefault();
		
		var processed_html = $("#procc_container").html();
	    $(this).find("textarea[name=processed_html_code]").text(processed_html);
		
		var processedParams = JSON.stringify(App.params);
		$(this).find("textarea[name=processed_params]").html(processedParams);
					
		var data = {
			'processing_node_id':  App.processing_node_id, 
			'registrated_path_id': App.registrated_path_id,
			'parent_processing_node_id':App.parent_processing_node_id, 
			'regime': 'save',
			'processed_params': processedParams,
			'record_id': App.record_id,
		}; 
					
		$.ajax({
			url: App.server_script,  
			type: 'get',
			data: data,
			cache: false,
			dataType: "text",
			obj: eventObj,   
				success: function(returned) {
					if (returned != "success") {
						console.log(returned); 
					};
				},				
				error: function(returned) {
					console.log(returned); 
						alert('Произошла ошибка при запросе на сервере (Подробности в консоли)');
					},
		});
		
		data = $(this).serialize();
		$.post (path, data).done(function( reseved ) {
    				console.log( "Data Loaded: " + reseved );
  				});
		return false;
					
		}
	);

})