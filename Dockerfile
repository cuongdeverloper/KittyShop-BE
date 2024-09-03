# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy both package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Rebuild bcrypt module to ensure compatibility
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of your application's code to the container
COPY . .

# Expose the port your app runs on
EXPOSE 6000

# Command to run your application
CMD ["npm", "start"]
