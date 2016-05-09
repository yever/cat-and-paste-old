function startCatAndPaste(mode) {
    'use strict';

    var cache_size = 5;
    var cats = [];
    var giphy_api_key = 'dc6zaTOxFJmzC';
    var giphy_search_term = 'cats';

    var init;

    function getJSON(url, func) {
        var request = new XMLHttpRequest();
        request.addEventListener('load',
            function() {
                if (request.status >= 200 && request.status < 400) {
                    var data = JSON.parse(request.responseText);
                    func(data);
                } else {
                    setTimeout(
                        function() {
                            getJSON(url, func);
                        },
                        1000);
                }
            });
        request.addEventListener('error',
            function() {
                setTimeout(
                    function() {
                        getJSON(url, func);
                    },
                    1000);
            });
        request.open('GET', url, true);
        request.send();
    }

    function giphyMP4(func) {
        getJSON('http://api.giphy.com/v1/gifs/random?api_key=' + giphy_api_key + '&tag=' + giphy_search_term,
            function(result) {
                getJSON('http://api.giphy.com/v1/gifs/' + result.data.id + '?api_key=' + giphy_api_key,
                    function(result) {
                        func(result.data.images.fixed_height.mp4);
                    });
            });
    }

    function giphyWEBP(func) {
        getJSON('http://api.giphy.com/v1/gifs/random?api_key=' + giphy_api_key + '&tag=' + giphy_search_term,
            function(result) {
                getJSON('http://api.giphy.com/v1/gifs/' + result.data.id + '?api_key=' + giphy_api_key,
                    function(result) {
                        func(result.data.images.fixed_height.webp);
                    });
            });
    }

    function giphyGIF(func) {
        getJSON('http://api.giphy.com/v1/gifs/random?api_key=' + giphy_api_key + '&tag=' + giphy_search_term,
            function(result) {
                getJSON('http://api.giphy.com/v1/gifs/' + result.data.id + '?api_key=' + giphy_api_key,
                    function(result) {
                        func(result.data.images.fixed_height.url);
                    });
            });
    }

    function startVideo(giphy) {
        for (var i = 0; i < cache_size; i++) {
            cats[i].element = document.getElementById('cat' + i);
        }

        var cur_cat = -1;

        function play() {
            if (cur_cat === -1) {
                var available_cat =
                    cats.find(function(cat) {
                        return cat.loaded;
                    });

                if (available_cat) {
                    cur_cat = cats.indexOf(available_cat);
                    available_cat.element.play();
                    available_cat.element.style.display = 'block';
                    available_cat.element.onended =
                        function() {
                            if (cur_cat !== -1) {
                                switch_cat(cur_cat);
                            }
                        };
                } else {
                    setInterval(play, 100);
                }
            }
        }

        function switch_cat(i) {
            cats[i].element.style.display = 'none';
            cats[i].loaded = false;
            cur_cat = -1;

            giphy(function(url) {
                cats[i].element.src = url;
                cats[i].element.load();
                cats[i].element.oncanplaythrough =
                    function() {
                        cats[i].loaded = true;
                    };
                cats[i].element.onclick = play;
            });
            play();
        }

        var staticCat = document.getElementById('static-cat');
        staticCat.parentNode.removeChild(staticCat);

        play();

    }

    function initVideo(giphy, start) {
        giphy(function(url) {
            var i = cats.length;

            cats.push({
                loaded: false
            });

            var videoElement = document.createElement('video');
            videoElement.setAttribute('id', 'cat' + i);
            videoElement.setAttribute('src', url);
            videoElement.setAttribute('type', 'video/mp4');
            videoElement.setAttribute('style', document.getElementById('static-cat').getAttribute('style'));
            videoElement.oncontextmenu =
                function() {
                    return false;
                };
            videoElement.oncanplaythrough =
                function() {
                    cats[i].loaded = true;
                    if (cats.length === cache_size &&
                        cats.every(
                            function(cat) {
                                return cat.loaded;
                            })) {
                        start(giphy);
                    }
                };
            document.getElementById('cats').appendChild(videoElement);
            document.getElementById('cat' + i).style.display = 'none';
        });
    }


    switch (mode) {
        case 'mp4':
            init = function() {
                initVideo(giphyMP4, startVideo);
            };
            break;

        case 'webp':
            init = function() {
                initVideo(giphyWEBP, startVideo);
            };
            return;

        case 'video-gif':
        case 'static-gif':
            console.log('Error: unimplemented');
            return;

        default:
            console.log('Error: unknown format');
            return;
    }

    for (var i = 0; i < cache_size; i++) {
        init();
    }
}

window.onload =
    function() {
        'use strict';

        // remove static cat image
        var staticCat = document.getElementById('static-cat');
        staticCat.src =
            'http://loremflickr.com/' + Math.floor(window.innerWidth / 4) +
            '/' + Math.floor(window.innerHeight / 4) + '/cat';

        if (Modernizr.video) {
            Modernizr.on('videoautoplay',
                function(videoautoplay) {
                    if (videoautoplay) {
                        if (Modernizr.video.h264) {
                            startCatAndPaste('mp4');
                        } else {
                            Modernizr.on('webp',
                                function(webp) {
                                    if (webp) {
                                        startCatAndPaste('webp');
                                    } else {
                                        startCatAndPaste('video-gif');
                                    }
                                });
                        }
                    }
                });
        } else {
            console.log('static-gif');
        }
    };
