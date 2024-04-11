#/bin/sh
# create nginx config from evironment
# *prevent envsubst from killing nginx vars with 'tr' and '@'* 
cat <<EOT | envsubst | tr '@' '$' >/subpath.conf
set @PUBLIC_PATH  $PUBLIC_PATH;
EOT