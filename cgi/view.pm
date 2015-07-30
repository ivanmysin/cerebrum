
# this is view 

use strict;
use warnings;
our %_getpost;
our $_session;



sub print_header {
	my $path = PATH;
	my $title = TITLE;
	my $cgi_path = GCI_SCRIPTS_DIR;
	print qq (
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>$title</title>
    <link rel="icon" href="/alv.gif" type="image/gif">
    <link rel="stylesheet" type="text/css" href="${path}css/reset.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/text.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/grid.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/layout.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/nav.css" media="screen" />
    
    <link rel="stylesheet" type="text/css" href="${path}css/jquery-ui.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/jquery-ui.structure.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/jquery-ui.theme.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="${path}css/jquery.svg.css" media="screen" />

    <link rel="stylesheet" type="text/css" href="${path}css/mystyles.css" media="screen" />
    
    <!--[if IE 6]><link rel="stylesheet" type="${path}text/css" href="css/ie6.css" media="screen" /><![endif]-->
    <!--[if IE 7]><link rel="stylesheet" type="text/css" href="${path}css/ie.css" media="screen" /><![endif]-->
    
    <!-- BEGIN: load jquery -->
    <script src="${path}js/jquery-2.1.4.min.js" type="text/javascript"></script>
    <script src="${path}js/jquery-ui.min.js" type="text/javascript"> </script>

	<script src="${path}js/jquery.svg/jquery.svg.min.js"></script>
	<script src="${path}js/jquery.svg/jquery.svganim.min.js"></script>
	<script src="${path}js/jquery.svg/jquery.svgdom.min.js"></script>
    

    <script src="${path}js/setup.js" type="text/javascript"></script>
	<script src="${path}js/myjs.js" type="text/javascript"></script>
	<script type="text/javascript"> window.cgi_path="${cgi_path}" </script>
	<script type="text/javascript">
		\$(document).ready(function(){
			setupLeftMenu();
			setSidebarHeight();
		});
	</script>
	<script type="text/javascript">
	    \$(window).load(function () {
            \$('#demo-side-bar').removeAttr('style');
	    });
	</script>

	<style type="text/css">
		#demo-side-bar{left:90%!important;display:block!important;}
		#branding .floatright{margin-right:130px!important;}
	</style>
</head>
<body>
	<!--Dynamically creates ads markup-->
    <div class="container_12">
        <div class="grid_12 header-repeat">
            <div id="branding">
                <div class="floatleft">
                    <img src="${path}img/logo1.png" alt="Logo" class="logotip_img" />
                </div>
                <p class="program_title"> Cerebrum </p>
                <div class="floatright">
                    <div class="floatleft">
                        <img src="${path}img/img-profile.jpg" alt="Profile Pic" />
                    </div>
                    <div class="floatleft marginleft10">
                        <ul class="inline-ul floatleft">
                            <li>Привет, Иван!</li>
                            <li><a href="#">Натройки профиля</a></li>
                            <li><a href="#">Выйти</a></li>
                        </ul>
                        <br />
                    </div>
                </div> <!-- .floatright -->
                <div class="clear"></div>
            </div> <!-- .branding -->
        </div> <!-- .grid_12 header-repeat-->
        <div class="clear"></div>
		);
}
########################################################################
sub print_top_menu {
	my $top_menu = shift @_;
	print
qq(
<!-- здесь заканчивается хедер и начинается верхнее меню !!!! -->
        <div class="grid_12">
            <ul class="nav main">
);   
    my @menu = @{$top_menu};     
	foreach my $menu (@menu) {
		if (@{$menu->{'sub'}} > 0) {
			print qq(		<li class="$menu->{'main'}{'class'}"><a href="javascript:"><span>$menu->{'main'}{'name'}</span></a>\n);
			my @sub= @{$menu->{'sub'}};
			print qq(		<ul>\n);
				foreach my $sub (@sub) {
					print qq(			<li><a href="$sub->{'reference'}" >$sub->{'name'}</a> </li>\n);
				}
				print qq(		</ul>\n		</li>\n);
		} else {
			print qq(		<li class="$menu->{'main'}{'class'}"><a href="$menu->{'main'}{'reference'}"><span>$menu->{'main'}{'name'}</span></a> </li>\n);
		
		}
		
	}
	print qq(                
            </ul> <!-- .nav main -->
        </div> <!-- .grid_12 -->
        <div class="clear"></div>
<!-- здесь заканчивается верхнее меню и начинается левый бар !!!!! -->
	);
	# print_arr($top_menu);
}
########################################################################
sub print_left_bar {
	my $left_bar = shift;
	my %menu = %{$left_bar};
	print 
qq (
        <div class="grid_2">
            <div class="box sidemenu">
                <div class="block" id="section-menu">
					<p class="menutitle">Группы животных</p>
                    <ul class="section menu">
						
);
	foreach my $key (%menu) {
		if (ref($key) eq "HASH" or ref($key) eq "ARRAY") {
			next;
		}; 
		if (defined ($menu{$key}{'sub'})) {
			print qq(			<li><a class="menuitem" href="#">$menu{$key}{'main'}{'name'}</a>\n);
			my @sub = @{$menu{$key}{'sub'}};
			print qq(				<ul class="submenu">\n);

			for (my $i=0; $i<@sub; $i++) {
				my $name =  $sub[$i]->{'name'};
				print qq(					<li><a href="#">$name</a> </li>\n);

			}
			print qq(				</ul>\n);
		} else {
			print qq(			<li><a class="menuitem" href="#">$menu{$key}{'main'}{'name'}</a>\n);
		}
		
	}
	print qq(					
                    </ul> <!-- .section menu -->
                </div> <!-- .block, #section menu-->
            </div> <!-- .box sidemenu -->
        </div> <!-- .grid_2 -->
	);
}
########################################################################
sub print_home {
	my $home_data = shift;
	my $path = PATH;
	print qq (
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2>${$home_data}[0]->{'series_name'}</h2>
            <div class="box round first">
				<table class="data display datatable" style="margin-top: 10px; width:200px; float:left">
					<thead style="text-align:left">
						<tr>
							<th>Название записи</th>
							<th>Группа</th>
						</tr>
					</thead>
					<tbody>
	);
	my $previous_group = ${$home_data}[0]->{'group_name'};
	print qq(		<tr class="odd gradeX">
						<td colspan="2" class="group_name_at_home">$previous_group</td>
					</tr>
	);
	foreach my $t (@{$home_data}) {
		if ($previous_group ne $t->{'group_name'}) {
			print qq(		<tr>
								<td colspan="2" class="group_name_at_home">$t->{'group_name'}</td>
							</tr>);
		}
		print qq(		<tr class="odd gradeX">\n);
		print qq(			<td><a href="?view=processing&record_id=$t->{'records_id'}&record_name=$t->{'record_name'}" class="goToProcessing">$t->{'record_name'}</a></td>\n);
		print qq(			<td>$t->{'group_name'}</td>\n);
		print qq(		</tr>);
		$previous_group = $t->{'group_name'};
	};
	print qq(
					</tbody>
				</table>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->
    <div class="clear"></div>
	);
}
########################################################################
sub print_footer {
	print qq (
		</div>
	</div>	
    <!--  Отсюдова начинается подвал сайта!!!!! -->	
	<div class="clear"></div>
    <div id="site_info">
        <p>
            Copyright <a href="#">Mysin Ivan</a>. Все права защищены.
        </p>
    </div>
    <!--wrapper end-->
	<!--Dynamically creates analytics markup-->


</body>
</html>
);
}
########################################################################
sub print_add_record {
	my $data = shift;
	my $path = PATH;
	my $main_script = ENTER_POINT;
	print qq (
	<script src="${path}js/ckeditor/ckeditor.js"></script>
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2>Редактирование записи</h2>
				<div class="block">
                    <form method="POST" action="$main_script" enctype="multipart/form-data">
                    <table class="form">
                        <tr>
                            <td class="col1">
                                <label> Название записи </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="grumble" name="record_name" />
                            </td>
                        </tr>

						<tr>
                            <td class="col1">
                                <label> Дата записи </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="datepicker" name="date"  />
                            </td>
                            <script>
                            \$.datepicker.regional["ru"];
  							 \$(function() {
								\$( "#datepicker" ).datepicker({ dateFormat: 'dd/mm/yy'});
							});
							</script>
                        </tr>	  

                        <tr>
                            <td>
                                <label>Пол животного</label>
                            </td>
                            <td>
                                <input type="radio" name="sex" value="male" checked/>
                                Male
                                <input type="radio" name="sex" value="female"/>
                                Female
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label> Выберите эксперимнтальную серию </label>
                            </td>
                            <td>
                                <select id="select" name="series"  style="width: 300px">
                            );
	
	foreach my $ser(@{$data}) {
		print qq(		<optgroup label="$ser->{'name'}">\n);
			foreach my $group (@{$ser->{'sub'}}) {
				if ($ser->{'current'} == 1 and $group->{'current'} == 1) {
					print qq(<option value="$ser->{'series_id'}|$group->{'id'}" selected> $group->{'name'}</option>);
				} else {
					print qq(<option value="$ser->{'series_id'}|$group->{'id'}"> $group->{'name'}</option>);
				}
			 
		}
		print qq(		</optgroup> \n );
	};
                            
    print qq(                                
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label>Файл с записью </label>
                            </td>
                            <td>
								<input type="file" name="file">
                            </td>
                        </tr>

                        <tr>
                            <td style="vertical-align: top; padding-top: 9px;">
                                <label> Замечания к записи </label>
                            </td>
                            <td>
                                <textarea id="editor1" rows="10" cols="45" name="description"></textarea>
                                <script> CKEDITOR.replace('editor1');</script>
                            </td>
                            
                        </tr>
						<tr>
							<td>
							</td>
							<td>
								<input type="hidden" name="view" value="added_record">
								<input type="submit" value="Отправить" >
							</td>
						</tr>
						<br/>
						</table>
                    </form>
                </div>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->

    <div class="clear"></div>
	);
}
########################################################################
sub print_add_group {
	my $add_group = shift;
	my $path = PATH;
	print qq (
	<script src="${path}js/ckeditor/ckeditor.js"></script>
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2>Добавление новой экспериментальной группы</h2>
				<div class="block">
                    <form mathod="POST">
                    <table class="form">
                        <tr>
                            <td class="col1">
                                <label> Название группы </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="grumble" name="group_name"/>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label> Выберите эксперимнтальную серию </label>
                            </td>
                            <td>
                                <select id="select" name="series"  style="width: 300px">
                            );

	foreach my $ser (@{$add_group}) {
		if ($ser->{'current'} == 1) {
			print qq(<option value="$ser->{'series_id'}" selected> $ser->{'name'}</option>\n);
		} else {
			print qq(<option value="$ser->{'series_id'}"> $ser->{'name'}</option>\n);
		}
	};
    print qq(                                
                                </select>
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="col1">
                                <label> Установить данную группу текущей </label>
                            </td>
                            <td class="col2">
                                <input type="checkbox" name="current" checked/>
                            </td>
                        </tr>

                        <tr>
                            <td style="vertical-align: top; padding-top: 9px;">
                                <label> Замечания к записи </label>
                            </td>
                            <td>
                                <textarea id="editor1" rows="10" cols="45" name="description"></textarea>
                            </td>
                            <script>
								 CKEDITOR.replace('editor1');
							</script>
                        </tr>
						<tr>
							<td>
							</td>
							<td>
								<input type="hidden" name="view" value="added_group">
								<input type="submit" value="Отправить" >
							</td>
						</tr>
						<br/>
						</table>
                    </form>
                </div>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->

    <div class="clear"></div>
	);
}
########################################################################
sub print_add_seria {
	my $add_seria = shift;
	my $path = PATH;
	print qq (
	<script src="${path}js/ckeditor/ckeditor.js"></script>
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2> Добавление новой экспериментальной серии </h2>
				<div class="block">
                    <form mathod="POST">
                    <table class="form">
                        <tr>
                            <td class="col1">
                                <label> Название серии </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="grumble" name="seria_name"/>
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="col1">
                                <label> Установить данную серию текущей </label>
                            </td>
                            <td class="col2">
                                <input type="checkbox" name="current" checked/>
                            </td>
                        </tr>

                        <tr>
                            <td style="vertical-align: top; padding-top: 9px;">
                                <label> Замечания к записи </label>
                            </td>
                            <td>
                                <textarea id="editor1" rows="10" cols="45" name="description"></textarea>
                            </td>
                            <script>
								 CKEDITOR.replace('editor1');
							</script>
                        </tr>
						<tr>
							<td>
							</td>
							<td>
								<input type="hidden" name="view" value="added_seria">
								<input type="submit" value="Отправить" >
							</td>
						</tr>
						<br/>
						</table>
                    </form>
                </div>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->

    <div class="clear"></div>
	);
}
########################################################################
sub print_records {
	my $records = shift;
	print qq (
	<div class="grid_10">
            <div class="box round first grid">
                <h2>Все записи</h2>
                <div class="block">
                    <table class="data display datatable" id="example">
					<thead style="text-align:left">
						<tr>
							<th>ID записи</th>
							<th>Название записи</th>
							<th>Дата</th>
							<th>Серия</th>
							<th>Группа</th>
							<th>Комментарии</th>
							<th>Редактировать</th>
							<th>Удалить</th>
						</tr>
					</thead>
					<tbody>
	);
	foreach my $t (@{$records}) {
		print qq(		<tr class="odd gradeX">\n);
		print qq(			<td>$t->{'records_id'}</td>\n);
		print qq(			<td>$t->{'name'}</td>\n);
		print qq(			<td>$t->{'date'}</td>\n);
		print qq(			<td>$t->{'series_name'}</td>\n);
		print qq(			<td>$t->{'group_name'}</td>\n);
		print qq(			<td>$t->{'description'}</td>\n);
		print qq(			<td><a href="?view=edit_record&record_id=$t->{'records_id'}" class="edit_ref">Редактировать</a></td>\n);
		print qq(			<td><a href="?view=delete_record&record_id=$t->{'records_id'}" class="delete_ref">Удалить</a></td>\n);
		print qq(		</tr>);
	};
	print qq(
					</tbody>
				</table>
                </div>
            </div>
        </div>
        <div class="clear"></div>
    </div>
    <div class="clear"> </div>
	);
}
########################################################################
sub print_groups {
	my $groups = shift;
		print qq (
	<div class="grid_10">
            <div class="box round first grid">
                <h2>Все записи</h2>
                <div class="block">
                    <table class="data display datatable" id="example">
					<thead style="text-align:left">
						<tr>
							<th>ID группы</th>
							<th>Название группы</th>
							<th>Серия</th>
							<th>Комментарии</th>
							<th>Редактировать</th>
							<th>Удалить</th>
						</tr>
					</thead>
	
					<tbody>
						
	);
	foreach my $t (@{$groups}) {
		print qq(		<tr class="odd gradeX">
							<td>$t->{'id'}</td>
							<td>$t->{'name'}</td>
							<td>$t->{'series_name'}</td>
							<td>$t->{'description'}</td>
							<td><a href="?view=edit_group&group_id=$t->{'id'}" class="edit_ref">Редактировать</a></td>
							<td><a href="?view=delete_group&group_id=$t->{'id'}" class="delete_ref">Удалить</a></td>
					</tr>);
	};
	print qq(
					</tbody>
					</table>
                </div>
            </div>
        </div>
        <div class="clear"></div>
    </div>
    <div class="clear"> </div>
	);
}
########################################################################
sub print_series {
	my $series = shift;
		print qq (
	<div class="grid_10">
            <div class="box round first grid">
                <h2>Все записи</h2>
                <div class="block">
                    <table class="data display datatable" id="example">
					<thead style="text-align:left">
						<tr>
							<th>ID серии</th>
							<th>Название серии</th>
							<th>Комментарии</th>
							<th>Редактировать</th>
							<th>Удалить</th>
						</tr>
					</thead>
	
					<tbody>
						
	);
	foreach my $t (@{$series}) {
		print qq(		<tr class="odd gradeX">\n);
		print qq(			<td>$t->{'series_id'}</td>\n);
		print qq(			<td>$t->{'name'}</td>\n);
		print qq(			<td>$t->{'description'}</td>\n);
		print qq(			<td><a href="?view=edit_seria&series_id=$t->{'series_id'}" class="edit_ref">Редактировать</a></td>\n);
		print qq(			<td><a href="?view=delete_seria&series_id=$t->{'series_id'}" class="delete_ref">Удалить</a></td>\n);
		print qq(		</tr>);
	};
	print qq(
					</tbody>
					</table>
                </div>
            </div>
        </div>
        <div class="clear"></div>
    </div>
    <div class="clear"> </div>
	);
}
########################################################################
sub print_edit_record {
	my $record = shift;
	my $groups = shift;
	my $series = shift;
	my $path = PATH;
	print qq (
	<script src="${path}js/ckeditor/ckeditor.js"></script>
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2>Редактирование записи</h2>
				<div class="block">
                    <form mathod="POST">
                    <table class="form">
                        <tr>
                            <td class="col1">
                                <label> Название записи </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="grumble" name="record_name" value="$record->{'name'}"/>
                            </td>
                        </tr>

						<tr>
                            <td class="col1">
                                <label> Дата записи </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="datepicker" name="date" value="$record->{'date'}" />
                            </td>
                            <script>
                            \$.datepicker.regional["ru"];
  							 \$(function() {
								\$( "#datepicker" ).datepicker({ dateFormat: 'dd/mm/yy'});
							});
							</script>
                        </tr>	  

                        <tr>
                            <td>
                                <label>Пол животного</label>
                            </td>
                            <td>
                                <input type="radio" name="sex" value="male" checked/>
                                Male
                                <input type="radio" name="sex" value="female"/>
                                Female
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label> Выберите эксперимнтальную серию </label>
                            </td>
                            <td>
                                <select id="select" name="series"  style="width: 300px">
                            );
	
	foreach my $ser (@{$series}) {
		print qq(		<optgroup label="$ser->{'name'}">\n);
			foreach my $group (@{$groups}) {
				if ($group->{'parent_seria_id'} ne $ser->{'series_id'}) {
					next;
				};
				if ($record->{'sub_series_id'} == $group->{'id'} and $record->{'series_id'} == $ser->{'series_id'}) {
					print qq(<option value="$ser->{'series_id'}|$group->{'id'}" selected> $group->{'name'}</option>);
				} else {
					print qq(<option value="$ser->{'series_id'}|$group->{'id'}"> $group->{'name'}</option>);
				}
			 
		}
		print qq(		</optgroup> \n );
	};
                            
    print qq(                                
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label>Файл с записью заменить нельзя</label>
                            </td>
                            <td>
                            </td>
                        </tr>

                        <tr>
                            <td style="vertical-align: top; padding-top: 9px;">
                                <label> Замечания к записи </label>
                            </td>
                            <td>
                                <textarea id="editor1" rows="10" cols="45" name="description">$record->{'description'}</textarea>
                            </td>
                            <script>
								 CKEDITOR.replace('editor1');
							</script>
                        </tr>
						<tr>
							<td>
							</td>
							<td>
								<input type="hidden" name="view" value="edited_record">
								<input type="hidden" name="record_id" value="$record->{'records_id'}">
								<input type="submit" value="Отправить" >
							</td>
						</tr>
						<br/>
						</table>
                    </form>
                </div>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->

    <div class="clear"></div>
	);
}
########################################################################
sub print_edit_group {
	my $group = shift;
	my $series = shift;
	my $path = PATH;
	print qq (
	<script src="${path}js/ckeditor/ckeditor.js"></script>
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2>Редактирование экспериментальной группы</h2>
				<div class="block">
                    <form mathod="POST">
                    <table class="form">
                        <tr>
                            <td class="col1">
                                <label> Название группы </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="grumble" name="group_name" value="$group->{'name'}"  />
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label> Выберите эксперимнтальную серию </label>
                            </td>
                            <td>
                                <select id="select" name="series"  style="width: 300px">
                            );
	foreach my $ser (@{$series}) {
		if ($ser->{'series_id'} == $group->{'parent_seria_id'}) {
			print qq(<option value="$ser->{'series_id'}" selected> $ser->{'name'}</option>\n);
		} else {
			print qq(<option value="$ser->{'series_id'}"> $ser->{'name'}</option>\n);
		}
	};
    print qq(                                
                                </select>
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="col1">
                                <label> Установить данную группу текущей </label>
                            </td>
                            <td class="col2">);
    if ($group->{'current'} == 1) {                        
        print qq(                        <input type="checkbox" name="current" checked/> \n);
    } else {
		print qq(                        <input type="checkbox" name="current" /> \n);
	}                            
    print qq(                        </td>
                        </tr>

                        <tr>
                            <td style="vertical-align: top; padding-top: 9px;">
                                <label> Замечания к записи </label>
                            </td>
                            <td>
                                <textarea id="editor1" rows="10" cols="45" name="description">$group->{'description'}</textarea>
                            </td>
                            <script>
								 CKEDITOR.replace('editor1');
							</script>
                        </tr>
						<tr>
							<td>
							</td>
							<td>
								<input type="hidden" name="view" value="edited_group">
								<input type="hidden" name="group_id" value="$group->{'id'}">
								<input type="submit" value="Отправить" >
							</td>
						</tr>
						<br/>
						</table>
                    </form>
                </div>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->

    <div class="clear"></div>
	);
}
########################################################################
sub print_edit_seria {
	my $seria = shift;
	my $path = PATH;
	print qq (
	<script src="${path}js/ckeditor/ckeditor.js"></script>
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2>Редактирование экспериментальной серии</h2>
				<div class="block">
                    <form mathod="POST">
                    <table class="form">
                        <tr>
                            <td class="col1">
                                <label> Название серии </label>
                            </td>
                            <td class="col2">
                                <input type="text" id="grumble" name="seria_name" value="$seria->{'name'}" />
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="col1">
                                <label> Установить данную серию текущей </label>
                            </td>
                            <td class="col2">
    );  
    if ($seria->{'current'} == 1) {
		print qq (				<input type="checkbox" name="current" checked/> \n);
	} else {
		print qq (				<input type="checkbox" name="current" /> \n);
	};                     
    print qq( 
                            </td>
                        </tr>

                        <tr>
                            <td style="vertical-align: top; padding-top: 9px;">
                                <label> Замечания к записи </label>
                            </td>
                            <td>
                                <textarea id="editor1" rows="10" cols="45" name="description">$seria->{'description'}</textarea>
                                <script>CKEDITOR.replace('editor1');</script>
                            </td>
                        </tr>
						<tr>
							<td>
							</td>
							<td>
								<input type="hidden" name="view" value="edited_seria">
								<input type="hidden" name="series_id" value="$seria->{'series_id'}">
								<input type="submit" value="Отправить" >
							</td>
						</tr>
						<br/>
						</table>
                    </form>
                </div>
            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->
    <div class="clear"></div>
	);
}
########################################################################
sub print_default {
	my $path = PATH;
	print qq (
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
        <div class="grid_10">
            <div class="box round first">
                <h2> Неизвестная страница </h2>
					<div style="height:300px; padding: 50px; font-size: 16px;"> 
						Запрашиваемой страницы в приложении нет! </br>
						Вы можете перейти на главную страницу по этой <a href="$path"> ссылке </a>
					</div>

            </div>
        <div class="clear"></div>
    </div> <!-- .container_12 -->

    <div class="clear"></div>
	);
}
########################################################################
sub print_processing {
	my $processing = shift;
	my $registrated_data = shift;
	my $targets = shift;
	my $parent_processing_node_id = shift;
	my $record_id = shift;
	
	my $html_code = $registrated_data->{'html_code'};
	my $server_script = MUDULES_CONTROLLER;
	my $js_file = JS_FOR_MODULS_DIR.$registrated_data->{'js_file'};
	my $css_file = CSS_FILES_MODULES_DIR.$registrated_data->{'css_file'};

	#my $js_dir = JS_FOR_MODULS_DIR;
	print qq(
	<!-- Тута заканчивается левый бар и начинается оснавная часть !!!!  -->
    <div class="grid_10">
        <div class="box round first">
            <h2>Обработка записи: <i>$processing->{'record_name'}</i>. Текущая стадия обработки: <i>$processing->{'module_name'} </i> </h2>
            <link rel="stylesheet" type="text/css" href="$css_file" media="screen" />
			<script type="text/javascript">
				window.App = {}; // Global structure for all global vars of application
				App.server_script = "$server_script";
				App.processing_node_id = $processing->{'id'};
				App.registrated_node_id = $processing->{'id_registrated_node'};
				App.parent_processing_node_id = $parent_processing_node_id;
				App.record_id = $record_id;
				App.params = {};   // structure for sending parameters to server in json format
			</script>
			<div id="menu_of_linked_nodes">
	);
	
	foreach my $t (@{$targets}) {
		print qq (
			<form class="button_top_menu" method="POST">
				<input type="hidden" name="processing_node_id" value="$processing->{'id'}"   />
				<input type="hidden" name="registrated_node_id" value="$t->{'id'}"   />
				<input type="hidden" name="parent_processing_node_id" value="$parent_processing_node_id" />
				<input type="hidden" name="view" value="processing"   />
				<button class="btn btn-teal node_button" type="submit"> $t->{'name'} </button>
			</form>		
		
		);
	}
	
	
    print qq (
			</div> <!-- #menu_of_linked_nodes -->
			</br>
            <div id="procc_container">

				$html_code
            
            </div> <!-- #procc_container -->
            <script src="$js_file" type="text/javascript"></script>

	);
	
	# &print_arr ($targets);
	
	print qq(
		</div> <!-- .box round first-->
	</div>	<!-- .grid_10 -->
	);
}
# <script type="text/javascript">var record_id=$record_id;</script>	

########################################################################
1;
