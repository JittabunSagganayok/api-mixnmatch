const WebSocket = require("ws");

// // **WebSocket Server (separate file: websocket.js)**
const portws = 3000;
// const wss = new WebSocket.Server({ port: portws });
// console.log(`[WebSocket] Starting WebSocket server on localhost:${portws}`);

// const connectedClients = {}; // Object to store connected clients with ID as key

// wss.on("connection", (ws, request) => {
//   const clientIp = request.connection.remoteAddress;
//   const clientId = Math.random().toString(36).substring(2, 15); // Generate unique client ID

//   connectedClients[clientId] = { ws }; // Add client to connectedClients object

//   console.log(
//     `[WebSocket] Client with IP ${clientIp} has connected (ID: ${clientId})`
//   );
//   ws.send(
//     JSON.stringify({ message: "Thanks for connecting to this chat app!" })
//   );

//   // Broadcast messages to all connected clients
//   ws.on("message", (message) => {
//     wss.clients.forEach((client) => {
//       if (true) {
//         client.send(message);
//         ws.send(message);
//       }
//     });
//     console.log("recieve", message.toString());
//     // const messageObject = JSON.parse(message); // Parse received message as object

//     // if (
//     //   messageObject.hasOwnProperty("senderId") &&
//     //   messageObject.hasOwnProperty("receiverId") &&
//     //   messageObject.hasOwnProperty("message") &&
//     //   messageObject.hasOwnProperty("time")
//     // ) {
//     //   // Validate message object properties
//     //   const senderId = messageObject.senderId;
//     //   const receiverId = messageObject.receiverId;
//     //   const chatMessage = messageObject.message;
//     //   const time = messageObject.time;

//     //   wss.clients.forEach((client) => {
//     //     if (client.readyState === WebSocket.OPEN) {
//     //       // Check if client ID matches receiver ID (for private messaging) or send to everyone (for public messaging)
//     //       if (
//     //         true
//     //         // receiverId === "*" || clientId === receiverId
//     //       ) {
//     //         // client.send(
//     //         //   JSON.stringify({
//     //         //     senderId,
//     //         //     receiverId,
//     //         //     message: chatMessage,
//     //         //     time,
//     //         //   })
//     //         // );
//     //       }
//     //     }
//     //   });
//     //   console.log(
//     //     `[WebSocket] Message from ${senderId} to ${receiverId}: ${chatMessage}`
//     //   );
//     // } else {
//     //   console.error(
//     //     "[WebSocket] Invalid message format. Please include senderId, receiverId, and message properties."
//     //   );
//     // }
//   });

// ws.on("close", () => {
//   delete connectedClients[clientId]; // Remove client on disconnect
//   console.log(`[WebSocket] Client ${clientId} disconnected`);
// });

// ws.on("error", (error) => {
//   console.error("[WebSocket] Error:", error);
// });
// // });

// module.exports = {
//   wss, // exporting WebSocket server instance if needed externally
// };

//
// const WebSocket = require("ws");
// start the server and specify the port number
// const port = 8080;
const wss = new WebSocket.Server({ port: portws });
console.log(`[WebSocket] Starting WebSocket server on localhost:${portws}`);
wss.on("connection", (ws, request) => {
  const clientIp = request.connection.remoteAddress;
  console.log(`[WebSocket] Client with IP ${clientIp} has connected`);
  ws.send("Thanks for connecting to this nodejs websocket server");
  // Broadcast aka send messages to all connected clients
  //   ws.on("message", (message) => {
  //     wss.clients.forEach((client) => {
  //       if (client.readyState === WebSocket.OPEN) {
  //         client.send(message.toString());
  //       }
  //     });
  //     console.log(`[WebSocket] Message ${message.toString()} was received`);
  //   });
  ws.on("message", (message) => {
    // Parse the received JSON message
    const messageObject = JSON.parse(message);

    console.log(
      `[WebSocket] Message received: ${JSON.stringify(messageObject)}`
    );

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messageObject));
      }
    });
  });
});
