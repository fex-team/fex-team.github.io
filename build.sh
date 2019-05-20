#!/usr/bin/env bash
docker run -it -v `pwd`:/build fexpublic/jekyll:latest jekyll build
