#!/bin/bash
source /home/user/Files/Programming/PythonTestEnv/bin/activate
waitress-serve --port 9100 --host 0.0.0.0 server:app