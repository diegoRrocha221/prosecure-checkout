#!/bin/bash
# deploy.sh

# Build the project
echo "Building project..."
yarn build

# Create directory if it doesn't exist
sudo mkdir -p /var/www/html/checkout

# Clean existing files
sudo rm -rf /var/www/html/checkout/*

# Copy files to web directory
echo "Copying files to web directory..."
sudo cp -r dist/* /var/www/html/checkout/

# Set permissions
echo "Setting permissions..."
sudo chown -R nginx:nginx /var/www/html/checkout
sudo find /var/www/html/checkout -type f -exec chmod 644 {} \;
sudo find /var/www/html/checkout -type d -exec chmod 755 {} \;

# Verify Nginx config
echo "Verifying Nginx configuration..."
sudo nginx -t

# Reload Nginx if config is valid
if [ $? -eq 0 ]; then
	    echo "Reloading Nginx..."
	        sudo systemctl reload nginx
	else
		    echo "Nginx configuration test failed. Please check the configuration."
		        exit 1
fi

echo "Deployment complete!"


