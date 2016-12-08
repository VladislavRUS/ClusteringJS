$(function() {
    function hidePreloader() {
        $('.preloader-wrapper').hide();
        $('#buttons-block').slideToggle();

    }
    setTimeout(hidePreloader, 200);

    $('#worked').click(function() {
        $('#buttons-block').hide();
        $('.determinate').width('0%');
        $('#info').show();

        $('#progress-bar').show();
        startWorker();
    });

    $('#kmeans').click(function() {
        $('#buttons-block').hide();
        $('.determinate').width('0%');
        $('#info').show();

        $('#progress-bar').show();
        startKMeans();
    });

    $('#closest').click(function() {
        $('#buttons-block').hide();
        $('.determinate').width('0%');
        $('#info').show();

        $('#progress-bar').show();

        startClosest();
    });

    $('#return').click(function() {
        hideCanvas();
    });

})