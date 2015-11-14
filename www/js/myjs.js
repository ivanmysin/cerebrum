
$(document).ready(function(){
	// region local for ru
	$.datepicker.regional['ru'] = {
	closeText: 'Закрыть',
	prevText: '&#x3c;Пред',
	nextText: 'След&#x3e;',
	currentText: 'Сегодня',
	monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь',
	'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
	monthNamesShort: ['Янв','Фев','Мар','Апр','Май','Июн',
	'Июл','Авг','Сен','Окт','Ноя','Дек'],
	dayNames: ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],
	dayNamesShort: ['вск','пнд','втр','срд','чтв','птн','сбт'],
	dayNamesMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
	dateFormat: 'dd/mm/yy',
	firstDay: 1,
	isRTL: false
	};
	$.datepicker.setDefaults($.datepicker.regional['ru']);

	$('input.datepicker').datepicker({
		showOn: 'both',
		//buttonImageOnly: true,
		//buttonImage: '/images/026.png'
	});
	//////////////////////////////////////////////////////////
	
	//confirm delete
	$(".delete_ref").click(function(){
		var res = confirm("Подтвердите удаление");
		if(!res) return false;
	});
	///////////////////////////////////////////////////////

	$("#menu_of_linked_nodes .button_top_menu").submit(function(eventObj){
		var processed_html = $("#procc_container").html();
		var proc_html_input = "<textarea name=\"processed_html_code\" style=\"display:none;\"> " + processed_html + "</textarea>";
		// Тут нужно вставлять не во все, а только в одну !!!!!!!
		
		
		$(this).prepend(proc_html_input);
		var processedParams = JSON.stringify(App.params); // App.params - стуктура, которая хранит параметры, полученные от пользователя и предназначеные для отправления 
	                                                      //  на сервер как параметы  для запуска следующего скрипта
	                                                      
		var processedParamsHtmlCode =  "<textarea name=\"processed_params\" style=\"display:none;\"> " + processedParams + "</textarea>";
		$(this).prepend(processedParamsHtmlCode);
		
		var data = {
			'processing_node_id':  App.processing_node_id, 
			'registrated_path_id': App.registrated_path_id, 
			'parent_processing_node_id':App.parent_processing_node_id, 
			'regime': 'write',
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
		
		// return false;

	});
	/////////////////////////////////////////////////////////////////////////////////
	$(".adduser").click(function(eventObj){
		var input = $(this).siblings("input:last").clone().val("");
		$(this).before("</br>").before(input);
	});

	$(".deleteuser").click(function(eventObj) {
		var input = $(this).siblings("input");
		var br = $(this).siblings("br:last");
		if ($(input).length > 1) {
			$(br).remove();
			$(input).last().remove();
		}
	});

	////////////////////////////////////////////////////////////////////////////////
});
