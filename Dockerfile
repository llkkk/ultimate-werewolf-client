# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:20 AS build

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Build the app
RUN npm run build

# Use a different image to serve the built app
FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Inform Docker that the container listens on the specified network ports at runtime.
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
