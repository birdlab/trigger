[![Trigger Logo](http://birdlab.ru/img/triggerlogo_black.svg)](http://trigger.fm/)


#Trigger


##Installation:

    sudo apt-get update
    sudo apt-get upgrade
    sudo apt-get install ssh php5-cli php5-common php5-mysql php5-gd php5-fpm php5-cgi php5-fpm php-pear php5-mcrypt php5-json php5-curl 
    sudo apt-get install nginx 
    sudo apt-get install mysql-server mysql-client

install icecast-kh

    sudo apt-get install icecast2 libxslt1-dev libcurl4-openssl-dev libvorbis-dev
    wget https://github.com/karlheyes/icecast-kh/archive/icecast-2.3.3-kh11.tar.gz
    tar xzf icecast-2.3.3-kh11.tar.gz
    cd icecast-kh-icecast-2.3.3-kh11/
    ./configure
    make
    sudo make install
    
    
    
    sudo cp /usr/local/etc/icecast.xml /etc/icecast2/icecast.xml
    сменить в нем папку логов на /var/log/icecast2, sources - на 10
    поменять DAEMON в /etc/init.d/icecast2 на /usr/local/bin/icecast

install MPD:

    sudo apt-get install mpd
    sudo service mpd stop
    sudo update-rc.d mpd disable
    sudo apt-get install mpc
    
install node.js

    sudo apt-get install curl
    curl -sL https://deb.nodesource.com/setup | sudo bash -
    sudo apt-get install nodejs
    sudo apt-get install build-essential
    
add user trigger

    sudo adduser trigger
    sudo adduser trigger sudo

login as trigger

    mkdir /home/trigger/www
    mkdir /home/trigger/node
    mkdir /home/trigger/upload
    mkdir /home/trigger/logs

install useful libs
    
    sudo npm install socket.io
    sudo npm install mysql
    sudo npm install MD5
    sudo npm install sanitizer
    sudo npm install validator

let's VM nginx response on virt-trigger.fm

create /etc/nginx/conf.d/virt-trigger.fm.conf:

```nginx

upstream backend {
    server 127.0.0.1:40033;
}

upstream icecast{
    server 127.0.0.1:8000;
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    access_log  /home/trigger/logs/nginx.access.log;
    server_name virt-trigger.fm;
    root /home/trigger/www/$subdomain;
    set $subdomain "";
    if ($host ~* ^([a-z0-9-\.]+)\.trigger.fm$) {
        set $subdomain $1;
    }


        location / {
                index index.php index.html index.htm;
        }

        location /stream/ {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            proxy_set_header X-NginX-Proxy true;
            proxy_pass http://icecast/;
            proxy_buffering off;
            proxy_http_version 1.1;
            access_log off;
            error_log /var/log/nginx/icecast.error.log;
        }

        location ~ \.php$ {
                try_files $uri =404;
                fastcgi_split_path_info ^(.+\.php)(/.+)$;
                # NOTE: You should have "cgi.fix_pathinfo = 0;" in php.ini
                # With php5-cgi alone:
                #fastcgi_pass 127.0.0.1:9000;
                # With php5-fpm:
                fastcgi_pass unix:/var/run/php5-fpm.sock;
                fastcgi_index index.php;
                include fastcgi_params;
        }

        location /socket.io/ {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_pass http://backend;
            access_log off;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            error_log /var/log/nginx/websockets.error.log;
        }


}

```

in /etc/nginx/sites-available/default:
  
	location ~ \.php$ {
		fastcgi_split_path_info ^(.+\.php)(/.+)$;
		# NOTE: You should have "cgi.fix_pathinfo = 0;" in php.ini
	
		# With php5-fpm:
		fastcgi_pass unix:/var/run/php5-fpm.sock;
		fastcgi_index index.php;
		include fastcgi_params;
	}


in /etc/php5/fpm/php.ini:
    cgi.fix_pathinfo=0
    post_max_size = 400M
    upload_max_filesize = 400M


in /etc/nginx/nginx.conf:

    types_hash_max_size 12048;
    client_max_body_size 1280m;

create db

copy to /home/trigger/:
*www
*node
*mpd

sudo chmod -R 777 /home/trigger/mpd		
sudo chmod -R 777 /home/trigger/upload




/home/trigger/node/trigger/db.local.js - config for sql connection
/home/trigger/www/js/paths.local.js - paths for client

/etc/sysctl.conf:

    net.ipv4.tcp_keepalive_time = 5
    net.ipv4.tcp_fin_timeout = 5
    net.ipv4.tcp_synack_retries = 1
    net.ipv4.tcp_keepalive_intvl = 15
    sudo sysctl -p

    sudo reboot
    sudo node /home/trigger/node/trigger.js
