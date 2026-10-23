#!/usr/bin/env python3
"""
Simple local development server for Guys Guys Night Shoot 2026.
Serves index.html with proper MIME types and opens the default web browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers for smooth media streaming
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Try finding an open port if 8000 is taken
    port = PORT
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print("=" * 60)
                print("  GUYS GUYS - NIGHT SHOOT 2026 PHOTO GALLERY")
                print(f"  Local Server Running: {url}")
                print("=" * 60)
                print("  Press Ctrl+C to stop the server.")
                
                # Automatically open browser if requested
                if "--open" in sys.argv or "-o" in sys.argv:
                    webbrowser.open(url)
                    
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == "__main__":
    run()
