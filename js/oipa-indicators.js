
function OipaCompareSelection(main){
	this.left = [];
	this.left.cities = [];
	this.left.countries = [];
	this.left.regions = [];

	this.right = [];
	this.right.cities = [];
	this.right.countries = [];
	this.right.regions = [];

	this.indicators = [];

	if (main){
		this.url = new OipaUrl();
	}
}

var OipaCompare = {
	item1 : null,
	item2 : null,
	refresh_state : 0,
	refresh_comparison: function(){
		leftmap.map.setView(this.item1.latlng, 10);
		rightmap.map.setView(this.item2.latlng, 10);
		$("#compare-left-title").text(this.item1.name);
		$("#compare-right-title").text(this.item2.name);
	},
	randomize: function(){
		// get cities
		var left_cities = [];
		$("#left-cities-filters input").each(function(){
			left_cities.push($(this).val());
		});

		var right_cities = [];
		$("#right-cities-filters input").each(function(){
			right_cities.push($(this).val());
		});


		// choose 2 random ones
		var city_id_1 = get_random_city_within_selection(left_cities);
		var city_id_2 = get_random_city_within_selection(right_cities, city_id_1);

		var city_1 = leftmap.set_city(city_id_1);
		this.item1 = city_1;
		var city_2 = rightmap.set_city(city_id_2);
		this.item2 = city_2;
	}
}

