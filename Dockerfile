FROM node:14

# Install build dependencies for bcrypt
RUN apt-get update && apt-get install -y build-essential python3

# Copy application files
WORKDIR /app
COPY package*.json ./

# Install node modules (will rebuild bcrypt)
RUN rm -rf node_modules
RUN npm install
RUN npm install -g nodemon
RUN npm rebuild bcrypt
COPY . .
EXPOSE 3304
CMD npm run start