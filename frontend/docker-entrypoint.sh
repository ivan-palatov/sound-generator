#!/bin/sh
set -eu

: "${BACKEND_UPSTREAM:=http://backend:8000}"
export BACKEND_UPSTREAM

sed "s|\${BACKEND_UPSTREAM}|${BACKEND_UPSTREAM}|g" \
  /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
