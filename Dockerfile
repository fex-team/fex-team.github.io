FROM ruby:2.5.3

WORKDIR /build

RUN apt-get update \
  && apt-get install -y build-essential \
  && gem install bundler jekyll jekyll-paginate

