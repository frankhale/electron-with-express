var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'c24En0r-lXg',
    events: {
      'onReady': onPlayerReady
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
  player.setVolume(30);
}
