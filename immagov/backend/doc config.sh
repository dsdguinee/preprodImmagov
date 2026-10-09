doc config 
sudo apt install certbot python3-certbot-nginx

sudo certbot --nginx -d immagov.com -d www.immagov.com

replace
sed 's/utf8mb4_0900_ai_ci/utf8mb4_general_ci/g' "$input_file" > "$output_file"

installation de php service
apt install  php-fpm
sudo systemctl restart php-fpm

database config
mariadb grant privilegies syntax
GRANT ALL PRIVILEGES ON immagov_db.* TO 'immagov'@'localhost';

decompression fichier gz
gzip -d imagov.sql.gz
