const socket = require('socket.io').listen(process.env.PORT);
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('socket connect');  
  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });
});
};