function OipaIndicatorMap(){

	this.indicatordata = {};

	this.active_years = {};

	this.init = function(){

		// set current year
		this.selected_year = 2015;
	    $( "#map-slider-tooltip div" ).html(this.selected_year);
	    $( "#map-slider-tooltip" ).val(this.selected_year);
	    $( "#year-" + this.selected_year).addClass("active");

	}

	this.refresh = function(data){

		if(!data){
			// indicatordata = {};
			// for (var k in this.selection.indicators) {
			// 	var curkey = this.selection.indicators[k].id;
			// 	if(this.selection.indicators[k].selection_type){
			// 		curkey += this.selection.indicators[k].selection_type;
			// 	}
			// 	indicatordata[curkey] = {};
			// }

			this.clear_circles();

			// get url
			var url = this.get_url();
			// get data
			this.get_data(url);
		} else {

			// // set the indicator data
			// indicatordata[k] = data[k];
			
			// // if not all keys are set yet, do nothing, else load the data
			// for (var k in indicatordata) {
			// 	if (indicatordata[k] == null){
			// 		return false;
			// 	} 
			// }

			// put data on map
			this.show_data_on_map(data);

			// load timeline
			this.draw_available_data_blocks();
			this.selected_year = this.get_first_available_year();
			this.move_slider_to_available_year();

			// refresh circles on right year
			this.refresh_circles(this.selected_year);
		}
	};

	this.get_url = function(){

		var str_region = get_parameters_from_selection(this.selection.regions);
		var str_country = get_parameters_from_selection(this.selection.countries);
		var str_city = get_parameters_from_selection(this.selection.cities);
		var str_indicators = get_parameters_from_selection(this.selection.indicators);

		return search_url + 'indicator-data/?format=json&countries__in=' + str_country + '&regions__in=' + str_region + '&cities__in=' + str_city + '&indicators__in=' + str_indicators;
	}

	this.get_data = function(url){

		// filters
		var thismap = this;
		
		$.support.cors = true;

		if(window.XDomainRequest){
		var xdr = new XDomainRequest();
		xdr.open("get", url);
		xdr.onprogress = function () { };
		xdr.ontimeout = function () { };
		xdr.onerror = function () { };
		xdr.onload = function() {
			var jsondata = $.parseJSON(xdr.responseText);
			if (jsondata === null || typeof (jsondata) === 'undefined')
			{
				jsondata = $.parseJSON(jsondata.firstChild.textContent);
				thismap.refresh(jsondata);
				
			}
		};
		setTimeout(function () {xdr.send();}, 0);
		} else {
			$.ajax({
				type: 'GET',
				url: url,
				contentType: "application/json",
				dataType: 'json',
				success: function(data){
					thismap.refresh(data);

				}
			});
		}
	};

	

	



	this.show_data_on_map = function(data){

		var thismap = this.map;
		var circles = this.circles;
		var vistype = this.vistype;
		circles.indicators = {};
		circles.countries = {};
		this.active_years = {};		
		var active_years = this.active_years;

		var circle_colors = ["#2B5A70", "DarkGreen", "Orange", "Pink", "Purple"];
		var indicator_counter = -1;

		// data containing multiple indicators
		$.each(data, function(mainkey, mainvalue){
			indicator_counter++;


			// key = indicator_id
			var cities_or_countries = null;
			if (Object.keys(mainvalue.cities).length > 0){
				cities_or_countries = mainvalue.cities;
			} else {
				cities_or_countries = mainvalue.countries;
			}

			// city or country
			$.each(cities_or_countries, function(key, value){

			    if (value.longitude == null || value.latitude == null){ return true; }
			    try{

			        //main indicator info
			        circles.indicators[mainvalue.indicator] = {};
			        circles.indicators[mainvalue.indicator].description = mainvalue.indicator_friendly;
			        circles.indicators[mainvalue.indicator].type_data = mainvalue.type_data;

			        circles.indicators[mainvalue.indicator].max_value = mainvalue.max_value;
			        
			        // circle info
			        if(!circles.countries[key]){circles.countries[key] = {};}
			        if(!circles.countries[key][mainvalue.indicator]){circles.countries[key][mainvalue.indicator] = {};}

			        circles.countries[key][mainvalue.indicator].years = value.years;


			        $.each(value.years, function(yearkey, yearval){
			        	active_years[yearkey] = yearkey;
			        });

			        
			        if (vistype == "markers"){
				        var circle = L.marker([value.latitude, value.longitude]).addTo(thismap);

				    } else if (vistype == "value-markers") {
				    	var circle = L.marker([value.latitude, value.longitude], {
				            icon: L.divIcon({
				                // Specify a class name we can refer to in CSS.
				                className: 'country-marker-icon',
				                // Define what HTML goes in each marker.
				                html: "null",
				                // Set a markers width and height.
				                iconSize: [36, 44],
				                iconAnchor: [18, 34],
				            })
				        }).addTo(thismap);

				    } else {
				    	var circle = L.circle(new L.LatLng(value.latitude, value.longitude), 1, {
				            color: circle_colors[indicator_counter],
				            weight: '5',
				            fillColor: circle_colors[indicator_counter],
				            fillOpacity: 0.7
				        }).setRadius(1).addTo(thismap);
				    }
			        
			        // main country info
			        circles.countries[key][mainvalue.indicator].circle = circle;
			        circles.countries[key].countryname = value.name;
			        //circles.countries[key].countryregion = value.region;
			        
			    }catch(err){

			        console.log(err);
			    }
			});
		});
	};


	this.delete_markers = function(){
		for (var i = 0; i < this.markers.length; i++) {
			this.map.removeLayer(this.markers[i]);
		}
	};


	this.refresh_circles = function(year){

		var circles = this.circles;
		var maxcirclearea = 500000000000;
	    var curyear = year;
		var vistype = this.vistype;

	    if(!(circles.countries === undefined)){
	        $.each(circles.countries, function(ckey, cvalue){

	            var popuptext = '<h4>'+cvalue.countryname+'</h4>';
	            // create pop-up text
	            $.each(circles.indicators, function(pkey, pvalue){
	                if(!(cvalue[pkey] === undefined)){

	                    var score = cvalue[pkey].years[curyear];
	                    if (score === undefined){
	                      score = "Not available";
	                    } else {

	                      if(pvalue.type_data == "1000"){
	                        score = comma_formatted((score * 1000) + '.');
	                      }

	                      if(pvalue.type_data == "p"){
	                        score = score + "%";
	                      }
	                    }
	                    popuptext += '<p>' + pvalue.description + ': ' + score + '</p>';
	                }
	            });

	            if (vistype == "value-markers"){

	            	// set radius size and pop-up text
		            $.each(circles.indicators, function(ikey, ivalue){
		                if(!(cvalue[ikey] === undefined)){

		                    var circle = cvalue[ikey].circle;
		                    var score = cvalue[ikey].years[curyear];
		                    if (!(score === undefined)){
		                        circle.setIcon(L.divIcon({
					                // Specify a class name we can refer to in CSS.
					                className: 'country-marker-icon',
					                // Define what HTML goes in each marker.
					                html: score,
					                // Set a markers width and height.
					                iconSize: [140, 44],
					                iconAnchor: [70, 34],
					            }));
		                    }
		                    circle.bindPopup(popuptext);
		                }
		            });
	            } else if (vistype == "markers"){
	            	$.each(circles.indicators, function(ikey, ivalue){

		                circle.bindPopup(popuptext);       
		                
		            });
	            } else {

		            // set radius size and pop-up text
		            $.each(circles.indicators, function(ikey, ivalue){
		                if(!(cvalue[ikey] === undefined)){

		                    var circle = cvalue[ikey].circle;
		                    var score = cvalue[ikey].years[curyear];
		                    if (!(score === undefined)){
		                        circle_radius = Math.round(Math.sqrt(((Math.round(maxcirclearea / ivalue.max_value)) * score) / Math.PI));
		                        circle.setRadius(circle_radius);
		                    } else {
		                      //circle.setRadius(1);
		                    }
		                    circle.bindPopup(popuptext);       
		                }
		            });
		        }
	        });
	    }
	};
	


	this.draw_available_data_blocks = function(indicator_data){

	    $('.slider-year').removeClass('slider-active');

	    $.each(this.active_years, function(yearkey, yearval){
        	$("#year-" + yearkey).addClass("slider-active");
        });
	};

	this.move_slider_to_available_year = function(){
		var year = this.selected_year;
		$( "#map-slider-tooltip" ).val(year);
		$( "#map-slider-tooltip div" ).text(year.toString());
		$( ".slider-year").removeClass("active");
		$( "#year-" + year.toString()).addClass("active");
	};

	this.get_first_available_year = function(){

		var years = this.active_years;
		if (this.selected_year in years){
			return this.selected_year;
		}
		for (var i = this.selected_year; i > 1949;i--){
			if (i in years){
				return i;
			}
		}

		for (var i = this.selected_year; i < 2100;i++){
			if (i in years){
				return i;
			}
		}

		return null;
	};

	this.clear_circles = function(){

		var circles = this.circles;
		var map = this.map;

		if(!(circles.countries === undefined)){
			$.each(circles.countries, function(ckey, cvalue){
				$.each(circles.indicators, function(ikey, ivalue){
					if(!(cvalue[ikey] === undefined)){
						map.removeLayer(cvalue[ikey].circle);
					}
				});
			});
		}
	}
	

}
OipaIndicatorMap.prototype = new OipaMap();



