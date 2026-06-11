const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const port = 4173;
const types = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
};

http.createServer((req, res) => {
  const target = req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1));
  const filePath = path.join(root, target);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain" });
    res.end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`MWM Builder ready on http://127.0.0.1:${port}`);
});
