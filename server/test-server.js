import http from "http";

const PORT = 8080; // or 3001, but try 8080 to avoid firewall issues

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✅ Basic Node server is working!\n");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Listening on http://localhost:${PORT}`);
});