function OipaCompareFilters(){

	this.update_selection_object = function(){
		this.selection.left.countries = this.get_checked_by_filter("left-countries");
		this.selection.left.cities = this.get_checked_by_filter("left-cities");
		this.selection.right.countries = this.get_checked_by_filter("right-countries");
		this.selection.right.cities = this.get_checked_by_filter("right-cities");
		this.selection.indicators = this.get_checked_by_filter("indicators");
	};

	this.get_selection_object = function(){
		var new_selection = new OipaCompareSelection();
		new_selection.left.countries = this.get_checked_by_filter("left-countries");
		new_selection.left.cities = this.get_checked_by_filter("left-cities");
		new_selection.right.countries = this.get_checked_by_filter("right-countries");
		new_selection.right.cities = this.get_checked_by_filter("right-cities");
		new_selection.indicators = this.get_checked_by_filter("indicators");
		return new_selection;
	};

	this.get_url = function(selection, parameters_set){
		// get url from filter selection object
		if (parameters_set){
			var cururl = search_url + "indicator-city-filter-options/?format=json" + parameters_set;
		} else {
			var cururl = search_url + "indicator-city-filter-options/?format=json" + "&indicators__in=" + get_parameters_from_selection(this.selection.indicators);
		}
		
		return cururl;
	};

	this.process_filter_options = function(data){

		var columns = 4;
		var filter = this;

		// load filter html and implement it in the page
		this.create_filter_attributes(data.countries, columns, 'left-countries');
		this.create_filter_attributes(data.countries, columns, 'right-countries');

		this.create_filter_attributes(data.cities, columns, 'left-cities');
		this.create_filter_attributes(data.cities, columns, 'right-cities');

		this.create_filter_attributes(data.indicators, 2, 'indicators');

		if (this.firstLoad === true) { firstLoad = false; OipaCompare.randomize(); }


		// reload aangevinkte vakjes
		this.initialize_filters();
	};

}
OipaCompareFilters.prototype = new OipaFilters();


