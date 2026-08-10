import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


PORT = int(os.environ.get("PORT", "8080"))


class UniUZHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path == "/":
            self.path = "/index.html"

        return super().do_GET()

    def log_message(self, format, *args):
        print(f"[MiniApp] {format % args}")


def main():
    server = ThreadingHTTPServer(
        ("0.0.0.0", PORT),
        UniUZHandler
    )

    print(f"UniUZ Mini App started on port {PORT}")
    print("Server: 0.0.0.0")
    print("Mini App is ready")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
