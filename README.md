trigger
========

Installation:
------

Если система девственно чиста - ставим ssh, nginx, mysql и php
--

sudo apt-get update
sudo apt-get upgrade
sudo apt-get install ssh
sudo apt-get install php5-cli php5-common php5-mysql php5-gd php5-fpm php5-cgi php5-fpm php-pear php5-mcrypt php5-json php5-curl
sudo apt-get install nginx
sudo apt-get install mysql-server mysql-client php5-mysql

ставим icecast2 и его продвинутый форк
--

sudo apt-get install icecast2
sudo apt-get install libxslt1-dev libcurl4-openssl-dev libvorbis-dev
wget https://github.com/karlheyes/icecast-kh/archive/icecast-2.3.3-kh11.tar.gz
tar xzf icecast-2.3.3-kh11.tar.gz
cd icecast-kh-icecast-2.3.3-kh11/
./configure
make
sudo make install

sudo cp /usr/local/etc/icecast.xml /etc/icecast2/icecast.xml
сменить в нем папку логов на /var/log/icecast2, sources - на 10
поменять DAEMON в /etc/init.d/icecast2 на /usr/local/bin/icecast

sudo apt-get install mpd
sudo service mpd stop
sudo update-rc.d mpd disable
sudo apt-get install mpc

sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs
sudo apt-get install build-essential


sudo adduser trigger
sudo adduser trigger sudo

---логинимся как trigger

mkdir /home/trigger/www
mkdir /home/trigger/node
mkdir /home/trigger/upload
mkdir /home/trigger/logs

sudo npm install socket.io
sudo npm install mysql
sudo npm install MD5
sudo npm install sanitizer
sudo npm install validator

далее считаем, что виртуальный триггер будет доступен по адресу virt-trigger.fm
------------------------
создаем файл virt-trigger.fm.conf со следующим содержимым:

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

и кладем его в /etc/nginx/conf.d/
------------------------
в файле /etc/nginx/sites-available/default вписываем (или находим и раскомменчиваем) следующее:
location ~ \.php$ {
		fastcgi_split_path_info ^(.+\.php)(/.+)$;
		# NOTE: You should have "cgi.fix_pathinfo = 0;" in php.ini
	
		# With php5-fpm:
		fastcgi_pass unix:/var/run/php5-fpm.sock;
		fastcgi_index index.php;
		include fastcgi_params;
	}

------------------------
в файле /etc/php5/fpm/php.ini правим:
cgi.fix_pathinfo=0
post_max_size = 400M
upload_max_filesize = 400M

------------------------
в файле /etc/nginx/nginx.conf

types_hash_max_size 12048;
client_max_body_size 1280m;
-----------------------


создаем базу данных

------------------------

копируем в /home/trigger/ папки
www
node
mpd
------------------------
sudo chmod -R 777 /home/trigger/mpd		
sudo chmod -R 777 /home/trigger/upload
------------------------



/home/trigger/node/trigger/db.local.js - явки-пароли к базе
/home/trigger/www/js/paths.local.js

------------------------

в файле /etc/sysctl.conf вписываем следующее:
net.ipv4.tcp_keepalive_time = 5
net.ipv4.tcp_fin_timeout = 5
net.ipv4.tcp_synack_retries = 1
net.ipv4.tcp_keepalive_intvl = 15

потом 
sudo sysctl -p

------------------------

sudo reboot

sudo node /home/trigger/node/trigger.js
