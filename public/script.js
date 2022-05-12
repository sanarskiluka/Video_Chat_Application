const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const peer = new Peer(undefined, {
  host: '/',
  port: '3001'
});

const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};
let currId;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    if(document.getElementById('video-grid').children.length == 2) {
      socket.emit('full-room', userId);
      return;
    }
    setTimeout(function() {
      connectToNewUser(userId, stream)
    }, 500);
  });
}).catch(() => {
  alert("Getting Audio/Video failed.");
});

socket.on('user-disconnected', userId => {
  if(peers[userId]) peers[userId].close();
});

socket.on('full-room', (id) => {
  if(currId == id) {
    // let roomId;
    // while(!roomId) {
    //   roomId = prompt("Room is full! Try another room.");
    // }
    // socket.emit('join-room', roomId, id);
    alert("Room is full! Refresh and try another room.");
  }
});

peer.on('open', (id) => {
  currId = id;
  let roomId = "";
  while(!roomId) {
    roomId = prompt("Type a room name");
    if(!roomId) continue;
    if(roomId.split(' ').length - 1 == roomId.length) roomId = "";
  }
  socket.emit('join-room', roomId, id);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });
  peers[userId] = call;
}