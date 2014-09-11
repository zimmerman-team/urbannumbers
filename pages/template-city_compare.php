<?php
/*
Template Name: City compare
*/
get_header(); the_post(); ?>
    <div id="main" class="city-compare-wrapper">
        <!-- container-map -->
        <div class="container-map small">
            
            <?php get_template_part("compare", "filters"); ?>

            <div class="container-heading">
                <!-- container-heading -->
                <div class="row">
                    <div class="col-md-6 col-sm-6 col-xs-6"><span id="compare-left-title" class="heading"></span></div>
                    <div class="col-md-6 col-sm-6 col-xs-6"><span id="compare-right-title" class="heading"></span></div>
                </div>
                <!-- action-list -->
                <ul class="action-list">
                    <li><a id="compare-cities-randomize" href="#"><i class="icon-reset"></i>RANDOMIZE</a></li>
                </ul>
            </div>
            <div class="columns-holder">
                <div class="holder">
                    <div id="compare-left-map-border" class="column">
                        <?php 
                        $curmapname = "left";
                        include( TEMPLATEPATH .'/map.php' ); 
                        ?>
                    </div>
                    <div id="compare-right-map-border" class="column">
                        <?php 
                        $curmapname = "right";
                        include( TEMPLATEPATH .'/map.php' ); 
                        ?>
                    </div>
                </div>
            </div>
            <div class="container-text hidden-xs">
                <div class="holder">
                    <div class="row">
                        <div class="col-md-6 col-sm-6">
                            <div class="text-box">
                                <div class="text-frame left-city-wikipedia">
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-6 col-sm-6">
                            <div class="text-box">
                                <div class="text-frame right-city-wikipedia">
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <?php get_template_part("compare", "visualisations"); ?>

    </div>


    <?php get_template_part("footer", "scripts"); ?>

    <script>

        Oipa.pageType = "compare";
        Oipa.mainSelection = new OipaCompareSelection(1);

        // Force refresh
        OipaWidgetsBus.use_force_refresh = true;
        var filter_div = "";

        var leftmap = new OipaMap();
        leftmap.set_map("left-map");
        leftmap.compare_left_right = "left";
        Oipa.maps.push(leftmap);

        var rightmap = new OipaMap();
        rightmap.set_map("right-map");
        rightmap.compare_left_right = "right";
        Oipa.maps.push(rightmap);
        

        var filter = new UnhabitatOipaCompareFilters();
        filter.selection = Oipa.mainSelection;
        //OipaCompare.randomize(1);
        filter.init();

    </script>

    <?php get_template_part("footer", "bus_scripts"); ?>

    <script type="text/javascript">
    //filter.save();
    </script>
<?php get_footer(); ?>