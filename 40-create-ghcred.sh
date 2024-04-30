#!/bin/sh

# Set default value for VUE_APP_PUBLIC_PATH if not provided
# Get VUE_APP_PUBLIC_PATH from Docker endpoint
#VUE_APP_PUBLIC_PATH=$(cat /proc/1/environ | grep VUE_APP_PUBLIC_PATH | cut -d '=' -f2)

# Copy files with the specified public path
#cp -r /usr/app/dist /usr/share/nginx/html/$VUE_APP_PUBLIC_PATH
echo $VUE_APP_PUBLIC_PATH
ln -s /usr/share/nginx/html /usr/share/nginx/html$VUE_APP_PUBLIC_PATH
#sed -e  "//js/++mylocation/js"
sed -i "s+/myAppPlaceholder+$VUE_APP_PUBLIC_PATH+g" /usr/share/nginx/html/index.html
sed -i "s+/myAppPlaceholder+$VUE_APP_PUBLIC_PATH+g" /usr/share/nginx/html/js/app.*.js

# Create nginx config from environment variables
# *prevent envsubst from killing nginx vars with 'tr' and '@'* 
cat <<EOT | envsubst | tr '@' '$' >/GH_OAUTH_CLIENT.conf
set @CLIENT_ID $CLIENT_ID;
set @CLIENT_SECRET $CLIENT_SECRET;
set @CALL_BACK $CALL_BACK;
EOT
