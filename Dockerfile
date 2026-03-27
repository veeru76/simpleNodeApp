# Step 1: Base Image
FROM node:18-alpine

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Copy package files and install dependencies
# We do this first to leverage Docker's layout caching!
COPY package.json ./
RUN npm install

# Step 4: Copy the rest of the app's source code
COPY . .

# Step 5: Expose the port our app runs on
EXPOSE 3000

# Step 6: Command to start the application
CMD ["npm", "start"]
