var is_granted = false;
var time, waittime, index;
var intervalWait, interval;
var init_payment = false;
var invoice_id = '';
var queryParams;
var is_connected = false;
var no_reconnect = 0;
var env = 'development'; // production | development
var env_params = {
  production: {
    socketUrl: 'https://www.ezactive.com',
    path: '/hkfa_websocket',
  },
  development: {
    socketUrl: 'http://localhost:3000',
    path: '',
  },
};
const socket = io(env_params[env].socketUrl, {
  path: `${env_params[env].path}/socket.io`,
});
socket.on('connect', () => {
  is_connected = true;
  if (no_reconnect > 0) {
    console.log('Reconnected to server', no_reconnect);
    joinQueue();
  }
  no_reconnect++;
  console.log('Connected to server');
});

socket.io.on('error', (error) => {
  console.log('error', error);
});

socket.io.on('ping', () => {
  console.log('ping');
});

socket.on('reconnect', (attempt) => {
  is_connected = true;
  console.log('Reconnected to server', attempt);
  joinQueue();
});

socket.on('reconnect_error', () => {
  is_connected = false;
  console.log('Reconnect error');
});

socket.on('reconnect_failed', () => {
  is_connected = false;
  console.log('Reconnect failed');
});

socket.on('disconnect', () => {
  is_connected = false;
  console.log('Disconnected from server');
});

socket.on('duplicateConnection', () => {
  console.log('Duplicate connection');
  socket.disconnect();
  // remove payment iframe
  $('#payment').remove();
  $('#duplicate').show();
  setTimeout(() => {
    console.log('close window');
    window.close();
  }, 2000);
});

// on check_access
socket.on('check_access', (data) => {
  console.log('check_access', data);
  let last_upadted = new Date();
  console.log('last_upadted', last_upadted.toTimeString());
  // set to el last-updated-time
  $('#last-updated-time').text(last_upadted.toTimeString());
  if (data.isGranted) {
    is_granted = true;
    startTimer(data);
  } else {
    is_granted = false;
    if (init_payment) {
      if (data.isPaid) {
        paymentSuccess();
      } else {
        paymentTineUp();
      }
      $('#payment').hide();
    }
    startWaitTimer(data);
  }
});

// on userLeftQueue
socket.on('userLeftQueue', (data) => {
  console.log('userLeftQueue', data);
  if (
    data.remaningTime &&
    data.remaningTime > 0 &&
    waittime >= data.remaningTime &&
    data.maxUsersAllowed
  ) {
    if (index > data.maxUsersAllowed) {
      waittime -= data.remaningTime;
    }
  }
  index--;
  setIndex(index);
});

function joinQueue() {
  console.log('joinQueue', `HKFA-${invoice_id}`);
  join('payment-queue', `HKFA-${invoice_id}`);
}

function join(roomName, token) {
  socket.emit('joinRoom', { roomName, token }, (data) => {
    console.log(data);
  });
}

function initPayment() {
  init_payment = true;
  let url_payment = queryParams.get('url');
  console.log('url_payment', url_payment);
  console.log('Payment granted');
  // create iframe
  let iframe = document.createElement('iframe');
  iframe.src = url_payment;
  iframe.classList.add('payment-iframe');

  iframe.onload = () => {
    console.log('iframe loaded');
  };

  iframe.onerror = () => {
    console.log('iframe error');
  };

  $('#payment').append(iframe);
  $('#payment').show();
  $('#loading').hide();
  $('#wait').hide();
}

function getTimer() {
  return `${Math.floor(this.time / 60000)}:${Math.floor(
    (this.time % 60000) / 1000,
  )}`;
}

function getWaitTimer() {
  let minutes = Math.floor(this.waittime / 60000);
  let seconds = Math.floor((this.waittime % 60000) / 1000);
  // if (minutes < 1) {
  //   return `${seconds} seconds`;
  // } else {
  return `${minutes + 1} minutes`;
  // }
}

function paymentTineUp() {
  // go to time up page
  console.log('Payment time up');
  window.location.href = `${env_params[env].path}/time-up`;
}

function paymentSuccess() {
  // go to success page
  console.log('Payment success');
  window.location.href = `${env_params[env].path}/success`;
}

function startTimer(data) {
  time = data.time;
  if (intervalWait) clearInterval(intervalWait);
  if (time > 0) {
    initPayment();
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      time -= 1000;
      if (time <= 0) {
        clearInterval(interval);
      }

      let timer = getTimer();
      $('#timer').text(timer);
    }, 1000);
  }
}

function startWaitTimer(data) {
  $('#wait').show();
  $('#loading').hide();
  let maxTime = parseInt(data.waitTime);
  waittime = maxTime;
  index = data.index;
  setIndex(index);
  if (interval) clearInterval(interval);
  if (waittime > 0) {
    if (intervalWait) clearInterval(intervalWait);
    intervalWait = setInterval(() => {
      waittime -= 1000;
      // console.log('waittime', waittime);
      if (waittime <= 0) {
        clearInterval(intervalWait);
      }

      let timer = getWaitTimer();
      setProgress(calcProgress(maxTime, waittime));
      $('#wait-timer').text(timer);
    }, 1000);
  }
}

function setIndex(index) {
  let indexElement = document.getElementById('index');
  if (indexElement) indexElement.innerText = index;
}

function setProgress(progress) {
  let progressElement = document.getElementById('progress');
  if (progressElement) progressElement.style.width = `${progress}%`;
}

function calcProgress(maxTime, currentTime) {
  return (1 - currentTime / maxTime) * 100;
}

// on document ready
$(document).ready(function () {
  // get url from query param
  let full_url = new URL(window.location.href);
  queryParams = full_url.searchParams;
  console.log('queryParams', queryParams);
  invoice_id = queryParams.get('invoice_id');
  console.log('invoice_id', invoice_id);
  $('#loading').show();
  $('#wait').hide();
  $('#payment').hide();
  $('#duplicate').hide();
  setTimeout(() => {
    joinQueue();
  }, 2000);
});
