#!/usr/bin/env python3
"""Inline the whole study into one portable HTML file.

    python3 bundle.py            ->  oh-study-standalone.html

The result opens by double-clicking - no server, no internet. Because there
is no server behind it, data is NOT posted anywhere: the participant gets a
"download my data" button instead. Use it for demos, previews, and sending
the task to a colleague; use the served version (server.py) to collect data.
"""
import os, re, base64

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "oh-study-standalone.html")

def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as f:
        return f.read()

# jsPsych's stylesheet carries ~460KB of base64 webfonts; the study sets its
# own font stack, so drop them.
jspsych_css = re.sub(r"@font-face\s*\{[^}]*\}", "", read("lib", "jspsych.css"))

config = read("js", "config.js")
config = re.sub(r'SAVE_URL:\s*"[^"]*"', 'SAVE_URL: ""', config)   # nothing to post to

parts = [
    "<!DOCTYPE html>", '<html lang="en">', "<head>", '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>Pattern Study</title>",
    "<style>", jspsych_css, read("css", "style.css"), "</style>",
    "</head>", "<body>", '<div id="jspsych-target"></div>',
]
for f in ["lib/jspsych.js", "lib/plugin-html-button-response.js",
          "lib/plugin-html-keyboard-response.js", "lib/plugin-survey-html-form.js", "js/patterns.js"]:
    parts += ["<script>", read(*f.split("/")), "</script>"]
parts += ["<script>", config, "</script>",
          "<script>", read("js", "experiment.js"), "</script>",
          "<script>", read("js", "dev.js"), "</script>",
          "<script>", read("js", "main.js"), "</script>",
          "</body>", "</html>"]

html = "\n".join(parts)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print("wrote %s (%.0f KB)" % (OUT, len(html.encode()) / 1024))