function OipaIndicatorFilters(){

	this.get_url = function(selection, parameters_set){
		// get url from filter selection object
		if (parameters_set){
			var cururl = search_url + "indicator-filter-options/?format=json" + parameters_set;
		} else {
			var cururl = search_url + "indicator-filter-options/?format=json" + "&indicators__in=" + get_parameters_from_selection(this.selection.indicators) + "&regions__in=" + get_parameters_from_selection(this.selection.regions) + "&countries__in=" + get_parameters_from_selection(this.selection.countries) + "&cities__in=" + get_parameters_from_selection(this.selection.cities);
		}

		return cururl;
	};

	this.process_filter_options = function(data){

		var columns = 4;

		// load filter html and implement it in the page
		$.each(data, function( key, value ) {
			
			if (!$.isEmptyObject(value)){
				if ($.inArray(key, ["indicators", "regions"]) > -1){ columns = 2; } else { columns = 4; }
				filter.create_filter_attributes(value, columns, key);
			}
		});

		// reload aangevinkte vakjes
		this.initialize_filters();
	};


	this.create_indicator_filter_attributes = function(objects, columns){

		var html = '';
		var paginatehtml = '';
		var per_col = 6;
		var sortable = [];
		for (var key in objects){
			sortable.push([key, objects[key]]);
		}
		sortable.sort(function(a, b){
			var nameA=a[1].name.toString().toLowerCase(), nameB=b[1].name.toString().toLowerCase();
			if (nameA < nameB) { //sort string ascending
				return -1; 
			}
			if (nameA > nameB) {
				return 1;
			}
			return 0; //default return value (no sorting)
		});

		var categories = {};
		var ivaluetranslation = {rural: 'Rural area', city_core: 'City core',urban_area:'Urban area', "City core": "city core", sub_urban_area: 'Sub-urban area', sub_urban:'Sub-urban area', total:'Total'}; 

		for (var i = 0;i < sortable.length;i++){

			var sortablename = sortable[i][1].name;
			var categoryname = sortable[i][1].category;

			if (columns == 4 && sortablename.length > 32){
				sortablename = sortablename.substr(0,28) + "...";
			} else if (columns == 3 && sortablename.length > 40){
				sortablename = sortablename.substr(0,36) + "...";
			}

			if (!(categoryname in categories)){
				categories[categoryname] = [];
			}


			
			if(sortable[i][1].selection_types.length > 0){
				var indicatoroptionhtml = '<div class="filter-indicator-type-dropdown"><a href="#" class="filter-indicator-type-text"><span class="urbnnrs-arrow"></span>'+sortablename+'</a><div class="filter-indicator-type-inner">';
				$.each(sortable[i][1].selection_types, function( ikey, ivalue ) {
					ivalue = ivaluetranslation[ivalue];
					indicatoroptionhtml += '<div class="checkbox"><label><input type="checkbox" selection_type="'+ivalue+'" value="'+ sortable[i][0] +'" id="'+sortable[i][1].name.toString().replace(/ /g,'').replace(',', '').replace('&', '').replace('%', 'perc')+'" name="'+sortable[i][1].name+'" />'+ivalue+'</label></div>';
				});
				indicatoroptionhtml += "</div></div>";
			} else {
				var indicatoroptionhtml = '<div class="checkbox"><label><input type="checkbox" value="'+ sortable[i][0] +'" id="'+sortable[i][1].name.toString().replace(/ /g,'').replace(',', '').replace('&', '').replace('%', 'perc')+'" name="'+sortable[i][1].name+'" />'+sortablename+' </label></div>';
			}
			categories[categoryname].push(indicatoroptionhtml);
		}
		
		paginatehtml += '<ul>';
		$.each(categories, function( key, value ) {

			var items_per_col = Math.ceil(value.length / 2);
			var ugly_category_name = key.toString().toLowerCase().replace(/ /g,'').replace(',', '').replace('&', '').replace('%', 'perc');

		  	html += '<div class="row filter-page filter-page-'+ugly_category_name+'">';
		  	html += '<div class="col-md-6 col-sm-6 col-xs-12">';
		  	$.each(value, function( ikey, ivalue ) {
		  		if (ikey == items_per_col){
		  			html += '</div><div class="col-md-6 col-sm-6 col-xs-12">';
		  		}
		  		html += ivalue;
		  		
		  	});

		  	html += '</div></div>';

		  	paginatehtml += '<li><a href="#" class="indicator-category-button" name="'+ugly_category_name+'">'+key+'</a></li>';

		});

		paginatehtml += '</ul>';

		// get pagination attributes and add both pagination + filter options to div
		$("#indicators-pagination").html(paginatehtml);
		$("#indicators-filters").html(html);
		this.load_indicator_paginate_listeners();
		this.update_selection_after_filter_load();
	};

	this.load_indicator_paginate_listeners = function(){
		$("#indicators-pagination li a").click(function(e){
			e.preventDefault();
			$("#indicators-pagination li").removeClass("active");
			$(this).parent().addClass("active");
			var name = $(this).attr("name");
			$("#indicators-filters .filter-page").hide();
			$(".filter-page-"+name).show();
		});

		$("#indicators-pagination li a:first").click();

		$(".filter-indicator-type-text").click(function(e){
			e.preventDefault();
			// $(this).closest(".urbnnrs-arrow").toggleClass("urbnnrs-arrow-active");
			$(this).closest(".filter-indicator-type-dropdown").children(".filter-indicator-type-inner").toggle(500);
		});
	}

}
OipaIndicatorFilters.prototype = new OipaFilters();



// XXXXXXXXXXXXXX INDICATOR SLIDER XXXXXXXXXXXXXXXXX


$( "#map-slider-tooltip" ).noUiSlider({
    range: [1950, 2050],
    handles: 1,
    start: 2000,
    step: 1,
    slide: slide_tooltip
});

function slide_tooltip(){
    var curval = $("#map-slider-tooltip").val();
    $( "#map-slider-tooltip div" ).text(curval);

    map.refresh_circles(curval);
    $( ".slider-year").removeClass("active");
    $( "#year-" + curval).addClass("active");
}


$(".slider-year").click(function() {
    var curId = $(this).attr('id');
    var curYear = curId.replace("year-", "");
    map.refresh_circles(curYear);
    $( "#map-slider-tooltip" ).val(parseInt(curYear));
    $( "#map-slider-tooltip div" ).text(curYear);
    $( ".slider-year").removeClass("active");
    $(this).addClass("active");
}); 