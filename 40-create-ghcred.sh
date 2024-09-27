#!/bin/sh

# Set default value for VUE_APP_PUBLIC_PATH if not provided
# Remove leading and trailing whitespace and slashes from VUE_APP_PUBLIC_PATH
VUE_APP_PUBLIC_PATH=$(echo $VUE_APP_PUBLIC_PATH | sed 's/^\s*\///;s/\/\s*$//')

# Add leading slash only if string is not empty
if [ "$VUE_APP_PUBLIC_PATH" != "/" ] && [ "$VUE_APP_PUBLIC_PATH" != "" ]; then
    VUE_APP_PUBLIC_PATH="/$VUE_APP_PUBLIC_PATH"
fi

# Link the Vue.js app to the public path
ln -s /usr/share/nginx/html /usr/share/nginx/html/"$VUE_APP_PUBLIC_PATH"
sed -i "s+/myAppPlaceholder+$VUE_APP_PUBLIC_PATH+g" /usr/share/nginx/html/index.html
sed -i "s+/myAppPlaceholder+$VUE_APP_PUBLIC_PATH+g" /usr/share/nginx/html/js/app.*.js

# Create NGINX configuration from environment variables
# The @ character is used to prevent envsubst from interpreting NGINX variables
cat <<EOT | envsubst | tr '@' '$' >/GH_OAUTH_CLIENT.conf
# Handle CLIENT_ID, CLIENT_SECRET, and CALL_BACK - they can be empty
set @CLIENT_ID "${CLIENT_ID:-}";
set @CLIENT_SECRET "${CLIENT_SECRET:-}";
set @CALL_BACK "${CALL_BACK:-}";
EOT
