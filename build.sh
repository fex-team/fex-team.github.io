#!/usr/bin/env bash
set -e # halt script on error

gem install jekyll jekyll-paginate redcarpet kramdown
jekyll build

tree ./_site

