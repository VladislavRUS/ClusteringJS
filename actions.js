$(function() {
    function hidePreloader() {
        $('.preloader-wrapper').hide();
        $('#buttons-block').slideToggle();

    }
    setTimeout(hidePreloader, 100);

    $('#worked').click(function() {
        $('#buttons-block').hide();
        $('#optimizations').hide();
        $('.determinate').width('0%');
        $('#info').show();

        $('#progress-bar').show();
        startTree();
    });

    $('#kmeans').click(function() {
        $('#buttons-block').hide();
        $('#optimizations').hide();
        $('.determinate').width('0%');
        $('#info').show();

        $('#progress-bar').show();
        startKMeans();
    });

    $('#closest').click(function() {
        $('#buttons-block').hide();
        $('#optimizations').hide();
        $('.determinate').width('0%');
        $('#info').show();

        $('#progress-bar').show();

        startClosest();
    });

    $('#return').click(function() {
        hideCanvas();
    });

    $('#mapBtn').click(function() {
        showMap();
    });

    $('#index').click(function() {
        $('#costPar').hide();
        $('#stationCost').hide();
        $('#cost').hide();
    });

    $('#sumDistance').click(function() {
        $('#costPar').show();
        $('#stationCost').show();
        $('#cost').show();
    });

    $('#costPar').hide();
    $('#stationCost').hide();
    $('#cost').hide();

});